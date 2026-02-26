import { NextResponse } from 'next/server';

const COOKIE_NAME = 'fitness_auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/fitness/login', request.url));
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true, secure: true, sameSite: 'lax',
    path: '/fitness', maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
