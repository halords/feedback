---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Defense-in-Depth Verification & Architecture Constraint

## Objective
Finalize the milestone by formally locking down the architectural paradigm. In this atomic plan, we confirm that `firestore.rules` is securely restricting all direct client communication, officially enforcing the Next.js API Routes layer as our sole arbiter of logic and data. 

## Context
- `.gsd/ROADMAP.md`
- `.gsd/ARCHITECTURE.md`
- `firebase.json`
- `firestore.rules`

## Tasks

<task type="auto">
  <name>Verify Routing and Rules</name>
  <files>
    firebase.json
    firestore.rules
  </files>
  <action>
    Since we just observed both of these files manually during planning, we know that `firestore.rules` correctly specifies `allow read, write: if false;` and `firebase.json` properly roots `firestore.rules`.
    Simply verify the presence of the `allow ... false;` firewall inside the rules to formally conclude the audit step.
  </action>
  <verify>Ensure `firestore.rules` explicitly contains `allow read, write: if false;` as a baseline check.</verify>
  <done>Confirmation that the firebase routing perfectly blocks direct Web API traffic</done>
</task>

<task type="auto">
  <name>Architectural Lockdown Documentation</name>
  <files>.gsd/ARCHITECTURE.md</files>
  <action>
    Append a new section to `.gsd/ARCHITECTURE.md` named `## Defense-In-Depth (Security)` or `## Backend-Only Data Constraint`. 
    Explicitly document this decision:
    - **Firestore Rules**: Locked to `allow read, write: if false;`.
    - **Reasoning**: All database traffic must be routed entirely through Next.js `/api` endpoints so we can utilize strict Zod validation schemas, robust session verification (JWT), and the Firebase Admin SDK.
    - **Warning**: Future developers must NEVER attempt to open direct client-side listeners utilizing `onSnapshot` from the browser without entirely rethinking the RBAC matrix from scratch.
  </action>
  <verify>Check `.gsd/ARCHITECTURE.md` to ensure the warning block is clearly visible</verify>
  <done>The architecture rules explicitly warn devs against unlocking firestore to the client</done>
</task>

## Success Criteria
- [ ] `firestore.rules` verified as impregnable to unauthorized frontend sniffing.
- [ ] Architecture document formally enshrines the strictly gated Next.js backend mechanism.
