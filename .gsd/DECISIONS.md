# DECISIONS.md

## Phase 1 Decisions

**Date:** 2026-04-20

### Scope
- **Public Routes Whitelist**: `/login`, `/api/login`, `/api/auth/resolve-id`, and static assets. Everything else is protected by default.
- **RBAC Continuity**: Security enforcement must not modify the visible output behavior for Responses, Reports, or Comments management. The `is_analytics_enabled` and `superadmin` role logic must remain the same as the current functional state.

### Approach
- **Chose**: **Option B (Context-Aware Guard)** for the `withAuth` higher-order function.
- **Rationale**: This centralizes both Authentication (session check) and Authorization (office-scoping intersection) into a single point of failure/success. By automatically intersecting requested offices with authorized offices, we eliminate the risk of "forgotten scoping" in future API implementation.

### Constraints
- **Functional Immutability**: Underlying service functions (e.g., `getManagedComments`, `getResponses`) will not be modified. Only the API-level entry point will be wrapped.
- **Zero RBAC Regression**: The wrapper must correctly distinguish between `superadmin` (granting `"ALL"`) and `standard` users (forcing intersection).
