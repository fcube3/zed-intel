#!/usr/bin/env node
// Enqueue a costs refresh request in Supabase (no provider API calls)
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
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

async function enqueueRefreshRequest() {
  const cutoffIso = new Date(Date.now() - 30_000).toISOString();

  const { data: existing, error: existingErr } = await supabase
    .from('refresh_requests')
    .select('request_id,status,created_at')
    .eq('status', 'pending')
    .gte('created_at', cutoffIso)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingErr) throw new Error(`Failed checking dedupe window: ${existingErr.message}`);

  if (existing) {
    console.log(JSON.stringify({ ok: true, requestId: existing.request_id, status: 'pending', deduped: true }, null, 2));
    return existing.request_id;
  }

  const requestId = randomUUID();
  const idempotencyKey = randomUUID();
  const requestedBy = process.env.USER || 'local-cli';

  const { error } = await supabase.from('refresh_requests').insert({
    request_id: requestId,
    source: 'cli',
    status: 'pending',
    idempotency_key: idempotencyKey,
    requested_by: requestedBy,
  });

  if (error) throw new Error(`Failed to enqueue refresh request: ${error.message}`);

  console.log(JSON.stringify({ ok: true, requestId, status: 'pending', deduped: false }, null, 2));
  return requestId;
}

enqueueRefreshRequest().catch((err) => {
  console.error('[trigger-pull] failed:', err.message);
  process.exit(1);
});
