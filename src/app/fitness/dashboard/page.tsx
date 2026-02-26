/**
 * /fitness/dashboard — Fitness Hub Dashboard
 *
 * UI layer by Ink. Data layer by Arc.
 * Props are currently mock data — Arc will wire real data via server-side fetch
 * or API routes. Swap the `mock*` constants below with real data sources.
 */

import { StatCards } from '@/components/fitness/StatCards';
import { FitnessChart } from '@/components/fitness/FitnessChart';
import { PRBoard } from '@/components/fitness/PRBoard';
import { WeaknessFlag } from '@/components/fitness/WeaknessFlag';
import { RecentSessions } from '@/components/fitness/RecentSessions';
import type {
  FitnessStats,
  ExerciseProgress,
  PRRecord,
  WorkoutSession,
} from '@/components/fitness/types';

// ─── Mock data (replace with Arc's data layer) ────────────────────────────────

const mockStats: FitnessStats = {
  lastWorkoutDate: new Date(Date.now() - 86400000).toISOString(),
  lastWorkoutSplit: 'Push',
  totalSessions: 142,
  currentWeekSessions: 3,
  currentSplit: 'PPL',
  weeklyVolumeKg: 8450,
  weeklyVolumeDelta: 12,
};

const mockProgress: ExerciseProgress[] = [
  {
    exercise: 'Bench Press',
    trend: 'progress',
    weeksStagnant: 0,
    history: [
      { date: '2025-12-01', weightKg: 80 },
      { date: '2025-12-15', weightKg: 82.5 },
      { date: '2026-01-01', weightKg: 85 },
      { date: '2026-01-15', weightKg: 85 },
      { date: '2026-02-01', weightKg: 87.5 },
      { date: '2026-02-15', weightKg: 90 },
    ],
  },
  {
    exercise: 'Squat',
    trend: 'plateau',
    weeksStagnant: 5,
    history: [
      { date: '2025-12-01', weightKg: 110 },
      { date: '2025-12-15', weightKg: 115 },
      { date: '2026-01-01', weightKg: 120 },
      { date: '2026-01-15', weightKg: 120 },
      { date: '2026-02-01', weightKg: 120 },
      { date: '2026-02-15', weightKg: 120 },
    ],
  },
  {
    exercise: 'Deadlift',
    trend: 'progress',
    weeksStagnant: 0,
    history: [
      { date: '2025-12-01', weightKg: 140 },
      { date: '2025-12-22', weightKg: 145 },
      { date: '2026-01-12', weightKg: 150 },
      { date: '2026-02-02', weightKg: 155 },
      { date: '2026-02-20', weightKg: 160 },
    ],
  },
  {
    exercise: 'OHP',
    trend: 'regression',
    weeksStagnant: 8,
    history: [
      { date: '2025-12-01', weightKg: 60 },
      { date: '2025-12-20', weightKg: 60 },
      { date: '2026-01-10', weightKg: 57.5 },
      { date: '2026-01-30', weightKg: 57.5 },
      { date: '2026-02-18', weightKg: 55 },
    ],
  },
];

const mockPRs: PRRecord[] = [
  { exercise: 'Deadlift', weightKg: 160, date: '2026-02-20', isRecent: true },
  { exercise: 'Squat', weightKg: 120, date: '2026-01-01', isRecent: false },
  { exercise: 'Bench Press', weightKg: 90, date: '2026-02-15', isRecent: true },
  { exercise: 'OHP', weightKg: 65, date: '2025-11-10', isRecent: false },
  { exercise: 'Barbell Row', weightKg: 95, date: '2026-01-28', isRecent: false },
  { exercise: 'Pull-ups', weightKg: 20, date: '2026-02-10', isRecent: true },
];

const mockSessions: WorkoutSession[] = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000).toISOString(),
    splitName: 'Push',
    durationMin: 68,
    totalVolumeKg: 3200,
    exercises: [
      { name: 'Bench Press', sets: [{ weight: 90, reps: 5 }, { weight: 90, reps: 4 }, { weight: 87.5, reps: 5 }] },
      { name: 'Incline DB Press', sets: [{ weight: 32, reps: 10 }, { weight: 32, reps: 9 }] },
      { name: 'OHP', sets: [{ weight: 55, reps: 8 }, { weight: 55, reps: 7 }] },
      { name: 'Lateral Raises', sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 15 }] },
    ],
  },
  {
    id: '2',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    splitName: 'Pull',
    durationMin: 72,
    totalVolumeKg: 3850,
    exercises: [
      { name: 'Deadlift', sets: [{ weight: 160, reps: 3 }, { weight: 155, reps: 5 }] },
      { name: 'Barbell Row', sets: [{ weight: 95, reps: 6 }, { weight: 92.5, reps: 6 }] },
      { name: 'Pull-ups', sets: [{ weight: 20, reps: 6 }, { weight: 20, reps: 5 }] },
      { name: 'Face Pulls', sets: [{ weight: 25, reps: 15 }, { weight: 25, reps: 15 }] },
    ],
  },
  {
    id: '3',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    splitName: 'Legs',
    durationMin: 65,
    totalVolumeKg: 4100,
    exercises: [
      { name: 'Squat', sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 115, reps: 5 }] },
      { name: 'Romanian DL', sets: [{ weight: 90, reps: 8 }, { weight: 90, reps: 8 }] },
      { name: 'Leg Press', sets: [{ weight: 180, reps: 12 }, { weight: 180, reps: 10 }] },
      { name: 'Calf Raises', sets: [{ weight: 60, reps: 20 }, { weight: 60, reps: 20 }] },
    ],
  },
  {
    id: '4',
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    splitName: 'Push',
    durationMin: 60,
    totalVolumeKg: 3050,
    exercises: [
      { name: 'Bench Press', sets: [{ weight: 87.5, reps: 5 }, { weight: 87.5, reps: 5 }] },
      { name: 'OHP', sets: [{ weight: 55, reps: 8 }, { weight: 55, reps: 8 }] },
      { name: 'Dips', sets: [{ weight: 15, reps: 10 }, { weight: 15, reps: 10 }] },
    ],
  },
  {
    id: '5',
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    splitName: 'Pull',
    durationMin: 70,
    totalVolumeKg: 3700,
    exercises: [
      { name: 'Deadlift', sets: [{ weight: 155, reps: 5 }, { weight: 155, reps: 4 }] },
      { name: 'Barbell Row', sets: [{ weight: 92.5, reps: 6 }, { weight: 92.5, reps: 6 }] },
      { name: 'Pull-ups', sets: [{ weight: 17.5, reps: 6 }, { weight: 17.5, reps: 5 }] },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FitnessDashboard() {
  return (
    <main className="min-h-screen bg-[#0d1117] px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Fitness</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <a
          href="/fitness"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back
        </a>
      </div>

      {/* Stats Row */}
      <div className="mb-4">
        <StatCards stats={mockStats} />
      </div>

      {/* Weakness Flags — surface issues prominently */}
      <div className="mb-4">
        <WeaknessFlag exercises={mockProgress} />
      </div>

      {/* Progress Chart */}
      <div className="mb-4">
        <FitnessChart exercises={mockProgress} />
      </div>

      {/* PR Board */}
      <div className="mb-4">
        <PRBoard records={mockPRs} />
      </div>

      {/* Recent Sessions */}
      <div className="mb-4">
        <RecentSessions sessions={mockSessions} />
      </div>

      {/* Footer note for Arc */}
      <p className="text-center text-[10px] text-zinc-700 mt-6">
        UI by Ink · Data layer: Arc
      </p>
    </main>
  );
}
