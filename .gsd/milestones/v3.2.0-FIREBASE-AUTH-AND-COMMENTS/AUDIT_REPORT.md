# Milestone Audit: v3.2.0-FIREBASE-AUTH-AND-COMMENTS

**Audited:** 2026-04-20

## Summary
| Metric | Value |
|--------|-------|
| Phases | 4 |
| Gap closures | 3 (Metadata Resolution, Password Logic, Validation) |
| Technical debt items | 0 |

## Must-Haves Status
| Requirement | Verified | Evidence |
|-------------|----------|----------|
| Install and initialize Firebase Client SDK | ? | src/lib/firebase/client.ts |
| Migrate Auth Context to handle Firebase Auth state | ? | src/context/AuthContext.tsx |
| Update Login flow to use Firebase Authentication | ? | src/app/login/page.tsx |
| Replace custom JWT session with Firebase ID Token verification | ? | src/lib/auth/verifySession.ts |
| Maintain RBAC mapping for Superadmin and Analytics users | ? | middleware.ts & Custom Claims |
| Update 'Add User' functionality to sync with Firebase Authentication | ? | src/lib/services/userService.ts |
| Add 'Comments Management' sidebar item with conditional visibility | ? | src/components/layout/Shell.tsx |
| Scaffold placeholder page for Comments Management | ? | src/app/comments/page.tsx |

## Concerns
- **Case Sensitivity**: User types were inconsistent between Firestore and Zod schemas (fixed, but requires vigilance).
- **Session Latency**: Custom claims set during the /api/login POST are not reflected in the *immediate* session cookie creation due to Firebase SDK behavior. Resolved via the new **Firestore Metadata Fallback** logic in erifySession.ts.

## Recommendations
1. Ensure all future user-related features use the getSessionUser() utility to benefit from the established profile resolution logic.
2. Monitor Firebase Auth logs for any failed login attempts related to the username-to-idno mapping.

## Technical Debt to Address
- None currently prioritized.
