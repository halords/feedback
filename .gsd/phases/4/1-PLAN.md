---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Cross-Role Functional Verification

## Objective
Verify strict RBAC enforcement in the reporting module while ensuring functional parity for Superadmins and restricted Office Admins.

## Context
- src/lib/auth/rbac.ts
- src/app/api/reports/individual/route.ts
- src/app/api/reports/bulk/route.ts

## Tasks

<task type="auto">
  <name>Empirical RBAC Audit</name>
  <files>
    <file>src/lib/auth/rbac.ts</file>
  </files>
  <action>
    - Create a scratch script `verify_rbac.ts` (or .js) to test the `resolveAuthorizedOffices` utility.
    - Test Suite:
        1. Superadmin (no request) -> ["ALL"]
        2. Superadmin (specific office) -> ["specific"]
        3. Office Admin (no request) -> [assigned offices]
        4. Office Admin (request unauthorized) -> [] or [assigned intersection]
        5. Office Admin (request assigned) -> [assigned]
    - Fix any inconsistencies found during the audit.
  </action>
  <verify>Execute the scratch script and confirm all 5 test cases PASS.</verify>
  <done>RBAC logic is formally verified via simulation.</done>
</task>

<task type="auto">
  <name>Verify Report API Authorization</name>
  <files>
    <file>src/app/api/reports/individual/route.ts</file>
  </files>
  <action>
    - Review the `individual` report logic to ensure it doesn't just check for "ALL" but also correctly validates against specific `scopedOffices`.
    - Ensure the "Forbidden" response is triggered correctly if a user tries to access an office they don't own.
  </action>
  <verify>Confirm line 31 in individual/route.ts returns 403 when canAccess is false.</verify>
  <done>Report APIs reliably enforce forbidden access for unauthorized office requests.</done>
</task>

## Success Criteria
- [ ] 100% pass rate in RBAC simulation script.
- [ ] Confirmed 403 Forbidden protection for individual reports.
- [ ] Verified Superadmin "ALL" view still functional after Phase 2/3 changes.
