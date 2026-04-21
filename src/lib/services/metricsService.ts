import { db } from "@/lib/firebase/admin";
import { getMonthBounds } from "@/lib/utils/dateUtils";
import { resolveTargetOffices, SATELLITE_GROUPS } from "./aggregatorService";
import { getJsonArchive } from "./storageService";
import {
  calculateQuestionRate,
  calculateSatisfactionAverages,
  calculateCollectionRate,
  QValues
} from "./analyticsService";
import { ensureArray } from "@/lib/utils/parsingUtils";

export interface DashboardMetrics {
  department: string;
  month: string;
  primaryGroup?: string;
  collection: number;
  online: number;
  offline: number;
  visitor: number;
  overrate: string;
  sysRate: string;
  staffRate: string;
  awareCount: number;
  visibleCount: number;
  helpfulCount: number;
  cc1: { Yes: number; "Just Now": number; No: number };
  cc2: { Visible: number; "Somewhat Visible": number; "Difficult to see": number; "Not Visible": number; "N/A": number };
  cc3: { "Very Much": number; Somewhat: number; "Did Not Help": number; "N/A": number };
  qValues: Record<string, any>;
  gender: Record<string, number>;
  clientType: Record<string, number>;
  comments: {
    positive: string[];
    negative: string[];
    suggestions: string[];
  };
  dateCollected?: string;
  collectionRate: string;
  fullname?: string;
  officeName?: string;
}

export async function getDashboardMetrics(offices: string[], month: string | string[], year: string, skipArchive = false, onlyArchive = false): Promise<DashboardMetrics[]> {
  if (!Array.isArray(offices)) return [];
  const activeOffices = await import("./officeService").then(m => m.getAllOffices());
  // Resolve office IDs into all variants (Acronym, Name, ID) to ensure archive lookup resilience
  const resolvedOffices = await resolveTargetOffices(offices, year);
  const monthArray = Array.isArray(month) ? month : [month];
  
  const results: DashboardMetrics[] = [];
  const monthsToFetchLive: string[] = [];

  // 1. Try fetching from archives first
  if (!skipArchive) {
    for (const m of monthArray) {
      const archivePath = `archives/${year}/${m}/metrics.json`;
      const archivedData = await getJsonArchive<DashboardMetrics[]>(archivePath);
      
      if (archivedData) {
        console.log(`[MetricsService] Archive HIT: Using optimized JSON for ${m} ${year} (Zero Firestore Reads)`);
        const filtered = archivedData.filter(item => {
          const dept = (item.department || "").trim().toLowerCase().replace(/-/g, ' ');
          return resolvedOffices.some(ro => 
            ro.trim().toLowerCase().replace(/-/g, ' ') === dept
          );
        });
        results.push(...filtered);
      } else {
        console.log(`[MetricsService] Archive MISS: Fetching live data for ${m} ${year}`);
        monthsToFetchLive.push(m);
      }
    }
  } else {
    monthsToFetchLive.push(...monthArray);
  }


  // 2. Fetch remaining months from Firestore (ONLY if not strictly using archives)
  if (monthsToFetchLive.length > 0 && !onlyArchive) {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const sortedMonths = [...monthsToFetchLive].sort((a, b) => months.indexOf(a) - months.indexOf(b));
    const minMonth = sortedMonths[0];
    const maxMonth = sortedMonths[sortedMonths.length - 1];
    
    // ISO Range preparation
    const monthMap: Record<string, string> = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const startDateIso = `${year}-${monthMap[minMonth]}-01`;
    const endDateIso = `${year}-${monthMap[maxMonth]}-31`;

    const offlineData = await getOfflineReportInRange(resolvedOffices, monthsToFetchLive, year, activeOffices);
    const onlineData = await getOnlineReportInRange(resolvedOffices, startDateIso, endDateIso, monthsToFetchLive, year, activeOffices);

    for (const m of monthsToFetchLive) {
      for (const office of resolvedOffices) {
        const offline = offlineData[`${office}_${m}`] || createEmptyResult(office, m);
        const online = onlineData[`${office}_${m}`] || createEmptyResult(office, m);
        const merged = mergeReports(offline, online, m);
        results.push(merged);
      }
    }
  }

  // 3. Post-Aggregation: Ensure unique rows by mapping Name/ID overlaps and resolving Readable Names
  const finalMap = new Map<string, DashboardMetrics>();
  results.forEach(m => {
    // Determine the authority record for this entry
    const canonical = activeOffices.find(o => 
      o.id.toLowerCase() === m.department.toLowerCase() || 
      o.name.toLowerCase() === m.department.toLowerCase() || 
      (o.fullName && o.fullName.toLowerCase() === m.department.toLowerCase())
    );
    const key = `${canonical?.id || m.department}_${m.month}`;
    
    // Always use the short acronym (name) or ID for the UI 'department' field
    const displayDepartment = canonical?.name || m.department;
    
    if (!finalMap.has(key)) {
      finalMap.set(key, { 
        ...m, 
        department: displayDepartment, 
        officeName: canonical?.fullName || displayDepartment 
      });
    } else {
      // Merge values if we somehow got multiple
      const existing = finalMap.get(key)!;
      const merged = mergeReports(existing, m, m.month);
      finalMap.set(key, { 
        ...merged, 
        department: displayDepartment, 
        fullname: m.fullname || merged.fullname,
        officeName: canonical?.fullName || displayDepartment
      });
    }
  });

  return Array.from(finalMap.values());
}


