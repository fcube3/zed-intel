import { NextRequest, NextResponse } from 'next/server';
import { deriveSessionToken, isValidSessionToken } from '@/lib/auth-token';

/* ── Route configs ─────────────────────────────────────────────── */
type ProtectedRoute = {
  cookieName: string;
  envVar: string;
  loginPath: string;
  bypassPaths: string[];
  realm: string;
};

const ROUTES: Record<string, ProtectedRoute> = {
  '/costs': {
    cookieName: 'ops_cost_auth',
    envVar: 'COST_DASH_PASSWORD',
    loginPath: '/costs/login',
    bypassPaths: ['/costs/login', '/costs/logout', '/costs/auth'],
    realm: 'Ops Cost',
  },
};

/* ── Helpers ────────────────────────────────────────────────────── */
function isHtmlRequest(request: NextRequest) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function readBasicPassword(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) return null;
  try {
    const decoded = atob(authHeader.slice(6));
    const sep = decoded.indexOf(':');
    return sep < 0 ? null : decoded.slice(sep + 1).trim();
  } catch {
    return null;
  }
}

function unauthorizedResponse(realm: string) {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'Cache-Control': 'no-store',
      'WWW-Authenticate': `Basic realm="${realm}"`,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

/* ── Middleware ──────────────────────────────────────────────────── */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const prefix = Object.keys(ROUTES).find(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (!prefix) return NextResponse.next();

  const route = ROUTES[prefix];

  const expectedPassword = process.env[route.envVar]?.trim();
  if (!expectedPassword) {
    return new NextResponse(`${route.envVar} is not configured`, {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (route.bypassPaths.includes(pathname)) return NextResponse.next();

  // Cookie check
  const cookieValue = request.cookies.get(route.cookieName)?.value?.trim();
  if (isValidSessionToken(cookieValue, expectedPassword)) return NextResponse.next();

  // Basic auth
  const basicPassword = readBasicPassword(request);
  if (basicPassword && basicPassword === expectedPassword) {
    const response = NextResponse.next();
    response.cookies.set(route.cookieName, deriveSessionToken(expectedPassword), {
      httpOnly: true, secure: true, sameSite: 'lax',
      path: '/', maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  }

  if (!isHtmlRequest(request)) return unauthorizedResponse(route.realm);

  const loginUrl = new URL(route.loginPath, request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/costs', '/costs/:path*'],
};
