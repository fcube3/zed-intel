'use client';

import { useState } from 'react';

type UiState = 'idle' | 'queued' | 'ok' | 'error' | 'timeout';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<UiState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/costs/refresh', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
      });

      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.requestId) {
        setStatus('error');
        setMessage(data?.message || 'Failed to queue refresh.');
        return;
      }

      setStatus('queued');

      const startedAt = Date.now();
      while (Date.now() - startedAt < 30_000) {
        await sleep(2_000);
        const statusRes = await fetch(`/api/costs/refresh-status?requestId=${encodeURIComponent(data.requestId)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        const statusData = await statusRes.json();
        if (!statusRes.ok || !statusData?.ok) {
          continue;
        }

        if (statusData.status === 'done') {
          setStatus('ok');
          window.location.reload();
          return;
        }

        if (statusData.status === 'failed') {
          setStatus('error');
          setMessage(statusData.error || 'Refresh failed.');
          return;
        }
      }

      setStatus('timeout');
      setMessage('Refresh queued locally; reload in a few seconds.');
    } catch {
      setStatus('error');
      setMessage('Refresh failed.');
    } finally {
      setLoading(false);
    }
  }

  const label = loading
    ? 'Queueing…'
    : status === 'queued'
      ? 'Queued…'
      : status === 'ok'
        ? '✓ Done'
        : status === 'error'
          ? '✗ Retry'
          : status === 'timeout'
            ? 'Queued ✓'
            : 'Refresh ↺';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="bg-[#3B82F6] text-white text-sm px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {label}
      </button>
      {message && <p className="text-xs text-[#98989D]">{message}</p>}
    </div>
  );
}
