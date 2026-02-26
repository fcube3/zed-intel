'use client';

import { useEffect, useState } from 'react';

type WorkoutSet = { type: string; reps: number; weight: number };
type Exercise = { name: string; sets: WorkoutSet[]; previous_weight: number | null; equipment_note: string | null; per_side: boolean };
type Session = { id: string; date: string; split: string | null; week: number | null; raw: string; exercises: Exercise[]; parse_error?: string };

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [splitFilter, setSplitFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fitness/data', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading…</main>;

  const splits = Array.from(new Set(sessions.map(s => s.split).filter(Boolean))) as string[];

  const filtered = [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(s => {
      if (splitFilter && s.split !== splitFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.id.toLowerCase().includes(q) ||
          s.date.includes(q) ||
          s.exercises.some(e => e.name.toLowerCase().includes(q));
      }
      return true;
    });

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Private · Fitness</p>
            <h1 className="mt-1 text-2xl font-bold">All Sessions</h1>
          </div>
          <a href="/fitness/dashboard" className="text-sm text-emerald-400 hover:underline">← Dashboard</a>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            placeholder="Search exercise, id, date…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
          <select
            value={splitFilter} onChange={e => setSplitFilter(e.target.value)}
            className="rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="">All Splits</option>
            {splits.map(s => <option key={s} value={s}>Split {s}</option>)}
          </select>
        </div>

        <p className="mt-3 text-xs text-zinc-500">{filtered.length} sessions</p>

        <div className="mt-4 space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="rounded-lg border border-white/5 bg-zinc-900/60">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-100">{s.id}</span>
                  <span className="text-sm text-zinc-500">{s.date}</span>
                  {s.split && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300">Split {s.split}</span>}
                  {s.parse_error && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">⚠ parse issue</span>}
                </div>
                <span className="text-xs text-zinc-500">{s.exercises.length} ex</span>
              </button>
              {expanded === s.id && (
                <div className="border-t border-white/5 px-4 py-3 space-y-1">
                  {s.exercises.map((ex, i) => (
                    <div key={i} className="flex flex-wrap items-baseline gap-2">
                      <a href={`/fitness/exercises/${encodeURIComponent(ex.name)}`} className="text-sm font-medium text-zinc-200 hover:text-emerald-400">{ex.name}</a>
                      <span className="text-xs text-zinc-500">
                        {ex.sets.map(set => `${set.reps}@${set.weight}kg`).join(' / ')}
                        {ex.per_side && ' per side'}
                        {ex.equipment_note && ` (${ex.equipment_note})`}
                        {ex.previous_weight != null && ` (was ${ex.previous_weight}kg)`}
                      </span>
                    </div>
                  ))}
                  {s.parse_error && <p className="text-xs text-amber-400">{s.parse_error}</p>}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-zinc-500">Raw note</summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-950 p-2 text-xs text-zinc-400">{s.raw}</pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
