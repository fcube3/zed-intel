import fs from 'node:fs';
import path from 'node:path';
import { supabase } from './supabase.ts';

const TABLE = 'opcost_snapshots';
const ROW_ID = 1;

function fallbackPayload() {
  return {
    generatedAt: new Date().toISOString(),
    totals: { cost: 0, estimatedCost: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    byProvider: [],
    byModel: [],
    byDay: [],
  };
}

function toDashboardShape(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.totals || !Array.isArray(payload.byProvider) || !Array.isArray(payload.byModel) || !Array.isArray(payload.byDay)) {
    return null;
  }
  return payload;
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

export async function writeDashboardToSupabase(payload) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({
      id: ROW_ID,
      data: payload,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[ops-cost-storage] Supabase upsert failed', error);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function readDashboardFromSupabase() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', ROW_ID)
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message || 'empty' };
  }

  const shaped = toDashboardShape(data.data);
  if (!shaped) return { ok: false, reason: 'invalid_payload' };
  return { ok: true, payload: shaped };
}

export async function loadDashboardData() {
  const fromDb = await readDashboardFromSupabase();
  if (fromDb.ok) {
    return {
      data: fromDb.payload,
      diagnostics: {
        source: 'supabase',
        generatedAt: fromDb.payload.generatedAt,
        warning: null,
      },
    };
  }

  const filePayload = readBundledDashboardFile();
  const reason = fromDb.reason === 'empty' ? 'Supabase has no payload yet.' : `Supabase unavailable (${fromDb.reason}).`;

  return {
    data: filePayload,
    diagnostics: {
      source: 'file-fallback',
      generatedAt: filePayload.generatedAt,
      warning: `${reason} Showing bundled read-only fallback data.`,
    },
  };
}
