---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Performance Optimizations & Low-Hanging Fruit

## Objective
Reduce unnecessary Firestore reads by caching office lookups in-memory, optimize Firebase Storage API calls, and eliminate aggressive polling on the client side for auth state. All these must be implemented with **ZERO REGRESSIONS (NON-NEGOTIABLE)**.

## Context
- `.gsd/ROADMAP.md` (Phase 1)
- `src/lib/services/officeService.ts`
- `src/lib/services/storageService.ts`
- `src/context/AuthContext.tsx`

## Tasks

<task type="auto">
  <name>Cache `getAllOffices()`</name>
  <files>src/lib/services/officeService.ts</files>
  <action>
    - Add a module-level variable to store the result of `getAllOffices(true)`.
    - Add a 60-second TTL logic: if the cache is populated and less than 60s old, return the cache. Otherwise, fetch from Firestore.
    - Since `getAllOffices` takes a parameter `includeDisabled = false`, cache the *entire* collection (`includeDisabled=true`) once, and apply the `includeDisabled === false` filter dynamically on the cached array when returning.
    - Ensure typing remains strict and backwards compatible. Do NOT change the return signature of the function.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Caching significantly reduces Firestore reads on heavy requests while behaving exactly the same downstream.</done>
</task>

<task type="auto">
  <name>Optimize `getJsonArchive()`</name>
  <files>src/lib/services/storageService.ts</files>
  <action>
    - Remove the `file.exists()` wait and check block.
    - Simply perform `file.download()` inside the existing `try/catch`. 
    - If it fails (e.g., HTTP 404 because file doesn't exist), the `catch` block should quietly return `null` as it currently does.
    - This eliminates 1 redundant API call per archive fetch.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Zero regressions in archive fetching functionality with optimized network calls.</done>
</task>

<task type="auto">
  <name>Tame Auth SWR Revalidation</name>
  <files>src/context/AuthContext.tsx</files>
  <action>
    - In the `useSWR` hook configuration for `/api/auth/me`, change `revalidateOnFocus` to `false`.
    - Add `refreshInterval: 5 * 60 * 1000` (5 minutes) to the configuration.
    - This stops the client from hammering the API on every browser tab switch while keeping the session fresh.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Auth context no longer aggressively polls while continuing to hold accurate state.</done>
</task>

## Success Criteria
- [ ] Office lookups rely on 60s cache, cutting redundant queries.
- [ ] Archive fetches require 1 call, not 2.
- [ ] App stops hammering auth endpoint on tab switch.
- [ ] Absolute functional parity — no existing UI or backend behavior breaks.
