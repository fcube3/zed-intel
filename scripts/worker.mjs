#!/usr/bin/env node
// Persistent refresh worker — polls Supabase for pending jobs, executes locally.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const POLL_INTERVAL_MS = 5_000;
const STALE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 5_000; // 5s, 15s, 45s (×3 each)
const SCRIPT_TIMEOUT_MS = 180_000;

// ── Env ──────────────────────────────────────────────────────────────
function readEnvFile(filePath) {
  const out = {};
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
      if (!m) continue;
      out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  } catch {}
  return out;
}

const openclawEnv = readEnvFile(path.join(process.env.HOME, '.openclaw', '.env'));
const localEnv = readEnvFile(path.join(process.cwd(), '.env.local'));

const SUPABASE_URL = localEnv.NEXT_PUBLIC_SUPABASE_URL || openclawEnv.SUPABASE_URL;
const SUPABASE_KEY = localEnv.SUPABASE_SERVICE_ROLE_KEY || openclawEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[worker] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Graceful shutdown ────────────────────────────────────────────────
let shuttingDown = false;
function onSignal(sig) {
  console.log(`[worker] ${sig} received, shutting down…`);
  shuttingDown = true;
}
process.on('SIGTERM', () => onSignal('SIGTERM'));
process.on('SIGINT', () => onSignal('SIGINT'));

// ── Claim job atomically via RPC ─────────────────────────────────────
async function claimJob() {
  const { data, error } = await supabase.rpc('claim_refresh_job');
  if (error) {
    // RPC might not exist yet — fall back to manual claim
    if (error.message.includes('claim_refresh_job')) {
      return claimJobFallback();
    }
    console.error('[worker] claim_refresh_job RPC error:', error.message);
    return null;
  }
  // RPC returns an array; take first row or null
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

// Fallback: atomic UPDATE with filters (no SELECT-then-UPDATE race)
async function claimJobFallback() {
  const now = new Date().toISOString();
  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  // Try pending first
  const { data: pending, error: e1 } = await supabase
    .from('refresh_requests')
    .update({ status: 'running', started_at: now, claimed_at: now })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .select()
    .maybeSingle();

  if (e1) { console.error('[worker] fallback claim pending error:', e1.message); return null; }
  if (pending) return pending;

  // Try stale running jobs
  const { data: stale, error: e2 } = await supabase
    .from('refresh_requests')
    .update({ status: 'running', started_at: now, claimed_at: now })
    .eq('status', 'running')
    .lt('claimed_at', staleThreshold)
    .order('created_at', { ascending: true })
    .limit(1)
    .select()
    .maybeSingle();

  if (e2) { console.error('[worker] fallback claim stale error:', e2.message); return null; }
  return stale ?? null;
}

// ── Execute refresh scripts ──────────────────────────────────────────
function runScript(scriptFile) {
  const scriptPath = path.join(process.cwd(), 'scripts', scriptFile);
  execFileSync('node', [scriptPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
    timeout: SCRIPT_TIMEOUT_MS,
  });
}

function executeRefresh() {
  runScript('fetch-openrouter.mjs');
  runScript('fetch-provider-apis.mjs');
}

// ── Mark job results ─────────────────────────────────────────────────
async function markDone(requestId) {
  const { error } = await supabase
    .from('refresh_requests')
    .update({ status: 'done', finished_at: new Date().toISOString(), error_msg: null })
    .eq('request_id', requestId);
  if (error) console.error(`[worker] markDone error for ${requestId}:`, error.message);
}

async function markFailed(requestId, errorMsg) {
  const { error } = await supabase
    .from('refresh_requests')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_msg: String(errorMsg || 'unknown').slice(0, 4000),
    })
    .eq('request_id', requestId);
  if (error) console.error(`[worker] markFailed error for ${requestId}:`, error.message);
}

async function requeueForRetry(requestId, retryCount, errorMsg) {
  const { error } = await supabase
    .from('refresh_requests')
    .update({
      status: 'pending',
      started_at: null,
      claimed_at: null,
      retry_count: retryCount,
      last_error: String(errorMsg || 'unknown').slice(0, 4000),
    })
    .eq('request_id', requestId);
  if (error) console.error(`[worker] requeueForRetry error for ${requestId}:`, error.message);
}

// ── Process a single job ─────────────────────────────────────────────
async function processJob(job) {
  const requestId = job.request_id;
  const retryCount = job.retry_count ?? 0;
  console.log(`[worker] Claimed job ${requestId} (retry ${retryCount})`);

  try {
    executeRefresh();
    await markDone(requestId);
    console.log(`[worker] Job ${requestId} done ✓`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[worker] Job ${requestId} failed: ${msg}`);

    if (retryCount + 1 < MAX_RETRIES) {
      const backoffMs = BACKOFF_BASE_MS * Math.pow(3, retryCount); // 5s, 15s, 45s
      console.log(`[worker] Retrying ${requestId} in ${backoffMs / 1000}s (attempt ${retryCount + 2}/${MAX_RETRIES})`);
      await requeueForRetry(requestId, retryCount + 1, msg);
      await sleep(backoffMs);
    } else {
      console.error(`[worker] Job ${requestId} exhausted retries, marking failed`);
      await markFailed(requestId, msg);
    }
  }
}

// ── Poll loop ────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pollLoop() {
  console.log('[worker] Starting poll loop (every 5s)…');
  while (!shuttingDown) {
    try {
      const job = await claimJob();
      if (job) {
        await processJob(job);
      }
    } catch (err) {
      console.error('[worker] Poll error:', err.message);
    }
    if (!shuttingDown) await sleep(POLL_INTERVAL_MS);
  }
  console.log('[worker] Shut down gracefully.');
}

pollLoop();
