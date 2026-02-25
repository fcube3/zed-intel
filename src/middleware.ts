import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'ops_cost_auth';
const LOGIN_PATH = '/ops-cost/login';
const LOGOUT_PATH = '/ops-cost/logout';
const AUTH_PATH = '/ops-cost/auth';

function setAuthCookie(response: NextResponse, password: string) {
  response.cookies.set(COOKIE_NAME, password, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/ops-cost',
    maxAge: 60 * 60 * 24 * 14,
  });
}


function isHtmlRequest(request: NextRequest) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function readBasicPassword(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) return null;

  try {
    const decoded = atob(authHeader.slice(6));
    const separator = decoded.indexOf(':');
    if (separator < 0) return null;
    return decoded.slice(separator + 1).trim();
  } catch {
    return null;
  }
}

function unauthorizedResponse() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'Cache-Control': 'no-store',
      'WWW-Authenticate': 'Basic realm="Ops Cost"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export function middleware(request: NextRequest) {
  const expectedPassword = process.env.COST_DASH_PASSWORD?.trim();
  if (!expectedPassword) {
    return new NextResponse('COST_DASH_PASSWORD is not configured', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH || pathname === LOGOUT_PATH || pathname === AUTH_PATH) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value?.trim();
  if (cookieValue === expectedPassword) {
    return NextResponse.next();
  }

  const basicPassword = readBasicPassword(request);
  if (basicPassword && basicPassword === expectedPassword) {
    const response = NextResponse.next();
    setAuthCookie(response, expectedPassword);
    return response;
  }

  if (!isHtmlRequest(request)) {
    return unauthorizedResponse();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/ops-cost', '/ops-cost/:path*'],
};
