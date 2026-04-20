---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Sidebar & Navigation Update

## Objective
Add the 'Comments Management' item to the sidebar with visibility logic for Superadmins and Analytics-enabled users.

## Context
- src/components/layout/Shell.tsx
- .gsd/ROADMAP.md

## Tasks

<task type="auto">
  <name>Update Navigation Definitions</name>
  <files>src/components/layout/Shell.tsx</files>
  <action>
    - Add MessageSquare to mainNav.
    - Set the href to /comments.
  </action>
  <verify>Check that 'Comments Management' appears in the mainNav array code.</verify>
  <done>Navigation definitions include Comments Management.</done>
</task>

<task type="auto">
  <name>Implement Visibility Logic</name>
  <files>src/components/layout/Shell.tsx</files>
  <action>
    - Update the side nav rendering to filter mainNav and dminNav based on the user object.
    - Specifically: 'Comments Management' should only show if user.user_type === 'superadmin' OR user.is_analytics_enabled === true.
  </action>
  <verify>Login as a standard user and ensure the menu is NOT visible.</verify>
  <done>Comments Management visibility is restricted to authorized roles.</done>
</task>

## Success Criteria
- [ ] 'Comments Management' appears in the sidebar for Superadmins.
- [ ] 'Comments Management' appears in the sidebar for users with analytics enabled.
- [ ] Standard users cannot see the new menu item.
