---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Superadmin Filtering Optimization

## Objective
Ensure Superadmins have a productive default experience on the Reports page by defaulting to "All Offices" and ensuring filtering is intuitive.

## Context
- .gsd/SPEC.md
- src/context/AnalyticsContext.tsx
- src/components/analytics/AnalyticsFilterBar.tsx
- src/components/analytics/DataView.tsx

## Tasks

<task type="auto">
  <name>Default Superadmin to All Offices</name>
  <files>
    <file>src/context/AnalyticsContext.tsx</file>
  </files>
  <action>
    Modify the `targetOffices` useMemo in `AnalyticsContext.tsx` to return `["ALL"]` by default for Superadmins in the "data" tab when no `selectedUserId` is set. 
    Currently, it returns `[]` which results in an empty page. 
    Updating this to `["ALL"]` will trigger a fetch for all offices by default.
  </action>
  <verify>Check the console logs in the browser (or simulated env) to see that [AnalyticsContext] now targets ["ALL"] by default for superadmins.</verify>
  <done>AnalyticsContext returns ["ALL"] for superadmins when selectedUserId is null.</done>
</task>

<task type="auto">
  <name>Update Filter UI for All Offices</name>
  <files>
    <file>src/components/analytics/AnalyticsFilterBar.tsx</file>
  </files>
  <action>
    Update the "User Filter" dropdown in `AnalyticsFilterBar.tsx` to handle the new default state. 
    If possible, make "All Offices (Global)" the visually selected option or ensure the "User Filter: None" actually means "All" now.
    Also, ensure that selecting "ALL_OFFICES" still works correctly with the updated context logic.
  </action>
  <verify>Inspect the AnalyticsFilterBar component and ensure the dropdown options align with the context's targetOffices logic.</verify>
  <done>User Filter dropdown correctly reflects the default "All Offices" state for Superadmins.</done>
</task>

## Success Criteria
- [ ] Superadmins see all office data by default upon entering the Reports page.
- [ ] Filtering by specific users still works and correctly limits the office scope.
- [ ] Data View pagination functions correctly with the "ALL" office scope.
