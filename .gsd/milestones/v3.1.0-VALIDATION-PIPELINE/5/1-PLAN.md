---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Scalable Rate Limiting via Firestore

## Objective
Migrate the in-memory rate limiter to a shared-state Firestore implementation. This ensures rate limits are enforced reliably across distributed serverless environments protecting heavy API endpoints.

## Context
- src/lib/security/rateLimit.ts (Rate logic)
- src/app/api/login/route.ts (Existing usage)
- src/app/api/responses/route.ts (New targets)
- src/app/api/dashboard/route.ts (New targets)

## Tasks

<task type="auto">
  <name>Implement Firestore-backed Rate Limiter</name>
  <files>
    src/lib/security/rateLimit.ts
  </files>
  <action>
    - Refactor 'rateLimit.ts' to export an asynchronous function: 'checkRateLimitAsync(ip, action, limit, windowMs)'.
    - Use 'db.collection("_system_rate_limits").doc(`${action}_${ip}`)' from '@/lib/firebase/admin' to track hit counts and reset timestamps.
    - If document does not exist or 'now > resetAt', set count to 1. Otherwise increment count.
    - Return an object matching the RateLimitResult shape (success, limit, remaining, reset).
  </action>
  <verify>Check that 'checkRateLimitAsync' handles Firestore reads/writes safely and returns a valid RateLimitResult.</verify>
  <done>Rate limiting logic is now stateful and backed by Firestore.</done>
</task>

<task type="auto">
  <name>Migrate Login to Stateful Limiter</name>
  <files>
    src/app/api/login/route.ts
  </files>
  <action>
    - Update the POST route in 'login/route.ts' to await 'checkRateLimitAsync(ip, "login", 5, 15 * 60 * 1000)'.
    - Ensure 'Retry-After' and 'X-RateLimit-*' headers are correctly calculated and sent when rate-limited.
  </action>
  <verify>Confirm 'login/route.ts' awaits the async limiter and passes 'ip' and 'action' string.</verify>
  <done>Login route uses distributed rate limiting.</done>
</task>

<task type="auto">
  <name>Expand Rate Limiting to Data APIs</name>
  <files>
    src/app/api/responses/route.ts
    src/app/api/dashboard/route.ts
  </files>
  <action>
    - Import and implement 'checkRateLimitAsync' in both route files at the top of the GET/POST handlers (after standard auth if applicable).
    - Rate limit params: limit = 60, windowMs = 60000 (60 per minute), action = "api_data".
    - On fail, return '429 Too Many Requests' with 'X-RateLimit-*' headers.
  </action>
  <verify>Review the routes to ensure 'checkRateLimitAsync' intercepts the request before heavy processing.</verify>
  <done>Heavy data read endpoints are protected from spam/abuse.</done>
</task>

## Success Criteria
- [ ] 'src/lib/security/rateLimit.ts' uses Firestore for state.
- [ ] Limit checks securely return 429 status codes with header payloads.
- [ ] Login, Responses, and Dashboard APIs are reliably protected.
