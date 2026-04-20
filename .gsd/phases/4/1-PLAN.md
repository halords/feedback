---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Unified Security Migration & Final Audit

## Objective
Finalize the transition to the Unified Security Architecture by migrating all remaining administrative endpoints to the `withAuth` wrapper and performing a comprehensive system audit to eliminate legacy technical debt.

## Context
- .gsd/SPEC.md
- src/middleware.ts
- src/lib/auth/withAuth.ts
- src/app/api/users/route.ts
- src/app/api/physical-reports/route.ts

## Tasks

<task type="auto">
  <name>Migrate Admin Endpoints to withAuth</name>
  <files>
    src/app/api/users/route.ts
    src/app/api/physical-reports/route.ts
    src/app/api/physical-reports/[id]/route.ts
  </files>
  <action>
    Refactor these administrative routes to use the 'withAuth' HOF with role: 'superadmin'.
    - Remove redundant manual 'verifySuperadmin' calls and custom 401/403 catch blocks.
    - Leverage centralized error handling.
  </action>
  <verify>
    # Run integration tests to ensure these routes are still protected
    npm test src/integration-tests/security.test.ts
  </verify>
  <done>
    - Admin routes are standardized on 'withAuth'.
    - Codebase is cleaner and more maintainable.
  </done>
</task>

<task type="auto">
  <name>System-Wide Guard Audit</name>
  <files>src/**/*.ts(x)</files>
  <action>
    1. Scan the whole codebase for any remaining 'verifySession' or 'verifySuperadmin' calls.
    2. Ensure every call is correctly 'awaited'. (Previously discovered bugs where these were unawaited, allowing bypass).
    3. Verify that ALL api routes (excluding whitelisted ones in middleware) are wrapped with 'withAuth' or have explicit manual guards.
  </action>
  <verify>
    grep -r "verifySession" src
    grep -r "verifySuperadmin" src
    grep -r "withAuth" src/app/api
  </verify>
  <done>
    - 100% of API endpoints are verified to have active security guards.
    - All guards are confirmed to be awaited.
  </done>
</task>

## Success Criteria
- [ ] ALL administrative API routes are protected by the unified 'withAuth' wrapper.
- [ ] No unawaited security guards exist in the codebase.
- [ ] Final integration test suite passes 100%.
