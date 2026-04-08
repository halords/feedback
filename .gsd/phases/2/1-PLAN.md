---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Dynamic Metadata & Advanced API Layer

## Objective
Establish the server-side data layer for the dashboard with specialized support for PHO/PTO satellite office aggregation and dynamic metadata fetching.

## Tasks

<task type="auto">
  <name>Implement Dynamic Metadata API with Satellite Mapping</name>
  <files>src/lib/services/officeService.ts</files>
  <action>
    - Update `officeService.ts` to include a mapping of satellite offices to their parent bundles (PHO, PTO).
    - Ensure `/api/offices` returns the relationship metadata (e.g., `parent: "PHO"`).
  </action>
  <verify>Invoke-WebRequest -Uri "http://localhost:3000/api/offices" | Select-String "parent"</verify>
  <done>Satellite relationships are defined and available via API.</done>
</task>

<task type="auto">
  <name>Implement Aggregation Logic for PTO/PHO</name>
  <files>src/lib/services/metricsService.ts</files>
  <action>
    - Refactor `metricsService.ts` to automatically fetch and average satellite office data when a parent (PHO/PTO) is requested.
    - Implement "Monthly Trend" calculation (returning data for multiple months if needed for line charts).
  </action>
  <verify>Test-Path "src/lib/services/metricsService.ts"</verify>
  <done>Backend handles parent-child office aggregation automatically.</done>
</task>

<task type="auto">
  <name>Expand Dashboard API for Tables & Trends</name>
  <files>src/app/api/dashboard/route.ts</files>
  <action>
    - Update `/api/dashboard` to return two new data structures: 
      1. `trendData`: Monthly time-series for Environment/Systems/Staff.
      2. `tableData`: Row-by-row breakdown for `tableCollect` and `tableCCQ`.
  </action>
  <verify>Get-Content "src/app/api/dashboard/route.ts" | Select-String "trendData"</verify>
  <done>Dashboard API supports all 6 new visual features.</done>
</task>

## Success Criteria
- [ ] parent-child relationships are explicitly handled in aggregation.
- [ ] API returns time-series data for line charts.
- [ ] API provides structured data for CC Awareness tables.
