# ARCHITECTURE.md

## Authentication & Identity
The system has migrated to **Firebase Authentication** as the primary identity provider.
- **Client Side**: Uses `firebase/auth` for user sign-in and ID token acquisition.
- **Server Side**: Uses `firebase-admin` for session verification.
- **Session Strategy**: We use **HttpOnly Session Cookies** (7-day duration) to maintain security and allow for Edge-compatible middleware.

## Data Isolation & Multi-Tenancy
- **User Records**: Dual-stored in Firebase Auth (for credentials) and Firestore 'users' collection (for system metadata).
- **Profile Data**: Stored in 'user_data' collection, mapped via 'idnumber'.
- **Office Scoping**: Enforced via 'office_assignment' collection.

## Analytics & Archiving (Zero-Read Strategy)
- **Aggregation**: Backend services pre-calculate metrics and export them to JSON archives in Firestore Storage/Archives.
- **Reporting**: The system fetches historical data from these JSON archives, achieving zero-read Firestore costs for reporting periods.
- **Dynamic Personnel**: Personnel lists in reports are derived directly from archive content, ensuring historical accuracy regardless of current database state.
- **Resilient Identification**: Office resolution handles Document IDs, Names, and Acronyms interchangeably via a normalized compare logic.

## Navigation & RBAC
- **Middleware**: Gating is performed in middleware.ts using JWT decoding of the session cookie.
- **Custom Claims**: User roles and analytics feature flags are embedded directly in the Firebase token.
- **Metadata Fallback**: If a session cookie is missing metadata, the system falls back to Firestore resolution.

## UI & Theming
- **Theming**: Centralized via ThemeContext using CSS variables.
- **Styling**: Tailwind v4 with a custom @theme block in globals.css.
- **Responsiveness**: Mobile-first design with a drawer-based sidebar.
