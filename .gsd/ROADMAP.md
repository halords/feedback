# ROADMAP.md

> **Current Milestone**: v3.3.0-SECURITY-UNIFICATION
> **Goal**: 100% Verified Secure-by-Default Architecture

## Must-Haves (from SPEC)
- [ ] Global "Deny-by-Default" Middleware
- [ ] Unified `withAuth` API Handler Wrapper
- [ ] Integration Test Suite for all `/api` routes
- [ ] Hardened `/api/users/assignment` & `/api/comments`

## Phases

### Phase 1: Perimeter Defense (Global)
**Status**: ⬜ Not Started
**Objective**: Lock the front door. Reconfigure Middleware to protect everything by default and create the `withAuth` higher-order function.
**Deliverables**:
- Secure-by-default `middleware.ts`
- `src/lib/auth/withAuth.ts` utility

### Phase 2: Endpoint Migration & Hardening
**Status**: ⬜ Not Started
**Objective**: Apply the shield to all handlers. Migrate vulnerable endpoints to the `withAuth` wrapper and fix missing RBAC scoping.
**Deliverables**:
- Hardened Comments API
- Hardened Users/Assignment API
- Hardened Dashboard Metrics APIs

### Phase 3: Integration Testing Framework
**Status**: ⬜ Not Started
**Objective**: Build the "Immune System". Set up Vitest mock environments for Next.js Request/Response and implement negative security tests.
**Deliverables**:
- `src/integration-tests/security.test.ts`
- Automated test runs for all API endpoints

### Phase 4: Final Audit & Polish
**Status**: ⬜ Not Started
**Objective**: Verification and cleanup. Re-run the full system audit and remove any legacy "masking" logic in favor of true scoping.
**Deliverables**:
- Passed `AUDIT_REPORT.md`
- Removed technical debt from `responseService.ts`
