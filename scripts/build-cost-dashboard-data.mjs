#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const home = os.homedir();
const outputPath = path.join(process.cwd(), 'public', 'data', 'cost-dashboard.json');
const pricingCachePath = path.join(process.cwd(), 'public', 'data', 'model-pricing-cache.json');

// Canonical community pricing registry used across OpenClaw ecosystem dashboards/tools.
const PRICING_SOURCE_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_SCAN_FILES = 3000;

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function collectFiles(rootDir, predicate, result = []) {
  if (result.length >= MAX_SCAN_FILES) return result;
  const stat = safeStat(rootDir);
  if (!stat || !stat.isDirectory()) return result;

  let entries = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (result.length >= MAX_SCAN_FILES) break;
    const absPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) collectFiles(absPath, predicate, result);
    else if (entry.isFile() && predicate(absPath)) result.push(absPath);
  }

  return result;
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeProvider(rawProvider, model = '') {
  const providerSource = `${rawProvider || ''}`.toLowerCase();
  const modelSource = `${model || ''}`.toLowerCase();
  const source = providerSource || modelSource;

  if (!source) return 'unknown';
  if (source.includes('google-vertex') || source.includes('vertex')) return 'google-vertex';
  if (source.includes('google')) return 'google';
  if (source.includes('openai-codex')) return 'openai-codex';
  if (source.includes('openai') || source.includes('gpt-')) return 'openai';
  if (source.includes('anthropic') || source.includes('claude')) return 'anthropic';
  if (source.includes('xai') || source.includes('grok')) return 'xai';

  return providerSource || 'unknown';
}

function parseDate(anyDate, fallbackMs = Date.now()) {
  if (typeof anyDate === 'number') {
    const ms = anyDate < 1e12 ? anyDate * 1000 : anyDate;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (typeof anyDate === 'string' && anyDate.trim()) {
    const ts = Date.parse(anyDate);
    if (!Number.isNaN(ts)) return new Date(ts).toISOString().slice(0, 10);
  }
  return new Date(fallbackMs).toISOString().slice(0, 10);
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return undefined;
}

function extractFromNode(node, context = {}, out = []) {
  if (!node || typeof node !== 'object') return out;

  const model = pick(node, ['model', 'modelName', 'model_name', 'llmModel']) ?? context.model;
  const provider = pick(node, ['provider', 'vendor', 'service']) ?? context.provider;

  const inputTokens = toNumber(pick(node, ['inputTokens', 'input_tokens', 'promptTokens', 'prompt_tokens']));
  const outputTokens = toNumber(pick(node, ['outputTokens', 'output_tokens', 'completionTokens', 'completion_tokens']));
  let totalTokens = toNumber(pick(node, ['totalTokens', 'total_tokens', 'tokens']));
  const cost = toNumber(pick(node, ['cost', 'usdCost', 'totalCost', 'amountUsd', 'priceUsd', 'costUsd']));

  if (!totalTokens && (inputTokens || outputTokens)) totalTokens = inputTokens + outputTokens;

  const hasUsageSignal = Boolean(cost || totalTokens || inputTokens || outputTokens);
  if (hasUsageSignal) {
    out.push({
      provider: normalizeProvider(provider, model),
      model: model || 'unknown',
      date: parseDate(
        pick(node, ['date', 'day', 'timestamp', 'createdAt', 'created_at', 'time']) ?? context.date,
        context.fallbackMs,
      ),
      cost,
      inputTokens,
      outputTokens,
      totalTokens,
    });
  }

  const nextContext = {
    provider,
    model,
    date: pick(node, ['date', 'day', 'timestamp', 'createdAt', 'created_at', 'time']) ?? context.date,
    fallbackMs: context.fallbackMs,
  };

  if (Array.isArray(node)) {
    for (const item of node) extractFromNode(item, nextContext, out);
  } else {
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') extractFromNode(value, nextContext, out);
    }
  }

  return out;
}

function readJsonlUsage(filePath) {
  const st = safeStat(filePath);
  if (!st || st.size > MAX_FILE_BYTES) return [];

  let text = '';
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const fallbackMs = st.mtimeMs || Date.now();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      extractFromNode(parsed, { fallbackMs }, rows);
    } catch {
      // ignore malformed rows
    }
  }
  return rows;
}

function readJsonUsage(filePath) {
  const st = safeStat(filePath);
  if (!st || st.size > MAX_FILE_BYTES) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const rows = [];
    extractFromNode(parsed, { fallbackMs: st.mtimeMs || Date.now() }, rows);
    return rows;
  } catch {
    return [];
  }
}

