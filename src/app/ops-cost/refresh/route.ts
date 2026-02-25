import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  const repoRoot = process.cwd();
  const scriptPath = path.join(repoRoot, 'scripts', 'build-cost-dashboard-data.mjs');

  try {
    await execFileAsync(process.execPath, [scriptPath], { cwd: repoRoot, timeout: 120_000 });
    revalidatePath('/ops-cost');
    revalidatePath('/data/cost-dashboard.json');
    return NextResponse.redirect(new URL('/ops-cost?refreshed=1', request.url), 303);
  } catch {
    return NextResponse.redirect(new URL('/ops-cost?refresh_error=1', request.url), 303);
  }
}
