# Plan 2.2 Summary: Dashboard & Metrics Hardening

## Completed Tasks
- **Automated Scoping**: Migrated `/api/dashboard/cc-awareness` and `/api/dashboard/collection` (POST) to `withAuth` with `requireOfficeScoping: true`. These routes now automatically intersect requested offices with authorized offices.
- **PDF Generation API**: Migrated `/api/reports/graphs` (POST) to `withAuth`. This route is now protected by session authentication.

## Verification
- Code review confirms `withAuth(..., { requireOfficeScoping: true })` is applied.
- Integration tests in Phase 3 will verify that manual office-tampering is blocked.
