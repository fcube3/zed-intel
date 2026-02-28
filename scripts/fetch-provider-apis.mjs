#!/usr/bin/env node
// Fetch Anthropic and OpenAI admin usage data, push to Supabase
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function readEnv(key) {
  const envPath = path.join(process.env.HOME, '.openclaw', '.env');
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const l of lines) {
      const m = l.match(new RegExp(`^${key}=["']?([^"'\\n]+)["']?$`));
      if (m) return m[1].trim();
    }
  } catch {}
  return null;
}

function readEnvLocal(key) {
  const envPath = path.join(process.cwd(), '.env.local');
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const l of lines) {
      const m = l.match(new RegExp(`^${key}=["']?([^"'\\n]+)["']?$`));
      if (m) return m[1].trim();
    }
  } catch {}
  return null;
}

const SUPABASE_URL = readEnvLocal('NEXT_PUBLIC_SUPABASE_URL') || readEnv('SUPABASE_URL');
const SUPABASE_KEY = readEnvLocal('SUPABASE_SERVICE_ROLE_KEY') || readEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Anthropic ---
async function fetchAnthropic() {
  const key = readEnv('ANTHROPIC_ADMIN_KEY');
  if (!key) { console.log('⊘ ANTHROPIC_ADMIN_KEY not found, skipping Anthropic'); return; }

  const start = Date.now();
  try {
    const res = await fetch('https://api.anthropic.com/v1/organization/usage', {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);

    const row = {
      provider: 'anthropic_api',
      source: 'admin_api',
      total_cost_usd: data.total_cost ?? null,
      input_tokens: data.input_tokens ?? null,
      output_tokens: data.output_tokens ?? null,
      total_tokens: (data.input_tokens || 0) + (data.output_tokens || 0) || null,
      model_breakdown: data.by_model ?? null,
      raw_response: data,
    };

    const { error } = await supabase.from('usage_snapshots').insert(row);
    if (error) throw new Error(`Supabase insert: ${error.message}`);

    await supabase.from('cost_sync_log').insert({
      provider: 'anthropic_api', status: 'ok', duration_ms: Date.now() - start,
    });
    console.log(`✓ Anthropic API: fetched`);
  } catch (err) {
    await supabase.from('cost_sync_log').insert({
      provider: 'anthropic_api', status: 'error', error_msg: err.message, duration_ms: Date.now() - start,
    }).catch(() => {});
    console.error(`✗ Anthropic API: ${err.message}`);
  }
}

// --- Codex (OAuth header approach) ---
// Usage is NOT available via admin API — it's in response headers from Codex backend calls.
// Flow: refresh token → POST /backend-api/codex/responses/compact → parse x-codex-* headers

const CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const CODEX_AUTH_FILE = path.join(process.env.HOME, '.codex', 'auth.json');

function readCodexAuth() {
  try {
    return JSON.parse(fs.readFileSync(CODEX_AUTH_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeCodexAuth(data) {
  try {
    fs.writeFileSync(CODEX_AUTH_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

async function refreshCodexToken(refreshToken) {
  const res = await fetch('https://auth.openai.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CODEX_CLIENT_ID,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${err}`);
  }
  return res.json();
}

async function fetchCodexUsage() {
  const auth = readCodexAuth();
  if (!auth?.tokens?.refresh_token) {
    console.log('⊘ Codex auth not found at ~/.codex/auth.json, skipping');
    return;
  }

  const start = Date.now();
  try {
    // Refresh the token
    const tokenData = await refreshCodexToken(auth.tokens.refresh_token);
    const accessToken = tokenData.access_token;
    const accountId = auth.tokens.account_id;

    // Persist rotated tokens
    auth.tokens.access_token = tokenData.access_token;
    auth.tokens.id_token = tokenData.id_token ?? auth.tokens.id_token;
    auth.tokens.refresh_token = tokenData.refresh_token ?? auth.tokens.refresh_token;
    auth.last_refresh = new Date().toISOString();
    writeCodexAuth(auth);

    // Send minimal Codex request to get usage headers
    const res = await fetch('https://chatgpt.com/backend-api/codex/responses/compact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'ChatGPT-Account-ID': accountId,
        'User-Agent': 'openai-codex/0.1',
      },
      body: JSON.stringify({
        model: 'codex-mini-latest',
        input: [{ role: 'user', content: 'echo 1' }],
        max_output_tokens: 1,
      }),
    });

    const primaryUsedPct = parseInt(res.headers.get('x-codex-primary-used-percent') ?? '-1');
    const primaryWindowMin = parseInt(res.headers.get('x-codex-primary-window-minutes') ?? '300');
    const primaryResetSec = parseInt(res.headers.get('x-codex-primary-reset-after-seconds') ?? '0');
    const secondaryUsedPct = parseInt(res.headers.get('x-codex-secondary-used-percent') ?? '-1');
    const secondaryWindowMin = parseInt(res.headers.get('x-codex-secondary-window-minutes') ?? '10080');
    const secondaryResetSec = parseInt(res.headers.get('x-codex-secondary-reset-after-seconds') ?? '0');
    const planType = res.headers.get('x-codex-plan-type') ?? null;

    if (primaryUsedPct === -1) {
      throw new Error(`No x-codex-* headers in response (status ${res.status})`);
    }

    const usageSnapshot = {
      primary_used_pct: primaryUsedPct,
      primary_window_minutes: primaryWindowMin,
      primary_reset_after_seconds: primaryResetSec,
      secondary_used_pct: secondaryUsedPct,
      secondary_window_minutes: secondaryWindowMin,
      secondary_reset_after_seconds: secondaryResetSec,
      plan_type: planType,
    };

    const row = {
      provider: 'codex',
      source: 'oauth_headers',
      total_cost_usd: null, // no billing data via this method
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
      model_breakdown: usageSnapshot,
      raw_response: usageSnapshot,
    };

    const { error } = await supabase.from('usage_snapshots').insert(row);
    if (error) throw new Error(`Supabase insert: ${error.message}`);

    await supabase.from('cost_sync_log').insert({
      provider: 'codex', status: 'ok', duration_ms: Date.now() - start,
    });
    console.log(`✓ Codex: 5h window ${primaryUsedPct}% used, weekly ${secondaryUsedPct}% used`);
  } catch (err) {
    await supabase.from('cost_sync_log').insert({
      provider: 'codex', status: 'error', error_msg: err.message, duration_ms: Date.now() - start,
    }).catch(() => {});
    console.error(`✗ Codex: ${err.message}`);
  }
}

await fetchAnthropic();
await fetchCodexUsage();
console.log('Provider API fetch complete.');
