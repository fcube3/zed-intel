'use client';

import type { PRRecord } from './types';

function PRCard({ record }: { record: PRRecord }) {
  const date = new Date(record.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-800/60 px-3 py-2.5 gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{record.exercise}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{date}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold text-emerald-400 tabular-nums">
          {record.weightKg}
          <span className="text-xs font-normal text-zinc-500 ml-0.5">kg</span>
        </span>
        {record.isRecent && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 uppercase tracking-wide">
            New
          </span>
        )}
      </div>
    </div>
  );
}

export function PRBoard({ records }: { records: PRRecord[] }) {
  const sorted = [...records].sort((a, b) => b.weightKg - a.weightKg);
  const recent = sorted.filter((r) => r.isRecent).length;

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-200">PR Board</h2>
        {recent > 0 && (
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
            {recent} new PR{recent > 1 ? 's' : ''} this month
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {sorted.map((record) => (
          <PRCard key={record.exercise} record={record} />
        ))}
        {sorted.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-6">No PRs logged yet</p>
        )}
      </div>
    </section>
  );
}