async function getOnlineReportInRange(offices: string[], startDate: string, endDate: string, targetMonths: string[], year: string, activeOffices: any[]) {
  const results: any = {};
  
  // Scoped to date range for massive performance gain vs legacy full-scan
  const CHUNK_SIZE = 30;
  const officeChunks = [];
  for (let i = 0; i < offices.length; i += CHUNK_SIZE) {
    officeChunks.push(offices.slice(i, i + CHUNK_SIZE));
  }

    const queryPromises = officeChunks.map(chunk =>
      db.collection('Responses')
        .where('officeId', 'in', chunk)
        .where('date_iso', '>=', startDate)
        .where('date_iso', '<=', endDate)
        .get()
    );

    const snapshots = await Promise.all(queryPromises);

    snapshots.forEach(snapshot => {
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        const dateIso = data.date_iso || "";
        if (!dateIso) return;

        const dateParts = dateIso.split('-');
        const yearStr = dateParts[0];
        const monthNum = dateParts[1];

        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const docMonth = months[parseInt(monthNum) - 1];
        const docYear = yearStr;

        if (targetMonths.includes(docMonth) && docYear === year) {
          const rawOffice = (data.officeId || data.Office || "").trim().replace(/-/g, ' ').toLowerCase();
          const canonical = activeOffices.find(o => 
            o.id.toLowerCase().replace(/-/g, ' ') === rawOffice || 
            o.name.toLowerCase().replace(/-/g, ' ') === rawOffice || 
            (o.fullName && o.fullName.toLowerCase().replace(/-/g, ' ') === rawOffice)
          );

          const officeId = canonical?.id || rawOffice;
          const key = `${officeId}_${docMonth}`;
          if (!results[key]) results[key] = createEmptyResult(officeId, docMonth);

          const res = results[key];
        res.collection++;
        res.visitor++;

        const gender = data.Gender || 'Others';
        res.gender[gender] = (res.gender[gender] || 0) + 1;

        for (let i = 0; i <= 9; i++) {
          const qKey = `Q${i}`;
          const val = data[qKey];
          if (val === 0 || val === '0' || !val) {
            res.qValues[qKey].NA++;
          } else {
            res.qValues[qKey][String(val)]++;
          }
        }

        const ct = normalizeClientType(data.Client_Type);
        if (res.clientType[ct] !== undefined) res.clientType[ct]++;
        else res.clientType.Others++;

        const rawClass = (data.Class || "").toLowerCase().trim();
        if (data.Comment && rawClass !== "not applicable") {
          // Comm.: Count only comments with type "positive"
          if (rawClass === "positive") {
            res.comments.positive.push(data.Comment);
          } 
          // Compl.: Count only comments with type "negative"
          else if (rawClass === "negative") {
            res.comments.negative.push(data.Comment);
          } 
          // Sugg.: Count only comments with type "suggestion" or "suggestions"
          else if (rawClass === "suggestion" || rawClass === "suggestions") {
            res.comments.suggestions.push(data.Comment);
          }
        }

        const cc1 = data.CC1 || 'N/A';
        if (res.cc1[cc1] !== undefined) res.cc1[cc1]++;
        const cc2 = data.CC2 || 'N/A';
        if (res.cc2[cc2] !== undefined) res.cc2[cc2]++;
        const cc3 = data.CC3 || 'N/A';
        if (res.cc3[cc3] !== undefined) res.cc3[cc3]++;
      }
    });
  });

  return results;
}

