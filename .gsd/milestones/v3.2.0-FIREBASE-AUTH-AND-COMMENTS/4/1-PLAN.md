---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Final Verification & Cleanup

## Objective
Final audit of the authentication migration to ensure no regressions and clean up technical debt.

## Context
- .gsd/ROADMAP.md
- src/lib/services/userService.ts
- src/app/api/auth/me/route.ts

## Tasks

<task type="auto">
  <name>Final Cleanup of Deprecated Logic</name>
  <files>
    src/lib/services/userService.ts
    src/middleware.ts
  </files>
  <action>
    - Review userService.ts for any redundant JWT-related comments or code.
    - Double check middleware.ts to ensure it correctly identifies Superadmin roles via the new Firebase session cookies.
  </action>
  <verify>Ensure all auth-related files refer to Firebase Session Cookies or Custom Claims.</verify>
  <done>Technical debt from JWT system is removed.</done>
</task>

<task type="auto">
  <name>Functional Verification Audit</name>
  <files>ROADMAP.md</files>
  <action>
    - Re-verify login for a standard Office Admin.
    - Re-verify login for a Superadmin using username.
    - Verify 'Comments Management' visibility for both.
  </action>
  <verify>Check that all must-haves in ROADMAP.md are checked off.</verify>
  <done>System is fully verified against the milestone requirements.</done>
</task>

## Success Criteria
- [ ] No remaining references to 'verifyJwt' or custom 'token' secret.
- [ ] All must-haves in ROADMAP.md are completed and verified.
