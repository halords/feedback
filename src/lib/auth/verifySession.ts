import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing. It is legally required to sign user session cookies securely.");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface SessionUser {
  uid: string;
  idno: string;
  username: string;
  email: string;
  user_type: string;
  full_name: string;
  offices: string[];
  requiresPasswordChange?: boolean;
  is_analytics_enabled?: boolean;
}

/**
 * Creates a signed JWT for the user session
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verifies a session token from request cookies
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Utility for API routes to require a session
 */
export async function verifySession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Utility for API routes to require Superadmin privileges
 */
export async function verifySuperadmin(): Promise<SessionUser> {
  const user = await verifySession();
  if (!hasGlobalAccess(user)) {
    throw new Error('Forbidden');
  }
  return user;
}

/**
 * Returns true if the user has global (Super Admin) access.
 */
export function hasGlobalAccess(user: SessionUser): boolean {
  const type = user.user_type?.toLowerCase().replace(/\s/g, '');
  return type === 'superadmin';
}

/**
 * Helper to set the session cookie in a response
 */
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set('__session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

/**
 * Helper to clear the session cookie
 */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set('__session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
