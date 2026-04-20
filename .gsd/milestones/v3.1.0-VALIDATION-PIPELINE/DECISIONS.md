# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v3.0.0-SECURITY-HARDENING/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-04-20

### Scope
- Focusing strictly on **Unit Tests** for `rbac.ts`. The logic is pure and does not require complex integration testing or database emulation, allowing for extremely fast execution.

### Approach
- Chose: **Vitest** (Option A).
- Reason: Zero configuration needed for Next.js/TypeScript environments, native ESM support, and incredibly fast. Avoids the heavy boilerplate overhead of Jest, suitable for this system's scale.

### Constraints
- Testing framework and commands must be completely isolated from production builds. If tests fail locally, they should not crash standard deployments unless explicitly added to CI pipelines in the future.
