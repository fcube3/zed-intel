'use client';

import { useState } from 'react';
import type { WorkoutSession } from './types';

function formatDuration(min?: number) {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function formatVolume(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function SessionRow({ session }: { session: WorkoutSession }) {
  const [open, setOpen] = useState(false);
  const date = new Date(session.date);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const duration = formatDuration(session.durationMin);
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 gap-2 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">{session.splitName}</span>
            <span className="text-[10px] text-zinc-500">{dateStr}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-zinc-500">
              {session.exercises.length} exercises · {totalSets} sets · {formatVolume(session.totalVolumeKg)}
            </span>
            {duration && (
              <span className="text-[10px] text-zinc-600">{duration}</span>
            )}
          </div>
        </div>
        <span className={`text-zinc-500 text-xs shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="pb-3 flex flex-col gap-1.5 pl-1">
          {session.exercises.map((ex) => {
            const topSet = ex.sets.reduce(
              (best, s) => (s.weight > best.weight ? s : best),
              ex.sets[0]
            );
            return (
              <div key={ex.name} className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 truncate">{ex.name}</span>
                <span className="text-zinc-500 shrink-0 ml-2 tabular-nums">
                  {ex.sets.length} × {topSet?.reps}
                  {topSet?.weight ? ` @ ${topSet.weight}kg` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RecentSessions({ sessions }: { sessions: WorkoutSession[] }) {
  const recent = sessions.slice(0, 5);

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-zinc-200">Recent Sessions</h2>
        <span className="text-[10px] text-zinc-500">Last {recent.length}</span>
      </div>
      <div>
        {recent.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
        {recent.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-6">No sessions logged yet</p>
        )}
      </div>
    </section>
  );
}
