# Phase 3 Research: JSON-Sourced Data Layer

## Objective
Implement a "Two-Tier" data fetching strategy in the application's core services to prioritize optimized JSON archives over expensive Firestore scans.

## Integration Points

### 1. `metricsService.getDashboardMetrics`
- **Current**: Direct calls to `getOfflineReportInRange` and `getOnlineReportInRange`.
- **Proposed**:
    1. Check for `archives/{year}/{month}/metrics.json` in Firebase Storage.
    2. If found: Download, parse, and filter for the requested offices.
    3. If not found: Proceed with current Firestore aggregator logic.

### 2. `responseService.getResponses`
- **Current**: Fetches all responses for a month and filters.
- **Proposed**:
    1. Check for `archives/{year}/{month}/responses.json`.
    2. If found: Download, parse, and filter for requested offices + date range.
    3. If not found: Proceed with current Firestore collection fetch.

## Implementation Details

### Fetching from Storage (Admin SDK)
```typescript
import { storage } from "@/lib/firebase/admin";

async function getFromArchive(path: string) {
  const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const file = bucket.file(path);
  const [exists] = await file.exists();
  
  if (exists) {
    const [content] = await file.download();
    return JSON.parse(content.toString());
  }
  return null;
}
```

## Performance & Cost Impact
- **Cost**: Storage downloads are significantly cheaper than Firestore read operations (cents vs. dollars for large datasets).
*   **Latency**: Fetching a single JSON blob is typically faster than performing multiple indexed/non-indexed queries across thousands of Firestore documents.
- **Complexity**: We must handle filtering in memory for archived data, but the dataset size (monthly) is manageable for Node.js.

## Risks
- **Cache Invalidation**: Archives are immutable. If data is edited in Firestore *after* an archive is created, the archive remains stale.
    - *Mitigation*: The "Saving Measures" portal allows "Re-Archiving" to refresh the snapshot.
- **Availability**: Storage outages (rare).
    - *Mitigation*: Fallback to Firestore ensures data is always available.
