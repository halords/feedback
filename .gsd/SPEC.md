# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Transform the system into a **Secure-by-Default** architecture where the API perimeter is globally enforced by middleware and a unified handler wrapper, ensuring that any new code is protected automatically and verified by empirical integration tests.

## Goals
1. **Perimeter Hardening**: Shift the Middleware from a whitelist approach to a **Secure-by-Default** (blacklist) logic, ensuring all `/api/` and `page` routes are protected unless explicitly public.
2. **Unified Security Wrapper**: Implement a Global Higher-Order Handler for API routes to centralize `verifySession()`, RBAC scoping, and rate limiting, eliminating the "forgotten guard" regression risk.
3. **Empirical Integration Suite**: Establish a Vitest-based integration testing suite that verifies:
    - **Authentication**: Unauthenticated requests to any `/api` endpoint return `401`.
    - **Authorization**: Non-superadmin requests for unauthorized offices return empty or 403.
    - **Integrity**: Zod validation is applied to all incoming payloads.
4. **Zero-Trust Migration**: Migrate all existing vulnerable endpoints (Comments, Assignments, Dashboard Metrics) to the new global handler.

## Non-Goals (Out of Scope)
- Developing new business features (Charts, AI Reports).
- Refactoring the Firestore database schema or storage architecture.
- Replacing the Next.js App Router or the current Shell UI.

## Users
- **Superadmins**: Expecting guaranteed organizational data protection.
- **Office Admins**: Expecting to only access their assigned office data.
- **Developers**: Expecting a friction-less but safe API development experience.

## Constraints
- **Functional Integrity**: No changes to existing UI behavior or data presentation for authorized users.
- **Deployment Platform**: Must remain compatible with Firebase App Hosting environment.

## Success Criteria
- [ ] Middleware blocks unauthenticated access to any newly created API route by default.
- [ ] Integration test suite covers 100% of `/api` endpoints with "Failure-to-Bypass" assertions.
- [ ] All high-risk endpoints (`/api/users/assignment`, `/api/comments`, etc.) are protected by the Unified Security Wrapper.
- [ ] System Audit (v3) returns `PASS` for all Security and RBAC categories.
