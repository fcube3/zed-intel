'use client';

import { useState } from 'react';

type UiState = 'idle' | 'queued' | 'picked_up' | 'ok' | 'error' | 'timeout' | 'offline';

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
      let pickedUp = false;
      while (Date.now() - startedAt < 120_000) {
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

        // Check if worker picked up the job
        if (statusData.status === 'running' && statusData.claimedAt) {
          if (!pickedUp) {
            pickedUp = true;
            setStatus('picked_up');
          }
        }

        // If not picked up after 15s, worker is probably offline
        if (!pickedUp && Date.now() - startedAt > 15_000) {
          setStatus('offline');
          setMessage('Mac offline — refresh queued');
          return;
        }
      }

      setStatus('timeout');
      setMessage('Refresh is taking longer than expected; reload later.');
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
      : status === 'picked_up'
        ? 'Refreshing…'
        : status === 'ok'
          ? '✓ Done'
          : status === 'error'
            ? '✗ Retry'
            : status === 'offline'
              ? '⏳ Queued'
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
