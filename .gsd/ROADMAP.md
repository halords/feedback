# ROADMAP.md

> **Current Milestone**: Reports
> **Goal**: Fix Reports page, Data View tab filtering especially on superadmin and individual pdf generation.

## Must-Haves
- [x] Fix Superadmin Data View filtering (default to All Offices)
- [ ] Implement Dynamic Personnel Filtering based on Archive content
- [ ] Fix "Personnel in-charge" metadata retrieval for individual PDFs
- [ ] Implement robust office scoping for report generation
- [ ] Standardized loading and error states for the Reports page

## Phases

### Phase 1: Superadmin Data View Filtering
**Status**: ✅ Complete
**Objective**: Audit and fix filtering logic in the Data View tab to ensure Superadmins can correctly view and filter data across all offices.

### Phase 2: Personnel-Centric Filtering (Archive-based)
**Status**: ⬜ Not Started
**Objective**: Dynamically derive the personnel filter list from the actual JSON archive content for the selected period.

### Phase 3: Individual PDF Generation & Metadata
**Status**: ⬜ Not Started
**Objective**: Fix individual report generation logic, ensuring "Personnel in-charge" names are correctly retrieved and rendered in PDF signatures.

### Phase 4: Integration & Cross-Role Verification
**Status**: ⬜ Not Started
**Objective**: Verify reporting features work across all roles (Superadmin vs. Office Admin) for both live and archived data.

### Phase 5: Final UI/UX Polish & Audit
**Status**: ⬜ Not Started
**Objective**: Standardize Reports page UI and perform a final data integrity audit on generated outputs.
