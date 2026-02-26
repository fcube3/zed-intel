#!/usr/bin/env node
/**
 * fitness-import.js — Reads workout notes from Apple Notes, parses them,
 * and POSTs to the kai-intel /api/fitness/import endpoint.
 *
 * Usage:
 *   FITNESS_PASSWORD=fitness2026 IMPORT_URL=https://kai-intel.vercel.app node scripts/fitness-import.js
 *
 * Environment:
 *   IMPORT_URL       — Base URL (default: http://localhost:3000)
 *   FITNESS_PASSWORD — Auth password
 *   NOTES_FOLDER     — Apple Notes folder name (default: "Workout")
 *   DRY_RUN          — If "1", parse only, don't POST
 */

const { execSync } = require('child_process');

// ── Config ──────────────────────────────────────────────────────
const IMPORT_URL = process.env.IMPORT_URL || 'http://localhost:3000';
const FITNESS_PASSWORD = process.env.FITNESS_PASSWORD || 'fitness2026';
const NOTES_FOLDER = process.env.NOTES_FOLDER || 'Workout';
const DRY_RUN = process.env.DRY_RUN === '1';

// ── Read notes from Apple Notes via osascript ───────────────────
function readNotesFromFolder(folderName) {
  const script = `
    tell application "Notes"
      set output to ""
      try
        set targetFolder to folder "${folderName}" of default account
        set noteList to notes of targetFolder
        repeat with n in noteList
          set noteBody to plaintext of n
          set noteDate to creation date of n
          set output to output & "---NOTE_SEP---" & (noteDate as string) & "---DATE_END---" & noteBody
        end repeat
      end try
      return output
    end tell
  `;

  try {
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });
    return result;
  } catch (err) {
    console.error('Failed to read Apple Notes:', err.message);
    return '';
  }
}

function parseAppleDate(dateStr) {
  // Apple returns dates like "Thursday, February 24, 2026 at 10:30:00 AM"
  // or locale-dependent. Try native Date parse.
  const d = new Date(dateStr.trim());
  return isNaN(d.getTime()) ? new Date() : d;
}

// ── Parser (mirrors src/lib/fitness-parser.ts) ──────────────────
function parseTitle(title) {
  const m = title.match(/^Workout\s+(\S+),\s*(\d{1,2})\/(\d{1,2})$/i);
  if (!m) return null;
  const id = m[1];
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  const idMatch = id.match(/^([A-F](?:\+[A-F])?)(\d+)$/i);
  const split = idMatch ? idMatch[1].toUpperCase() : null;
  const week = idMatch ? parseInt(idMatch[2], 10) : null;
  return { id, split, week, month, day };
}

function parseExerciseLine(line) {
  // Find first comma not inside parentheses
  let depth = 0, splitIdx = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '(') depth++;
    else if (line[i] === ')') depth--;
    else if (line[i] === ',' && depth === 0) { splitIdx = i; break; }
  }
  if (splitIdx < 0) return null;

  let name = line.slice(0, splitIdx).trim();
  const rest = line.slice(splitIdx + 1).trim();

  let equipment_note = null;
  const equipMatch = name.match(/\(([^)]+)\)\s*$/);
  if (equipMatch) {
    equipment_note = equipMatch[1];
    name = name.slice(0, equipMatch.index).trim();
  }

  let previous_weight = null;
  const wasMatch = rest.match(/\(was\s+(\d+(?:\.\d+)?)kg\)/i);
  if (wasMatch) previous_weight = parseFloat(wasMatch[1]);

  const per_side = /\bper\s*$/i.test(rest);
  const sets = [];

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

function parseWorkoutNote(noteText, referenceYear) {
  const lines = noteText.split('\n').map(l => l.trim()).filter(Boolean);
  const titleLine = lines[0] || '';
  const parsed = parseTitle(titleLine);

  if (!parsed) {
    return {
      id: titleLine.replace(/[^a-zA-Z0-9+]/g, '_').slice(0, 40) || 'unknown',
      date: `${referenceYear}-01-01`,
      split: null, week: null,
      raw: noteText,
      exercises: [],
      parse_error: `Could not parse title: "${titleLine}"`,
    };
  }

  const exercises = [];
  for (let i = 1; i < lines.length; i++) {
    const ex = parseExerciseLine(lines[i]);
    if (ex) exercises.push(ex);
  }

  const mm = String(parsed.month).padStart(2, '0');
  const dd = String(parsed.day).padStart(2, '0');

  return {
    id: parsed.id,
    date: `${referenceYear}-${mm}-${dd}`,
    split: parsed.split,
    week: parsed.week,
    raw: noteText,
    exercises,
  };
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log(`Reading notes from folder: ${NOTES_FOLDER}`);
  const raw = readNotesFromFolder(NOTES_FOLDER);

  if (!raw || !raw.includes('---NOTE_SEP---')) {
    console.log('No notes found. Make sure the folder exists in Apple Notes.');
    process.exit(0);
  }

  const noteChunks = raw.split('---NOTE_SEP---').filter(Boolean);
  console.log(`Found ${noteChunks.length} notes`);

  const sessions = [];
  for (const chunk of noteChunks) {
    const dateEnd = chunk.indexOf('---DATE_END---');
    const dateStr = dateEnd > 0 ? chunk.slice(0, dateEnd) : '';
    const noteText = dateEnd > 0 ? chunk.slice(dateEnd + 14).trim() : chunk.trim();

    if (!noteText) continue;

    const refDate = parseAppleDate(dateStr);
    const session = parseWorkoutNote(noteText, refDate.getFullYear());
    sessions.push(session);

    const status = session.parse_error ? '⚠' : '✓';
    console.log(`  ${status} ${session.id} (${session.date}) — ${session.exercises.length} exercises`);
  }

  console.log(`\nParsed ${sessions.length} sessions total`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Not sending to server. Sample output:');
    console.log(JSON.stringify(sessions.slice(0, 2), null, 2));
    return;
  }

  // POST to import endpoint
  const url = `${IMPORT_URL}/api/fitness/import`;
  console.log(`\nPOSTing to ${url}...`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Fitness-Password': FITNESS_PASSWORD,
    },
    body: JSON.stringify(sessions),
  });

  const result = await resp.json();
  if (resp.ok) {
    console.log('Import successful:', result);
  } else {
    console.error('Import failed:', resp.status, result);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
