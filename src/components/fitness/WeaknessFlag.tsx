'use client';

import type { ExerciseProgress } from './types';

const PLATEAU_WEEKS = 4;

function severityStyle(weeks: number) {
  if (weeks >= 8) {
    return {
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      dot: 'bg-red-500',
      badge: 'text-red-400 bg-red-400/10 border-red-400/30',
      label: 'Stagnant',
      icon: '⚠',
    };
  }
  return {
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    dot: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    label: 'Plateau',
    icon: '→',
  };
}

export function WeaknessFlag({
  exercises,
}: {
  exercises: ExerciseProgress[];
}) {
  const flagged = exercises.filter(
    (e) => e.trend === 'plateau' || e.trend === 'regression'
  );

  if (flagged.length === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Weakness Flags</h2>
        <p className="text-xs text-emerald-400 flex items-center gap-2">
          <span>✓</span>
          <span>All lifts progressing — nothing stagnant this month</span>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-200">Weakness Flags</h2>
        <span className="text-[10px] text-zinc-500">{flagged.length} lift{flagged.length > 1 ? 's' : ''} flagged</span>
      </div>

      <div className="flex flex-col gap-2">
        {flagged.map((ex) => {
          const style = severityStyle(ex.weeksStagnant);
          const lastWeight = ex.history[ex.history.length - 1]?.weightKg;

          return (
            <div
              key={ex.exercise}
              className={`rounded-lg border ${style.border} ${style.bg} px-3 py-2.5 flex items-center justify-between gap-2`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{ex.exercise}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    No progress for <span className="text-zinc-300">{ex.weeksStagnant}w</span>
                    {lastWeight && (
                      <> · stuck at <span className="text-zinc-300">{lastWeight}kg</span></>
                    )}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${style.badge}`}>
                {style.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">
        Flagged = no new top-weight in {PLATEAU_WEEKS}+ weeks
      </p>
    </section>
  );
}
