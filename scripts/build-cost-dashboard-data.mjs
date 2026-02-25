#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const home = os.homedir();
const outputPath = path.join(process.cwd(), 'public', 'data', 'cost-dashboard.json');

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
    if (entry.isDirectory()) {
      collectFiles(absPath, predicate, result);
    } else if (entry.isFile() && predicate(absPath)) {
      result.push(absPath);
    }
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
  if (source.includes('openai-codex') || modelSource.includes('codex')) return 'openai-codex';
  if (source.includes('openai')) return 'openai';
  if (source.includes('anthropic')) return 'anthropic';
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

  if (!totalTokens && (inputTokens || outputTokens)) {
    totalTokens = inputTokens + outputTokens;
  }

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
      // Ignore malformed JSONL rows.
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

function aggregateRows(rows) {
  const totals = { cost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const byProvider = new Map();
  const byModel = new Map();
  const byDay = new Map();

  for (const row of rows) {
    totals.cost += row.cost;
    totals.inputTokens += row.inputTokens;
    totals.outputTokens += row.outputTokens;
    totals.totalTokens += row.totalTokens;

    const providerVal = byProvider.get(row.provider) || { provider: row.provider, cost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    providerVal.cost += row.cost;
    providerVal.inputTokens += row.inputTokens;
    providerVal.outputTokens += row.outputTokens;
    providerVal.totalTokens += row.totalTokens;
    byProvider.set(row.provider, providerVal);

    const modelKey = `${row.provider}::${row.model}`;
    const modelVal = byModel.get(modelKey) || { provider: row.provider, model: row.model, cost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    modelVal.cost += row.cost;
    modelVal.inputTokens += row.inputTokens;
    modelVal.outputTokens += row.outputTokens;
    modelVal.totalTokens += row.totalTokens;
    byModel.set(modelKey, modelVal);

    const dayVal = byDay.get(row.date) || { date: row.date, cost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    dayVal.cost += row.cost;
    dayVal.inputTokens += row.inputTokens;
    dayVal.outputTokens += row.outputTokens;
    dayVal.totalTokens += row.totalTokens;
    byDay.set(row.date, dayVal);
  }

  const sortByUsage = (a, b) => (b.cost - a.cost) || (b.totalTokens - a.totalTokens);

  return {
    totals,
    byProvider: Array.from(byProvider.values()).sort(sortByUsage),
    byModel: Array.from(byModel.values()).sort(sortByUsage),
    byDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function main() {
  const cronRunsDir = path.join(home, '.openclaw', 'cron', 'runs');
  const workspaceDir = path.join(home, '.openclaw', 'workspace');
  const jsonlFiles = [
    ...collectFiles(cronRunsDir, (p) => p.endsWith('.jsonl')),
    ...collectFiles(workspaceDir, (p) => p.endsWith('.jsonl')),
  ];

  const codexbarPaths = [];
  const explicit = process.env.CODEXBAR_JSON_PATH;
  if (explicit) {
    for (const p of explicit.split(',').map((x) => x.trim()).filter(Boolean)) {
      codexbarPaths.push(path.resolve(p));
    }
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
  const codexbarDir = path.join(home, '.codexbar');
  codexbarPaths.push(...collectFiles(codexbarDir, (p) => p.endsWith('.json')));

  const rows = [];
  for (const filePath of jsonlFiles) rows.push(...readJsonlUsage(filePath));
  for (const filePath of [...new Set(codexbarPaths)]) rows.push(...readJsonUsage(filePath));

  const { totals, byProvider, byModel, byDay } = aggregateRows(rows);

  const payload = {
    generatedAt: new Date().toISOString(),
    sources: {
      jsonlFilesScanned: jsonlFiles.length,
      codexbarFilesScanned: [...new Set(codexbarPaths)].length,
      usageRows: rows.length,
    },
    totals,
    byProvider,
    byModel,
    byDay,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
  console.log(`Rows: ${rows.length}, providers: ${byProvider.length}, models: ${byModel.length}, days: ${byDay.length}`);
}

main();
