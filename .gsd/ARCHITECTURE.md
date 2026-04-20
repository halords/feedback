# ARCHITECTURE.md

## Authentication & Identity
The system has migrated to **Firebase Authentication** as the primary identity provider.
- **Client Side**: Uses irebase/auth for user sign-in and ID token acquisition.
- **Server Side**: Uses irebase-admin for session verification.
- **Session Strategy**: We use **HttpOnly Session Cookies** (7-day duration) to maintain security and allow for Edge-compatible middleware.

## Data Isolation & Multi-Tenancy
- **User Records**: Dual-stored in Firebase Auth (for credentials) and Firestore 'users' collection (for system metadata).
- **Profile Data**: Stored in 'user_data' collection, mapped via 'idnumber'.
- **Office Scoping**: Enforced via 'office_assignment' collection.

## Navigation & RBAC
- **Middleware**: Gating is performed in middleware.ts using JWT decoding of the session cookie.
- **Custom Claims**: User roles and analytics feature flags are embedded directly in the Firebase token to minimize database hits during routing.
- **Metadata Fallback**: If a session cookie is missing metadata (common on first login), the system falls back to Firestore resolution in erifySession.ts.

## UI & Theming
- **Theming**: Centralized via ThemeContext using CSS variables. Supports Light, Dark, Red, and Standard themes.
- **Styling**: Tailwind v4 with a custom @theme block in globals.css.
- **Responsiveness**: Mobile-first design with a drawer-based sidebar in Shell.tsx and responsive components.
