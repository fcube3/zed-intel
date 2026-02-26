import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeProvider, normalizeModel, aggregateRows } from './build-cost-dashboard-data.mjs';

test('normalizeProvider handles google + vertex aliases', () => {
  assert.equal(normalizeProvider('google-generative-ai', 'gemini-3-flash-preview'), 'google');
  assert.equal(normalizeProvider('google-vertex-ai', 'gemini-3.1-pro-preview'), 'google-vertex');
  assert.equal(normalizeProvider('vertexai', 'publishers/google/models/gemini-3.1-pro-preview'), 'google-vertex');
  assert.equal(normalizeProvider('', 'gemini-3-flash-preview'), 'google');
  assert.equal(normalizeProvider('google-antigravity', 'claude-opus-4-6-thinking'), 'anthropic');
});

test('normalizeModel strips provider and publisher prefixes', () => {
  assert.equal(normalizeModel('google/gemini-3-flash-preview'), 'gemini-3-flash-preview');
  assert.equal(normalizeModel('publishers/google/models/gemini-3.1-pro-preview'), 'gemini-3.1-pro-preview');
  assert.equal(normalizeModel('models/gemini-3-flash-preview'), 'gemini-3-flash-preview');
});

test('aggregateRows merges case variants and keeps configured zero rows', () => {
  const rows = [
    {
      provider: 'google',
      model: 'gemini-3-flash-preview',
      date: '2026-02-25',
      cost: 1,
      estimatedCost: 1,
      inputTokens: 100,
      outputTokens: 20,
      totalTokens: 120,
      cacheReadTokens: 40,
      cacheWriteTokens: 0,
    },
    {
      provider: 'Google',
      model: 'Gemini-3-Flash-Preview',
      date: '2026-02-25',
      cost: 2,
      estimatedCost: 2,
      inputTokens: 300,
      outputTokens: 80,
      totalTokens: 380,
      cacheReadTokens: 100,
      cacheWriteTokens: 0,
    },
  ];

  const configuredModels = [
    { provider: 'google', model: 'gemini-3-flash-preview' },
    { provider: 'google-vertex', model: 'gemini-3.1-pro-preview' },
  ];

  const agg = aggregateRows(rows, configuredModels, { data: {} });

  const google = agg.byProvider.find((x) => x.provider.toLowerCase() === 'google');
  assert.ok(google);
  assert.equal(google.totalTokens, 500);

  const vertexConfigured = agg.byModel.find((x) => x.provider === 'google-vertex' && x.model === 'gemini-3.1-pro-preview');
  assert.ok(vertexConfigured);
  assert.equal(vertexConfigured.totalTokens, 0);
});
