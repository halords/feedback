# Security Gap Analysis & Remediation Plan (v3)
**Date:** 2026-04-20
**Target Milestone:** Security Restoration & RBAC Integrity

## 🛡️ Executive Summary
Following a comprehensive system audit, several critical security regressions were identified. While the core RBAC logic remains sound, its integration across API endpoints has been compromised or omitted. This plan outlines the necessary steps to restore authoritative backend protection.

---

## 🔍 Part 1: Identified Security Gaps

### 1. Global Middleware Bypass
- **File:** `src/middleware.ts`
- **Root Cause:** A "whitelist" approach that ignores paths starting with `/api/`.
- **Status:** **CRITICAL**
- **Symptom:** Unauthenticated users can access any `/api/` endpoint by bypassing the session cookie check.

### 2. Guard Integration Gaps
- **Affected Files:**
    - `src/app/api/comments/route.ts` (Imports but never awaits `verifySuperadmin`)
    - `src/app/api/users/assignment/route.ts` (No auth check)
    - `src/app/api/peek/route.ts` (Public exposure of data)
    - `src/app/api/reports/graphs/route.ts` (No auth check)
- **Status:** **CRITICAL**
- **Symptom:** Sensitive administrative actions and data retrieval can be performed by any authenticated (or in some cases unauthenticated) user.

### 3. Missing RBAC Scoping
- **Affected Files:**
    - `src/app/api/dashboard/cc-awareness/route.ts`
    - `src/app/api/dashboard/collection/route.ts`
- **Root Cause:** Trusting the `offices` array provided by the client without intersecting it with user permissions.
- **Status:** **HIGH**
- **Symptom:** Standard users can view data for offices they are not assigned to by tampering with the request body.

### 4. Brute-Force Vulnerability
- **Affected Files:**
    - `src/app/api/login/route.ts`
    - `src/app/api/auth/resolve-id/route.ts`
- **Status:** **MEDIUM**
- **Symptom:** Lack of rate limiting allows for automated user enumeration and login attempts.

---

## 🚀 Part 2: Remediation Implementation Plan

### Phase 1: Middleware Reform (Global Shield)
*   **Goal:** Secure the API perimeter at the Edge.
*   **Actionable:**
    - Update `middleware.ts` to include `/api` in `PROTECTED_ROUTES`.
    - Create an exception for `/api/login` and `/api/auth/resolve-id`.
    - Instantly block any non-authenticated request to an API endpoint.

### Phase 2: Endpoint Authentication (Internal Guards)
*   **Goal:** Ensure every handler knows exactly who is calling it.
*   **Actionable:**
    - Correct the "dead code" in `comments/route.ts` by adding `await verifySuperadmin()`.
    - Implement `verifySuperadmin()` in `users/assignment` and `physical-reports`.
    - Implement `verifySession()` in `peek` and `reports/graphs`.

### Phase 3: Rigid RBAC Scoping (Data Integrity)
*   **Goal:** Enforce "Need to Know" data access server-side.
*   **Actionable:**
    - Update all Dashboard and Responses APIs to call `resolveAuthorizedOffices(user, offices)`.
    - **Rule:** Never use a client-supplied office list directly in a database query.

### Phase 4: Abuse Protection (Rate Limiting)
*   **Goal:** Protect against bots and scrapers.
*   **Actionable:**
    - Apply `checkRateLimitAsync` to `login`, `comments`, and `users/assignment`.
    - Standardize on 5 attempts/15 mins for login and 60 requests/min for data retrieval.

---

## ✅ Part 3: Verification Protocol
1.  **Vitest Integration:** Add integration tests that simulate unauthenticated/unauthorized API calls and expect `401` or `403`.
2.  **System Audit:** Re-run the `SYSTEM_AUDIT.md` checklist to confirm all categories move to **PASS**.
3.  **Manual Penetration Test:** Verify that changing the `offices` array in a browser's Network tab no longer returns unauthorized data.
