# ROADMAP.md

### Phase 2: Dynamic Core & Dashboard (Updated per Spec)
**Status**: ⬜ Not Started
**Objective**: Build the dynamic data layer and visual dashboard with satellite office aggregation (PTO/PHO) and trend analytics.
**Requirements**: REQ-DATA-01, REQ-UI-02, REQ-DASH-01 (Aggregation), REQ-DASH-02 (Tables)
- Implement satellite office grouping logic (PHO/PTO bundles) in `metricsService`.
- Build Trend Line charts for rating components and collection rates.
- Implement `tableCollect` and `tableCCQ` interactive data tables.
- Synchronize all 6 dashboard features listed in system_map.json.

## Must-Haves (from SPEC)
- [ ] 100% Feature parity with `system_map.json`
- [ ] Next.js + Tailwind CSS Implementation
- [ ] UI matching `UI_reference` (Indigo Slate Pro)
- [ ] No hardcoded offices (fully dynamic)
- [ ] Optimized Firestore Reads

## Phases

### Phase 1: Foundation & Auth
**Status**: ✅ Complete
**Objective**: Establish the Next.js foundation and complete the first vertical slice (Login).
**Requirements**: REQ-MOD-01, REQ-UI-01, REQ-AUTH-01
- Initialize Next.js project and Tailwind configuration.
- Implement shared UI components (Buttons, Inputs) from `UI_reference`.
- Refactor `index.html` logic into a Next.js Login Page.

### Phase 2: Dynamic Core & Dashboard (Updated per Spec)
**Status**: ⬜ Not Started
**Objective**: Build the dynamic data layer and visual dashboard with satellite office aggregation (PTO/PHO) and trend analytics.
**Requirements**: REQ-DATA-01, REQ-UI-02, REQ-DASH-01 (Aggregation), REQ-DASH-02 (Tables)
- Implement satellite office grouping logic (PHO/PTO bundles) in `metricsService`.
- Build Trend Line charts for rating components and collection rates.
- Implement `tableCollect` and `tableCCQ` interactive data tables.
- Synchronize all 6 dashboard features listed in system_map.json.

### Phase 3: Analytics Engine & Reports
**Status**: ⬜ Not Started
**Objective**: Implement the complex analytical logic and report generation.
**Requirements**: REQ-UI-03, REQ-LOGIC-01, REQ-LOGIC-02, REQ-OPT-01
- Port satisfaction formulas to a dedicated service utility.
- Build Analytics/Reports page (multi-tabbed) as per `UI_reference`.
- Refactor PDF generation service to a Next.js API route.

### Phase 4: User/Office Management & Optimization
**Status**: ⬜ Not Started
**Objective**: Complete the administrative features and audit for read-efficiency.
**Requirements**: REQ-DATA-01, REQ-DATA-02, REQ-OPT-01
- Port Users Management page logic.
- Implement read-optimization audit (ensure metrics caching is active).
- Standardize error handling and loading skeletons.

### Phase 5: Parity Completion & Launch
**Status**: ⬜ Not Started
**Objective**: Clean up remaining pages and perform a final parity audit.
- Port Responses and AllResponses pages.
- Final visual audit against `UI_reference`.
- Final feature audit against `system_map.json`.
