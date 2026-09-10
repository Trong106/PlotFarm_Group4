import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * List of protected routes requiring authentication token cookie
 */
const PROTECTED_ROUTES = ['/my-farm', '/admin', '/dashboard', '/profile'];

/**
 * List of authentication routes (login/register)
 */
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token from request cookies
  const token = request.cookies.get('token')?.value;

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current route is an auth page (login/register)
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Scenario 1: Unauthenticated user accessing a protected route -> Redirect to /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Scenario 2: Authenticated user accessing /login or /register -> Redirect to home /
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/**
 * Configure matcher to trigger middleware on specific protected & auth paths
 */
export const config = {
  matcher: [
    '/my-farm/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
