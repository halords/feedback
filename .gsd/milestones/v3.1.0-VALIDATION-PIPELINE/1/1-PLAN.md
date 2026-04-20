---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Vitest Configuration & RBAC Test Suite

## Objective
Establish a lightning-fast unit testing environment using Vitest and permanently secure our core authorization logic by writing comprehensive tests for `rbac.ts`.

## Context
- `.gsd/SPEC.md`
- `src/lib/auth/rbac.ts`
- `package.json`

## Tasks

<task type="auto">
  <name>Setup Vitest Configuration</name>
  <files>
    package.json
    vitest.config.ts
  </files>
  <action>
    1. Edit `package.json`: 
       - Add `"test": "vitest run"` to the `"scripts"` block.
       - Add `"vitest": "^3.0.0"` and `"vite-tsconfig-paths": "^5.0.0"` to the `"devDependencies"` block.
    2. Create `vitest.config.ts` in the project root:
       - Import `defineConfig` from `vitest/config`.
       - Import `tsconfigPaths` from `vite-tsconfig-paths`.
       - Export the configuration wrapping `tsconfigPaths()` in the plugins array to ensure absolute Next.js imports (e.g., `@/lib/...`) resolve correctly during tests.
  </action>
  <verify>Check that package.json and vitest.config.ts are properly formatted</verify>
  <done>Testing framework is integrated into the Next.js ecosystem</done>
</task>

<task type="auto">
  <name>Develop RBAC Test Suite</name>
  <files>src/lib/auth/__tests__/rbac.test.ts</files>
  <action>
    Create `rbac.test.ts`.
    Write comprehensive deterministic tests utilizing the `SessionUser` interface.
    
    1. Test `hasGlobalAccess`:
       - User types `1`, `2`, `5`, `6` should return true.
       - A standard user type like `3` should return false.
    2. Test `resolveAuthorizedOffices`:
       - Superadmin should receive exact requested arrays or fallback to `["ALL"]`.
       - Analytics User should receive `["ALL"]` if no exact scope is passed, but strictly specific valid offices if granular data is requested.
       - Standard User MUST just receive their valid assigned offices, completely ignoring `"ALL"` requests.
  </action>
  <verify>Run the testing suite using `npm run test`</verify>
  <done>100% test pass rate proving standard users cannot spoof global authorization scopes</done>
</task>

## Success Criteria
- [ ] `vitest` runs without native module configuration errors.
- [ ] The core RBAC security rule is proven immune to spoofing by test coverage.
