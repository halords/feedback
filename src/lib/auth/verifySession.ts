import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';

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
 * Verifies a Firebase session cookie from request cookies
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) return null;

  try {
    // 1. Verify the session cookie.
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Check if custom claims are present. 
    // If essential profile data is missing, fall back to Firestore.
    if (!decodedClaims.idno || !decodedClaims.full_name) {
      // Fallback: Fetch user metadata from Firestore
      const identifier = (decodedClaims.email || "").split('@')[0];
      
      let userSnapshot = await db.collection("users").where("idno", "==", identifier).get();
      if (userSnapshot.empty) {
        userSnapshot = await db.collection("users").where("username", "==", identifier).get();
      }

      if (userSnapshot.empty) return null;

      const userData = userSnapshot.docs[0].data();
      const idno = userData.idno; // Official ID number for profile lookup

      const profileSnapshot = await db.collection("user_data").where("idnumber", "==", idno).get();
      const profileData = !profileSnapshot.empty ? profileSnapshot.docs[0].data() : {};
      
      const officeSnapshot = await db.collection("office_assignment").where("idno", "==", idno).get();
      let offices: string[] = [];
      officeSnapshot.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.office)) offices = offices.concat(data.office);
        else if (typeof data.office === "string") offices.push(data.office);
      });

      return {
        uid: decodedClaims.uid,
        idno: idno,
        username: userData.username || idno,
        email: decodedClaims.email || "",
        user_type: userData.user_type || "Office Admin",
        full_name: profileData.full_name || "Unknown User",
        offices: [...new Set(offices)],
        requiresPasswordChange: !!userData.requiresPasswordChange,
        is_analytics_enabled: !!profileData.is_analytics_enabled,
      };
    }

    // 3. Map Firebase claims back to our SessionUser structure
    return {
      uid: decodedClaims.uid,
      idno: decodedClaims.idno as string || "",
      username: decodedClaims.username as string || "",
      email: decodedClaims.email || "",
      user_type: decodedClaims.user_type as string || "Office Admin",
      full_name: decodedClaims.full_name as string || "Unknown User",
      offices: decodedClaims.offices as string[] || [],
      requiresPasswordChange: decodedClaims.requiresPasswordChange as boolean || false,
      is_analytics_enabled: decodedClaims.is_analytics_enabled as boolean || false,
    };
  } catch (error: any) {
    // If the cookie is invalid or formatted for the old JWT system, we treat it as no session.
    if (error.code === 'auth/argument-error' || error.message.includes('kid')) {
       return null; 
    }
    console.error('Firebase session verification failed:', error);
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
export function setSessionCookie(response: NextResponse, cookie: string) {
  response.cookies.set('__session', cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 10, // 10 hours — matches Firebase session cookie duration set in /api/login
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
