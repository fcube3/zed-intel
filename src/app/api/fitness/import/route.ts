import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { WorkoutSession } from '@/lib/fitness-parser';

export async function POST(request: NextRequest) {
  const expectedPassword = process.env.FITNESS_PASSWORD?.trim();
  if (!expectedPassword) {
    return NextResponse.json({ error: 'FITNESS_PASSWORD not configured' }, { status: 503 });
  }

  // Auth: check header
  const authPassword =
    request.headers.get('x-fitness-password')?.trim() ||
    request.headers.get('authorization')?.replace('Bearer ', '').trim();

  if (authPassword !== expectedPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions: WorkoutSession[] = await request.json();

    if (!Array.isArray(sessions)) {
      return NextResponse.json({ error: 'Expected array of sessions' }, { status: 400 });
    }

    // Load existing sessions
    const existing: WorkoutSession[] = (await kv.get('fitness:sessions')) || [];
    const existingMap = new Map(existing.map((s) => [s.id, s]));

    // Merge — new sessions overwrite existing by id
    let added = 0;
    let updated = 0;
    for (const session of sessions) {
      if (existingMap.has(session.id)) {
        updated++;
      } else {
        added++;
      }
      existingMap.set(session.id, session);
    }

    const merged = Array.from(existingMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    // Derive exercise library
    const exerciseNames = new Set<string>();
    for (const s of merged) {
      for (const ex of s.exercises) {
        exerciseNames.add(ex.name);
      }
    }

    await kv.set('fitness:sessions', merged);
    await kv.set('fitness:exercises', Array.from(exerciseNames));
    await kv.set('fitness:meta', {
      lastImport: new Date().toISOString(),
      sessionCount: merged.length,
      exerciseCount: exerciseNames.size,
    });

    return NextResponse.json({
      ok: true,
      added,
      updated,
      totalSessions: merged.length,
      totalExercises: exerciseNames.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
