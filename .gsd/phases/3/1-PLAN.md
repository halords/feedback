---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Codebase Strictness

## Objective
Address scattered TypeScript compilation errors that have degraded the `tsc` health of the repository. By systematically resolving UI prop conflicts, missing imports, and logic mismatches, we can cleanly remove the `ignoreBuildErrors` escape hatch from Next.js and enforce strict verification.

## Context
- `.gsd/ROADMAP.md` (Phase 3)
- `next.config.ts`

## Tasks

<task type="auto">
  <name>Fix Core UI Prop & Button Strictness</name>
  <files>
    src/app/offices/page.tsx
    src/app/settings/saving-measures/SavingMeasuresClient.tsx
    src/components/physical-reports/PhysicalReportsEditor.tsx
    src/components/ui/ArchiveOverrideModal.tsx
    src/components/users/UsersTable.tsx
    src/components/analytics/AnalyticsFilterBar.tsx
  </files>
  <action>
    - Address Button component prop mismatches: The UI tries to pass `variant="ghost"` or `variant="outline"` but the interface currently only supports `"primary" | "secondary" | "tertiary"`. Map `ghost` to `tertiary` or `secondary`, and strip unsupported properties like `size`.
    - Fix `AnalyticsFilterBar`: remove the invalid `selectedUserId` property from objects typed as `{ month?: string; year?: string; search?: string }`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Number of UI props errors in `tsc --noEmit` drops significantly.</done>
</task>

<task type="auto">
  <name>Fix Dashboard & Analytics Types</name>
  <files>
    src/components/comments/AnalysisDashboard.tsx
    src/context/DashboardContext.tsx
  </files>
  <action>
    - `AnalysisDashboard`: The `Card` component interface is aggressively requiring `children`. Some cards might just be self-closing `<Card className="..." />`. Pass an empty React fragment `<></>` or `null` as `children`. Also address the `cutout` property on `ChartDataset<"doughnut", number[]>` (map it to `cutoutPercentage` or remove it based on Chart.js v3+ typings).
    - `DashboardContext`: Fix comparisons between `number` and `string` types involving dates/years (lines 112 and 143). Explicitly `parseInt` or `.toString()` to align types before `>`, `<`, or `===`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Charts and Dashboard context compile smoothly without ignoring types.</done>
</task>

<task type="auto">
  <name>Fix API Route & Service Typings</name>
  <files>
    src/app/api/offices/route.ts
    src/app/comments/page.tsx
    src/lib/services/commentManagementService.ts
  </files>
  <action>
    - `api/offices/route.ts`: Ensure that updating `status` casts incoming string to `"active" | "disabled"`.
    - `app/comments/page.tsx`: Import the missing `ManagedComment` type from definition files.
    - `commentManagementService.ts`: Remove duplicate `id` spread or assignment in mapping objects (e.g., `{ id: doc.id, ..., id, ... }`) at lines 63, 241, and 352.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>No compilation errors exist anywhere in `npx tsc --noEmit`.</done>
</task>

<task type="auto">
  <name>Enforce Next.js Build Strictness</name>
  <files>next.config.ts</files>
  <action>
    - Remove the `typescript: { ignoreBuildErrors: true }` block.
    - Remove the `eslint: { ignoreDuringBuilds: true }` block.
  </action>
  <verify>npx next build</verify>
  <done>The production build runs successfully without overriding errors.</done>
</task>

## Success Criteria
- [ ] ZERO TypeScript errors exist across the whole codebase.
- [ ] Production Build passes natively.
