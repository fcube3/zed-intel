#!/usr/bin/env node
// Fetch OpenRouter usage data and push to Supabase
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function readEnv(key) {
  const envPath = path.join(process.env.HOME, '.openclaw', '.env');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const l of lines) {
    const m = l.match(new RegExp(`^${key}=["']?([^"'\\n]+)["']?$`));
    if (m) return m[1].trim();
  }
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

const OPENROUTER_API_KEY = readEnv('OPENROUTER_API_KEY');
if (!OPENROUTER_API_KEY) { console.error('OPENROUTER_API_KEY not found in ~/.openclaw/.env'); process.exit(1); }

const SUPABASE_URL = readEnvLocal('NEXT_PUBLIC_SUPABASE_URL') || readEnv('SUPABASE_URL');
const SUPABASE_KEY = readEnvLocal('SUPABASE_SERVICE_ROLE_KEY') || readEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const start = Date.now();
try {
  // Get credit/key info
  const keyRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
  });
  const keyData = await keyRes.json();

  // Get activity
  const actRes = await fetch('https://openrouter.ai/api/v1/activity?limit=1000', {
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
  });
  const actData = await actRes.json();

  // Calculate totals from activity
  const activities = actData.data || actData || [];
  let totalCost = 0, totalInput = 0, totalOutput = 0;
  const modelBreakdown = {};

  if (Array.isArray(activities)) {
    for (const a of activities) {
      const cost = parseFloat(a.total_cost || a.native_tokens_cost || 0);
      const inp = parseInt(a.input_tokens || a.native_tokens_prompt || 0);
      const out = parseInt(a.output_tokens || a.native_tokens_completion || 0);
      totalCost += cost;
      totalInput += inp;
      totalOutput += out;
      const model = a.model || a.model_id || 'unknown';
      if (!modelBreakdown[model]) modelBreakdown[model] = { cost: 0, input: 0, output: 0 };
      modelBreakdown[model].cost += cost;
      modelBreakdown[model].input += inp;
      modelBreakdown[model].output += out;
    }
  }

  // Also check credits from key info
  const creditBalance = keyData?.data?.limit_remaining ?? keyData?.data?.usage ?? null;

  const row = {
    provider: 'openrouter',
    source: 'api',
    total_cost_usd: totalCost || (keyData?.data?.usage ?? null),
    input_tokens: totalInput || null,
    output_tokens: totalOutput || null,
    total_tokens: (totalInput + totalOutput) || null,
    model_breakdown: modelBreakdown,
    raw_response: { key: keyData, activity_count: Array.isArray(activities) ? activities.length : 0 },
  };

  const { error } = await supabase.from('usage_snapshots').insert(row);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);

  const durationMs = Date.now() - start;
  await supabase.from('cost_sync_log').insert({
    provider: 'openrouter', status: 'ok', duration_ms: durationMs,
  });

  console.log(`✓ OpenRouter: $${totalCost.toFixed(4)}, ${totalInput + totalOutput} tokens, ${Object.keys(modelBreakdown).length} models`);
} catch (err) {
  const durationMs = Date.now() - start;
  await supabase.from('cost_sync_log').insert({
    provider: 'openrouter', status: 'error', error_msg: err.message, duration_ms: durationMs,
  }).catch(() => {});
  console.error('✗ OpenRouter fetch failed:', err.message);
  process.exit(1);
}
