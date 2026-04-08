---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Core Modular Infrastructure

## Objective
Establish the shared services and state management required for a modular application, focusing on Firebase SDK integration and reusable UI components.

## Context
- .gsd/SPEC.md
- legacy/functions/auth/serviceAccount.json (for admin sdk)
- UI_reference/login_screen/code.html

## Tasks

<task type="auto">
  <name>Initialize Firebase Service Layer</name>
  <files>src/lib/firebase/config.ts, src/lib/firebase/admin.ts</files>
  <action>
    - Create a client-side Firebase config in `src/lib/firebase/config.ts` (using client keys).
    - Create a server-side Firebase Admin SDK init in `src/lib/firebase/admin.ts` using the service account from `legacy/`.
    - Ensure these are exported as singleton instances.
  </action>
  <verify>Test-Path "src/lib/firebase/admin.ts"</verify>
  <done>Firebase Admin and Client SDKs are initialized for use in Next.js.</done>
</task>

<task type="auto">
  <name>Implement AuthContext & Hooks</name>
  <files>src/context/AuthContext.tsx, src/hooks/useAuth.ts</files>
  <action>
    - Create `AuthContext` to manage the logged-in user state.
    - Implement `useAuth` hook using `SWR` to persist and synchronize user state from `localStorage` into the React tree.
    - Provide a `login` and `logout` function that interacts with the context.
  </action>
  <verify>Get-Content "src/context/AuthContext.tsx" | Select-String "createContext"</verify>
  <done>Global Auth state is available to all components.</done>
</task>

<task type="auto">
  <name>Build Reusable Base UI Components</name>
  <files>src/components/ui/Button.tsx, src/components/ui/Input.tsx, src/components/ui/Card.tsx</files>
  <action>
    - Extract UI patterns from `UI_reference/login_screen/code.html`.
    - Build atomic React components (`Button`, `Input`, `Card`) using Tailwind and `clsx`/`tailwind-merge` for flexible styling.
    - Ensure they match the Indigo theme colors.
  </action>
  <verify>Test-Path "src/components/ui/Button.tsx"</verify>
  <done>Core UI package is ready for page construction.</done>
</task>

## Success Criteria
- [ ] Firebase SDK is accessible from both server and client.
- [ ] `AuthContext` successfully reads/writes to LocalStorage via React.
- [ ] UI components render correctly with target Indigo styling.
