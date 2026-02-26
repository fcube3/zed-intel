import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { WorkoutSession } from '@/lib/fitness-parser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const expectedPassword = process.env.FITNESS_PASSWORD?.trim();
  if (!expectedPassword) {
    return NextResponse.json({ error: 'FITNESS_PASSWORD not configured' }, { status: 503 });
  }

  // Auth: cookie or header
  const cookieValue = request.cookies.get('fitness_auth')?.value?.trim();
  const headerPassword =
    request.headers.get('x-fitness-password')?.trim() ||
    request.headers.get('authorization')?.replace('Bearer ', '').trim();

  if (cookieValue !== expectedPassword && headerPassword !== expectedPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions: WorkoutSession[] = (await kv.get('fitness:sessions')) || [];
  const exercises: string[] = (await kv.get('fitness:exercises')) || [];
  const meta = (await kv.get('fitness:meta')) || {};

  return NextResponse.json({ sessions, exercises, meta });
}
