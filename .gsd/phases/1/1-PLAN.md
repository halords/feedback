---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Project Reset & Next.js Initialization

## Objective
Establish the new Next.js foundation by archiving the legacy codebase and initializing a modern, modular project structure with Tailwind CSS configured for the target "Indigo Slate" theme.

## Context
- .gsd/SPEC.md
- .gsd/STACK.md
- UI_reference/indigo_slate_pro (for primary colors)

## Tasks

<task type="auto">
  <name>Archive Legacy Codebase</name>
  <files>legacy/</files>
  <action>
    Create a `legacy/` directory and move the following items into it to clear the root for Next.js:
    - `public/`
    - `functions/`
    - `firebase.json`
    - `firebaserc`
    - `firestore.rules` / `firestore.indexes.json`
    - `package.json` / `package-lock.json`
    - `PROJECT_RULES.md` / `GSD-STYLE.md` (keep .gsd/ in root)
  </action>
  <verify>Test-Path "legacy/functions/index.js"</verify>
  <done>Root directory is clean of legacy application files except for `.gsd` and `.git`.</done>
</task>

<task type="auto">
  <name>Initialize Next.js App</name>
  <files>package.json, tailwind.config.ts, src/app/layout.tsx</files>
  <action>
    Run `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --use-npm --src-dir` in the root.
    Note: Overwrite any existing files (like .gitignore) if prompted.
    Install additional dependencies: `npm install bcryptjs pdf-lib lucide-react clsx tailwind-merge swr`.
  </action>
  <verify>npm list next</verify>
  <done>Next.js project is initialized with TypeScript and Tailwind.</done>
</task>

<task type="auto">
  <name>Configure Global Theme</name>
  <files>tailwind.config.ts, src/app/globals.css</files>
  <action>
    Update `tailwind.config.ts` to include the "Indigo" primary color palette (e.g., #4f46e5) as seen in `UI_reference`.
    Set up the default font (Inter or similar) in `globals.css` and `src/app/layout.tsx`.
    Remove default "Vercel" boilerplate styles from `globals.css`.
  </action>
  <verify>Get-Content "tailwind.config.ts" | Select-String "theme"</verify>
  <done>Tailwind is configured with project-specific theme colors.</done>
</task>

## Success Criteria
- [ ] Legacy code is safely archived in `/legacy`.
- [ ] Next.js dev server starts without errors.
- [ ] Tailwind CSS is active and themed.
