import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_KV_KEY = 'ops-cost:latest';

function fallbackPayload() {
  return {
    generatedAt: new Date().toISOString(),
    totals: { cost: 0, estimatedCost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    byProvider: [],
    byModel: [],
    byDay: [],
  };
}

export function getKvConfig() {
  const url = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim() || '';
  const token = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || '';
  const key = process.env.OPS_COST_KV_KEY?.trim() || DEFAULT_KV_KEY;

  return {
    url,
    token,
    key,
    available: Boolean(url && token),
  };
}

async function callKv(command) {
  const cfg = getKvConfig();
  if (!cfg.available) {
    return { ok: false, reason: 'KV env vars are not configured (KV_REST_API_URL + KV_REST_API_TOKEN).' };
  }

  const response = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { ok: false, reason: `KV HTTP ${response.status}` };
  }

  const json = await response.json();
  if (json?.error) {
    return { ok: false, reason: String(json.error) };
  }

  return { ok: true, result: json?.result };
}

export function readBundledDashboardFile() {
  const filePath = path.join(process.cwd(), 'public', 'data', 'cost-dashboard.json');
  const fallback = fallbackPayload();

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function toDashboardShape(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.totals || !Array.isArray(payload.byProvider) || !Array.isArray(payload.byModel) || !Array.isArray(payload.byDay)) {
    return null;
  }
  return payload;
}

export async function readDashboardFromKv() {
  const cfg = getKvConfig();
  if (!cfg.available) {
    return { ok: false, reason: 'unavailable' };
  }

  const result = await callKv(['GET', cfg.key]);
  if (!result.ok) {
    return { ok: false, reason: result.reason || 'get_failed' };
  }

  if (!result.result) {
    return { ok: false, reason: 'empty' };
  }

  try {
    const parsed = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
    const shaped = toDashboardShape(parsed);
    if (!shaped) return { ok: false, reason: 'invalid_payload' };
    return { ok: true, payload: shaped };
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
}

export async function writeDashboardToKv(payload) {
  const cfg = getKvConfig();
  if (!cfg.available) {
    return { ok: false, reason: 'unavailable' };
  }

  const result = await callKv(['SET', cfg.key, JSON.stringify(payload)]);
  if (!result.ok) {
    return { ok: false, reason: result.reason || 'set_failed' };
  }

  return { ok: true };
}

export async function loadDashboardData() {
  const fromKv = await readDashboardFromKv();
  if (fromKv.ok) {
    return {
      data: fromKv.payload,
      diagnostics: {
        source: 'kv',
        generatedAt: fromKv.payload.generatedAt,
        warning: null,
      },
    };
  }

  const filePayload = readBundledDashboardFile();
  const reason = fromKv.reason === 'empty' ? 'KV has no payload yet.' : `KV unavailable (${fromKv.reason}).`;

  return {
    data: filePayload,
    diagnostics: {
      source: 'file-fallback',
      generatedAt: filePayload.generatedAt,
      warning: `${reason} Showing bundled read-only fallback data.`,
    },
  };
}
