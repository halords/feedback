---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Advanced Modular UI Components

## Objective
Build the complex UI components required for trend analysis and detailed tabular reporting, adhering to the updated `system_map.json` definitions.

## Tasks

<task type="auto">
  <name>Implement Trend Line Components</name>
  <files>src/components/dashboard/TrendChart.tsx</files>
  <action>
    - Create a reusable `TrendChart` component using `react-chartjs-2` (Line chart type).
    - Support multi-dataset visualization (e.g., Environment vs Staff over time).
    - Implement PHO/PTO special tooltip behavior (showing sub-office data on hover if applicable).
  </action>
  <done>Trend charts are available for the dashboard grid.</done>
</task>

<task type="auto">
  <name>Build Advanced Data Tables</name>
  <files>src/components/dashboard/DataTable.tsx</files>
  <action>
    - Build a generic `DataTable` component with support for headers, cell formatting, and responsive scroll.
    - Specifically implement `tableCollect` (Collection vs Logbook) and `tableCCQ` (Citizen's Charter) layouts.
  </action>
  <done>Tables can display row-by-row sub-office data.</done>
</task>

<task type="auto">
  <name>Enhanced Loading Architecture</name>
  <files>src/components/dashboard/DashboardSkeleton.tsx</files>
  <action>
    - Update skeletons to handle the new grid layout (Charts + Tables).
    - Add progressive loading states for individual chart sections.
  </action>
  <done>Smooth loading experience for all 6 features.</done>
</task>

## Success Criteria
- [ ] Line charts can visualize monthly performance trends.
- [ ] Tables match `system_map.json` column definitions (`AWARE`, `VISIBLE`, `HELPFUL`).
- [ ] Components are responsive and accessible.
