---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Individual PDF & Metadata Fixes

## Objective
Correct bugs in office metadata retrieval to ensure accurate personnel signatures on individual reports, including historical and disabled offices.

## Context
- src/lib/services/officeService.ts
- src/app/api/reports/individual/route.ts
- src/lib/reports/pdfGenerator.ts

## Tasks

<task type="auto">
  <name>Fix officeService.ts Metadata Retrieval</name>
  <files>
    <file>src/lib/services/officeService.ts</file>
  </files>
  <action>
    - Update `getAllOffices` to correctly respect the `includeDisabled` flag (currently it ignores it).
    - Ensure `getOfficeAssignee` utilizes `getAllOffices(true)` to find personnel for archived/disabled offices.
    - Confirm the satellite fallback logic (e.g., PTO-Cash -> PTO) successfully resolves through parent offices even if they are marked as disabled.
  </action>
  <verify>Run a scratch script to call `getOfficeAssignee` for a disabled office and verify it returns the assigned personnel name.</verify>
  <done>officeService successfully resolves signatures for both active and historical/disabled offices.</done>
</task>

<task type="auto">
  <name>Audit & Fix Individual Report API Scoping</name>
  <files>
    <file>src/app/api/reports/individual/route.ts</file>
  </files>
  <action>
    - Review the office ID resolution logic to handle acronym vs. document ID consistently.
    - Ensure Superadmins have unrestricted access to generate individual reports for any office ID provided.
    - Verify the `assigneeName` is correctly calculated and passed to the PDF generator.
  </action>
  <verify>Call /api/reports/individual with a valid but "unassigned" office ID as Superadmin and ensure it returns a valid PDF.</verify>
  <done>Individual report API is robust against office naming variations and correctly authorized for Superadmins.</done>
</task>

## Success Criteria
- [ ] Personnel signatures render correctly for all offices in the archive.
- [ ] Archived/Disabled offices no longer return empty signature fields.
- [ ] Superadmins can generate individual reports without "Forbidden" errors for valid offices.
