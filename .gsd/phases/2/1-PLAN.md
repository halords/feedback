---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Dynamic Metadata & API Layer

## Objective
Establish the server-side data layer for the dashboard, replacing all hard-coded office references with dynamic Firestore queries and creating a central aggregation API.

## Context
- .gsd/SPEC.md
- legacy/functions/auth/call.js (for aggregation logic)
- system_map.json (for data flow)

## Tasks

<task type="auto">
  <name>Implement Dynamic Metadata API</name>
  <files>src/app/api/offices/route.ts, src/lib/services/officeService.ts</files>
  <action>
    - Create `src/lib/services/officeService.ts` to manage Firestore queries for the `offices` collection.
    - Implement `/api/offices` (GET) to return the list of all available offices.
    - Implement a revalidation strategy using Next.js 15 cache tags.
  </action>
  <verify>Invoke-WebRequest -Uri "http://localhost:3000/api/offices" | Select-String "name"</verify>
  <done>Offices are fetched dynamically from Firestore.</done>
</task>

<task type="auto">
  <name>Implement Dashboard Aggregation API</name>
  <files>src/app/api/dashboard/route.ts, src/lib/services/metricsService.ts</files>
  <action>
    - Port the dashboard aggregation logic from `legacy/functions/auth/call.js:fetchDashboard`.
    - Create `src/lib/services/metricsService.ts` to handle complex aggregation logic.
    - Implement `/api/dashboard` (POST) that accepts `offices`, `month`, and `year` filters.
  </action>
  <verify>Test-Path "src/app/api/dashboard/route.ts"</verify>
  <done>Dashboard API provides aggregated metrics for charts.</done>
</task>

<task type="auto">
  <name>Create Dashboard Context & Filters</name>
  <files>src/context/DashboardContext.tsx, src/hooks/useDashboard.ts</files>
  <action>
    - Build `DashboardContext` to manage the currently selected office(s), month, and year.
    - Use `URLSearchParams` to sync filter state with the browser's address bar.
    - Implement `useDashboardData` hook to fetch data using SWR.
  </action>
  <verify>Get-Content "src/context/DashboardContext.tsx" | Select-String "useSearchParams"</verify>
  <done>Filter state is managed globally and synced with URL.</done>
</task>

## Success Criteria
- [ ] `/api/offices` returns a real list from Firestore.
- [ ] No hard-coded office names exist in the API layer.
- [ ] Aggregation logic matches legacy parity.
