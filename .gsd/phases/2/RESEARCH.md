# Phase 2 Research: Dynamic Core & Dashboard

## Data Fetching & Optimization
To achieve the "zero hard-coded offices" (SPEC goal) and move toward read efficiency:
- **Strategy**: Fetch the master list of offices in a **Next.js Server Component** with a revalidation tag.
- **Next.js 15 Tags**: Use `revalidateTag` to purge the office cache only when the office list is updated in the database.
- **Hook Strategy**: Create a `useDashboardData` hook that uses `SWR` with a `fetcher` calling the Next.js API route. SWR will provide client-side caching to prevent repeated reads when switching tabs.

## Chart.js Integration
- **Library**: `react-chartjs-2` + `chart.js`.
- **Setup**: Externalize the `Chart.register` logic to a single entry point (e.g., `src/lib/charts/init.ts`) to avoid redundant bundle bloat.
- **Theme Matching**: Use CSS variables (e.g., `--primary`) in the chart configuration to ensure visual consistency with the "Indigo Slate" theme.

## Dynamic Filter Architecture
- **Pattern**: URL-driven state for Filter values.
- **Benefit**: Allows users to share specific dashboard views via URL and enables server-side data preparation for the selected filters.
- **Implementation**: `next/navigation` hooks (`useSearchParams`, `usePathname`) will manage the transition of filters.

## Loading Strategy
- **Approach**: Skeleton Screens.
- **Visuals**: Use `animate-pulse` on placeholder `Card` components to match the "Precision Curator" aesthetic (soft transitions).