async function getOfflineReportInRange(offices: string[], monthArray: string[], year: string, activeOffices: any[]) {
  const results: any = {};
  const formattedOffices = offices.map(o => o.replace(/-/g, ' '));
  const monthMap: Record<string, string> = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  const targetPeriodIsos = monthArray.map(m => `${year}-${monthMap[m]}`);

  const CHUNK_SIZE = 30;
  const officeChunks = [];
  for (let i = 0; i < formattedOffices.length; i += CHUNK_SIZE) {
    officeChunks.push(formattedOffices.slice(i, i + CHUNK_SIZE));
  }

  const queryPromises: Promise<any>[] = [];
  monthArray.forEach(m => {
    const periodIso = `${year}-${monthMap[m]}`;
    const monthYearLabel = `${m} ${year}`;
    
    // Performance: Querying all physical reports for the month is efficient as there is usually only 1 per office.
    // This allows us to handle legacy records that may not have 'officeId' or 'period_iso' properly.
    queryPromises.push(db.collection('physical_report').where('period_iso', '==', periodIso).get());
    queryPromises.push(db.collection('physical_report').where('FOR_THE_MONTH_OF', '==', monthYearLabel).get());
  });

  const snapshots = await Promise.all(queryPromises);
  const processedDocIds = new Set<string>();

  snapshots.forEach(snapshot => {
    snapshot.forEach((doc: any) => {
      // Prevent double-processing if a doc matches both queries
      if (processedDocIds.has(doc.id)) return;
      processedDocIds.add(doc.id);

      const data = doc.data();
      if (!data) return;

      // Filter by office in-memory using both IDs, Names, and Full Names
      const deptNormalized = (data.DEPARTMENT || "").trim().replace(/-/g, ' ').toLowerCase();
      const officeMatch = activeOffices.find(o => 
        o.id.toLowerCase().replace(/-/g, ' ') === deptNormalized ||
        o.name.toLowerCase().replace(/-/g, ' ') === deptNormalized ||
        (o.fullName && o.fullName.toLowerCase().replace(/-/g, ' ') === deptNormalized)
      );

      if (!officeMatch) return;

      const officeId = officeMatch.id; // Always use ID (Acronym) as the internal key
      const docPeriod = data.FOR_THE_MONTH_OF || "";
      
      // Resolve month correctly from various legacy schemas
      let docMonth = docPeriod.split(' ')[0];
      if (!docMonth && data.period_iso) {
        const monthNum = data.period_iso.split('-')[1];
        docMonth = Object.keys(monthMap).find(k => monthMap[k] === monthNum) || "";
      }
      
      if (!docMonth) return; // Skip if we can't determine the month
      
      // DIAGNOSTIC LOG: Show which Firestore doc is contributing to which office
      console.log(`[Offline-Agg] Doc ID: ${doc.id} | DEPT: "${data.DEPARTMENT}" -> matched office: "${officeId}" | Q5_5: ${data['55']} | Q6_5: ${data['65']} | Forms: ${data.COLLECTED_FORMS}`);
      
      const key = `${officeId}_${docMonth}`;
      
      // Strict Deduplication: Always overwrite with the latest valid document for this month/office
      // This prevents rogue duplicates from secretly adding their numbers (like 8 + 9 = 17)
      results[key] = createEmptyResult(officeId, docMonth);
      const res = results[key];

      const safeInt = (val: any) => {
        const n = parseInt(val);
        return isNaN(n) ? 0 : n;
      };

      res.collection += safeInt(data.COLLECTED_FORMS);
      res.visitor += safeInt(data.VISITORS);
      res.gender.Male += safeInt(data.MALE);
      res.gender.Female += safeInt(data.FEMALE);
      res.gender.LGBTQ += safeInt(data.LGBTQ);
      res.gender.Others += safeInt(data.PREFER_NOT_TO_SAY);

      res.clientType.Citizen += safeInt(data.CITIZEN);
      res.clientType.Business += safeInt(data.BUSINESS);
      res.clientType.Government += safeInt(data.GOVERNMENT);

      for (let i = 0; i <= 9; i++) {
        const qKey = `Q${i}`;
        res.qValues[qKey]['1'] += safeInt(data[`${i}1`]);
        res.qValues[qKey]['2'] += safeInt(data[`${i}2`]);
        res.qValues[qKey]['3'] += safeInt(data[`${i}3`]);
        res.qValues[qKey]['4'] += safeInt(data[`${i}4`]);
        res.qValues[qKey]['5'] += safeInt(data[`${i}5`]);
        res.qValues[qKey].NA += safeInt(data[`${i}NA`]);
      }

      res.cc1.Yes += safeInt(data.YES);
      res.cc1['Just Now'] += safeInt(data.JUST_NOW);
      res.cc1.No += safeInt(data.NO);
      res.cc2.Visible += safeInt(data.VISIBLE);
      res.cc2['Somewhat Visible'] += safeInt(data.SOMEWHAT_VISIBLE);
      res.cc2['Difficult to see'] += safeInt(data.DIFFICULT_TO_SEE);
      res.cc2['Not Visible'] += safeInt(data.NOT_VISIBLE);
      res.cc2['N/A'] += safeInt(data.NA);
      res.cc3['Very Much'] += safeInt(data.VERY_MUCH);
      res.cc3.Somewhat += safeInt(data.SOMEWHAT);
      res.cc3['Did Not Help'] += safeInt(data.DID_NOT_HELP);
      res.cc3['N/A'] += safeInt(data.NA2);

      const comments = ensureArray(data.COMMENTS, true);
      const classifications = ensureArray(data.CLASSIFY);

      if (comments.length > 0) {
        let docPositive = 0;
        let docNegative = 0;
        let docSugg = 0;

        comments.forEach((comment: string, index: number) => {
          if (!comment || typeof comment !== 'string' || comment.trim().length < 2) return;
          
          const rawSentiment = (classifications[index] || "").trim().toLowerCase();
          if (rawSentiment === "not applicable") return;

          if (rawSentiment === "positive") {
            res.comments.positive.push(comment);
            docPositive++;
          } else if (rawSentiment === "negative") {
            res.comments.negative.push(comment);
            docNegative++;
          } else if (rawSentiment === "suggestion" || rawSentiment === "suggestions") {
            res.comments.suggestions.push(comment);
            docSugg++;
          }
        });

        if (docPositive > 0 || docNegative > 0 || docSugg > 0) {
          console.log(`[Archive-Fix] Extracted ${docPositive + docNegative + docSugg} comments from ${officeId} (${docMonth}): Pos:${docPositive} Neg:${docNegative} Sugg:${docSugg}`);
          if (comments.length !== classifications.length) {
            console.warn(`[Archive-Fix] Mismatch in ${officeId}: Comments(${comments.length}) vs Classify(${classifications.length}). Smart-split applied.`);
          }
        }
      }

      if (data.DATE_COLLECTED) {
        let date: Date | null = null;
        if (data.DATE_COLLECTED && typeof data.DATE_COLLECTED.toDate === 'function') date = data.DATE_COLLECTED.toDate();
        else if (data.DATE_COLLECTED instanceof Date) date = data.DATE_COLLECTED;
        else if (typeof data.DATE_COLLECTED === 'string') {
          const d = new Date(data.DATE_COLLECTED);
          if (!isNaN(d.getTime())) date = d;
        }

        if (date) {
          res.dateCollected = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
        } else {
          res.dateCollected = String(data.DATE_COLLECTED || "");
        }
      }
    });
  });

  return results;
}

