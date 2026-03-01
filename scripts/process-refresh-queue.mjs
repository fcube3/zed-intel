#!/usr/bin/env node
// Process one queued refresh request locally.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

function readEnvFile(filePath) {
  const out = {};
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
    if (!m) continue;
    const key = m[1];
    const value = m[2].trim().replace(/^['"]|['"]$/g, '');
    out[key] = value;
  }
  return out;
}

function readFrom(filePath, key) {
  try {
    return readEnvFile(filePath)[key] ?? null;
  } catch {
    return null;
  }
}

const openclawEnv = path.join(process.env.HOME, '.openclaw', '.env');
const localEnv = path.join(process.cwd(), '.env.local');

const SUPABASE_URL = readFrom(localEnv, 'NEXT_PUBLIC_SUPABASE_URL') || readFrom(openclawEnv, 'SUPABASE_URL');
const SUPABASE_KEY = readFrom(localEnv, 'SUPABASE_SERVICE_ROLE_KEY') || readFrom(openclawEnv, 'SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function claimOldestPending() {
  const { data: pending, error } = await supabase
    .from('refresh_requests')
    .select('request_id,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed reading queue: ${error.message}`);
  if (!pending) return null;

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimErr } = await supabase
    .from('refresh_requests')
    .update({ status: 'running', started_at: startedAt, error_msg: null })
    .eq('request_id', pending.request_id)
    .eq('status', 'pending')
    .select('request_id,status')
    .maybeSingle();

  if (claimErr) throw new Error(`Failed claiming request: ${claimErr.message}`);
  if (!claimed) return null; // lost race

  return claimed.request_id;
}

async function markDone(requestId) {
  const { error } = await supabase
    .from('refresh_requests')
    .update({ status: 'done', finished_at: new Date().toISOString(), error_msg: null })
    .eq('request_id', requestId);
  if (error) throw new Error(`Failed marking done: ${error.message}`);
}

async function markFailed(requestId, errorMsg) {
  const { error } = await supabase
    .from('refresh_requests')
    .update({ status: 'failed', finished_at: new Date().toISOString(), error_msg: String(errorMsg || 'unknown error').slice(0, 4000) })
    .eq('request_id', requestId);
  if (error) {
    console.error(`Failed to update failed status for ${requestId}:`, error.message);
  }
}

function runScript(scriptFile) {
  const scriptPath = path.join(process.cwd(), 'scripts', scriptFile);
  execFileSync('node', [scriptPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
    timeout: 180000,
  });
}

async function main() {
  const requestId = await claimOldestPending();
  if (!requestId) {
    console.log('No pending refresh requests.');
    return;
  }

  console.log(`Claimed request ${requestId}`);

  try {
    runScript('fetch-openrouter.mjs');
    runScript('fetch-provider-apis.mjs');
    await markDone(requestId);
    console.log(`Refresh request ${requestId} completed.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(requestId, msg);
    console.error(`Refresh request ${requestId} failed:`, msg);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[process-refresh-queue] failed:', err.message);
  process.exit(1);
});
