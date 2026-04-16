import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes and roles
const PROTECTED_ROUTES = [
  '/dashboard',
  '/analytics',
  '/responses',
  '/physical-reports',
  '/users',
  '/offices',
  '/settings',
];

const SUPERADMIN_ONLY_ROUTES = [
  '/users',
  '/offices',
  '/settings/saving-measures',
  '/physical-reports', // Physical reports editor is superadmin only per UI layout
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // Allow public assets, Next.js internals, and login APIs to bypass
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 2. Extract and verify session token
  const token = request.cookies.get('__session')?.value;

  if (!token) {
    // Return unauthorized / redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = (payload as any).user_type?.toLowerCase().replace(/\s/g, '');

    // 3. Enforce Role-Based Access for Superadmin routes
    const isSuperadminRoute = SUPERADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));
    if (isSuperadminRoute && userRole !== 'superadmin') {
      console.warn(`[Middleware] Access denied: User role '${userRole}' attempted to access superadmin route: ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 4. Continue if authorized
    return NextResponse.next();

  } catch (error) {
    console.error('[Middleware] JWT Verification failed:', error);
    // Invalid token, force re-login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Ensure middleware only fires on specific paths to optimize performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/login (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png (public files)
     */
    '/((?!api/login|_next/static|_next/image|favicon.ico|logo.png|login|$).*)',
  ],
};
