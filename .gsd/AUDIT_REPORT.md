# SYSTEM AUDIT REPORT - PGLU Feedback v2
Date: 2026-04-20
Status: **FAIL** (Security Critical)

---

## 1. SECURITY

### 1.1 Unintended Access
- **status**: FAIL
- **issues**: 
    - **Endpoint Exposure**: Multiple API routes are completely unprotected and accessible without a session token or authorization.
    - **Critical Vulnerability**: `/api/users/assignment` (POST) allows anyone to modify any user's office assignments.
    - **Data Leakage**: `/api/peek`, `/api/dashboard/cc-awareness`, `/api/dashboard/collection`, and `/api/comments` (GET) are accessible to unauthenticated users.
    - **Action Exposure**: `/api/comments` (POST) allows unauthenticated users to trigger comment synchronization.
- **risk_level**: CRITICAL
- **recommendations**: 
    - Implement `verifySession()` in EVERY API route under `src/app/api`.
    - Implement `verifySuperadmin()` for management routes (users, offices, assignments).
    - Update `middleware.ts` to include `/api/` prefix in `PROTECTED_ROUTES` or implement a global API protection strategy.

### 1.2 API Protection
- **status**: FAIL
- **issues**: 
    - **Missing Rate Limiting**: Sensitive routes like `/api/login`, `/api/comments`, and most dashboard APIs lack rate limiting, making them vulnerable to brute-force and DoS.
    - **Loose Validation**: `/api/reports/graphs` processes large base64 strings without size limits or auth.
- **risk_level**: HIGH
- **recommendations**: 
    - Apply `checkRateLimitAsync` to all POST/PATCH/PUT routes.
    - Specifically rate-limit `/api/login` and `/api/auth/resolve-id`.

### 1.3 Injection Attacks
- **status**: PASS
- **issues**: 
    - No direct SQL/NoSQL injection vulnerabilities found due to the use of Firestore SDK and Zod validation.
    - Loose validation in some areas (e.g., `passthrough()` in physical reports) could allow junk data but not code injection.
- **risk_level**: LOW
- **recommendations**: Tighten Zod schemas to remove `.passthrough()` where not strictly required.

### 1.4 DDoS & Abuse Protection
- **status**: WARNING
- **issues**: 
    - Lack of systemic rate limiting (as noted in 1.2).
    - Base64 image processing in `/api/reports/graphs` could be abused to consume server CPU.
- **risk_level**: MEDIUM
- **recommendations**: Implement global rate limiting at the middleware or infrastructure level.

### 1.5 General Vulnerabilities
- **status**: PASS
- **issues**: 
    - No `dangerouslySetInnerHTML` or `eval` usage detected.
    - Use of `jose` for JWT decoding is safe, but middleware lacks signature verification (compensated by full verification in APIs).
- **risk_level**: LOW
- **recommendations**: Ensure `CSP` headers are configured in `next.config.ts`.

---

## 2. PERFORMANCE & OPTIMIZATION

### 2.1 Page Performance
- **status**: PASS
- **issues**: 
    - Good use of `useSWR` for client-side caching.
    - Dashboard and Responses pages handle large datasets with loaders.
- **risk_level**: LOW
- **recommendations**: Implement `Suspense` for better progressive loading.

### 2.2 Database Performance
- **status**: PASS
- **issues**: 
    - **Excellent Archive System**: Use of JSON archives for historical data (metrics/responses) reduces Firestore reads to zero for archived months.
    - **Targeted Queries**: Firestore queries use `date_iso` range filters instead of full collection scans.
- **risk_level**: LOW
- **recommendations**: None.

### 2.3 System Speed
- **status**: PASS
- **issues**: 
    - API latency is minimized through archives.
- **risk_level**: LOW
- **recommendations**: None.

### 2.4 Client vs Server Load Balance
- **status**: PASS
- **issues**: 
    - Heavy aggregation logic is performed on the server (service layer).
    - Filtering/Searching is performed on the client for responsiveness.
- **risk_level**: LOW
- **recommendations**: Ensure client doesn't freeze when searching >1000 items in `ResponsesClient`.

### 2.5 Rendering & Page Load Justification
- **status**: PASS
- **issues**: 
    - No redundant API calls detected.
    - App Router usage is efficient.
- **risk_level**: LOW
- **recommendations**: None.

---

## 3. USER INTERFACE

- **status**: PASS
- **issues**: 
    - Clean, modern, and high-contrast design.
    - Multi-theme support (Dark/Light/Red/Standard).
    - Intuitive navigation with sidebar and "Console" nesting.
- **risk_level**: LOW
- **recommendations**: Add tooltips for collapsed sidebar (already implemented but ensure consistency).

---

## 4. ROLE-BASED ACCESS CONTROL (RBAC)

### 4.1 Role Separation
- **status**: FAIL
- **issues**: 
    - Backend enforcement is inconsistent (see Security 1.1).
    - `/api/users/assignment` bypasses role checks entirely.
- **risk_level**: CRITICAL
- **recommendations**: Consistently use `verifySuperadmin()` across all management endpoints.

### 4.2 Data Access Enforcement
- **status**: FAIL
- **issues**: 
    - Systemic failure: While `resolveAuthorizedOffices` exists and is robust, it is NOT used in several dashboard and comment APIs, allowing cross-office data exposure.
- **risk_level**: CRITICAL
- **recommendations**: Mandatory application of `resolveAuthorizedOffices(user, offices)` in all data-fetching APIs.

### 4.3 Non-Superadmin Data Loading
- **status**: WARNING
- **issues**: 
    - Some data loaded in `/api/responses` for non-superadmins is masked (`classification: "Restricted"`), but the records themselves are still returned. This is "Data loaded but not shown" which is flagged as a failure in instructions.
- **risk_level**: MEDIUM
- **recommendations**: Explicitly filter out unauthorized records at the database level using `resolveAuthorizedOffices` instead of masking in post-processing.

---

## 5. DATA ACCESS VALIDATION

- **status**: FAIL
- **issues**: 
    - Several API routes take `offices` array directly from request without validating if the user has access to those offices (specifically in Dashboard and Comments APIs).
- **risk_level**: HIGH
- **recommendations**: Every API taking an `offices` parameter MUST pipe it through the RBAC resolver.

---

## 6. SCALABILITY & USER HANDLING

- **status**: PASS
- **issues**: 
    - Archive system effectively handles concurrency for historical data.
    - Firestore `in` queries are chunked correctly (size 30).
- **risk_level**: LOW
- **recommendations**: Monitor Firestore read usage if archives are frequently "missed".

---

## FINAL SUMMARY
The system has a high-quality UI and an impressive performance optimization layer (Archives). However, it suffers from **severe security regressions** where multiple API routes were implemented without authentication or RBAC scoping. These must be addressed immediately to prevent unauthorized data access and privilege escalation.
