---
phase: 1
plan: 3
wave: 1
---

# Plan 1.3: Vertical Slice: Login Page

## Objective
Complete the first vertical slice by implementing the Login API and connecting it to a fully themed React Login Page.

## Context
- system_map.json (for login logic)
- UI_reference/login_screen/ (screen.png and code.html)
- legacy/functions/auth/call.js (for bcrypt implementation)

## Tasks

<task type="auto">
  <name>Implement Login API Route</name>
  <files>src/app/api/login/route.ts</files>
  <action>
    - Create a POST handler at `/api/login`.
    - Port logic from `legacy/functions/auth/call.js:loginUser`.
    - Retrieve user from `users` collection, verify with `bcryptjs`, and fetch related `office_assignment` and `user_data` info.
    - Return the exact same JSON schema defined in `system_map.json`.
  </action>
  <verify>Invoke-WebRequest -Method Post -Uri "http://localhost:3000/api/login" -Body '{}' -ContentType "application/json" -ErrorAction SilentlyContinue</verify>
  <done>Login API is functional and parity-matched.</done>
</task>

<task type="auto">
  <name>Build Login Page Frontend</name>
  <files>src/app/login/page.tsx</files>
  <action>
    - Build the Login UI using the components from Plan 1.2.
    - STRICTLY match the layout in `UI_reference/login_screen/screen.png`.
    - Connect the form to the `AuthContext` login method.
    - Implement error handling (e.g., "Incorrect password") matching original features.
  </action>
  <verify>Test-Path "src/app/login/page.tsx"</verify>
  <done>Login page is visually and functionally complete.</done>
</task>

<task type="checkpoint:human-verify">
  <name>End-to-End Login Verification</name>
  <files>src/app/login/page.tsx</files>
  <action>
    1. Start the dev server.
    2. Navigate to /login.
    3. Login with test credentials.
    4. Verify successful redirect and existence of `loggedInUser` in localStorage.
  </action>
  <verify>User manual confirmation</verify>
  <done>Phase 1 vertical slice is validated by the user.</done>
</task>

## Success Criteria
- [ ] /api/login performs real Firestore validation.
- [ ] UI is 1:1 match with `UI_reference`.
- [ ] Successful login populates state and redirects.
