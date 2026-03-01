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
      className="bg-[#3B82F6] text-white text-sm px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {loading ? 'Pulling…' : status === 'ok' ? '✓ Done' : status === 'error' ? '✗ Retry' : 'Refresh ↺'}
    </button>
  );
}
