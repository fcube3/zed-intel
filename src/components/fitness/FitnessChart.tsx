'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { ExerciseProgress } from './types';

const TREND_COLOR = {
  progress: '#34d399',   // emerald-400
  plateau: '#f59e0b',    // amber-400
  regression: '#f87171', // red-400
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-zinc-100 font-semibold">{payload[0].value} kg</p>
    </div>
  );
}

export function FitnessChart({
  exercises,
}: {
  exercises: ExerciseProgress[];
}) {
  const [selected, setSelected] = useState(exercises[0]?.exercise ?? '');

  const current = exercises.find((e) => e.exercise === selected);
  const data = current?.history.map((h) => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: h.weightKg,
  })) ?? [];

  const prValue = data.length > 0 ? Math.max(...data.map((d) => d.weight)) : null;
  const lineColor = current ? TREND_COLOR[current.trend] : '#58a6ff';

  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-sm font-semibold text-zinc-200 shrink-0">Weight Progress</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="ml-auto text-xs rounded-lg border border-white/10 bg-zinc-800 text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[180px] truncate"
        >
          {exercises.map((ex) => (
            <option key={ex.exercise} value={ex.exercise}>
              {ex.exercise}
            </option>
          ))}
        </select>
      </div>

      {current && (
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
            style={{
              color: lineColor,
              borderColor: `${lineColor}44`,
              backgroundColor: `${lineColor}18`,
            }}
          >
            {current.trend === 'progress' ? '↑ Progressing' :
             current.trend === 'plateau' ? '→ Plateau' : '↓ Regressing'}
          </span>
          {prValue !== null && (
            <span className="text-[10px] text-zinc-500">
              PR: <span className="text-emerald-400 font-medium">{prValue}kg</span>
            </span>
          )}
        </div>
      )}

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {prValue !== null && (
              <ReferenceLine
                y={prValue}
                stroke="#34d399"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <Line
              type="monotone"
              dataKey="weight"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
