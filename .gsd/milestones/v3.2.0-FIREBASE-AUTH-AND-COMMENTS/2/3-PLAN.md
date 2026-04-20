---
phase: 2
plan: 3
wave: 3
---

# Plan 2.3: User Management Update

## Objective
Sync the 'Add User' functionality with Firebase Authentication using the @feedback.internal email template.

## Context
- src/lib/services/userService.ts
- src/app/api/users/route.ts

## Tasks

<task type="auto">
  <name>Update addUser with Firebase Auth sync</name>
  <files>src/lib/services/userService.ts</files>
  <action>
    - Update ddUser to call dmin.auth().createUser.
    - Use ${userData.idno}@feedback.internal as the email identifier.
    - Set the uid if possible to match userData.idno (as requested "userid should still be the same") or store the generated UID in Firestore.
    - Store the results in Firestore users collection as before.
  </action>
  <verify>Check that both Firestore and Auth accounts are created with correct identifiers.</verify>
  <done>New users are created in both Firestore and Firebase Auth with @feedback.internal emails.</done>
</task>

<task type="auto">
  <name>Update Password Change sync</name>
  <files>src/app/api/auth/change-password/route.ts</files>
  <action>
    - Update the password change route to also update the password in Firebase Auth using dmin.auth().updateUser.
  </action>
  <verify>Verify that password updates sync from Firestore to Firebase Auth.</verify>
  <done>Password changes are reflected in Firebase Authentication.</done>
</task>

## Success Criteria
- [ ] Superadmin can add users who exist in both systems with correct identifiers.
