// Fitness data types — UI layer only
// Arc owns the data layer; these types define the contract between layers

export type WorkoutSession = {
  id: string;
  date: string; // ISO date string
  splitName: string; // e.g. "Push", "Pull", "Legs"
  durationMin?: number;
  exercises: SessionExercise[];
  totalVolumeKg: number; // sum of sets * reps * weight
};

export type SessionExercise = {
  name: string;
  sets: ExerciseSet[];
};

export type ExerciseSet = {
  weight: number; // kg
  reps: number;
};

export type PRRecord = {
  exercise: string;
  weightKg: number;
  date: string;
  isRecent: boolean; // set within last 4 weeks
};

export type ExerciseProgress = {
  exercise: string;
  history: { date: string; weightKg: number }[];
  trend: 'progress' | 'plateau' | 'regression';
  weeksStagnant: number;
};

export type FitnessStats = {
  lastWorkoutDate: string;
  lastWorkoutSplit: string;
  totalSessions: number;
  currentWeekSessions: number;
  currentSplit: string; // e.g. "PPL", "Upper/Lower"
  weeklyVolumeKg: number;
  weeklyVolumeDelta: number; // vs last week, percentage
};
