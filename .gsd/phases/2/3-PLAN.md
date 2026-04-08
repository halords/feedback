---
phase: 2
plan: 3
wave: 1
---

# Plan 2.3: Dashboard Integration & Verification

## Objective
Assemble all 6 features into a cohesive dashboard vertical slice, ensuring that PTO/PHO sub-offices are correctly aggregated and displayed as per the updated specification.

## Features to Implement
1. **Per-Office Rating (Bar)**: Satellite aggregation for PHO/PTO.
2. **Rating Breakdown (Line/Trend)**: Individual sub-office performance.
3. **Collection Rate (Line)**: Aggregated monthly trends.
4. **Collection vs Logbook (Bar)**: Aggregated totals.
5. **Detailed Collection Table (`tableCollect`)**: Row-by-row breakdown.
6. **Charter Awareness Table (`tableCCQ`)**: Columnar metric report.

## Tasks

<task type="auto">
  <name>Finalize Dashboard Grid Layout</name>
  <files>src/app/dashboard/page.tsx</files>
  <action>
    - Arrange all 6 features into an architectural grid following `UI_reference` (Editorial design).
    - Connect all components to the enhanced `useDashboardData` hook.
  </action>
  <done>Full 6-feature dashboard layout is integrated.</done>
</task>

<task type="auto">
  <name>Wire Aggregation Logic to UI</name>
  <files>src/app/dashboard/DashboardClient.tsx</files>
  <action>
    - Ensure when "PHO" is selected, the UI displays aggregated data across its 3 sub-offices.
    - Implement the "Trend" views where sub-offices appear as individual lines.
  </action>
  <done>Parent-Child office logic is visible in the UI.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Verification of Section 212 (CC Awareness)</name>
  <files>src/app/dashboard/page.tsx</files>
  <action>
    1. Select "PTO" in the office filter.
    2. Verify `tableCCQ` appears with rows for PTO, PTO-Cash, and PTO-Assessor.
    3. Verify columns for AWARE, VISIBLE, HELPFUL, and CLIENTS contain data.
  </action>
  <done>New spec requirements are physically verified.</done>
</task>

## Success Criteria
- [ ] 100% Feature parity with the updated `system_map.json`.
- [ ] PHO/PTO specific aggregation logic works correctly.
- [ ] Visual fidelity maintained at 100%.
