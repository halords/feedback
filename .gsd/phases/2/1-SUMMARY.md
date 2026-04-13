# Plan 2.1 Summary: Satellite-Aware Data Layer

Successfully implemented the granular data services for the SPEC 2.0 dashboard.

## Key Accomplishments
- **Group Aggregator**: Implemented `aggregatorService.ts` to manage the expansion of PHO and PTO groups.
- **Metrics Refactor**: Updated the core `metricsService.ts` to support satellite awareness (`primaryGroup` labeling) and awareness metrics (`awareCount`, `visibleCount`, `helpfulCount`).
- **Granular APIs**: Created specialized endpoints `/api/dashboard/collection` and `/api/dashboard/cc-awareness` to feed the high-fidelity tables.

## Evidence
- Satellite expansion resolves `PHO` -> `[PHO, PHO-Clinic, PHO-Warehouse]`.
- API responses include correct column mappings for `tableCCQ` and `tableCollect`.
