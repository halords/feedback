# Milestone Audit: v3.2.0-FIREBASE-AUTH-AND-COMMENTS (Revision 2)

**Audited:** 2026-04-20
**Health:** NEEDS ATTENTION

---

## Summary
| Metric | Value |
|--------|-------|
| Phases | 4 |
| Gap closures | 3 (Metadata Resolution, Password Logic, Validation) |
| Residual Security Gaps | 6 API Routes (Auth/RBAC bypass) |
| Technical debt items | 4 (Rate Limiting, Scoping, Dead Code) |

---

## Must-Haves Status
| Requirement | Verified | Evidence | Status |
|-------------|:---:|----------|--------|
| Install and initialize Firebase Client SDK | ✅ | src/lib/firebase/client.ts | PASS |
| Migrate Auth Context to handle Firebase Auth state | ✅ | src/context/AuthContext.tsx | PASS |
| Update Login flow to use Firebase Authentication | ✅ | src/app/login/page.tsx | PASS |
| Replace custom JWT session with Firebase ID Token verification | ✅ | src/lib/auth/verifySession.ts | PASS |
| Maintain RBAC mapping for Superadmin and Analytics users | ❌ | middleware.ts & API Routes | **FAIL** (Bypass Found) |
| Update 'Add User' functionality to sync with Firebase Auth | ✅ | src/lib/services/userService.ts | PASS |
| Add 'Comments Management' sidebar item | ✅ | src/components/layout/Shell.tsx | PASS |
| Scaffold placeholder page for Comments Management | ✅ | src/app/comments/page.tsx | PASS |

---

## Concerns
- **Critical Middleware Bypass**: The `middleware.ts` logic allows all `/api` routes to bypass session checks because they are not in the `PROTECTED_ROUTES` whitelist.
- **Unprotected Management APIs**: `/api/users/assignment` and `/api/comments` have no internal verification guards, allowing unauthorized privilege escalation and data access.
- **RBAC Scoping Regression**: Dashboard and Metrics APIs trust client-supplied office arrays without server-side intersection or verification.
- **Dead Security Code**: `src/app/api/comments/route.ts` imports security guards but fails to await/execute them.

---

## Recommendations
1. **Immediate Remediation**: Patch `middleware.ts` to include `/api` within the protected perimeter (Phase 1 of Remediation Plan v3).
2. **Authoritative Scoping**: Implement mandatory `resolveAuthorizedOffices` intersection in all data-fetching handlers.
3. **Internal Guards**: Consistently apply `await verifySession()`/`await verifySuperadmin()` in all API handlers under `src/app/api`.

---

## Technical Debt to Address
- [ ] Implement rate limiting on `/api/login` and `/api/auth/resolve-id`.
- [ ] Standardize backend error responses for 401/403 states across all API routes.
- [ ] Migrate `Responses.date_iso` to native Firestore Timestamps for improved query performance.
- [ ] Remove `passthrough()` from sensitive Zod schemas in `apiSchemas.ts` where strict validation is viable.
