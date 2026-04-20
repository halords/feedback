---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Management API Hardening

## Objective
Secure the administrative management endpoints (Comments and User Assignments) by migrating them to the unified `withAuth` wrapper, enforcing Superadmin-only access.

## Context
- .gsd/SPEC.md
- src/lib/auth/withAuth.ts
- src/app/api/comments/route.ts
- src/app/api/comments/[id]/route.ts
- src/app/api/users/assignment/route.ts

## Tasks

<task type="auto">
  <name>Harden Comments Management APIs</name>
  <files>src/app/api/comments/route.ts, src/app/api/comments/[id]/route.ts</files>
  <action>
    Refactor both files to use withAuth(handler, { role: 'superadmin' }).
    - Remove direct verifySession/verifySuperadmin calls within handlers as the wrapper handles this.
    - Ensure syncComments (POST) and updateCommentAction (PATCH) remain functional.
  </action>
  <verify>
    # Check if files use withAuth
    cat src/app/api/comments/route.ts | grep "withAuth"
  </verify>
  <done>
    - Both /api/comments handlers are wrapped with Superadmin protection.
    - Unauthorized (non-superadmin) access returns 403.
  </done>
</task>

<task type="auto">
  <name>Harden User Assignment API</name>
  <files>src/app/api/users/assignment/route.ts</files>
  <action>
    Wrap /api/users/assignment/route.ts with withAuth(handler, { role: 'superadmin' }).
    - This route previously had NO auth check; it must now be strictly Superadmin-only.
  </action>
  <verify>
    # Test for 401/403 on this sensitive endpoint
    curl -I http://localhost:3000/api/users/assignment
  </verify>
  <done>
    - /api/users/assignment is protected by the superadmin role.
    - curl returns 401/403 instead of allowing the request.
  </done>
</task>

## Success Criteria
- [ ] Comments management is strictly restricted to Superadmins via withAuth.
- [ ] User assignment can no longer be modified by anonymous or non-superadmin users.
