'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

type WorkoutSet = { type: string; reps: number; weight: number };
type Exercise = { name: string; sets: WorkoutSet[]; previous_weight: number | null; equipment_note: string | null; per_side: boolean };
type Session = { id: string; date: string; split: string | null; week: number | null; raw: string; exercises: Exercise[] };

function maxWeight(sets: WorkoutSet[]) {
  return Math.max(0, ...sets.filter(s => s.type === 'working').map(s => s.weight));
}

function maxReps(sets: WorkoutSet[]) {
  return Math.max(0, ...sets.map(s => s.reps));
}

export default function ExercisePage() {
  const params = useParams();
  const exerciseName = decodeURIComponent(params.name as string);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fitness/data', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading…</main>;

  const history = sessions
    .filter(s => s.exercises.some(e => e.name === exerciseName))
    .sort((a, b) => a.date.localeCompare(b.date));

  const chartData = history.map(s => {
    const ex = s.exercises.find(e => e.name === exerciseName)!;
    return {
      date: s.date,
      weight: maxWeight(ex.sets),
      maxReps: maxReps(ex.sets),
      session: s.id,
    };
  });

  const prWeight = Math.max(0, ...chartData.map(d => d.weight));
  const prEntry = chartData.find(d => d.weight === prWeight);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <a href="/fitness/dashboard" className="text-sm text-emerald-400 hover:underline">← Dashboard</a>
        <h1 className="mt-2 text-2xl font-bold">{exerciseName}</h1>
        <p className="text-sm text-zinc-400">{history.length} sessions tracked</p>

        {prEntry && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
            <span className="text-sm text-emerald-300">PR: {prWeight}kg</span>
            <span className="text-xs text-zinc-500">on {prEntry.date} ({prEntry.session})</span>
          </div>
        )}

        {/* Weight Chart */}
        {chartData.length > 0 && (
          <section className="mt-6 rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Weight Progression</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* History Table */}
        <section className="mt-6 rounded-xl border border-white/10 bg-zinc-950/70 p-4">
          <h2 className="text-sm font-semibold text-zinc-200">Full History</h2>
          <div className="mt-3 space-y-2">
            {[...history].reverse().map(s => {
              const ex = s.exercises.find(e => e.name === exerciseName)!;
              return (
                <div key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-zinc-900/60 px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-zinc-200">{s.id}</span>
                    <span className="ml-2 text-xs text-zinc-500">{s.date}</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {ex.sets.map((set, i) => (
                      <span key={i} className={set.type === 'warmup' ? 'text-zinc-600' : ''}>
                        {i > 0 && ' / '}{set.reps}@{set.weight}kg
                      </span>
                    ))}
                    {ex.per_side && ' per side'}
                    {ex.equipment_note && ` (${ex.equipment_note})`}
                    {ex.previous_weight != null && <span className="text-amber-400"> was {ex.previous_weight}kg</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
