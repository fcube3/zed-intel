import { NextRequest, NextResponse } from 'next/server';

function unauthorized(message = 'Unauthorized') {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Ops Cost Dashboard"',
      'Cache-Control': 'no-store',
    },
  });
}

export function middleware(request: NextRequest) {
  const expectedPassword = process.env.COST_DASH_PASSWORD;
  if (!expectedPassword) {
    return unauthorized('COST_DASH_PASSWORD is not configured');
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorized();
  }

  const encoded = authHeader.slice(6);
  let decoded = '';
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const separator = decoded.indexOf(':');
  if (separator === -1) return unauthorized();

  const password = decoded.slice(separator + 1);
  if (password !== expectedPassword) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ops-cost', '/ops-cost/:path*'],
};
