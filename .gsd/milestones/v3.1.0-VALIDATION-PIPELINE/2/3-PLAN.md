---
phase: 2
plan: 3
wave: 2
---

# Plan 2.3: Data Migration & Apps Script

## Objective
Execute a system-wide migration to populate `officeId` fields in legacy records and finalize the naming changes in the Google Apps Script export files.

## Context
- .gsd/REVISIONv2.md (Item 5)
- scripts/Responses_Export.js
- scripts/physical_reports_export.js

## Tasks

<task type="auto">
  <name>Normalization Migration Script</name>
  <files>scripts/migrate-normalization.js (NEW)</files>
  <action>
    Create and run a migration script that:
    1. Fetches all records from `Responses` and mapping `Office` (name) to `officeId` (which is the acronym document ID).
    2. Populates a new `officeId` field in `Responses`.
    3. Repeat for `physical_report` (mapping `DEPARTMENT` to `officeId`).
    4. Repeat for `office_assignment` and `user_data`.
  </action>
  <verify>Check sample records in Firestore to verify officeId exists and matches the acronym.</verify>
  <done>All referenced documents possess an officeId field linking them to the offices collection.</done>
</task>

<task type="auto">
  <name>Update Export Apps Scripts</name>
  <files>
    scripts/Responses_Export.js
    scripts/physical_reports_export.js
  </files>
  <action>
    - In `Responses_Export.js`: Change `Office: sheet.getName()` to `officeId: sheet.getName()`.
    - In `physical_reports_export.js`: Change `DEPARTMENT` to `officeId` in the `dataObject` construction (around line 210).
    - Update comment references to reflect normalized field naming.
  </action>
  <verify>Scripts correctly map data to officeId in dry-run or sample executions.</verify>
  <done>Incoming data from Google Sheets uses normalized officeId fields.</done>
</task>

## Success Criteria
- [ ] Database is fully normalized with officeId links.
- [ ] Export scripts produce normalized records.
