---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Dual-Tier Sidebar

## Objective
Implement the "Replacements" (Active Dev) vs "Deployed" (Safety) sidebar structure. Add a collapsible section for legacy routes and implement Superadmin-only protection.

## Context
- src/components/layout/Shell.tsx
- .gsd/SPEC.md
- .gsd/DECISIONS.md

## Tasks

<task type="auto">
  <name>Implement Legacy Sidebar Section</name>
  <files>
    - src/components/layout/Shell.tsx
  </files>
  <action>
    1. Define `legacyNavItems` (Dashboard, Reports, Responses, Physical Reports) pointing to `/legacy/...`.
    2. Add a collapsible "Deployed (Safety)" header below the main navigation items.
    3. Use a state variable `isLegacyOpen` to toggle the visibility of these items.
    4. Ensure this entire section is only rendered if `user.user_type === 'superadmin'`.
  </action>
  <verify>Check sidebar in browser for the new "Deployed" section.</verify>
  <done>Sidebar has two functional categories for Superadmins.</done>
</task>

<task type="auto">
  <name>Add Safety Indicators</name>
  <files>
    - src/app/legacy/layout.tsx
    - src/components/ui/SafetyBanner.tsx
  </files>
  <action>
    1. Create a `SafetyBanner.tsx`—a subtle, orange/yellow top bar that says "SAFETY MODE (ORIGINAL LOGIC)".
    2. Create a `src/app/legacy/layout.tsx` file (Server Component).
    3. In this layout, import the `SafetyBanner` and wrap all legacy children with it.
    4. Add a middleware-level check or a simple `redirect` in this layout if the user is not a Superadmin.
  </action>
  <verify>Navigate to /legacy/dashboard and confirm the orange banner is visible.</verify>
  <done>Legacy pages are visually distinguished and protected.</done>
</task>

## Success Criteria
- [ ] Sidebar shows "Deployed" as a collapsible group for Superadmins.
- [ ] Navigation to `/legacy/dashboard` shows the original logic *and* a Safety Banner.
- [ ] Non-superadmins cannot access `/legacy` routes.
