# TODO.md

## General Checklist
- [x] **Firestore Date String Data Migration**: (COMPLETED) Verified that all historical records and imports now use `date_iso` for optimized Firestore indexing. Native Timestamp migration is deemed unnecessary as string range queries are stable and high-performance. 2026-04-20
- [x] **Logic Revisions**: Implement Archiving & Reporting logic revisions for inactive offices and PYESDO/PCDO (2025 exclusion) as specified in `REVISION.md`. `high` — 2026-04-16

## Future Debt
- [x] **Automated RBAC Testing**: (COMPLETED) Verified in `src/integration-tests/security.test.ts`. 2026-04-21
- [x] **Zod Validation Expansion**: (COMPLETED) All API entry points now validated by schemas. 2026-04-21
- [x] **Security Rule Audit**: (COMPLETED) System purely relies on Admin SDK; Firestore client access is locked down (`allow read, write: if false`). 2026-04-21
- [ ] **Dependency Vulnerability Upgrade**: Upgrade `firebase-admin` to v10.3.0+ to clear 3 low-severity transitive CVEs (requires full regression test).
- [ ] **CSP Hardening**: Implement script nonce strategy in middleware to safely remove `'unsafe-inline'` without breaking Firebase auth flows.
