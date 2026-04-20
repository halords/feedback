# Research: Phase 2 (Query Optimization)

## 1. Firestore Range Queries
**Goal**: Use `.where('date_iso', '>=', start).where('date_iso', '<=', end)` instead of `.get()` followed by manual JS filtering.
**Pattern**:
- Firestore requires an index for multi-field filtering, but for a single field range query (like `date_iso`), it works out of the box.
- For combined `Office` and `date_iso` queries, we may need to ensure standard composite indexes exist (Firestore usually prompts for this via a link in the error log if it's missing).

## 2. Refactoring `getResponses`
**Current**: Fetches all responses in some cases or uses a legacy string `Date` check.
**Proposed**:
```typescript
let query = db.collection('Responses');
if (offices.length > 0) query = query.where('Office', 'in', offices);
if (startDate && endDate) {
  query = query.where('date_iso', '>=', startDate).where('date_iso', '<=', endDate);
}
```

## 3. Physical Report Optimization
**Current**: Uses `where('FOR THE MONTH OF', '==', 'JANUARY 2025')`.
**Proposed**: Switch to `where('period_iso', '==', '2025-01')`. This is cleaner and allows for "previous 3 months" or "Range" queries easily in the future.
