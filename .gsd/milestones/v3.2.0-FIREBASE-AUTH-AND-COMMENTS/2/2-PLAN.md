---
phase: 2
plan: 2
wave: 2
---

# Plan 2.2: Client-Side Auth Refactor

## Objective
Update the Login UI to use the Firebase Client SDK with the verified identifier format.

## Context
- src/app/login/page.tsx
- src/context/AuthContext.tsx

## Tasks

<task type="auto">
  <name>Update Login Page logic</name>
  <files>src/app/login/page.tsx</files>
  <action>
    - Update handleSubmit to use signInWithEmailAndPassword from @/lib/firebase/client.
    - Mapping Requirement: Construct the auth identifier by appending @feedback.internal to the entered username (e.g. username@feedback.internal).
    - Exchange the resulting idToken with /api/login.
  </action>
  <verify>Ensure the login flow correctly appends @feedback.internal to the username.</verify>
  <done>Users can log in using their Username via Firebase Auth.</done>
</task>

<task type="auto">
  <name>Sync Auth Context</name>
  <files>src/context/AuthContext.tsx</files>
  <action>
    - Ensure AuthContext correctly handles the session state after the new Firebase login flow.
  </action>
  <verify>Check that user profile is correctly populated after login.</verify>
  <done>Application state remains consistent after Firebase migration.</done>
</task>

## Success Criteria
- [ ] Login experience remains "Username" based for the user.
- [ ] Login successfully identifies users via @feedback.internal format.
