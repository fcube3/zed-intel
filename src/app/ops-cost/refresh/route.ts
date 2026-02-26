import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { buildDashboardPayload } from '../../../../scripts/build-cost-dashboard-data.mjs';
import { writeDashboardToKv } from '@/lib/ops-cost-storage.mjs';

export async function POST(request: Request) {
  try {
    const payload = await buildDashboardPayload();
    const writeResult = await writeDashboardToKv(payload);

    if (!writeResult.ok) {
      console.error('[ops-cost/refresh] KV write failed', writeResult);
      return NextResponse.redirect(new URL('/ops-cost?refresh_error=1', request.url), 303);
    }

    revalidatePath('/ops-cost');
    return NextResponse.redirect(new URL('/ops-cost?refreshed=1', request.url), 303);
  } catch (error) {
    console.error('[ops-cost/refresh] refresh failed', { error });
    return NextResponse.redirect(new URL('/ops-cost?refresh_error=1', request.url), 303);
  }
}
