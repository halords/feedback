---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Modular Dashboard Components

## Objective
Build the reusable UI building blocks for the dashboard, including the chart wrapper and dynamic selectors, while adhering to the Indigo Slate theme.

## Context
- UI_reference/dashboard/code.html
- .gsd/SPEC.md (UI Fidelity)

## Tasks

<task type="auto">
  <name>Initialize Chart.js Wrapper</name>
  <files>src/lib/charts/init.ts, src/components/dashboard/ChartCard.tsx</files>
  <action>
    - Install `chart.js` and `react-chartjs-2`.
    - Create `src/lib/charts/init.ts` to register global Chart.js plugins and scales once.
    - Build `ChartCard` component: A themed `Card` containing a responsive canvas and a loading skeleton state.
  </action>
  <verify>npm list chart.js</verify>
  <done>Charts are ready to be integrated with real data.</done>
</task>

<task type="auto">
  <name>Build Dynamic Filter Bar</name>
  <files>src/components/dashboard/FilterBar.tsx</files>
  <action>
    - Build a horizontal filter bar using the `surface_container_low` background.
    - Create a dynamic Office selector (Select/Combobox) that populates from `/api/offices`.
    - Create Month/Year selectors.
    - Ensure all selectors update the `DashboardContext` (and URL).
  </action>
  <verify>Test-Path "src/components/dashboard/FilterBar.tsx"</verify>
  <done>Interactive filters are functional and data-driven.</done>
</task>

<task type="auto">
  <name>Implement Dashboard Skeletons</name>
  <files>src/components/dashboard/DashboardSkeleton.tsx</files>
  <action>
    - Create a loading skeleton for the full dashboard grid using `animate-pulse`.
    - Base the skeleton sizes on the `UI_reference/dashboard` layout.
  </action>
  <verify>Get-Content "src/components/dashboard/DashboardSkeleton.tsx" | Select-String "animate-pulse"</verify>
  <done>Skeletons provide smooth loading UX.</done>
</task>

## Success Criteria
- [ ] Chart component is responsive and themed correctly.
- [ ] Filter bar dynamically loads office list.
- [ ] UI matches the layouts from design references.
