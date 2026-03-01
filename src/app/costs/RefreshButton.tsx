'use client';

import { useState } from 'react';

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  async function handleRefresh() {
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/costs/refresh', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('ok');
        setTimeout(() => window.location.reload(), 500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="rounded-lg border border-[#DA7756]/40 bg-[#DA7756]/10 px-3 py-1.5 text-xs font-medium text-[#DA7756] transition-all hover:bg-[#DA7756]/20 disabled:opacity-50"
    >
      {loading ? 'Pulling…' : status === 'ok' ? '✓ Done' : status === 'error' ? '✗ Retry' : '↻ Refresh Now'}
    </button>
  );
}
