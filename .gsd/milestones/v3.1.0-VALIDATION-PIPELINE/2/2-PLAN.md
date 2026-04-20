---
phase: 2
plan: 2
wave: 2
---

# Plan 2.2: Auth, Classify, & Analytics Zod Migration

## Objective
Conclude 100% Zod validation coverage across the API scope by refactoring the final peripheral endpoints (Login, Password Management, Response Classification, and specific Dashboard data layers).

## Context
- `.gsd/SPEC.md`
- `src/lib/validation/apiSchemas.ts`
- `src/app/api/login/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/responses/classify/route.ts`
- `src/app/api/dashboard/collection/route.ts`
- `src/app/api/dashboard/cc-awareness/route.ts`

## Tasks

<task type="auto">
  <name>Expand Zod Schemas</name>
  <files>src/lib/validation/apiSchemas.ts</files>
  <action>
    Append new schemas to `apiSchemas.ts`:
    1. `loginSchema` / `validateLoginInput`: `username`, `password` (strings).
    2. `changePasswordSchema` / `validateChangePasswordInput`: `currentPassword`, `newPassword` (strings, `min(6)`).
    3. `classificationSchema` / `validateClassificationInput`: `assignments` (array of objects containing `{ commentId: z.string(), newCategory: z.string() }`).
  </action>
  <verify>Ensure `validateDashboardInput` is intact to be reused by the other endpoints</verify>
  <done>All final authentication and classification schemas are integrated</done>
</task>

<task type="auto">
  <name>Integrate Schemas into Routes</name>
  <files>
    src/app/api/login/route.ts
    src/app/api/auth/change-password/route.ts
    src/app/api/responses/classify/route.ts
    src/app/api/dashboard/collection/route.ts
    src/app/api/dashboard/cc-awareness/route.ts
  </files>
  <action>
    Refactor the 5 endpoints:
    1. Replace unstructured `request.json()` destructuring exactly like in Plan 1.
    2. Pass into the explicit `validate*Input` function you created.
    3. Ensure `collection` and `cc-awareness` simply import and use the pre-existing `validateDashboardInput` from Phase 8.
    4. If `!result.success`, return 400 with the zod error formatted.
  </action>
  <verify>Check that destructuring variables correctly map to `result.data`</verify>
  <done>All Auth, Response, and Sub-Dashboard endpoints are 100% Zod validated</done>
</task>

## Success Criteria
- [ ] No raw `request.json()` fields are processed without passing through `.safeParse`.
- [ ] Zod coverage across API surface hits 100%.
