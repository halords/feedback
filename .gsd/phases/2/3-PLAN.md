---
phase: 2
plan: 3
wave: 1
---

# Plan 2.3: Vertical Slice: Dashboard Page

## Objective
Finalize the Dashboard vertical slice by assembling all components and connecting them to the live API, ensuring full feature parity and dynamic data binding.

## Context
- .gsd/SPEC.md
- UI_reference/dashboard/screen.png
- system_map.json (for dashboard features)

## Tasks

<task type="auto">
  <name>Assemble Dashboard Page</name>
  <files>src/app/dashboard/page.tsx, src/components/layout/Shell.tsx</files>
  <action>
    - Create a main application `Shell` (including Sidebar and Navbar) as seen in `UI_reference`.
    - Assemble the Dashboard Page with the `FilterBar` and `Chart` grid.
    - Implement a protected route check (redirect to `/login` if not authenticated).
  </action>
  <verify>Test-Path "src/app/dashboard/page.tsx"</verify>
  <done>Dashboard layout is complete and protected.</done>
</task>

<task type="auto">
  <name>Wire Charts to Real Data</name>
  <files>src/app/dashboard/page.tsx</files>
  <action>
    - Populate charts using data from the `useDashboardData` hook.
    - Implement the "Overall Feedback Rating" (Bar), "Breakdown Summary" (Bar), and "Monthly Collection Trend" (Line) as per original features.
    - Ensure the logic correctly handles "All Offices" vs individual selections.
  </action>
  <verify>Get-Content "src/app/dashboard/page.tsx" | Select-String "useDashboardData"</verify>
  <done>Charts visualize live Firestore data.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Dynamic Office List Verification</name>
  <files>src/app/dashboard/page.tsx</files>
  <action>
    1. Log in as a Superadmin.
    2. Navigate to Dashboard.
    3. Verify all charts load (or show skeletons).
    4. Change an office name in the Firestore `offices` collection.
    5. Refresh dashboard and verify the new name appears in the filter dropdown without code changes.
  </action>
  <verify>User manual confirmation of dynamic binding</verify>
  <done>Dynamic data requirement is validated.</done>
</task>

## Success Criteria
- [ ] Dashboard is 100% data-driven (no hard-coded names).
- [ ] Visual fidelity matches `UI_reference`.
- [ ] Feature parity: All charts from the legacy dashboard are present.
