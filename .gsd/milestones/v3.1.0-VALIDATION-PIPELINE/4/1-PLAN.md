---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Global Middleware Implementation

## Objective
Implement server-side authentication enforcement using Next.js Middleware. This replaces client-side "flash and redirect" logic with a secure, server-authoritative gate that redirects unauthenticated users to the login page before any page content is rendered.

## Context
- src/lib/auth/verifySession.ts (JWT logic)
- src/middleware.ts (New file)

## Tasks

<task type="auto">
  <name>Create Global Auth Middleware</name>
  <files>
    src/middleware.ts
  </files>
  <action>
    - Create 'src/middleware.ts'.
    - Implement a matcher for administrative routes: '/dashboard', '/analytics', '/responses', '/physical-reports', '/users', '/offices', '/settings'.
    - Use 'jose' to verify the '__session' cookie.
    - Redirect to '/login' if unauthorized.
  </action>
  <verify>Check for the existence of src/middleware.ts and its matcher configuration.</verify>
  <done>Middleware is correctly intercepting requests to protected routes.</done>
</task>

<task type="auto">
  <name>Implement Role-Based Navigation Gating</name>
  <files>
    src/middleware.ts
  </files>
  <action>
    - Add role checking for Superadmin-only routes.
    - Paths like '/users', '/offices', and '/settings/saving-measures' should redirect Standard users back to '/dashboard'.
  </action>
  <verify>Confirm role-based redirect logic in the middleware.</verify>
  <done>Sensitive admin routes are protected at the server layer against unauthorized roles.</done>
</task>

## Success Criteria
- [ ] Unauthenticated users are redirected to '/login' at the server level.
- [ ] Standard users attempting to access '/users' are redirected to '/dashboard'.
- [ ] Middleware does not block correctly authorized requests or public assets.
