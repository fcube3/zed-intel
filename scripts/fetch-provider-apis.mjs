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

// --- OpenAI ---
async function fetchOpenAI() {
  const key = readEnv('OPENAI_ADMIN_KEY');
  if (!key) { console.log('⊘ OPENAI_ADMIN_KEY not found, skipping OpenAI'); return; }

  const start = Date.now();
  try {
    const res = await fetch('https://api.openai.com/v1/organization/costs?days=30', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);

    const totalCost = data.total_cost ?? data.data?.reduce((s, d) => s + (d.cost || 0), 0) ?? null;

    const row = {
      provider: 'openai_api',
      source: 'admin_api',
      total_cost_usd: totalCost,
      input_tokens: data.input_tokens ?? null,
      output_tokens: data.output_tokens ?? null,
      total_tokens: data.total_tokens ?? null,
      model_breakdown: data.by_model ?? data.data ?? null,
      raw_response: data,
    };

    const { error } = await supabase.from('usage_snapshots').insert(row);
    if (error) throw new Error(`Supabase insert: ${error.message}`);

    await supabase.from('cost_sync_log').insert({
      provider: 'openai_api', status: 'ok', duration_ms: Date.now() - start,
    });
    console.log(`✓ OpenAI API: fetched`);
  } catch (err) {
    await supabase.from('cost_sync_log').insert({
      provider: 'openai_api', status: 'error', error_msg: err.message, duration_ms: Date.now() - start,
    }).catch(() => {});
    console.error(`✗ OpenAI API: ${err.message}`);
  }
}

await fetchAnthropic();
await fetchOpenAI();
console.log('Provider API fetch complete.');
