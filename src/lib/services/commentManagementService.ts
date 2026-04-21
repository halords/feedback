import { db, admin } from "@/lib/firebase/admin";
import { getAllOffices } from "./officeService";
import { ensureArray } from "@/lib/utils/parsingUtils";

export interface ManagedComment {
  id: string;
  sourceId: string;
  sourceCollection: "Responses" | "physical_report";
  commentText: string;
  sentiment: "Positive" | "Negative" | "Suggestion" | "Not Applicable";
  office: string;
  month: string; // Formatting: "January 2026"
  date: any;
  actionPlan?: string;
  expectedOutcome?: string;
  status: "Pending" | "Ongoing" | "Resolved";
  createdAt: any;
  updatedAt: any;
}

/**
 * Helper to format month from date or period_iso
 */
function getMonthLabel(dateInput: any, sourceData?: any): string {
  if (sourceData?.period_iso) {
    const [y, m] = sourceData.period_iso.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    if (sourceData?.FOR_THE_MONTH_OF) return sourceData.FOR_THE_MONTH_OF;
    return "Unknown Month";
  }
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Syncs classified comments from original collections into the unified management collection.
 */
export async function syncComments(force = false) {
  // 0. Fetch active offices list first (NEW)
  const activeOffices = await getAllOffices(false);
  const activeOfficeNames = new Set(activeOffices.map(o => o.name));

  const metaRef = db.collection("system_metadata").doc("comment_sync_meta");
  const metaSnap = await metaRef.get();
  const lastSyncTime = (metaSnap.exists && !force) ? metaSnap.data()?.lastSyncTime : null;

  const syncLimit = 500;
  let batch = db.batch();
  let operationCount = 0;
  let totalSynced = 0;

  console.log(`[Sync] Starting sync. Last Sync: ${lastSyncTime?.toDate()?.toISOString() || "FULL SCAN"}`);

  // 1. Fetch Source Data
  let responsesQuery: any = db.collection("Responses")
    .where("Class", "in", ["Positive", "Negative", "Suggestion"]);
  if (lastSyncTime) {
    responsesQuery = responsesQuery.where("updatedAt", ">", lastSyncTime);
  }
  const responsesSnapshot = await responsesQuery.get();

  let physicalQuery: any = db.collection("physical_report");
  if (lastSyncTime) {
    physicalQuery = physicalQuery.where("updatedAt", ">", lastSyncTime);
  }
  const physicalSnapshot = await physicalQuery.get();

  // 2. Optimization: Bulk fetch existing potential target IDs
  const responseTargetIds = responsesSnapshot.docs.map(doc => `Responses_${doc.id}`);
  const physicalTargetIds: string[] = [];
  physicalSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const commentsList = ensureArray(data.COMMENTS);
    const count = commentsList.length;
    for (let i = 0; i < count; i++) physicalTargetIds.push(`physical_report_${doc.id}_${i}`);
  });

  const allTargetIds = [...responseTargetIds, ...physicalTargetIds];
  const existingMap = new Map<string, boolean>();

  for (let i = 0; i < allTargetIds.length; i += 1000) {
    const chunk = allTargetIds.slice(i, i + 1000);
    const refs = chunk.map(id => db.collection("comment_management").doc(id));
    const snaps = await db.getAll(...refs);
    snaps.forEach((snap, idx) => existingMap.set(chunk[idx], snap.exists));
  }

  // 3. Process Responses
  for (const doc of responsesSnapshot.docs) {
    const data = doc.data();
    // Match using ID, Name, or Full Name to ensure canonical ID is used
    const rawOfficeSearch = (data.Office || data.officeId || "").trim().toLowerCase();
    const canonical = activeOffices.find(o => 
      o.id.toLowerCase() === rawOfficeSearch || 
      o.name.toLowerCase() === rawOfficeSearch || 
      (o.fullName && o.fullName.toLowerCase() === rawOfficeSearch)
    );

    // Skip if office not found or disabled
    if (!canonical) continue;
    const office = canonical.id; 
    const managedId = `response_${doc.id}`;
    const ref = db.collection("comment_management").doc(managedId);
    const exists = existingMap.get(managedId);

    const baseData = {
      sourceId: doc.id,
      sourceCollection: "Responses",
      commentText: data.Comment || "",
      sentiment: data.Class,
      office: office,
      month: getMonthLabel(data.Date),
      date: data.Date ? (data.Date.toDate ? data.Date.toDate() : new Date(data.Date)) : new Date(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!exists) {
      batch.set(ref, {
        ...baseData,
        status: "Pending",
        actionPlan: "",
        expectedOutcome: "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      batch.update(ref, baseData);
    }

    operationCount++;
    totalSynced++;
    if (operationCount >= syncLimit) {
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
  }

  // 4. Process Physical Reports
  for (const doc of physicalSnapshot.docs) {
    const data = doc.data();
    // Match using ID, Name, or Full Name to ensure legacy data maps correctly
    const rawOfficeSearch = (data.DEPARTMENT || data.officeId || "").trim().toLowerCase();
    const canonical = activeOffices.find(o => 
      o.id.toLowerCase() === rawOfficeSearch || 
      o.name.toLowerCase() === rawOfficeSearch || 
      (o.fullName && o.fullName.toLowerCase() === rawOfficeSearch)
    );

    // Skip if office not found or disabled
    if (!canonical) continue;
    const office = canonical.id; 

    const comments = ensureArray(data.COMMENTS, true);
    const classes = ensureArray(data.CLASSIFY);
    const reportMonth = getMonthLabel(data.DATE_COLLECTED, data);

    for (let index = 0; index < comments.length; index++) {
      const sentiment = (classes[index] || "").trim();
      const normalizedSentiment = sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
      if (!["Positive", "Negative", "Suggestion"].includes(normalizedSentiment)) continue;

      const managedId = `physical_report_${doc.id}_${index}`;
      const ref = db.collection("comment_management").doc(managedId);
      const exists = existingMap.get(managedId);
      
      const baseData = {
        sourceId: doc.id,
        sourceCollection: "physical_report",
        commentText: comments[index],
        sentiment: sentiment,
        office: office,
        month: reportMonth,
        date: data.DATE_COLLECTED ? (data.DATE_COLLECTED.toDate ? data.DATE_COLLECTED.toDate() : new Date(data.DATE_COLLECTED)) : new Date(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!exists) {
        batch.set(ref, {
          ...baseData,
          status: "Pending",
          actionPlan: "",
          expectedOutcome: "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        batch.update(ref, baseData);
      }

      operationCount++;
      totalSynced++;
      if (operationCount >= syncLimit) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }
  }

  batch.set(metaRef, { 
    lastSyncTime: admin.firestore.FieldValue.serverTimestamp(),
    totalSyncedCount: admin.firestore.FieldValue.increment(totalSynced)
  }, { merge: true });

  await batch.commit();
  return totalSynced;
}

export async function upsertManagedComment(
  sourceCollection: "Responses" | "physical_report",
  sourceId: string,
  data: any,
  index?: number
) {
  const office = (sourceCollection === "Responses" ? data.Office : data.DEPARTMENT) || "Unknown";
  
  // Check if office is active
  const activeOffices = await getAllOffices(false);
  const activeOfficeNames = new Set(activeOffices.map(o => o.name));
  
  const managedId = index !== undefined 
    ? `${sourceCollection}_${sourceId}_${index}` 
    : `${sourceCollection}_${sourceId}`;
  
  const ref = db.collection("comment_management").doc(managedId);
  const existing = await ref.get();

  // If office is disabled, delete from management if it exists (NEW)
  if (!activeOfficeNames.has(office)) {
    if (existing.exists) await ref.delete();
    return;
  }

  const commentText = sourceCollection === "Responses" 
    ? data.Comment 
    : ensureArray(data.COMMENTS, true)[index!];
  const sentiment = sourceCollection === "Responses" 
    ? data.Class 
    : ensureArray(data.CLASSIFY)[index!];
  
  const normalizedSentiment = (sentiment || "").trim().charAt(0).toUpperCase() + (sentiment || "").trim().slice(1).toLowerCase();
  
  if (!["Positive", "Negative", "Suggestion"].includes(normalizedSentiment)) {
    if (existing.exists) await ref.delete();
    return;
  }

  const baseData = {
    sourceId,
    sourceCollection,
    commentText: commentText || "",
    sentiment,
    office: office,
    month: getMonthLabel(sourceCollection === "Responses" ? data.Date : data.DATE_COLLECTED, data),
    date: (sourceCollection === "Responses" ? data.Date : data.DATE_COLLECTED) ? new Date(sourceCollection === "Responses" ? data.Date : data.DATE_COLLECTED) : new Date(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!existing.exists) {
    await ref.set({
      ...baseData,
      status: "Pending",
      actionPlan: "",
      expectedOutcome: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await ref.update(baseData);
  }
}

export async function getManagedComments(filters: { 
  sentiment?: string; 
  status?: string;
  month?: string;
  year?: string;
} = {}) {
  // 1. Get active offices to filter out disabled office data (NEW)
  const activeOffices = await getAllOffices(false);
  const activeOfficeNames = new Set(activeOffices.map(o => o.name));

  let query: any = db.collection("comment_management");

  if (filters.month && filters.year) {
    const formattedMonth = `${filters.month} ${filters.year}`;
    query = query.where("month", "==", formattedMonth);
  }

  if (filters.sentiment) {
    query = query.where("sentiment", "==", filters.sentiment);
  }
  if (filters.status) {
    query = query.where("status", "==", filters.status);
  }

  const snapshot = await query.get();
  
  const results = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate()?.toISOString() || null,
    createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
    updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || null,
  })).filter((c: any) => activeOfficeNames.has(c.office)) as ManagedComment[]; // FILTER HERE (NEW)

  return results.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export async function updateCommentAction(id: string, updates: Partial<ManagedComment>) {
  const ref = db.collection("comment_management").doc(id);
  await ref.update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
}
