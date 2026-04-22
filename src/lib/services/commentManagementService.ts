import { db, admin } from "@/lib/firebase/admin";
import { getAllOffices } from "./officeService";
import { ensureArray } from "@/lib/utils/parsingUtils";
import { getJsonArchive } from "./storageService";
import { DashboardMetrics } from "./metricsService";
import { getSmartClusters } from "../ai/aiService";

export interface ManagedComment {
  id: string;
  sourceId: string;
  sourceCollection: "Responses" | "physical_report" | "Archive";
  commentText: string;
  sentiment: "Positive" | "Negative" | "Suggestion" | "Not Applicable";
  office: string; // Internal: Stores Office ID
  officeName?: string; // Virtual: Stores Acronym for UI
  month: string;
  date: any;
  actionPlan?: string;
  expectedOutcome?: string;
  status: "Pending" | "Ongoing" | "Resolved";
  createdAt: any;
  updatedAt: any;
}

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

export async function syncComments(force = false) {
  const activeOffices = await getAllOffices(false);
  const activeIdsSet = new Set(activeOffices.map(o => o.id.toLowerCase()));

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();
  const syncPeriods: { month: string; year: string }[] = [];
  for (let y = 2025; y <= now.getFullYear(); y++) {
    for (const m of months) {
      syncPeriods.push({ month: m, year: String(y) });
      if (y === now.getFullYear() && months.indexOf(m) === now.getMonth()) break;
    }
  }

  let totalSynced = 0;
  let batch = db.batch();
  let operationCount = 0;

  for (const period of syncPeriods) {
    const monthYearLabel = `${period.month} ${period.year}`;
    const archivePath = `archives/${period.year}/${period.month}/metrics.json`;
    const archiveData = await getJsonArchive(archivePath) as DashboardMetrics[];

    const existingSnap = await db.collection("comment_management").where("month", "==", monthYearLabel).get();
    const existingDocs = existingSnap.docs.map(d => ({ ...(d.data() as ManagedComment), id: d.id }));
    const claimedDocIds = new Set<string>();

    if (archiveData) {
      for (const officeMetrics of archiveData) {
        const officeIdRaw = officeMetrics.department;
        const canonical = activeOffices.find(o =>
          o.id.toLowerCase() === officeIdRaw.toLowerCase() ||
          o.name.toLowerCase() === officeIdRaw.toLowerCase()
        );

        // STORE ID (canonical) in DB
        const officeKey = canonical ? canonical.id : officeIdRaw;
        if (!activeIdsSet.has(officeKey.toLowerCase())) continue;

        const sentiments = {
          Positive: officeMetrics.comments?.positive || [],
          Negative: officeMetrics.comments?.negative || [],
          Suggestion: officeMetrics.comments?.suggestions || []
        } as Record<string, string[]>;

        for (const [sentiment, comments] of Object.entries(sentiments)) {
          for (let i = 0; i < comments.length; i++) {
            const commentText = comments[i];
            if (!commentText || commentText.trim().length < 2) continue;

            const matchingDoc = existingDocs.find(d =>
              !claimedDocIds.has(d.id) &&
              d.commentText === commentText &&
              (d.office.toLowerCase() === officeKey.toLowerCase() || (canonical && d.office.toLowerCase() === canonical.name.toLowerCase())) &&
              d.sentiment === sentiment
            );

            const docId = matchingDoc ? matchingDoc.id : `archive_${period.year}_${period.month}_${officeKey}_${sentiment.toLowerCase()}_${i}`;
            const ref = db.collection("comment_management").doc(docId);

            if (matchingDoc) {
              claimedDocIds.add(matchingDoc.id);
              batch.update(ref, { office: officeKey, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
            } else {
              batch.set(ref, {
                sourceId: `archive_${period.year}_${period.month}`,
                sourceCollection: "Archive",
                commentText, sentiment, office: officeKey, month: monthYearLabel,
                date: new Date(`${period.month} 1, ${period.year}`),
                status: "Pending", actionPlan: "", expectedOutcome: "",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
            totalSynced++;
            operationCount++;
            if (operationCount >= 500) { await batch.commit(); batch = db.batch(); operationCount = 0; }
          }
        }
      }
    } else {
      const monthMap: Record<string, string> = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      const periodIso = `${period.year}-${monthMap[period.month]}`;
      const startDateIso = `${periodIso}-01`;
      const endDateIso = `${periodIso}-31`;

      const resSnap = await db.collection("Responses").where("date_iso", ">=", startDateIso).where("date_iso", "<=", endDateIso).get();
      for (const doc of resSnap.docs) {
        const data = doc.data();
        const rawOffice = (data.officeId || data.Office || "").trim().toLowerCase();
        const canonical = activeOffices.find(o => o.id.toLowerCase() === rawOffice || o.name.toLowerCase() === rawOffice);
        if (!canonical) continue;

        let sentiment = "";
        const rawClass = (data.Class || "").toLowerCase().trim();
        if (rawClass === "positive") sentiment = "Positive";
        else if (rawClass === "negative") sentiment = "Negative";
        else if (rawClass === "suggestion" || rawClass === "suggestions") sentiment = "Suggestion";
        else continue;

        batch.set(db.collection("comment_management").doc(`response_${doc.id}`), {
          sourceId: doc.id, sourceCollection: "Responses",
          commentText: data.Comment, sentiment, office: canonical.id, month: monthYearLabel,
          date: data.Date ? (typeof data.Date === 'string' ? new Date(data.Date) : (data.Date.toDate ? data.Date.toDate() : new Date())) : new Date(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        totalSynced++;
        operationCount++;
      }
      if (operationCount > 0) { await batch.commit(); batch = db.batch(); operationCount = 0; }
    }
  }
  await batch.commit();
  return totalSynced;
}

export async function upsertManagedComment(sourceCollection: "Responses" | "physical_report", sourceId: string, data: any, index?: number) {
  const office = (sourceCollection === "Responses" ? data.Office : data.DEPARTMENT) || "Unknown";
  const activeOffices = await getAllOffices(false);
  const canonical = activeOffices.find(o => o.id.toLowerCase() === office.toLowerCase() || o.name.toLowerCase() === office.toLowerCase());
  if (!canonical) return;

  const sentiment = sourceCollection === "Responses" ? data.Class : ensureArray(data.CLASSIFY)[index!];
  const rawClass = (sentiment || "").trim().toLowerCase();
  let normalizedSentiment = "";
  if (rawClass === "positive") normalizedSentiment = "Positive";
  else if (rawClass === "negative") normalizedSentiment = "Negative";
  else if (rawClass === "suggestion" || rawClass === "suggestions") normalizedSentiment = "Suggestion";
  else return;

  const managedId = index !== undefined ? `${sourceCollection}_${sourceId}_${index}` : `${sourceCollection}_${sourceId}`;
  const ref = db.collection("comment_management").doc(managedId);
  const existing = await ref.get();

  const baseData = {
    sourceId, sourceCollection, commentText: (sourceCollection === "Responses" ? data.Comment : ensureArray(data.COMMENTS, true)[index!]) || "",
    sentiment: normalizedSentiment, office: canonical.id,
    month: getMonthLabel(sourceCollection === "Responses" ? data.Date : data.DATE_COLLECTED, data),
    date: (sourceCollection === "Responses" ? data.Date : data.DATE_COLLECTED) ? new Date(sourceCollection === "Responses" ? data.Date : data.DATE_COLLECTED) : new Date(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!existing.exists) {
    await ref.set({ ...baseData, status: "Pending", actionPlan: "", expectedOutcome: "", createdAt: admin.firestore.FieldValue.serverTimestamp() });
  } else {
    await ref.update(baseData);
  }
}

export async function getManagedComments(filters: any = {}) {
  const activeOffices = await getAllOffices(false);
  const officeMap = new Map(activeOffices.map(o => [o.id.toLowerCase(), o.name]));
  activeOffices.forEach(o => officeMap.set(o.name.toLowerCase(), o.name));

  let query: any = db.collection("comment_management");
  if (filters.month && filters.year) query = query.where("month", "==", `${filters.month} ${filters.year}`);
  if (filters.sentiment) query = query.where("sentiment", "==", filters.sentiment);
  if (filters.status) query = query.where("status", "==", filters.status);

  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    const acronym = officeMap.get((data.office || "").toLowerCase()) || data.office;
    const parseDate = (d: any) => {
      if (!d) return null;
      if (typeof d.toDate === 'function') return d.toDate().toISOString();
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    return {
      id: doc.id, ...data,
      office: acronym,
      officeId: data.office,
      date: parseDate(data.date),
      createdAt: parseDate(data.createdAt),
      updatedAt: parseDate(data.updatedAt),
    };
  }).filter((c: any) => {
    const off = (c.officeId || "").toLowerCase();
    return activeOffices.some(o => o.id.toLowerCase() === off || o.name.toLowerCase() === off);
  }).sort((a: any, b: any) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
}

export async function updateCommentAction(id: string, updates: any) {
  const ref = db.collection("comment_management").doc(id);
  await ref.update({ ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { success: true };
}

export async function getCommentAnalytics(year: string) {
  const activeOffices = await getAllOffices(false);
  const officeMap = new Map(activeOffices.map(o => [o.id.toLowerCase(), o.name]));
  activeOffices.forEach(o => officeMap.set(o.name.toLowerCase(), o.name));

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const startOfYear = new Date(parseInt(year), 0, 1);
  const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);

  const snapshot = await db.collection("comment_management").get();

  const allDocs = snapshot.docs.map(d => ({ ...(d.data() as ManagedComment), id: d.id }))
    .filter(d => d.month && d.month.includes(year));

  const monthlyData = months.map(m => ({
    month: m,
    negative: 0,
    resolvedNegative: 0,
    suggestion: 0,
    resolvedSuggestion: 0,
    positive: 0
  }));

  const officeStats: Record<string, { negative: number; resolved: number; suggestion: number; resolvedSuggestion: number; total: number }> = {};
  const commentPatterns: Record<string, { text: string; count: number; offices: Set<string> }> = {};

  allDocs.forEach(doc => {
    const monthName = doc.month.split(" ")[0];
    const monthIdx = months.indexOf(monthName);
    if (monthIdx === -1) return;

    const data = monthlyData[monthIdx];
    if (!data) return;
    const sentiment = doc.sentiment;
    const isResolved = doc.status === "Resolved";
    const officeId = (doc.office || "").toLowerCase();
    const officeName = officeMap.get(officeId) || doc.office || "Unknown";

    // Track monthly counts
    if (sentiment === "Negative") {
      data.negative++;
      if (isResolved) data.resolvedNegative++;
    } else if (sentiment === "Suggestion") {
      data.suggestion++;
      if (isResolved) data.resolvedSuggestion++;
    } else if (sentiment === "Positive") {
      data.positive++;
    }

    // Track office stats
    if (!officeStats[officeName]) officeStats[officeName] = { negative: 0, resolved: 0, suggestion: 0, resolvedSuggestion: 0, total: 0 };
    officeStats[officeName].total++;
    if (sentiment === "Negative") {
      officeStats[officeName].negative++;
      if (isResolved) officeStats[officeName].resolved++;
    } else if (sentiment === "Suggestion") {
      officeStats[officeName].suggestion++;
      if (isResolved) officeStats[officeName].resolvedSuggestion++;
    }

    // Track comment patterns (Repetitive comments) - Only for Negative
    if (sentiment === "Negative") {
      // Normalize: lowercase, trim, remove some punctuation
      const normalizedText = doc.commentText.toLowerCase().trim().replace(/[.,!?;:]/g, "");
      if (normalizedText.length > 5) { // Only track meaningful comments
        if (!commentPatterns[normalizedText]) {
          commentPatterns[normalizedText] = { text: doc.commentText, count: 0, offices: new Set() };
        }
        commentPatterns[normalizedText].count++;
        commentPatterns[normalizedText].offices.add(officeName);
      }
    }
  });

  // Calculate resolution rates
  const yearlyStats = {
    totalNegative: monthlyData.reduce((acc, m) => acc + m.negative, 0),
    resolvedNegative: monthlyData.reduce((acc, m) => acc + m.resolvedNegative, 0),
    totalSuggestions: monthlyData.reduce((acc, m) => acc + m.suggestion, 0),
    resolvedSuggestions: monthlyData.reduce((acc, m) => acc + m.resolvedSuggestion, 0),
  };

  const topOffices = Object.entries(officeStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.negative - a.negative)
    .slice(0, 10);

  const repetitiveComments = await getSmartClusters(allDocs.filter(d => d.sentiment === "Negative").map(d => d.commentText));

  return {
    year,
    monthlyData,
    overall: {
      negativeResolutionRate: yearlyStats.totalNegative > 0
        ? (yearlyStats.resolvedNegative / yearlyStats.totalNegative) * 100
        : 0,
      combinedResolutionRate: (yearlyStats.totalNegative + yearlyStats.totalSuggestions) > 0
        ? ((yearlyStats.resolvedNegative + yearlyStats.resolvedSuggestions) / (yearlyStats.totalNegative + yearlyStats.totalSuggestions)) * 100
        : 0,
      totalNegative: yearlyStats.totalNegative,
      resolvedNegative: yearlyStats.resolvedNegative,
      totalSuggestions: yearlyStats.totalSuggestions,
      resolvedSuggestions: yearlyStats.resolvedSuggestions,
      totalResolved: yearlyStats.resolvedNegative + yearlyStats.resolvedSuggestions
    },
    topOffices,
    allOffices: Object.entries(officeStats)
      .sort((a, b) => {
        const combinedA = a[1].negative + a[1].suggestion;
        const combinedB = b[1].negative + b[1].suggestion;
        if (combinedB !== combinedA) return combinedB - combinedA;
        return a[0].localeCompare(b[0]);
      })
      .map(entry => entry[0]),
    repetitiveComments
  };
}
export async function getOfficeAnalytics(year: string, officeName: string) {
  const activeOffices = await getAllOffices(false);
  const office = activeOffices.find(o => o.name.toLowerCase() === officeName.toLowerCase() || o.id.toLowerCase() === officeName.toLowerCase());

  if (!office) throw new Error("Office not found");
  const canonicalId = office.id;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const startOfYear = new Date(parseInt(year), 0, 1);
  const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);

  const snapshot = await db.collection("comment_management")
    .where("office", "==", canonicalId)
    .get();

  const docs = snapshot.docs.map(d => ({ ...(d.data() as ManagedComment), id: d.id }))
    .filter(d => d.month && d.month.includes(year));

  const monthlyData = months.map(m => ({
    month: m,
    negative: 0,
    resolvedNegative: 0,
    suggestion: 0,
    resolvedSuggestion: 0,
    resolutionRate: 0
  }));

  const officePatterns: Record<string, { text: string; count: number }> = {};

  docs.forEach(doc => {
    const monthName = doc.month.split(" ")[0];
    const monthIdx = months.indexOf(monthName);
    if (monthIdx === -1) return;

    const data = monthlyData[monthIdx];
    if (!data) return;
    const sentiment = doc.sentiment;
    const isResolved = doc.status === "Resolved";

    if (sentiment === "Negative") {
      data.negative++;
      if (isResolved) data.resolvedNegative++;

      const normalizedText = doc.commentText.toLowerCase().trim().replace(/[.,!?;:]/g, "");
      if (normalizedText.length > 5) {
        if (!officePatterns[normalizedText]) officePatterns[normalizedText] = { text: doc.commentText, count: 0 };
        officePatterns[normalizedText].count++;
      }
    } else if (sentiment === "Suggestion") {
      data.suggestion++;
      if (isResolved) data.resolvedSuggestion++;
    }

    // Calculate monthly rate so far
    if (data.negative > 0) {
      data.resolutionRate = (data.resolvedNegative / data.negative) * 100;
    }
  });

  const totals = {
    negative: monthlyData.reduce((acc, m) => acc + m.negative, 0),
    resolvedNegative: monthlyData.reduce((acc, m) => acc + m.resolvedNegative, 0),
    suggestion: monthlyData.reduce((acc, m) => acc + m.suggestion, 0),
    resolvedSuggestion: monthlyData.reduce((acc, m) => acc + m.resolvedSuggestion, 0),
  };

  const overallResolutionRate = totals.negative > 0 ? (totals.resolvedNegative / totals.negative) * 100 : 0;
  const repetitiveComplaints = await getSmartClusters(docs.filter(d => d.sentiment === "Negative").map(d => d.commentText));

  return {
    officeName: office.name,
    year,
    monthlyData,
    overallResolutionRate,
    totals,
    repetitiveComplaints
  };
}
