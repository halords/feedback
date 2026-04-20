# Research: Phase 1 (Audit Remediation)

## 1. Zod in Next.js API Routes
**Goal**: Implement strict input validation for all API routes.
**Pattern**:
- Create a `validation` schema file for each major entity.
- Wrap API `POST/PUT` handlers with a Zod parser.
- Return 400 Bad Request with detailed errors if validation fails.

**Files to create**:
- `src/lib/validation/apiSchemas.ts`

---

## 2. Date Migration Strategy
**State**:
- `Responses.Date` is currently a string (format varies? likely `MM/DD/YYYY` or similar).
- `physical_report.FOR_THE_MONTH_OF` is `Month YYYY`.

**Strategy**:
- **Backward Compatibility**: Keep the existing string field but add a new `dateSort` field (as a native Firestore Timestamp) or convert the existing string to ISO-8601 (`YYYY-MM-DD`).
- **Migration Script**: Create a one-off script in `scripts/migrate-dates.js` to batch update all documents.
- **Safety**: Test with a small batch first.

---

## 3. Hydration Bug Analysis
**Issue**: Sidebar/Shell state mismatch.
**Cause**: `Shell.tsx` reads `localstorage` and `cookies` inside `useEffect`, but the initial render on the server doesn't have access to `localstorage`.
**Fix**:
- Initialize state as `null` or a neutral value and only show/apply the state after mounting (`mounted` state pattern).
- Or, use CSS media queries for simple "collapsed" states where possible.

---

## 4. Superadmin UI Bug
**Issue**: `user.role` vs `user.user_type`.
**Solution**: Search and replace `user.role` with `user.user_type` in `Shell.tsx`.
