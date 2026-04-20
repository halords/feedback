# Phase 5 Research: Logic Refinement

## Context
Goal: Implement the Unified Logic Flow for office inclusion/exclusion as defined in `REVISION.md`.

## Key Findings

### 1. Data Schema
- **Offices Collection**: Documents use the office acronym as ID.
- **Office Status**: Field `status` is either `"active"` or `"disabled"`.
- **Special Offices**: `PYESDO` and `PCDO` are identified by their acronym IDs.
- **Physical Reports**: `physical_report` collection uses `DEPARTMENT` (string matching office name) and `FOR_THE_MONTH_OF` (e.g., "January 2025").
- **Responses**: `Responses` collection uses `Office` (string matching office name) and `Date` (ISO or MM/DD/YYYY string).

### 2. Implementation Strategy

#### Core Utility: `getEffectiveOfficesForPeriod(month, year)`
Create a helper function in `officeService.ts` that:
1. Fetches all offices.
2. Filters out `PYESDO` and `PCDO` if `year === "2025"`.
3. For other offices:
   - If status is `active`, include.
   - If status is `disabled`:
     - Quick-check if any records exist in `Responses` or `physical_report` for that specific month/year.
     - Include only if data exists.

#### API Updates
- **`/api/offices`**: Update to accept `month` and `year`. If provided, use `getEffectiveOfficesForPeriod`. This ensures UI filters only show relevant offices.
- **`/api/admin/archive`**: Update `POST` to use the new filtering logic so that the `metrics.json` and `responses.json` only contain the correct subset of data.

### 3. Verification Criteria
- `PYESDO` and `PCDO` should not appear in any 2025 reports/archives.
- `PHO-Warehouse` (known inactive) should appear in monthly reports/archives ONLY for months where it has data.
- Dashboard totals should match the filtered subset.
