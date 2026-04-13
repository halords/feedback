---
phase: 2
plan: 3
wave: 1
---

# Plan 2.3: Per-Office Analytics Vertical Slice

## Objective
Assemble the complete dashboard experience with aggregated analytics for satellites and detailed breakdown tables, ensuring 100% feature coverage of the updated `system_map.json`.

## Tasks

| ID | Task Name | Description | Files | Verification |
| :--- | :--- | :--- | :--- | :--- |
| 2.3.1 | **Satellite Dashboard** | Integrate PHO/PTO aggregation into the main dashboard view. | `src/app/dashboard/page.tsx` | PHO shows combined stats |
| 2.3.2 | **Table Integration** | Place `tableCollect` and `tableCCQ` below the charts in a modular grid. | `src/app/dashboard/page.tsx` | All 3 spec features visible |
| 2.3.3 | **Read Optimization** | Audit SWR caching to ensure PTO/PHO sub-queries don't spike read counts. | `src/lib/services/metricsService.ts`| Cache-Control headers verified |

## Success Criteria
- [ ] Overall Feedback Rating is aggregated for PTO/PHO groups.
- [ ] CC Awareness Table shows the exact columns: OFFICE, AWARE, VISIBLE, HELPFUL, CLIENTS.
- [ ] Detailed Breakdown Table displays satellite offices as individual rows.
- [ ] Sidebar and navigation redirect unauthorized users as per spec.
