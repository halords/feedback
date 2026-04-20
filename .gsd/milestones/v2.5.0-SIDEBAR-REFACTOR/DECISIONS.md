# DECISIONS.md

## ADR 1: Addressing Systemic Code Over Pre-Deployment Configuration
**Context:** The final audit revealed a mix of environment-level flaws (like exposed keys and missing Firestore dev rules) mixed in with deeply systemic code logic flaws.
**Decision:** We are executing the project exclusively on the architectural and systemic code logic flaws, recognizing that updating the Firestore `.rules` and managing Cloud Key rotations are operational deployment tasks to be carried out externally.
**Status:** Approved
## Phase 1 Decisions

**Date:** 2026-04-16

### Scope
- **Safety Snapshot**: The entire `src/` directory will be copied to a root-level `legacyV2/` folder. This is purely for safekeeping and manual reverts if needed.
- **Development Environment**: The current `src/` folder remains the active development environment for the Read Optimization features.
- **Sidebar**: The existing sidebar remains as is for now. Any UI changes for the "Saving Measures" portal or optimization toggles will be deferred to later phases.

### Approach
- **Chose**: Root-level File Replication.
- **Reason**: Provides a clean, non-build-interfering backup of the current stable state. Using a root-level folder instead of a route group prevents potential Next.js routing conflicts and code duplication in the bundle.

### Constraints
- **Build Exclusion**: `legacyV2/` must be ignored by `.gitignore` (or at least by ESLint/TypeScript/Next.js) to avoid duplicate module errors and build complexity.
- **Manual Sync**: This is a one-time snapshot before dev work begins.
