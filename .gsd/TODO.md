# TODO.md

## General Checklist
- [x] **Firestore Date String Data Migration**: (COMPLETED) Verified that all historical records and imports now use `date_iso` for optimized Firestore indexing. Native Timestamp migration is deemed unnecessary as string range queries are stable and high-performance. 2026-04-20
- [x] **Logic Revisions**: Implement Archiving & Reporting logic revisions for inactive offices and PYESDO/PCDO (2025 exclusion) as specified in `REVISION.md`. `high` — 2026-04-16

## Future Debt
- [ ] **Automated RBAC Testing**: Implement a test suite that simulates different roles to verify scoping doesn't regress.
- [ ] **Zod Validation Expansion**: Ensure all remaining API endpoints (outside core data) use Zod for validation.
- [ ] **Security Rule Audit**: Dedicated verification of Firestore Security Rules to match code-level RBAC.
