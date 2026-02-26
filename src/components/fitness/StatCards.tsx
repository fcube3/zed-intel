'use client';

import type { FitnessStats } from './types';

function formatVolume(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function deltaClass(delta: number) {
  if (delta > 0) return 'text-emerald-400';
  if (delta < 0) return 'text-red-400';
  return 'text-zinc-500';
}

function StatCard({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string;
  sub?: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4 flex flex-col gap-1 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">{label}</p>
      <p className="text-xl font-semibold text-zinc-100 truncate">{value}</p>
      <div className="flex items-center gap-2 min-h-[1rem]">
        {sub && <p className="text-xs text-zinc-400 truncate">{sub}</p>}
        {badge && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCards({ stats }: { stats: FitnessStats }) {
  const lastDate = new Date(stats.lastWorkoutDate);
  const daysAgo = Math.floor(
    (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastWorkoutSub =
    daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  const volDelta = stats.weeklyVolumeDelta;
  const volBadge = volDelta !== 0
    ? {
        text: `${volDelta > 0 ? '+' : ''}${volDelta.toFixed(0)}%`,
        color: volDelta > 0
          ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
          : 'text-red-400 border-red-400/30 bg-red-400/10',
      }
    : undefined;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Last Workout"
        value={stats.lastWorkoutSplit}
        sub={lastWorkoutSub}
      />
      <StatCard
        label="Total Sessions"
        value={String(stats.totalSessions)}
        sub={`${stats.currentWeekSessions} this week`}
      />
      <StatCard
        label="Current Split"
        value={stats.currentSplit}
        sub="Active program"
      />
      <StatCard
        label="Weekly Volume"
        value={formatVolume(stats.weeklyVolumeKg)}
        sub="vs last week"
        badge={volBadge}
      />
    </div>
  );
}
