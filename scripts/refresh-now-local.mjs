#!/usr/bin/env node
// One-click local refresh: enqueue then process queue once.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const projectRoot = process.cwd();

function run(script) {
  execFileSync('node', [path.join(projectRoot, 'scripts', script)], {
    cwd: projectRoot,
    stdio: 'inherit',
    timeout: 180000,
  });
}

run('trigger-pull.mjs');
run('process-refresh-queue.mjs');
