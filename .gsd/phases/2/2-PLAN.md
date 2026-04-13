---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Advanced Visualization & Tables

## Objective
Develop the complex UI components required for per-office analytics, including multi-axis charts and data tables with satellite office row support.

## Tasks

| ID | Task Name | Description | Files | Verification |
| :--- | :--- | :--- | :--- | :--- |
| 2.2.1 | **Dynamic DataTable** | Build a reusable `DataTable` component using Indigo Slate theme (No-Line rule). | `src/components/ui/DataTable.tsx` | Visual check against DESIGN.md |
| 2.2.2 | **KPI Charts (4)** | Implement `rate` (Bar), `breakdown` (Line), `collect` (Line), `collectBreak` (Combo). | `src/components/dashboard/KPIGrid.tsx` | Matches system_map.json IDs |
| 2.2.3 | **CC Awareness Table** | Implement `tableCCQ` component with specific columns: OFFICE, AWARE, VISIBLE, HELPFUL, CLIENTS. | `src/components/dashboard/CCTable.tsx` | Columns match the specification |
| 2.2.4 | **Collection Table** | Implement `tableCollect` for detailed visitor and collection breakdown. | `src/components/dashboard/CollectionTable.tsx` | Rows show satellites for PTO/PHO |

## Success Criteria
- [ ] Dashboard displays 4 distinct charts types as per `system_map.json`.
- [ ] Tables use a clean, architectural layout without unnecessary columns.
- [ ] PTO/PHO sections list their satellite offices as individual rows.
