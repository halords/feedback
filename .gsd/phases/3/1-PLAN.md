---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Security Integration Test Suite

## Objective
Establish an automated integration testing suite to verify that all API endpoints correctly implement the Secure-by-Default architecture, preventing future regressions.

## Context
- .gsd/SPEC.md
- src/lib/auth/withAuth.ts
- src/middleware.ts
- src/app/api/comments/route.ts
- src/app/api/users/assignment/route.ts

## Tasks

<task type="auto">
  <name>Setup API Test Utilities</name>
  <files>src/integration-tests/helpers.ts</files>
  <action>
    Create a testing helper to:
    1. Mock Next.js Request objects with custom JSON bodies and headers.
    2. Provide a 'mockAuth' utility that overwrites verifySession to return a specific user (Superadmin vs Standard).
    3. Provide an 'invokeHandler' utility to call route handlers and parse the resulting NextResponse.
  </action>
  <verify>
    # Check for file existence
    ls src/integration-tests/helpers.ts
  </verify>
  <done>
    - Testing helpers created.
    - able to simulate authenticated and unauthenticated requests in Vitest.
  </done>
</task>

<task type="auto">
  <name>Implement Global Security Integration Tests</name>
  <files>src/integration-tests/security.test.ts</files>
  <action>
    Create a comprehensive test suite that:
    1. Tests Middleware Logic: Verifies that anonymous requests to /api/peek (and others) return 401.
    2. Tests withAuth Wrapper: Verifies 401 on missing session, 403 on role mismatch.
    3. Tests Automated Scoping: Verifies that a standard user requesting 'ALL' offices only gets their authorized list.
    4. Covers High-Risk Endpoints: Specifically asserts that /api/users/assignment rejects non-superadmins.
  </action>
  <verify>
    # Run the new tests
    npm test src/integration-tests/security.test.ts
  </verify>
  <done>
    - Integration suite passes 100%.
    - All identified security gaps (from the audit) are covered by a negative test case.
  </done>
</task>

## Success Criteria
- [ ] 100% of high-risk endpoints (/comments, /users/assignment) are verified for role-based access.
- [ ] Automated scoping is verified with at least 3 distinct user role/office combinations.
- [ ] Middleware perimeter is verified to block 100% of non-whitelisted anonymous API requests.
