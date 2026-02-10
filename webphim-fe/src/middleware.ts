import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and API routes
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for refresh token cookie as auth indicator.
  // Note: The BE sets refreshToken with Path=/api/auth on its own origin,
  // so it may not be visible here. The (main) layout handles client-side
  // auth restoration via refresh token call. Only redirect if we can
  // definitively confirm no auth cookie exists AND no client-side auth
  // is possible (i.e., no cookie at all on any path).
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (refreshToken) {
    // Cookie present - allow through
    return NextResponse.next();
  }

  // No cookie visible to middleware. Let client-side layout handle auth
  // restoration via the refresh endpoint (httpOnly cookie is sent by the
  // browser directly to the BE). Only block if this is a server-side
  // navigation that would fail without auth data.
  // For now, pass through and let client-side handle it.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
