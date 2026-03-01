import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

import { buildDashboardPayload } from '../../../../scripts/build-cost-dashboard-data.mjs';
import { writeDashboardToSupabase } from '@/lib/ops-cost-storage.mjs';

const execFileAsync = promisify(execFile);

const COOKIE_NAME = 'ops_cost_auth';

function isAuthed(cookieStore: ReturnType<typeof cookies> extends Promise<infer T> ? T : never): boolean {
  const pw = process.env.COST_DASH_PASSWORD?.trim();
  if (!pw) return false;
  return cookieStore.get(COOKIE_NAME)?.value === pw;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAuthed(cookieStore)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const isJson = request.headers.get('accept')?.includes('application/json') ||
    request.headers.get('content-type')?.includes('application/json');

  try {
    // 1. Trigger API pull (force — manual override bypasses cooldown)
    const projectRoot = path.resolve(process.cwd());
    const triggerScript = path.join(projectRoot, 'scripts', 'trigger-pull.mjs');
    try {
      const { stdout, stderr } = await execFileAsync('node', [triggerScript], {
        cwd: projectRoot,
        timeout: 120000,
      });
      if (stdout) console.log('[refresh] trigger-pull:', stdout);
      if (stderr) console.error('[refresh] trigger-pull stderr:', stderr);
    } catch (err: any) {
      console.error('[refresh] trigger-pull failed:', err.message);
    }

    // 2. Rebuild dashboard payload
    const payload = await buildDashboardPayload();
    const writeResult = await writeDashboardToSupabase(payload);

    if (!writeResult.ok) {
      console.error('[ops-cost/refresh] Supabase write failed', writeResult);
      if (isJson) return NextResponse.json({ ok: false, message: 'Supabase write failed' });
      return NextResponse.redirect(new URL('/costs?refresh_error=1', request.url), 303);
    }

    revalidatePath('/costs');

    if (isJson) return NextResponse.json({ ok: true, message: 'Pull triggered and dashboard refreshed' });
    return NextResponse.redirect(new URL('/costs?refreshed=1', request.url), 303);
  } catch (error: any) {
    console.error('[ops-cost/refresh] refresh failed', { error });
    if (isJson) return NextResponse.json({ ok: false, message: error.message });
    return NextResponse.redirect(new URL('/costs?refresh_error=1', request.url), 303);
  }
}
