# Phase 1 Research: Foundation & Auth

## Next.js Initialization
To ensure a modular and future-proof refactor, we will initialize Next.js in the project root after archiving legacy code.
- **Command**: `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --use-npm --src-dir`
- **Rationale**: Next.js App Router provides the best balance for vertical slice refactoring (handling both API routes and UI).

## Caching & Optimization
To minimize Firestore reads (SPEC goal):
- **Choice**: **SWR** (Stale-While-Revalidate).
- **Reasoning**: It is lightweight, officially supported by Vercel, and handles the "read-saving" requirement out of the box by serving stale data while fetching updates in the background.
- **Implementation**: We will create a `useAuth` and `useDashboard` hook using SWR to share data across tabs without re-fetching.

## Authentication Migration
- **Pattern**: Custom Route Handler in Next.js (`/api/login`) that performs the `bcryptjs` check against Firestore.
- **Session**: Using a shared `AuthContext` to avoid Prop Drilling and simplify UI state.

## Legacy Archive
- **Method**: Move `public/`, `functions/`, `firebase.json`, etc., to a `/legacy` folder.
- **Benefit**: Keeps reference code accessible while allowing the Next.js setup to take over the root filesystem and `package.json`.
