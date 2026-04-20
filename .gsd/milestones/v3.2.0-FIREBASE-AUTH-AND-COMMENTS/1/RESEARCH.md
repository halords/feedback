# RESEARCH.md - Phase 1: Foundation Tools

## Goal
Confirm the best architecture for Firebase Authentication in Next.js 15 (App Router) while preserving current session-based functionality.

## Current Setup
- Next.js 15 (App Router).
- Custom JWT auth using jose.
- __session cookie (HttpOnly) for session storage.
- Backend (firebase-admin) uses this cookie to verify identities.

## Discovery Findings

### 1. Firebase Client SDK in Next.js 15
- Firebase Client SDK (firebase/auth) is needed for client-side sign-in.
- Usage of onAuthStateChanged is standard for client-side state, but for Server Components and Middleware, we need a cookie.

### 2. Session Management Strategy
- **Option A: Firebase ID Tokens in Cookies**: Client signs in -> gets ID Token -> sends to /api/login -> Backend sets standard cookie.
- **Option B: Firebase Session Cookies**: Standard Firebase way for SSR. Client signs in -> gets ID Token -> sends to /api/login -> Backend uses dmin.auth().createSessionCookie() -> Sets __session cookie.
- **Decision**: **Option B** is more robust for SSR and matches the current __session cookie pattern.

### 3. Middleware Integration
- Middleware will need to verify the session cookie using irebase-admin.
- Note: irebase-admin does NOT run in the Edge Runtime (standard for Next.js Middleware).
- **Solution**: Use jose to verify the JWT session cookie if it's a standard JWT, OR if using Firebase Session Cookies, we might need to route checks through a Node.js runtime API or use a library that can verify Firebase tokens in Edge (like 
ext-firebase-auth-edge or custom logic).
- **Alternative**: Since we are using Firebase Admin SDK in API routes already, we can keep using standard Node.js runtime for API routes. For Middleware, we might need a workaround for token verification if it's in the edge.

### 4. Required Dependencies
- irebase (Client SDK) - Missing.
- irebase-admin - Existing.

## Conclusion
Phase 1 will focus on installing irebase and setting up the client-side initialization. We will also prepare the configuration to support Session Cookies.
