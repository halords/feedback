# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Achieve a 100% fortified, future-proof codebase by establishing a rigorous automated testing pipeline and comprehensively rolling out strict Zod validation schemas across all endpoints, ensuring that our recently secured architecture is immune to developer regressions.

## Goals
1. **Automated Defense Line**: Implement a robust testing framework (Vitest/Jest) that automatically verifies our complex RBAC scoping rules against simulated user profiles, guaranteeing the `"ALL"` bypass leak can never secretly return.
2. **Universal Schema Integrity**: Expand the powerful `Zod` validation system established in Phase 8 to cover all remaining auxiliary API endpoints perfectly mapping the data structures.
3. **Database Rules Finalization**: Formally audit and document the `firestore.rules` file to permanently enforce the backend-only access architecture (Admin SDK reliance), locking the Firebase frontend doors permanently.

## Non-Goals (Out of Scope)
- Developing new dashboard UI features or metrics.
- Changing existing database design or rewriting `responseService.ts`.
- Migrating the codebase to a radically different framework architecture (e.g., App Router rewrites, if keeping Pages/API routes).

## Users
- Future development teams and auditors who need guaranteed proof that the codebase maintains a secure standard during maintenance cycles.

## Constraints
- **Zero Integration Breaking**: The new testing framework must not disrupt the current functional application.
- **Node Alignment**: Operations should maintain the standard of the `engines: ">=20"` configuration as recently verified.

## Success Criteria
- [ ] CI/CD-ready test suite successfully passes and asserts office scoping logic.
- [ ] 100% of writable `/api` endpoints have `z.object()` structured validations instead of basic vanilla if/else checks.
- [ ] `firestore.rules` is fully documented, audited, and intentionally implemented as purely server-access only.
