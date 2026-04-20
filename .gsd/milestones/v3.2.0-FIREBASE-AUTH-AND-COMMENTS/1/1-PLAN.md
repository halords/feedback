---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Firebase Client SDK & Core Config

## Objective
Enable client-side Firebase Authentication by installing the necessary SDK and initializing the Firebase Client App.

## Context
- .gsd/SPEC.md
- src/lib/firebase/config.ts
- src/lib/firebase/admin.ts

## Tasks

<task type="auto">
  <name>Install Firebase Client SDK</name>
  <files>package.json</files>
  <action>
    Install the irebase package as a dependency.
    Action: Run 
pm install firebase@latest
  </action>
  <verify>npm list firebase</verify>
  <done>firebase package is listed in dependencies in package.json.</done>
</task>

<task type="auto">
  <name>Initialize Firebase Client SDK</name>
  <files>src/lib/firebase/client.ts</files>
  <action>
    Create a new file src/lib/firebase/client.ts.
    It should:
    1. Import getApps, getApp, initializeApp from irebase/app.
    2. Import getAuth from irebase/auth.
    3. Use the irebaseConfig from @/lib/firebase/config.
    4. Export initialized pp and uth.
    5. Follow singleton pattern: check if getApps().length > 0 before initializing.
  </action>
  <verify>Test-Path src/lib/firebase/client.ts</verify>
  <done>src/lib/firebase/client.ts exists and correctly exports auth.</done>
</task>

## Success Criteria
- [ ] irebase package installed.
- [ ] Firebase Client initialized and exported from src/lib/firebase/client.ts.
