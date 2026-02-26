import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'fitness_auth';

function safeNextPath(value: string | null) {
  if (!value) return '/fitness';
  if (!value.startsWith('/fitness')) return '/fitness';
  return value;
}

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/fitness/login', request.url), 303);
}

export async function POST(request: NextRequest) {
  const expectedPassword = process.env.FITNESS_PASSWORD?.trim();
  if (!expectedPassword) {
    return new NextResponse('FITNESS_PASSWORD is not configured', { status: 503 });
  }

  const formData = await request.formData();
  const password = String(formData.get('password') || '').trim();
  const nextPath = safeNextPath(String(formData.get('next') || '/fitness'));

  if (password !== expectedPassword) {
    const retryUrl = new URL('/fitness/login', request.url);
    retryUrl.searchParams.set('error', '1');
    retryUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(retryUrl, 303);
  }

  const target = new URL(nextPath, request.url);
  const response = NextResponse.redirect(target, 303);
  response.cookies.set(COOKIE_NAME, expectedPassword, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/fitness',
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}
