import { NextResponse } from 'next/server';

const COOKIE_NAME = 'ops_cost_auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/ops-cost/login', request.url));
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/ops-cost',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
