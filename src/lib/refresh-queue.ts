import { randomUUID } from 'node:crypto';
import { supabase } from './supabase';

export type RefreshStatus = 'pending' | 'running' | 'done' | 'failed' | 'rate_limited';

export type RefreshRequestRow = {
  request_id: string;
  status: RefreshStatus;
  source: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_msg: string | null;
  idempotency_key: string | null;
  requested_by: string | null;
};

export async function enqueueRefreshRequest(opts?: {
  source?: string;
  idempotencyKey?: string;
  requestedBy?: string;
  dedupeWindowSeconds?: number;
}) {
  const source = opts?.source ?? 'web';
  const idempotencyKey = opts?.idempotencyKey ?? randomUUID();
  const requestedBy = opts?.requestedBy ?? 'unknown';
  const dedupeWindowSeconds = opts?.dedupeWindowSeconds ?? 30;

  const cutoffIso = new Date(Date.now() - dedupeWindowSeconds * 1000).toISOString();

  const { data: existing, error: existingErr } = await supabase
    .from('refresh_requests')
    .select('request_id,status,created_at')
    .eq('status', 'pending')
    .gte('created_at', cutoffIso)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    return { ok: false as const, error: existingErr.message };
  }

  if (existing) {
    return { ok: true as const, requestId: existing.request_id, status: existing.status, deduped: true };
  }

  const requestId = randomUUID();
  const { error } = await supabase
    .from('refresh_requests')
    .insert({
      request_id: requestId,
      source,
      status: 'pending',
      idempotency_key: idempotencyKey,
      requested_by: requestedBy,
    });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, requestId, status: 'pending' as const, deduped: false };
}

export async function getRefreshRequestById(requestId: string) {
  const { data, error } = await supabase
    .from('refresh_requests')
    .select('request_id,status,source,created_at,started_at,finished_at,error_msg,idempotency_key,requested_by')
    .eq('request_id', requestId)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, notFound: true };

  return { ok: true as const, row: data as RefreshRequestRow };
}
