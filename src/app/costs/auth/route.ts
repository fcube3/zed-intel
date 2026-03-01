import { NextRequest, NextResponse } from 'next/server';
import { deriveSessionToken } from '@/lib/auth-token';

const COOKIE_NAME = 'ops_cost_auth';

function safeNextPath(value: string | null) {
  if (!value) return '/costs';
  if (!value.startsWith('/costs')) return '/costs';
  return value;
}

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/costs/login', request.url), 303);
}

export async function POST(request: NextRequest) {
  const expectedPassword = process.env.COST_DASH_PASSWORD?.trim();
  if (!expectedPassword) {
    return new NextResponse('COST_DASH_PASSWORD is not configured', { status: 503 });
  }

  const formData = await request.formData();
  const password = String(formData.get('password') || '').trim();
  const nextPath = safeNextPath(String(formData.get('next') || '/costs'));

  if (password !== expectedPassword) {
    const retryUrl = new URL('/costs/login', request.url);
    retryUrl.searchParams.set('error', '1');
    retryUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(retryUrl, 303);
  }

  const target = new URL(nextPath, request.url);
  const response = NextResponse.redirect(target, 303);
  response.cookies.set(COOKIE_NAME, await deriveSessionToken(expectedPassword), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}