function mergeReports(offline: any, online: any, month: string): DashboardMetrics {
  const qValues: any = {};

  for (let i = 0; i <= 9; i++) {
    const key = `Q${i}`;
    const q1 = offline.qValues[key]['1'] + online.qValues[key]['1'];
    const q2 = offline.qValues[key]['2'] + online.qValues[key]['2'];
    const q3 = offline.qValues[key]['3'] + online.qValues[key]['3'];
    const q4 = offline.qValues[key]['4'] + online.qValues[key]['4'];
    const q5 = offline.qValues[key]['5'] + online.qValues[key]['5'];
    const qNA = offline.qValues[key].NA + online.qValues[key].NA;

    const total = offline.collection + online.collection;
    const rate = calculateQuestionRate(
      { '1': q1, '2': q2, '3': q3, '4': q4, '5': q5, NA: qNA },
      total
    );

    qValues[key] = { '1': q1, '2': q2, '3': q3, '4': q4, '5': q5, NA: qNA, RATE: rate };
  }

  // Calculate Averages using centralized logic
  const qRates: Record<string, string> = {};
  Object.keys(qValues).forEach(key => qRates[key] = qValues[key].RATE);

  const { sysRate, staffRate, overrate } = calculateSatisfactionAverages(qRates);

  return {
    department: offline.department,
    month,
    primaryGroup: Object.entries(SATELLITE_GROUPS).find(([_, list]) => (list as string[]).includes(offline.department))?.[0],
    collection: offline.collection + online.collection,
    online: online.collection,
    offline: offline.collection,
    visitor: offline.visitor + online.visitor,
    overrate,
    sysRate,
    staffRate,
    awareCount: (offline.cc1?.Yes || 0) + (online.cc1?.Yes || 0) + (offline.cc1?.['Just Now'] || 0) + (online.cc1?.['Just Now'] || 0),
    visibleCount: (offline.cc2?.Visible || 0) + (online.cc2?.Visible || 0) + (offline.cc2?.['Somewhat Visible'] || 0) + (online.cc2?.['Somewhat Visible'] || 0),
    helpfulCount: (offline.cc3?.['Very Much'] || 0) + (online.cc3?.['Very Much'] || 0) + (offline.cc3?.Somewhat || 0) + (online.cc3?.Somewhat || 0),
    cc1: {
      Yes: (offline.cc1?.Yes || 0) + (online.cc1?.Yes || 0),
      "Just Now": (offline.cc1?.['Just Now'] || 0) + (online.cc1?.['Just Now'] || 0),
      No: (offline.cc1?.No || 0) + (online.cc1?.No || 0),
    },
    cc2: {
      Visible: (offline.cc2?.Visible || 0) + (online.cc2?.Visible || 0),
      "Somewhat Visible": (offline.cc2?.['Somewhat Visible'] || 0) + (online.cc2?.['Somewhat Visible'] || 0),
      "Difficult to see": (offline.cc2?.['Difficult to see'] || 0) + (online.cc2?.['Difficult to see'] || 0),
      "Not Visible": (offline.cc2?.['Not Visible'] || 0) + (online.cc2?.['Not Visible'] || 0),
      "N/A": (offline.cc2?.['N/A'] || 0) + (online.cc2?.['N/A'] || 0),
    },
    cc3: {
      "Very Much": (offline.cc3?.['Very Much'] || 0) + (online.cc3?.['Very Much'] || 0),
      Somewhat: (offline.cc3?.Somewhat || 0) + (online.cc3?.Somewhat || 0),
      "Did Not Help": (offline.cc3?.['Did Not Help'] || 0) + (online.cc3?.['Did Not Help'] || 0),
      "N/A": (offline.cc3?.['N/A'] || 0) + (online.cc3?.['N/A'] || 0),
    },
    qValues,
    gender: {
      Male: offline.gender.Male + online.gender.Male,
      Female: offline.gender.Female + online.gender.Female,
      LGBTQ: offline.gender.LGBTQ + online.gender.LGBTQ,
      Others: offline.gender.Others + online.gender.Others,
    },
    clientType: {
      Citizen: (offline.clientType.Citizen || 0) + (online.clientType.Citizen || 0),
      Business: (offline.clientType.Business || 0) + (online.clientType.Business || 0),
      Government: (offline.clientType.Government || 0) + (online.clientType.Government || 0),
      Others: (offline.clientType.Others || 0) + (online.clientType.Others || 0),
    },
    comments: {
      positive: [...offline.comments.positive, ...online.comments.positive],
      negative: [...offline.comments.negative, ...online.comments.negative],
      suggestions: [...offline.comments.suggestions, ...online.comments.suggestions],
    },
    dateCollected: offline.dateCollected,
    collectionRate: calculateCollectionRate(offline.collection + online.collection, offline.visitor + online.visitor)
  };
}