function readConfiguredModelsFromOpenClaw() {
  const out = [];

  // Configured defaults/fallbacks are the source of truth for “configured models”.
  const status = spawnSync('openclaw', ['models', 'status', '--json'], { encoding: 'utf8' });
  if (status.status === 0 && status.stdout) {
    try {
      const parsed = JSON.parse(status.stdout);
      const refs = [parsed.defaultModel, ...(Array.isArray(parsed.fallbacks) ? parsed.fallbacks : [])]
        .filter(Boolean)
        .map((v) => String(v));
      for (const ref of refs) {
        const [provider, ...rest] = ref.split('/');
        if (!provider || rest.length === 0) continue;
        out.push({ provider: normalizeProvider(provider, rest.join('/')), model: rest.join('/') });
      }
    } catch {
      // ignore and fallback
    }
  }

  // Include names from list as a fallback to avoid missing configured refs.
  const list = spawnSync('openclaw', ['models', 'list', '--json'], { encoding: 'utf8' });
  if (list.status === 0 && list.stdout) {
    try {
      const parsed = JSON.parse(list.stdout);
      for (const entry of Array.isArray(parsed.models) ? parsed.models : []) {
        const key = String(entry?.key || '');
        if (!key.includes('/')) continue;
        const [provider, ...rest] = key.split('/');
        if (!provider || rest.length === 0) continue;
        out.push({ provider: normalizeProvider(provider, rest.join('/')), model: rest.join('/') });
      }
    } catch {
      // ignore
    }
  }

  const dedup = new Map();
  for (const item of out) dedup.set(`${item.provider}::${item.model}`.toLowerCase(), item);
  return Array.from(dedup.values());
}

