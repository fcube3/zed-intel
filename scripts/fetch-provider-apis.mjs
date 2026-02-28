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
    try { await supabase.from('cost_sync_log').insert({
      provider: 'anthropic_api', status: 'error', error_msg: err.message, duration_ms: Date.now() - start,
    }); } catch {}
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
  // Must use x-www-form-urlencoded (not JSON) — matches relay service implementation
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CODEX_CLIENT_ID,
    refresh_token: refreshToken,
    scope: 'openid profile email',
  }).toString();

  const res = await fetch('https://auth.openai.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': String(Buffer.byteLength(body)),
    },
    body,
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
    // Note: compact endpoint requires input as array, no stream/max_output_tokens params
    const res = await fetch('https://chatgpt.com/backend-api/codex/responses/compact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'ChatGPT-Account-ID': accountId,
      },
      body: JSON.stringify({
        model: 'gpt-5.3-codex',
        instructions: 'Reply with one word.',
        input: [{ role: 'user', content: 'ping' }],
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
    try { await supabase.from('cost_sync_log').insert({
      provider: 'codex', status: 'error', error_msg: err.message, duration_ms: Date.now() - start,
    }); } catch {}
    console.error(`✗ Codex: ${err.message}`);
  }
}

// --- Claude (OAuth usage) ---
// Endpoint: https://api.anthropic.com/api/oauth/usage
// Auth: OAuth access token from macOS Keychain ("Claude Code-credentials")
// Token refresh via https://console.anthropic.com/v1/oauth/token (same as claude-relay-service)

import { execSync } from 'node:child_process';

const CLAUDE_OAUTH_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const CLAUDE_KEYCHAIN_SERVICE = 'Claude Code-credentials';

function readKeychainCredentials() {
  try {
    const raw = execSync(`security find-generic-password -s "${CLAUDE_KEYCHAIN_SERVICE}" -w 2>/dev/null`, { encoding: 'utf8' }).trim();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeKeychainCredentials(creds) {
  const json = JSON.stringify(creds);
  // Delete then re-add (macOS Keychain doesn't support in-place update easily)
  try { execSync(`security delete-generic-password -s "${CLAUDE_KEYCHAIN_SERVICE}" 2>/dev/null`); } catch {}
  execSync(`security add-generic-password -s "${CLAUDE_KEYCHAIN_SERVICE}" -w '${json.replace(/'/g, "'\\''")}'`);
}

async function refreshClaudeToken(refreshToken) {
  // Try platform.claude.com first (new URL), fall back to console.anthropic.com (legacy)
  const endpoints = [
    'https://platform.claude.com/v1/oauth/token',
    'https://console.anthropic.com/v1/oauth/token',
  ];

  let lastError;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'claude-cli/2.0.53 (external, cli)',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: CLAUDE_OAUTH_CLIENT_ID,
        }),
      });
      if (res.ok) return res.json();
      lastError = `${url} → ${res.status} ${await res.text()}`;
    } catch (e) {
      lastError = `${url} → ${e.message}`;
    }
  }
  throw new Error(`Claude token refresh failed on all endpoints: ${lastError}`);
}

async function fetchClaudeOAuthUsage() {
  const start = Date.now();
  try {
    const credentials = readKeychainCredentials();
    if (!credentials?.claudeAiOauth) {
      console.log('⊘ Claude Code-credentials not found in Keychain, skipping Claude OAuth usage');
      return;
    }

    let { accessToken, refreshToken, expiresAt } = credentials.claudeAiOauth;

    // Check if token is expired or expiring within 60s
    const now = Date.now();
    const tokenExpired = !expiresAt || now >= (Number(expiresAt) - 60000);

    if (tokenExpired) {
      if (!refreshToken) {
        console.log('⊘ Claude token expired and no refresh token available. Run: claude login');
        return;
      }
      console.log('🔄 Claude token expired, refreshing (trying platform.claude.com + console.anthropic.com)...');
      const tokenData = await refreshClaudeToken(refreshToken);

      // Update credentials in keychain
      accessToken = tokenData.access_token;
      credentials.claudeAiOauth.accessToken = tokenData.access_token;
      credentials.claudeAiOauth.refreshToken = tokenData.refresh_token;
      credentials.claudeAiOauth.expiresAt = (Date.now() + tokenData.expires_in * 1000).toString();
      writeKeychainCredentials(credentials);
      console.log('✓ Claude token refreshed and saved to Keychain');
    }

    const res = await fetch('https://api.anthropic.com/api/oauth/usage', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'anthropic-beta': 'oauth-2025-04-20',
        'User-Agent': 'claude-cli/2.0.53 (external, cli)',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const usageSnapshot = {
      five_hour_utilization: data.five_hour?.utilization ?? null,
      seven_day_utilization: data.seven_day?.utilization ?? null,
      seven_day_sonnet_utilization: data.seven_day_sonnet?.utilization ?? null,
    };

    const row = {
      provider: 'claude_oauth',
      source: 'oauth_usage_api',
      total_cost_usd: null,
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
      model_breakdown: usageSnapshot,
      raw_response: data,
    };

    const { error } = await supabase.from('usage_snapshots').insert(row);
    if (error) throw new Error(`Supabase insert: ${error.message}`);

    await supabase.from('cost_sync_log').insert({
      provider: 'claude_oauth', status: 'ok', duration_ms: Date.now() - start,
    });
    console.log(`✓ Claude OAuth: 5h=${data.five_hour?.utilization ?? '?'}%, 7d=${data.seven_day?.utilization ?? '?'}%`);
  } catch (err) {
    try { await supabase.from('cost_sync_log').insert({
      provider: 'claude_oauth', status: 'error', error_msg: err.message, duration_ms: Date.now() - start,
    }); } catch {}
    console.error(`✗ Claude OAuth: ${err.message}`);
  }
}

await fetchAnthropic();
await fetchClaudeOAuthUsage();
await fetchCodexUsage();
console.log('Provider API fetch complete.');