function normalizeClientType(rawType: string): string {
  if (!rawType) return "Others";
  const t = String(rawType).toLowerCase();
  if (t.includes("citizen")) return "Citizen";
  if (t.includes("business")) return "Business";
  if (t.includes("government") || t.includes("govt")) return "Government";
  return "Others";
}

function createEmptyResult(department: string, month: string = "") {
  const qValues: any = {};
  for (let i = 0; i <= 9; i++) {
    qValues[`Q${i}`] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0, RATE: 'N/A' };
  }
  return {
    department,
    month,
    collection: 0,
    visitor: 0,
    gender: { Male: 0, Female: 0, LGBTQ: 0, Others: 0 },
    clientType: { Citizen: 0, Business: 0, Government: 0, Others: 0 },
    overrate: 'N/A',
    sysRate: 'N/A',
    staffRate: 'N/A',
    awareCount: 0,
    visibleCount: 0,
    helpfulCount: 0,
    cc1: { Yes: 0, "Just Now": 0, No: 0 },
    cc2: { Visible: 0, "Somewhat Visible": 0, "Difficult to see": 0, "Not Visible": 0, "N/A": 0 },
    cc3: { "Very Much": 0, Somewhat: 0, "Did Not Help": 0, "N/A": 0 },
    qValues,
    comments: { positive: [], negative: [], suggestions: [] },
    dateCollected: "",
    collectionRate: "0.00%"
  };
}
