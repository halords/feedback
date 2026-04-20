---
phase: 8
plan: 1
wave: 1
gap_closure: true
---

# Plan 8.1: Hardening & Refactor

## Objective
Address the remaining technical debt from the Security Hardening milestone to ensure long-term stability and high-grade security.

## Tasks

<task type="auto">
  <name>Rate Limit Sensitive Endpoints</name>
  <files>
    src/app/api/auth/change-password/route.ts
    src/app/api/responses/classify/route.ts
  </files>
  <action>
    Integrate `checkRateLimitAsync` into:
    1. `change-password`: 2 attempts per 15 minutes.
    2. `classify`: 10 attempts per minute.
  </action>
  <verify>Manual check: attempt limit returns 429 for both</verify>
  <done>Sensitive writing endpoints are protected against brute-force/abuse</done>
</task>

<task type="auto">
  <name>Implement HSTS</name>
  <files>next.config.ts</files>
  <action>
    Add `Strict-Transport-Security` to the `securityHeaders` array in `next.config.ts`.
    Include `max-age=31536000; includeSubDomains; preload`.
  </action>
  <verify>Check network headers in browser</verify>
  <done>HSTS is active for all responses</done>
</task>

<task type="auto">
  <name>Zod Migration</name>
  <files>
    src/lib/validation/apiSchemas.ts
    package.json
  </files>
  <action>
    1. Install `zod` via npm.
    2. Refactor `apiSchemas.ts` to use Zod schemas instead of manual if/else checks.
    3. Maintain identical validation rules to ensure no regression.
  </action>
  <verify>Verify API endpoints (Responses, Dashboard, Physical Reports) still validate correctly</verify>
  <done>Validation is more robust and declarative</done>
</task>

<task type="auto">
  <name>Redundant File Cleanup</name>
  <files>src/app/api/generate-pdf/</files>
  <action>Remove the empty `generate-pdf` directory.</action>
  <verify>Directory is gone</verify>
  <done>Cleaner codebase structure</done>
</task>
