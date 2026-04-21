# ROADMAP.md

> **Current Milestone**: System Security & Performance Optimization
> **Goal**: Address outstanding security debt, eliminate technical vulnerabilities, optimize application bottlenecks (Firestore reads), and enforce TypeScript strictness across the codebase.

## Must-Haves
- [ ] **ZERO REGRESSIONS (NON-NEGOTIABLE)**: Absolutely no existing function should break. All current functionality must continue to work flawlessly throughout these changes.
- [x] **Performance Optimization**: Implement 60s TTL cache for `getAllOffices()`, optimize `getJsonArchive()` API calls, and fix `AuthContext` polling.
- [x] **Auth Hardening**: Add app-level rate limiting to `/api/login` and implement immediate token revocation when roles change.
- [ ] **Codebase Strictness**: Fix pre-existing TypeScript errors in `AnalysisDashboard.tsx` and UI components and remove `ignoreBuildErrors: true`.
- [ ] **CSP Hardening**: Implement script nonce strategy in Next.js middleware and remove `'unsafe-inline'` from CSP headers.
- [ ] **Dependency Clean-up**: Update `firebase-admin` to v10.3.0+ to clear 3 low-severity transitive CVEs and execute full system regression tests.

## Phases

### Phase 1: Performance & Low-Hanging Fruit
**Status**: ✅ Complete
**Objective**: Implement in-memory caching for `officeService`, remove redundant `file.exists()` in `storageService`, and adjust SWR revalidation rules in `AuthContext`.

### Phase 2: Auth Hardening
**Status**: ✅ Complete
**Objective**: Secure `/api/login` with `checkRateLimitAsync` (10 req/5min) and trigger `admin.auth().revokeRefreshTokens()` when user assignments change.

### Phase 3: Codebase Strictness
**Status**: ⬜ Not Started
**Objective**: Resolve all dangling `tsc` errors (e.g., ChartDataset properties, missing `children` in Cards) and update `next.config.ts` to enforce strict builds.

### Phase 4: CSP Nonce Implementation
**Status**: ⬜ Not Started
**Objective**: Generate cryptographic nonces in `middleware.ts`, pass to Next.js components, and eliminate `'unsafe-inline'` without breaking Firebase authentication.

### Phase 5: Dependency Upgrade & Regression
**Status**: ⬜ Not Started
**Objective**: Safely execute a major semver bump for `firebase-admin`, verify Firestore/Storage SDK usages, and perform manual end-to-end regression tests across the app.
