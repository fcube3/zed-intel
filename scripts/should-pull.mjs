#!/usr/bin/env node
// Check if a pull should proceed based on 30-min cooldown
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

function readEnvLocal(key) {
  try {
    const lines = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n');
    for (const l of lines) {
      const m = l.match(new RegExp(`^${key}=["']?([^"'\\n]+)["']?$`));
      if (m) return m[1].trim();
    }
  } catch {}
  return null;
}

function readEnvHome(key) {
  try {
    const lines = fs.readFileSync(path.join(process.env.HOME, '.openclaw', '.env'), 'utf8').split('\n');
    for (const l of lines) {
      const m = l.match(new RegExp(`^${key}=["']?([^"'\\n]+)["']?$`));
      if (m) return m[1].trim();
    }
  } catch {}
  return null;
}

export function getSupabase() {
  const url = readEnvLocal('NEXT_PUBLIC_SUPABASE_URL') || readEnvHome('SUPABASE_URL');
  const key = readEnvLocal('SUPABASE_SERVICE_ROLE_KEY') || readEnvHome('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

export async function shouldPull(force = false) {
  if (force) return { should: true, reason: 'forced' };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('cost_pull_state')
    .select('value')
    .eq('key', 'last_pull_at')
    .single();

  if (error || !data?.value) return { should: true, reason: 'no previous pull recorded' };

  const lastPull = new Date(data.value).getTime();
  const elapsed = Date.now() - lastPull;

  if (elapsed < COOLDOWN_MS) {
    const remainMin = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
    return { should: false, reason: `Skipping — cooldown active (${remainMin}m remaining)` };
  }

  return { should: true, reason: 'cooldown expired' };
}

export async function updateLastPull() {
  const supabase = getSupabase();
  await supabase.from('cost_pull_state').upsert({
    key: 'last_pull_at',
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

// CLI mode
if (process.argv[1] && process.argv[1].endsWith('should-pull.mjs')) {
  const force = process.argv.includes('--force');
  const result = await shouldPull(force);
  console.log(result.reason);
  process.exit(result.should ? 1 : 0);
}
