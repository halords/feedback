---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Users & Offices Zod Migration

## Objective
Migrate the core User Management and Office Management API endpoints from vanilla parameter validation to strict, unified Zod schemas, while cleaning up a duplicated route directory.

## Context
- `.gsd/SPEC.md`
- `src/lib/validation/apiSchemas.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/users/assignment/route.ts`
- `src/app/api/offices/route.ts`

## Tasks

<task type="auto">
  <name>Expand Zod Schemas</name>
  <files>src/lib/validation/apiSchemas.ts</files>
  <action>
    Append new schemas and validation functions to `apiSchemas.ts`:
    1. `userBaseSchema` / `validateUserInput`: 
       - Expects `idno`, `username`, `email` (email type), `full_name`, `user_type` (Super Admin or Office Admin).
    2. `userAnalyticsPatchSchema` / `validateUserPatchInput`:
       - Expects `analyticsEnabled: z.boolean()`.
    3. `officeAssignmentSchema` / `validateOfficeAssignmentInput`:
       - Expects `idno`, `offices` (array of strings).
    4. `officeSchema` / `validateOfficeInput`:
       - Expects `name`, `fullName`. Optional: `status` (string), `id` (string).
  </action>
  <verify>Ensure standard `ValidationResult<T>` structure is strictly maintained</verify>
  <done>Four new schemas are exported and typed</done>
</task>

<task type="auto">
  <name>Integrate Schemas into Routes</name>
  <files>
    src/app/api/users/route.ts
    src/app/api/users/[id]/route.ts
    src/app/api/users/assignment/route.ts
    src/app/api/offices/route.ts
  </files>
  <action>
    Refactor the 4 endpoints:
    1. Replace unstructured `request.json()` destructuring.
    2. Pass the JSON into the explicit `validate*Input` function you created.
    3. If `!result.success`, return a `NextResponse.json({ error: result.error }, { status: 400 })`.
    4. Provide the strongly-typed `result.data` to the underlying service functions.
    
    *CLEANUP*: The user accidentally has a duplicated folder `src/app/api/users/id`. Delete the `id` folder (keeping `[id]`).
  </action>
  <verify>Check that `request.json()` is securely parsed by the new Zod boundaries before any logic executes</verify>
  <done>All User and Office endpoints are 100% Zod validated</done>
</task>

## Success Criteria
- [ ] No raw `request.json()` fields are processed without passing through `.safeParse`.
- [ ] Duplicate `users/id/` path is permanently removed.
