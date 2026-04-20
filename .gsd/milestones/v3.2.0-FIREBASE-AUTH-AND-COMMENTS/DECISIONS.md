# DECISIONS.md

## Auth Migration Strategy (2026-04-20)
- **Decision**: Use Firebase Session Cookies instead of ID Tokens directly on the client.
- **Rationale**: Better security (HttpOnly prevents XSS theft) and allows for server-side role gating in Middleware.

## Metadata Fallback Logic (2026-04-20)
- **Decision**: Implement a Firestore lookup fallback in erifySession.ts.
- **Rationale**: Firebase Custom Claims are not immediately available in a session cookie created right after account creation or the first login. This fallback ensures the UI always has user profile data.

## Username-to-ID Resolution (2026-04-20)
- **Decision**: Added an ID resolution layer in the Login flow.
- **Rationale**: To support users who prefer to log in with their Username instead of their ID Number, while maintaining a single ID-based Auth record in Firebase.
