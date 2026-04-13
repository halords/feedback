---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Satellite-Aware Data Layer

## Objective
Implement high-fidelity API routes and services that handle the "Satellite Office" aggregation logic for PHO and PTO, ensuring dynamic tabular data is available for the dashboard.

## Tasks

| ID | Task Name | Description | Files | Verification |
| :--- | :--- | :--- | :--- | :--- |
| 2.1.1 | **Satellite Service Logic** | Implement `src/lib/services/aggregatorService.ts` to group PTO/PHO satellites. | `src/lib/services/aggregatorService.ts` | Unit test for PTO/PHO groupings |
| 2.1.2 | **Collection API** | Create `/api/dashboard/collection` to return rows for `tableCollect` (Office/Satellite vs Month). | `src/app/api/dashboard/collection/route.ts` | API returns individual satellite rows |
| 2.1.3 | **CC Awareness API** | Create `/api/dashboard/cc-awareness` returning `AWARE`, `VISIBLE`, `HELPFUL` metrics. | `src/app/api/dashboard/cc-awareness/route.ts` | API returns exact columns from spec |
| 2.1.4 | **Metrics Refactor** | Update `metricsService.ts` to include "Collection vs Logbook" calculation. | `src/lib/services/metricsService.ts` | `overrate` matches legacy formula |

## Success Criteria
- [ ] API routes handle PTO (Cash/Assessor) and PHO (Clinic/Warehouse) as grouped and individual entities.
- [ ] CC Awareness payload includes columns: OFFICE, AWARE, VISIBLE, HELPFUL, CLIENTS.
