# RESEARCH.md - Phase 2: Auth Migration

## Goal
Implement the core migration from custom JWT to Firebase Session Cookies.

## Implementation Details

### 1. Client-Side Login Flow
The client will use the Firebase Client SDK to perform the physical login, then pass the short-lived ID Token to the server to establish a long-lived session.

`	ypescript
// Proposed Client Login Logic
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();
await fetch('/api/login', {
  method: 'POST',
  body: JSON.stringify({ idToken })
});
`

### 2. API Route Update (/api/login)
The /api/login route will be refactored to:
- Verify the ID Token from the payload.
- Map the uid to the existing Firestore user metadata (offices, roles).
- Create a 7-day Firebase Session Cookie.
- Set the __session cookie using NextResponse.

### 3. Session Verification Update (lib/auth/verifySession.ts)
Update getSessionUser to:
- Read __session cookie.
- Verify using dmin.auth().verifySessionCookie(cookie, true).
- Reconstruct the SessionUser object from the verified claims and Firestore lookup if necessary.

### 4. RBAC Mapping
Currently, roles and offices are stored in Firestore. We must ensure these are still fetched and included in the session state or available via the verifySession logic.
The current SessionUser includes user_type, ull_name, offices, etc.

## Risks
- **Cold Starts**: Firebase Admin verification adds slight latency compared to local JWT verification.
- **Edge Runtime**: Firebase Admin does not run on Edge. Ensure middleware or routes using it are in Node.js runtime (Next.js default for standard API routes).
