---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Server-Side Auth Refactor

## Objective
Refactor the backend session management and login API to use Firebase Session Cookies instead of custom JWTs.

## Context
- src/lib/auth/verifySession.ts
- src/app/api/login/route.ts
- src/middleware.ts

## Tasks

<task type="auto">
  <name>Update Session Verification Logic</name>
  <files>src/lib/auth/verifySession.ts</files>
  <action>
    - Replace jose logic with uth.verifySessionCookie from @/lib/firebase/admin.
    - Update getSessionUser to verify the __session cookie and return SessionUser.
    - Ensure uid in session matches the Firebase Auth uid.
  </action>
  <verify>Check for syntax errors and correct Admin SDK usage.</verify>
  <done>erifySession.ts utilizes Firebase Admin for session validation.</done>
</task>

<task type="auto">
  <name>Refactor Login API</name>
  <files>src/app/api/login/route.ts</files>
  <action>
    - Refactor /api/login to accept idToken from the client.
    - Verify idToken using dmin.auth().verifyIdToken.
    - Create a session cookie using dmin.auth().createSessionCookie.
    - Set the __session cookie in the response.
  </action>
  <verify>Ensure the route handles the token correctly.</verify>
  <done>/api/login successfully creates a Firebase Session Cookie.</done>
</task>

## Success Criteria
- [ ] Backend session verification is powered by Firebase Admin.
- [ ] Login API creates official Firebase Session Cookies.
