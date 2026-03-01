#!/usr/bin/env node
// Parse local OpenClaw session JSONL files, aggregate usage, push to Supabase
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

function readEnvHome(key) {
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

const SUPABASE_URL = readEnvLocal('NEXT_PUBLIC_SUPABASE_URL') || readEnvHome('SUPABASE_URL');
const SUPABASE_KEY = readEnvLocal('SUPABASE_SERVICE_ROLE_KEY') || readEnvHome('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — aborting');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function classifyProvider(model) {
  if (!model) return 'other_local';
  const m = model.toLowerCase();
  if (m.includes('claude') || m.includes('anthropic')) return 'claude_local';
  if (m.includes('gpt') || m.includes('codex') || m.includes('openai') || m.includes('o1') || m.includes('o3') || m.includes('o4')) return 'codex_local';
  return 'other_local';
}

const agentsDir = path.join(process.env.HOME, '.openclaw', 'agents');
const providers = {}; // provider -> { input, output, cache_read, models: {} }

let filesProcessed = 0;
let linesProcessed = 0;

try {
  const agents = fs.readdirSync(agentsDir, { withFileTypes: true }).filter(d => d.isDirectory());
  
  for (const agent of agents) {
    const sessionsDir = path.join(agentsDir, agent.name, 'sessions');
    if (!fs.existsSync(sessionsDir)) continue;
    
    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
    
    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        filesProcessed++;
        
        for (const line of content.split('\n')) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            const model = entry.model || '';
            const inputTokens = entry.input_tokens || entry.usage?.input_tokens || 0;
            const outputTokens = entry.output_tokens || entry.usage?.output_tokens || 0;
            const cacheRead = entry.cache_read_tokens || entry.usage?.cache_read_input_tokens || 0;
            
            if (!inputTokens && !outputTokens) continue;
            
            const provider = classifyProvider(model);
            if (!providers[provider]) {
              providers[provider] = { input: 0, output: 0, cache_read: 0, models: {} };
            }
            providers[provider].input += inputTokens;
            providers[provider].output += outputTokens;
            providers[provider].cache_read += cacheRead;
            
            if (!providers[provider].models[model]) {
              providers[provider].models[model] = { input: 0, output: 0 };
            }
            providers[provider].models[model].input += inputTokens;
            providers[provider].models[model].output += outputTokens;
            
            linesProcessed++;
          } catch {}
        }
      } catch {}
    }
  }
} catch (err) {
  console.error('Error scanning agents directory:', err.message);
}

console.log(`Scanned ${filesProcessed} files, ${linesProcessed} usage entries`);

const start = Date.now();
for (const [provider, data] of Object.entries(providers)) {
  const row = {
    provider,
    source: 'local_session',
    input_tokens: data.input,
    output_tokens: data.output,
    cache_read_tokens: data.cache_read,
    total_tokens: data.input + data.output,
    model_breakdown: data.models,
  };

  const { error } = await supabase.from('usage_snapshots').insert(row);
  if (error) {
    console.error(`✗ ${provider}: ${error.message}`);
  } else {
    console.log(`✓ ${provider}: ${data.input + data.output} tokens across ${Object.keys(data.models).length} models`);
  }
}

try {
  await supabase.from('cost_sync_log').insert({
    provider: 'local_session', status: 'ok', duration_ms: Date.now() - start,
  });
} catch {}

console.log('Local usage parse complete.');
