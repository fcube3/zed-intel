import fs from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);
const SCRIPT_RELATIVE_PATH = path.join('scripts', 'build-cost-dashboard-data.mjs');

function resolveRepoRoot() {
  const envRoot = process.env.OPS_COST_PROJECT_ROOT?.trim();
  const argvRoots = process.argv
    .slice(2)
    .filter((arg) => arg && !arg.startsWith('-'))
    .map((arg) => path.resolve(process.cwd(), arg));

  const candidates = [envRoot, process.cwd(), ...argvRoots].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, SCRIPT_RELATIVE_PATH))) return candidate;
  }

  return process.cwd();
}

export async function POST(request: Request) {
  const repoRoot = resolveRepoRoot();
  const scriptPath = path.join(repoRoot, SCRIPT_RELATIVE_PATH);

  try {
    await execFileAsync(process.execPath, [scriptPath], { cwd: repoRoot, timeout: 120_000 });
    revalidatePath('/ops-cost');
    revalidatePath('/data/cost-dashboard.json');
    return NextResponse.redirect(new URL('/ops-cost?refreshed=1', request.url), 303);
  } catch (error) {
    console.error('[ops-cost/refresh] refresh failed', { repoRoot, scriptPath, error });
    return NextResponse.redirect(new URL('/ops-cost?refresh_error=1', request.url), 303);
  }
}
