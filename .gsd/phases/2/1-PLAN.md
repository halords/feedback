---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Auth Hardening

## Objective
Layer `checkRateLimitAsync` onto the login API to prevent brute-force abuse over and above Firebase Authentication's internal protections. Additionally, enforce immediate mid-session access revocation when user roles or scopes are modified.

## Context
- `.gsd/ROADMAP.md` (Phase 2)
- `src/app/api/login/route.ts`
- `src/lib/services/userService.ts`

## Tasks

<task type="auto">
  <name>Rate Limit Login</name>
  <files>src/app/api/login/route.ts</files>
  <action>
    - Import `checkRateLimitAsync` from `src/lib/auth/rbac.ts`.
    - At the start of the `POST` route, extract the client IP: `request.headers.get("x-forwarded-for") || "unknown-ip"`.
    - Run `await checkRateLimitAsync("login_attempts", ip, 10, 5 * 60 * 1000);` (10 requests per 5 minutes).
    - If it throws an Error (`Too Many Requests`), catch it and return `NextResponse.json({ error: "Too Many Requests" }, { status: 429 })`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Login route protects against rapid abuse before hitting Firebase ID verification.</done>
</task>

<task type="auto">
  <name>Revoke Firebase Tokens on Role Update</name>
  <files>src/lib/services/userService.ts</files>
  <action>
    - In `updateAssignments()` and `updateUserAnalyticsFlag()`, just prior to returning success, invoke `await auth.revokeRefreshTokens(idno)`.
    - Wrap the revocation in a `try/catch` block that logs a warning if the user doesn't exist in auth (so that it doesn't hard-fail the Firestore assignment update if a user hasn't completed their first login yet).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Tokens are forcefully revoked when access claims are updated, preventing stale authorized sessions.</done>
</task>

## Success Criteria
- [ ] Login endpoint imposes 429 after 10 attempts in 5 minutes.
- [ ] Mid-session assignment changes force immediate re-authentication.
