---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Dashboard & Metrics Hardening

## Objective
Enable automated office-scoping for dashboard endpoints to prevent users from accessing organizational metrics outside their assigned jurisdiction.

## Context
- .gsd/SPEC.md
- src/lib/auth/withAuth.ts
- src/app/api/dashboard/cc-awareness/route.ts
- src/app/api/dashboard/collection/route.ts

## Tasks

<task type="auto">
  <name>Implement Automated Scoping for Dashboard APIs</name>
  <files>src/app/api/dashboard/cc-awareness/route.ts, src/app/api/dashboard/collection/route.ts</files>
  <action>
    Refactor both routes to use withAuth(handler, { requireOfficeScoping: true }).
    - Replace the manual offices extraction logic with the `scopedOffices` injected by the wrapper.
    - Ensure that if a user requests "ALL" but is not a superadmin, they only receive their assigned offices.
  </action>
  <verify>
    # Verify use of withAuth
    grep "withAuth" src/app/api/dashboard/cc-awareness/route.ts
  </verify>
  <done>
    - Both routes use withAuth with requireOfficeScoping.
    - Standard users are restricted to their authorized office list automatically.
  </done>
</task>

<task type="auto">
  <name>Harden PDF Generation API</name>
  <files>src/app/api/reports/graphs/route.ts</files>
  <action>
    Wrap /api/reports/graphs/route.ts with withAuth.
    - This endpoint handles heavy base64 image processing; it must require an active session to prevent abuse.
  </action>
  <verify>
    # Check for withAuth
    grep "withAuth" src/app/api/reports/graphs/route.ts
  </verify>
  <done>
    - PDF generation route is protected by session authentication.
  </done>
</task>

## Success Criteria
- [ ] Dashboard metrics are automatically scoped based on user permissions.
- [ ] Anonymous access to metrics is blocked (returning 401).