async function loadPricingMap() {
  const fallback = (() => {
    try {
      return JSON.parse(fs.readFileSync(pricingCachePath, 'utf8'));
    } catch {
      return null;
    }
  })();

  try {
    const response = await fetch(PRICING_SOURCE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    fs.mkdirSync(path.dirname(pricingCachePath), { recursive: true });
    fs.writeFileSync(
      pricingCachePath,
      JSON.stringify({ fetchedAt: new Date().toISOString(), sourceUrl: PRICING_SOURCE_URL, data: json }, null, 2) + '\n',
      'utf8',
    );
    return { source: PRICING_SOURCE_URL, fetchedAt: new Date().toISOString(), data: json, stale: false };
  } catch {
    if (fallback?.data) {
      return {
        source: fallback.sourceUrl || PRICING_SOURCE_URL,
        fetchedAt: fallback.fetchedAt || null,
        data: fallback.data,
        stale: true,
      };
    }
    return { source: PRICING_SOURCE_URL, fetchedAt: null, data: {}, stale: true };
  }
}

function resolvePricingEntry(pricingMap, provider, model) {
  const candidates = [
    `${provider}/${model}`,
    model,
    provider === 'openai-codex' ? `openai/${model}` : null,
    provider === 'google-vertex' ? `google/${model}` : null,
  ].filter(Boolean);

  for (const key of candidates) {
    const hit = pricingMap[key] || pricingMap[key.toLowerCase()];
    if (hit && typeof hit === 'object') return { key, entry: hit };
  }
  return null;
}

function estimateCostUsd(row, pricing) {
  const inputRate = toNumber(pricing.input_cost_per_token || pricing.inputCostPerToken);
  const outputRate = toNumber(pricing.output_cost_per_token || pricing.outputCostPerToken);
  const cacheReadRate = toNumber(
    pricing.cache_read_input_token_cost || pricing.cacheReadInputTokenCost || pricing.cached_input_cost_per_token,
  );
  const cacheWriteRate = toNumber(
    pricing.cache_creation_input_token_cost || pricing.cacheWriteInputTokenCost || pricing.cache_write_input_token_cost,
  );

  // We do not have cache token split in parsed logs here; treat them as zero unless present in future extraction.
  const estimated = row.inputTokens * inputRate + row.outputTokens * outputRate + 0 * cacheReadRate + 0 * cacheWriteRate;
  return Number.isFinite(estimated) && estimated > 0 ? estimated : 0;
}

function aggregateRows(rows, configuredModels, pricingMeta) {
  const totals = {
    cost: 0,
    estimatedCost: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };

  const byProvider = new Map();
  const byModel = new Map();
  const byDay = new Map();

  for (const { provider } of configuredModels) {
    if (!byProvider.has(provider)) {
      byProvider.set(provider, {
        provider,
        cost: 0,
        estimatedCost: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimated: true,
      });
    }
  }

  for (const { provider, model } of configuredModels) {
    const key = `${provider}::${model}`;
    byModel.set(key, {
      provider,
      model,
      cost: 0,
      estimatedCost: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimated: true,
      priceSourceModelKey: null,
    });
  }

  for (const row of rows) {
    const pricingHit = resolvePricingEntry(pricingMeta.data, row.provider, row.model);
    const estimatedCost = row.cost > 0 ? row.cost : pricingHit ? estimateCostUsd(row, pricingHit.entry) : 0;

    totals.cost += row.cost;
    totals.estimatedCost += estimatedCost;
    totals.inputTokens += row.inputTokens;
    totals.outputTokens += row.outputTokens;
    totals.totalTokens += row.totalTokens;

    const providerVal =
      byProvider.get(row.provider) ||
      { provider: row.provider, cost: 0, estimatedCost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimated: true };
    providerVal.cost += row.cost;
    providerVal.estimatedCost += estimatedCost;
    providerVal.inputTokens += row.inputTokens;
    providerVal.outputTokens += row.outputTokens;
    providerVal.totalTokens += row.totalTokens;
    byProvider.set(row.provider, providerVal);

    const modelKey = `${row.provider}::${row.model}`;
    const modelVal =
      byModel.get(modelKey) ||
      {
        provider: row.provider,
        model: row.model,
        cost: 0,
        estimatedCost: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimated: true,
        priceSourceModelKey: null,
      };
    modelVal.cost += row.cost;
    modelVal.estimatedCost += estimatedCost;
    modelVal.inputTokens += row.inputTokens;
    modelVal.outputTokens += row.outputTokens;
    modelVal.totalTokens += row.totalTokens;
    if (pricingHit?.key) modelVal.priceSourceModelKey = pricingHit.key;
    byModel.set(modelKey, modelVal);

    const dayVal =
      byDay.get(row.date) ||
      { date: row.date, cost: 0, estimatedCost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimated: true };
    dayVal.cost += row.cost;
    dayVal.estimatedCost += estimatedCost;
    dayVal.inputTokens += row.inputTokens;
    dayVal.outputTokens += row.outputTokens;
    dayVal.totalTokens += row.totalTokens;
    byDay.set(row.date, dayVal);
  }

  const sortByUsage = (a, b) => b.estimatedCost - a.estimatedCost || b.totalTokens - a.totalTokens;

  return {
    totals,
    byProvider: Array.from(byProvider.values()).sort(sortByUsage),
    byModel: Array.from(byModel.values()).sort(sortByUsage),
    byDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

async function main() {
  const cronRunsDir = path.join(home, '.openclaw', 'cron', 'runs');
  const openclawRoot = path.join(home, '.openclaw');
  const workspaceDir = path.join(openclawRoot, 'workspace');

  const jsonlFiles = [
    ...collectFiles(cronRunsDir, (p) => p.endsWith('.jsonl')),
    ...collectFiles(workspaceDir, (p) => p.endsWith('.jsonl')),
  ];

  const codexbarPaths = [];
  const explicit = process.env.CODEXBAR_JSON_PATH;
  if (explicit) {
    for (const p of explicit.split(',').map((x) => x.trim()).filter(Boolean)) codexbarPaths.push(path.resolve(p));
  }
  const defaultCodexbar = [
    path.join(home, '.codexbar', 'costs.json'),
    path.join(home, '.codexbar', 'usage.json'),
    path.join(home, '.openclaw', 'codexbar-costs.json'),
    path.join(home, '.openclaw', 'codexbar', 'usage.json'),
  ];
  for (const p of defaultCodexbar) {
    if (safeStat(p)?.isFile()) codexbarPaths.push(p);
  }

  const rows = [];
  for (const filePath of jsonlFiles) rows.push(...readJsonlUsage(filePath));
  for (const filePath of [...new Set(codexbarPaths)]) rows.push(...readJsonUsage(filePath));

  const configuredModels = readConfiguredModelsFromOpenClaw();
  const pricingMeta = await loadPricingMap();
  const { totals, byProvider, byModel, byDay } = aggregateRows(rows, configuredModels, pricingMeta);

  const payload = {
    generatedAt: new Date().toISOString(),
    sources: {
      jsonlFilesScanned: jsonlFiles.length,
      codexbarFilesScanned: [...new Set(codexbarPaths)].length,
      usageRows: rows.length,
      configuredModels: configuredModels.length,
      configuredProviders: [...new Set(configuredModels.map((m) => m.provider))].length,
    },
    pricing: {
      mode: 'estimated',
      sourceUrl: pricingMeta.source,
      fetchedAt: pricingMeta.fetchedAt,
      staleCache: pricingMeta.stale,
      note: 'Estimated from token usage × public model pricing registry; exact vendor billing may differ.',
    },
    totals,
    byProvider,
    byModel,
    byDay,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
  console.log(
    `Rows: ${rows.length}, providers: ${byProvider.length}, models: ${byModel.length}, days: ${byDay.length}, configuredModels: ${configuredModels.length}`,
  );
}

main();