## Phase 1 Decisions

**Date:** 2026-04-08

### Architecture
- **Framework**: Chose **Next.js App Router** with **Option A** (Unified API Routes).
- **Rationale**: Simplifies codebase management and ensures a truly modular refactor.
- **Migration**: Existing `functions/` logic will be ported to `/app/api/` handlers.

### Authentication
- **Approach**: Custom implementation using **React Context** for global state management.
- **Persistence**: Maintaining existing `localStorage` and `bcryptjs` logic for compatibility and feature parity.

### UI & Components
- **Styling**: Standardized on **Tailwind CSS**.
- **Foundations**: Using **Radix UI** primitives for accessible, high-quality components (e.g., Dialogs, Selects) while styling them to match `UI_reference`.

### Repository Structure
- **Archiving**: Legacy project files (`public/`, `functions/`) will be moved to a `legacy/` directory during Phase 1 setup to keep the root clean for the Next.js app.

## Phase 3 Decisions

**Date:** 2026-04-12

### PDF Generation
- **Engine**: Chose **pdf-lib** with **AcroForm template filling**.
- **Rationale**: Using existing `REPORT.pdf` templates ensures 100% visual parity with legacy reports while enabling server-side dynamic signatures and automated data mapping.

### Data Aggregation
- **Unified Engine**: Implemented `metricsService.ts` to merge Online (structured Firestore) and Offline (Excel-uploaded physical reports).
- **Parity Fix**: Standardized "Citizen's Charter" metrics across both sources to resolve "zero-value" reporting bugs found in early development.
