# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Transform the existing feedbackV2 system into a high-performance, cost-efficient, and responsive React application (Feedback V3) that adheres to minimal Material Design principles and optimizes Firebase quota usage for scale (10k+ responses/mo).

## Goals
1. **React Migration:** Rewrite the entire frontend using Vite + React + Tailwind CSS.
2. **Cost Optimization:** Reduce Firestore read counts by fixing N+1 query patterns and implementing client-side caching.
3. **Responsive Design:** Implement a mobile-first, minimal Material Design UI that works seamlessly on PC, Tablet, and Mobile.
4. **Security Hardening:** Move sensitive service account credentials to Firebase secrets and enforce Role-Based Access Control (RBAC).
5. **Performance:** Achieve faster page loads (LCP < 2.5s) and smooth transitions.

## Non-Goals (Out of Scope)
- Adding new feature modules (e.g., AI sentiment analysis) not present in V2.
- Changing the primary database (Firestore).
- Modifying the existing feedback submission mechanism (unless requested later).

## Users
- **Superadmin:** Full access to reports, user management, and office assignments.
- **Office Admin / Staff:** Access to dashboards and responses for their assigned offices only.

## Constraints
- **Data Continuity:** Must use the existing Firestore database and structure.
- **Budget:** Must minimize operational costs by reducing Firebase reads/writes.
- **Timeline:** Rapid migration as requested.

## Success Criteria
- [ ] 0 manual DOM manipulation in the frontend code.
- [ ] Firestore read count for the user list reduced by >75% (O(1) instead of O(N)).
- [ ] Responsive UI validated on 3 breakpoints (Mobile, Tablet, Desktop).
- [ ] No exposed `serviceAccount.json` in the source repository.
