import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getRefreshRequestById } from '@/lib/refresh-queue';

const COOKIE_NAME = 'ops_cost_auth';

function isAuthed(cookieStore: ReturnType<typeof cookies> extends Promise<infer T> ? T : never): boolean {
  const pw = process.env.COST_DASH_PASSWORD?.trim();
  if (!pw) return false;
  return cookieStore.get(COOKIE_NAME)?.value === pw;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAuthed(cookieStore)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const requestId = request.nextUrl.searchParams.get('requestId')?.trim();
  if (!requestId) {
    return NextResponse.json({ ok: false, message: 'requestId is required' }, { status: 400 });
  }

  const result = await getRefreshRequestById(requestId);
  if (!result.ok) {
    if ('notFound' in result && result.notFound) {
      return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: false, message: result.error }, { status: 500 });
  }

  const row = result.row;
  return NextResponse.json({
    ok: true,
    requestId: row.request_id,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    error: row.error_msg,
  });
}
