import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

// 1. Define Public Routes (Secure-by-Default)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/api/login',
  '/api/auth/resolve-id',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets, Next.js internals, and whitelisted APIs to bypass
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

const SUPERADMIN_ONLY_ROUTES = [
  '/users',
  '/offices',
  '/settings/saving-measures',
  '/physical-reports', // Physical reports editor is superadmin only per UI layout
];

  // 2. Extract and verify session token
  const token = request.cookies.get('__session')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Return unauthorized / redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Note: We avoid heavy signature verification in Edge Middleware to maintain performance.
    // Full verification happens in API routes and Server Components via verifySession.
    const payload = decodeJwt(token);
    const userRole = (payload as any).user_type?.toLowerCase().replace(/\s/g, '');
    const isAnalyticsEnabled = !!(payload as any).is_analytics_enabled;

    // 3. Enforce Role-Based Access for Superadmin routes
    const isSuperadminRoute = SUPERADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));
    if (isSuperadminRoute && userRole !== 'superadmin') {
      console.warn(`[Middleware] Access denied: User role '${userRole}' attempted to access superadmin route: ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 4. Enforce Access for Comments Management (Superadmin or Analytics-enabled)
    if (pathname.startsWith('/comments') && userRole !== 'superadmin' && !isAnalyticsEnabled) {
      console.warn(`[Middleware] Access denied: User '${userRole}' (Analytics: ${isAnalyticsEnabled}) attempted to access /comments`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 5. Continue if authorized
    return NextResponse.next();

  } catch (error) {
    console.error('[Middleware] Token processing failed:', error);
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
