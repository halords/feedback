---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Dynamic Personnel Extraction

## Objective
Replace static user lookup with dynamic personnel extraction from archives.

## Context
- src/context/AnalyticsContext.tsx
- src/components/analytics/AnalyticsFilterBar.tsx

## Tasks

<task type="auto">
  <name>Expose availablePersonnel in AnalyticsContext</name>
  <files>
    <file>src/context/AnalyticsContext.tsx</file>
  </files>
  <action>
    - Ensure Superadmin always targets ["ALL"] in the Data tab.
    - Extract unique `fullname` values from the `data` array in a useMemo.
    - Expose `availablePersonnel` in the context value.
    - Important: Maintain filtering logic so that if a `selectedUserId` (name) is set, the `data` returned to the consumer is filtered by that name.
  </action>
  <verify>Check [AnalyticsContext] logs to see if availablePersonnel list is populated from the fetch result.</verify>
  <done>availablePersonnel list is correctly derived and exposed.</done>
</task>

<task type="auto">
  <name>Switch FilterBar to Dynamic Personnel</name>
  <files>
    <file>src/components/analytics/AnalyticsFilterBar.tsx</file>
  </files>
  <action>
    - Remove SWR fetch for `/api/users`.
    - Use `availablePersonnel` from context to populate the dropdown options.
    - Ensure selecting "All Offices" clears the filter.
  </action>
  <verify>Inspect the dropdown in the browser (simulated) to ensure it shows names present in the current month's data.</verify>
  <done>User filter dropdown is dynamically populated from archive data.</done>
</task>

## Success Criteria
- [ ] Dropdown only shows personnel with active reports in the selected month/year.
- [ ] Changing month/year automatically refreshes the personnel list.
- [ ] Filtering by personnel correctly narrows the data list in the UI.
