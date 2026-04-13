# ROADMAP.md

> **Current Phase**: Phase 5: Parity Completion & Launch
> **Milestone**: v1.0 (Refactored Modular System)

## Must-Haves (from SPEC)
- [ ] 100% Feature parity with `system_map.json`
- [x] Next.js + Tailwind CSS Implementation
- [x] UI matching `UI_reference` (Indigo Slate Pro)
- [x] No hardcoded offices (fully dynamic)
- [x] Optimized Firestore Reads

## Phases

### Phase 1: Foundation & Auth
**Status**: ✅ Complete
**Objective**: Establish the Next.js foundation and complete the first vertical slice (Login).
**Requirements**: REQ-MOD-01, REQ-UI-01, REQ-AUTH-01
- Initialize Next.js project and Tailwind configuration.
- Implement shared UI components (Buttons, Inputs) from `UI_reference`.
- Refactor `index.html` logic into a Next.js Login Page.

### Phase 2: Dynamic Core & Dashboard
**Status**: ✅ Complete
**Objective**: Build the dynamic data layer and the main visual dashboard.
**Requirements**: REQ-DATA-01, REQ-DATA-02, REQ-UI-02
- Implement `OfficeContext` and `UserContext` for shared dynamic state.
- Create `/api/dashboard` route to optimize data retrieval.
- Build Dashboard page with dynamic office filtering and Chart.js integration.

### Phase 3: Analytics Engine & Reports
**Status**: ✅ Complete
**Objective**: Implement complex analytical logic and high-fidelity PDF report generation.
- [x] Port satisfaction formulas to dedicated service utility.
- [x] Build Analytics/Reports multi-tabbed interface.
- [x] Implement individual Data View (Q0-Q9 parity).
- [x] Implement Consolidated Summary matrix.
- [x] Port key trend charts in Graphs View.
- [x] **Phase 3.3: High-Fidelity PDF Generation**
    - [x] 3.3.1: Data View PDF (Individual & Bulk Exports)
    - [x] 3.3.2: Summary PDF (Consolidated Matrix Export)
    - [x] 3.3.3: Graphs PDF (Visual Analytics Export)

### Phase 4: User/Office Management & Optimization
**Status**: ✅ Complete
**Objective**: Complete the administrative features and audit for read-efficiency.
**Requirements**: REQ-DATA-01, REQ-DATA-02, REQ-OPT-01
- [x] **Phase 4.2: User Management Service & API**
- [x] **Phase 4.3: Users Management Interface**
- [x] **Phase 4.4: Final Optimization & UX Polish**
    - [x] Notification System (Toasts)
    - [x] Firestore Read Audit & Efficiency
    - [x] Skeleton & UI Standardization
    - [x] Final RBAC Pass

### Phase 5: Parity Completion & Launch
**Status**: ✅ Complete
**Objective**: Clean up remaining pages and enforce matrix-based RBAC.
- [x] **RBAC Hardening**: Jail Dashboard/Analytics-Data to assigned offices for Admin/User.
- [x] **Superadmin Only**: Restrict Users management strictly to Superadmin.
- [x] **Responses Page**: 
    - [x] Backend API (Fetching & Classification).
    - [x] `My Responses`: Assigned offices + Classification rights.
    - [x] `All Responses`: Global list + Read-only for non-Superadmins.
- [x] Final visual audit against `UI_reference`.
- [x] Final feature audit against `system_map.json`.
