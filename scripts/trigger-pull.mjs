#!/usr/bin/env node
// Trigger API usage pull (OpenRouter + provider APIs) with cooldown check
import { shouldPull, updateLastPull } from './should-pull.mjs';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const force = process.argv.includes('--force');
const scriptsDir = path.dirname(new URL(import.meta.url).pathname);

const check = await shouldPull(force);
if (!check.should) {
  console.log(`[trigger-pull] ${check.reason}`);
  process.exit(0);
}

console.log(`[trigger-pull] Proceeding — ${check.reason}`);

// Update timestamp BEFORE running (prevents parallel triggers)
await updateLastPull();

const scripts = ['fetch-openrouter.mjs', 'fetch-provider-apis.mjs'];
let hadError = false;

for (const script of scripts) {
  const scriptPath = path.join(scriptsDir, script);
  try {
    console.log(`[trigger-pull] Running ${script}...`);
    execFileSync('node', [scriptPath], {
      cwd: path.join(scriptsDir, '..'),
      stdio: 'inherit',
      timeout: 60000,
    });
  } catch (err) {
    console.error(`[trigger-pull] ${script} failed:`, err.message);
    hadError = true;
  }
}

console.log(`[trigger-pull] Done${hadError ? ' (with errors)' : ''}`);
process.exit(hadError ? 1 : 0);
