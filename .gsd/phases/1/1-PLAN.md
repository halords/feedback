---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Perimeter Lockdown & Unified Auth Wrapper

## Objective
Establish a secure-by-default perimeter by reconfiguring the Middleware to block all unauthorized requests and creating a global `withAuth` wrapper that centralizes session verification and RBAC scoping logic.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- src/middleware.ts
- src/lib/auth/verifySession.ts
- src/lib/auth/rbac.ts

## Tasks

<task type="auto">
  <name>Middleware Perimeter Flip</name>
  <files>src/middleware.ts</files>
  <action>
    Refactor middleware.ts to use a Deny-by-Default approach:
    1. Define a PUBLIC_ROUTES whitelist: ["/login", "/api/login", "/api/auth/resolve-id"].
    2. Change the route logic: If the path is NOT public, require a valid session.
    3. Ensure that all /api/ requests (except login) return a 401 JSON response if unauthenticated, while page requests continue to redirect to /login.
    4. Maintain existing role-based redirects for /users, /offices, and /comments.
  </action>
  <verify>
    # Verify anonymous API access is blocked
    curl -I http://localhost:3000/api/peek
  </verify>
  <done>
    - curl returns 401 or redirects to /login for /api paths (middleware level).
    - Authenticated page access still works.
  </done>
</task>

<task type="auto">
  <name>Create withAuth Higher-Order Handler</name>
  <files>src/lib/auth/withAuth.ts, src/lib/auth/verifySession.ts</files>
  <action>
    1. Create src/lib/auth/withAuth.ts implementing a Higher-Order Function for Next.js 15 route handlers.
    2. The wrapper must:
       - Await verifySession() to get the user.
       - Support a configuration object: { role?: "superadmin", requireOfficeScoping?: boolean }.
       - If requireOfficeScoping is true: Intersect body.offices with user.offices using resolveAuthorizedOffices.
       - Inject the sanitized user and scoped offices into the handler as arguments.
    3. Ensure type safety for Next.js 15 Route Handler context/params.
  </action>
  <verify>
    # Check for file existence and compilation
    ls src/lib/auth/withAuth.ts
  </verify>
  <done>
    - src/lib/auth/withAuth.ts exists and exports the wrapper.
    - The wrapper correctly handles both Superadmin ("ALL") and Standard user scoping.
  </done>
</task>

<task type="auto">
  <name>Pilot Migration: Protect /api/peek</name>
  <files>src/app/api/peek/route.ts</files>
  <action>
    Migrate /api/peek/route.ts to use the new withAuth wrapper.
    - Remove direct db calls and wrap the handler function.
    - Verify that unauthenticated access returns 401 via the wrapper's layer.
  </action>
  <verify>
    # Test unauthenticated access
    curl -s http://localhost:3000/api/peek | grep "Unauthorized"
  </verify>
  <done>
    - /api/peek/route.ts is refactored to use withAuth.
    - Unauthorized access is blocked with a 401 status.
  </done>
</task>

## Success Criteria
- [ ] Middleware blocks unauthenticated requests to /api/peek at the Edge.
- [ ] withAuth wrapper successfully injects session user into route handlers.
- [ ] Anonymous attempts to any non-whitelisted API route return 401.
