import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { buildDashboardPayload } from '../../../../scripts/build-cost-dashboard-data.mjs';
import { writeDashboardToSupabase } from '@/lib/ops-cost-storage.mjs';

export async function POST(request: Request) {
  try {
    const payload = await buildDashboardPayload();
    const writeResult = await writeDashboardToSupabase(payload);

    if (!writeResult.ok) {
      console.error('[ops-cost/refresh] Supabase write failed', writeResult);
      return NextResponse.redirect(new URL('/costs?refresh_error=1', request.url), 303);
    }

    revalidatePath('/costs');
    return NextResponse.redirect(new URL('/costs?refreshed=1', request.url), 303);
  } catch (error) {
    console.error('[ops-cost/refresh] refresh failed', { error });
    return NextResponse.redirect(new URL('/costs?refresh_error=1', request.url), 303);
  }
}
