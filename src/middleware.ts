import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'ops_cost_auth';

function unauthorized(message = 'Unauthorized') {
  return new NextResponse(
    `${message}\n\nTip: open /ops-cost?pw=YOUR_PASSWORD once to set an auth cookie.`,
    {
      status: 401,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
}

export function middleware(request: NextRequest) {
  const expectedPassword = process.env.COST_DASH_PASSWORD?.trim();
  if (!expectedPassword) {
    return unauthorized('COST_DASH_PASSWORD is not configured');
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value?.trim();
  if (cookieValue === expectedPassword) {
    return NextResponse.next();
  }

  const url = request.nextUrl;
  const pw = url.searchParams.get('pw')?.trim();
  if (pw && pw === expectedPassword) {
    const clean = new URL(url.toString());
    clean.searchParams.delete('pw');
    const res = NextResponse.redirect(clean);
    res.cookies.set(COOKIE_NAME, expectedPassword, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/ops-cost',
      maxAge: 60 * 60 * 24 * 14,
    });
    return res;
  }

  return unauthorized();
}

export const config = {
  matcher: ['/ops-cost', '/ops-cost/:path*'],
};
