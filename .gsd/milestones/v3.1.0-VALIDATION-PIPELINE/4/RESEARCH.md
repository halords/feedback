# Phase 4 Research: Protected Overrides

## Objective
Implement a "Hardware Override" mechanism to allow Superadmins to edit data for archived months, protected by a secondary password challenge.

## Proposed Strategy

### 1. Step-up Authentication
When the user clicks "Edit" on an archived month (which is currently disabled/read-only), we will prompt for an "Archive Protection Password".

### 2. Implementation logic
- **Password Storage**: For simplicity and statelessness, we can use an environment variable `ARCHIVE_OVERRIDE_PASSWORD`.
- **Session State**: Once the correct password is entered, we can set a session-specific flag `isOverrideActive` (stored in the browser window state or a temporary cookie) that unlocks the "Save" buttons across the application until the next refresh.
- **Frontend Challenge**: A reusable `PasswordChallengeModal` component.

### 3. Impact on Guardrails
- **Physical Reports**: If `isOverrideActive`, the "Add/Edit" buttons become enabled even if `isArchived` is true.
- **Saving Measures**: A reminder to "Re-Archive" the month after making manual Firestore edits to ensure the JSON snapshot stays in sync.

## Target Areas
- `Shell.tsx`: Global status indicator for Override Mode.
- `PhysicalReportsEditor.tsx`: Unlock buttons.
- `SavingMeasuresClient.tsx`: Context/Hints for re-archiving after overrides.

## Questions for User
- Should the password be a single global secret or different per user? (Assuming Global for now as per SPEC).
- Default suggested password for development? (I'll use `ADMIN-GS-2024` or similar unless changed).
