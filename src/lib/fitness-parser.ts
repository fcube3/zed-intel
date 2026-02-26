/**
 * Workout note parser — handles Apple Notes format.
 * ALWAYS preserves raw text. Structured parse is best-effort.
 */

export type WorkoutSet = {
  type: 'warmup' | 'working';
  reps: number;
  weight: number;
};

export type Exercise = {
  name: string;
  sets: WorkoutSet[];
  previous_weight: number | null;
  equipment_note: string | null;
  per_side: boolean;
};

export type WorkoutSession = {
  id: string;
  date: string; // YYYY-MM-DD
  split: string | null;
  week: number | null;
  raw: string;
  exercises: Exercise[];
  parse_error?: string;
};

/**
 * Parse a title like "Workout B42, 02/24" or "Workout D+E24, 01/15"
 * Returns { id, split, week, month, day } or null if unparseable.
 */
function parseTitle(title: string): {
  id: string;
  split: string | null;
  week: number | null;
  month: number;
  day: number;
} | null {
  // Match: Workout <id>, <MM/DD>
  const m = title.match(/^Workout\s+(\S+),\s*(\d{1,2})\/(\d{1,2})$/i);
  if (!m) return null;

  const id = m[1];
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);

  // Extract split letter(s) and week from id like "B42", "D+E24"
  const idMatch = id.match(/^([A-F](?:\+[A-F])?)(\d+)$/i);
  const split = idMatch ? idMatch[1].toUpperCase() : null;
  const week = idMatch ? parseInt(idMatch[2], 10) : null;

  return { id, split, week, month, day };
}

/**
 * Derive full date (YYYY-MM-DD) from month/day + a reference year.
 * referenceYear is typically from the note's creation date.
 */
function deriveDate(month: number, day: number, referenceYear: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${referenceYear}-${mm}-${dd}`;
}

/**
 * Parse an exercise line like:
 *   "Hack Squat, warmup 8@57kg, working 6/6/6@77/87/97kg"
 *   "Bulgarian squat, 10/10/10@12kg (was 16kg)"
 *   "Hammer curl, 10/10/7@10kg per"
 */
function parseExerciseLine(line: string): Exercise | null {
  // Split name from set data. We need to handle commas inside parentheses.
  // Strategy: find the first comma that's not inside parentheses.
  let depth = 0;
  let splitIdx = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '(') depth++;
    else if (line[i] === ')') depth--;
    else if (line[i] === ',' && depth === 0) { splitIdx = i; break; }
  }
  if (splitIdx < 0) return null;

  let name = line.slice(0, splitIdx).trim();
  const rest = line.slice(splitIdx + 1).trim();

  // Extract equipment annotation from name: "Panatta Lateral raise (h3,-1)"
  let equipment_note: string | null = null;
  const equipMatch = name.match(/\(([^)]+)\)\s*$/);
  if (equipMatch) {
    equipment_note = equipMatch[1];
    name = name.slice(0, equipMatch.index).trim();
  }

  // Also check rest for equipment annotations not in name
  // e.g. "Rear delt (flye machine, h5), 12/12/12@33kg"
  // This case: name="Rear delt (flye machine, h5)" — already handled above

  // Check for (was Xkg)
  let previous_weight: number | null = null;
  const wasMatch = rest.match(/\(was\s+(\d+(?:\.\d+)?)kg\)/i);
  if (wasMatch) {
    previous_weight = parseFloat(wasMatch[1]);
  }

  // Check for "per" suffix
  const per_side = /\bper\s*$/i.test(rest);

  // Parse sets
  const sets: WorkoutSet[] = [];

  // Check for warmup/working pattern
  const warmupMatch = rest.match(/warmup\s+([\d/]+)@([\d./]+)kg/i);
  const workingMatch = rest.match(/working\s+([\d/]+)@([\d./]+)kg/i);

  if (warmupMatch || workingMatch) {
    if (warmupMatch) {
      const reps = warmupMatch[1].split('/').map(Number);
      const weights = warmupMatch[2].split('/').map(Number);
      for (let i = 0; i < reps.length; i++) {
        const w = weights.length === 1 ? weights[0] : weights[i] || weights[weights.length - 1];
        if (reps[i] > 0) sets.push({ type: 'warmup', reps: reps[i], weight: w });
      }
    }
    if (workingMatch) {
      const reps = workingMatch[1].split('/').map(Number);
      const weights = workingMatch[2].split('/').map(Number);
      for (let i = 0; i < reps.length; i++) {
        const w = weights.length === 1 ? weights[0] : weights[i] || weights[weights.length - 1];
        if (reps[i] > 0) sets.push({ type: 'working', reps: reps[i], weight: w });
      }
    }
  } else {
    // Simple pattern: 10/10/10@45kg or 6/6/6@77/87/97kg
    const simpleMatch = rest.match(/([\d/]+)@([\d./]+)kg/);
    if (simpleMatch) {
      const reps = simpleMatch[1].split('/').map(Number);
      const weights = simpleMatch[2].split('/').map(Number);
      for (let i = 0; i < reps.length; i++) {
        const w = weights.length === 1 ? weights[0] : weights[i] || weights[weights.length - 1];
        if (reps[i] > 0) sets.push({ type: 'working', reps: reps[i], weight: w });
      }
    }
  }

  if (!name) return null;

  return { name, sets, previous_weight, equipment_note, per_side };
}

/**
 * Parse a full workout note.
 * @param noteText  Raw note text
 * @param referenceYear  Year to use for date derivation (from note metadata)
 */
export function parseWorkoutNote(
  noteText: string,
  referenceYear: number = new Date().getFullYear()
): WorkoutSession {
  const lines = noteText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const titleLine = lines[0] || '';
  const parsed = parseTitle(titleLine);

  if (!parsed) {
    // Unparseable — store raw, skip structured parse
    return {
      id: titleLine.replace(/[^a-zA-Z0-9+]/g, '_').slice(0, 40) || 'unknown',
      date: `${referenceYear}-01-01`,
      split: null,
      week: null,
      raw: noteText,
      exercises: [],
      parse_error: `Could not parse title: "${titleLine}"`,
    };
  }

  const exercises: Exercise[] = [];
  for (let i = 1; i < lines.length; i++) {
    const ex = parseExerciseLine(lines[i]);
    if (ex) exercises.push(ex);
  }

  return {
    id: parsed.id,
    date: deriveDate(parsed.month, parsed.day, referenceYear),
    split: parsed.split,
    week: parsed.week,
    raw: noteText,
    exercises,
  };
}
