import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  readBundledDashboardFile,
  readDashboardFromKv,
  writeDashboardToKv,
  loadDashboardData,
} from '../src/lib/ops-cost-storage.mjs';

const ENV_KEYS = ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'OPS_COST_KV_KEY'];

function withEnv(vars, fn) {
  const snapshot = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const key of ENV_KEYS) {
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  return Promise.resolve(fn()).finally(() => {
    for (const key of ENV_KEYS) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  });
}

test('read/write dashboard via KV REST payload', async () => {
  const payload = {
    generatedAt: '2026-02-26T00:00:00.000Z',
    totals: { cost: 0, estimatedCost: 1, inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    byProvider: [],
    byModel: [],
    byDay: [],
  };

  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (_url, init) => {
    calls.push(JSON.parse(String(init?.body || '[]')));
    const cmd = calls[calls.length - 1]?.[0];
    if (cmd === 'SET') return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
    if (cmd === 'GET') return new Response(JSON.stringify({ result: JSON.stringify(payload) }), { status: 200 });
    return new Response(JSON.stringify({ error: 'bad command' }), { status: 400 });
  };

  await withEnv(
    {
      KV_REST_API_URL: 'https://example-kv.upstash.io',
      KV_REST_API_TOKEN: 'token',
      OPS_COST_KV_KEY: 'ops-cost:latest',
    },
    async () => {
      const writeResult = await writeDashboardToKv(payload);
      assert.equal(writeResult.ok, true);

      const readResult = await readDashboardFromKv();
      assert.equal(readResult.ok, true);
      assert.equal(readResult.payload.generatedAt, payload.generatedAt);
      assert.deepEqual(calls[0], ['SET', 'ops-cost:latest', JSON.stringify(payload)]);
      assert.deepEqual(calls[1], ['GET', 'ops-cost:latest']);
    },
  );

  global.fetch = originalFetch;
});

test('loadDashboardData falls back to bundled file when KV unavailable', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ops-cost-'));
  const dataDir = path.join(tmp, 'public', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, 'cost-dashboard.json'),
    JSON.stringify({
      generatedAt: '2026-02-25T00:00:00.000Z',
      totals: { cost: 0, estimatedCost: 2, inputTokens: 1, outputTokens: 2, totalTokens: 3 },
      byProvider: [],
      byModel: [],
      byDay: [],
    }),
    'utf8',
  );

  const before = process.cwd();
  process.chdir(tmp);

  await withEnv({}, async () => {
    const fileData = readBundledDashboardFile();
    assert.equal(fileData.generatedAt, '2026-02-25T00:00:00.000Z');

    const loaded = await loadDashboardData();
    assert.equal(loaded.diagnostics.source, 'file-fallback');
    assert.match(loaded.diagnostics.warning || '', /KV/);
    assert.equal(loaded.data.generatedAt, '2026-02-25T00:00:00.000Z');
  });

  process.chdir(before);
  fs.rmSync(tmp, { recursive: true, force: true });
});
