import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';

import { enqueueRefreshRequest } from '@/lib/refresh-queue';

const COOKIE_NAME = 'ops_cost_auth';

function isAuthed(cookieStore: ReturnType<typeof cookies> extends Promise<infer T> ? T : never): boolean {
  const pw = process.env.COST_DASH_PASSWORD?.trim();
  if (!pw) return false;
  return cookieStore.get(COOKIE_NAME)?.value === pw;
}

function deriveRequester(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown';
  return 'unknown';
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAuthed(cookieStore)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const idempotencyKey = request.headers.get('x-idempotency-key')?.trim() || randomUUID();
  const requestedBy = deriveRequester(request);

  const queued = await enqueueRefreshRequest({
    source: 'web',
    idempotencyKey,
    requestedBy,
    dedupeWindowSeconds: 30,
  });

  if (!queued.ok) {
    return NextResponse.json({ ok: false, message: queued.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, requestId: queued.requestId, status: 'pending' });
}
