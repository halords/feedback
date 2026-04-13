import { db } from "@/lib/firebase/admin";
import { resolveTargetOffices, SATELLITE_GROUPS } from "./aggregatorService";
import {
  calculateQuestionRate,
  calculateSatisfactionAverages,
  calculateCollectionRate,
  QValues
} from "./analyticsService";

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
}

export async function getDashboardMetrics(offices: string[], month: string | string[], year: string): Promise<DashboardMetrics[]> {
  if (!Array.isArray(offices)) return [];
  const resolvedOffices = resolveTargetOffices(offices);
  const monthArray = Array.isArray(month) ? month : [month];
  const results: DashboardMetrics[] = [];

  for (const m of monthArray) {
    const offlineData = await getOfflineReport(resolvedOffices, m, year);
    const onlineData = await getOnlineReport(resolvedOffices, m, year);

    for (const office of resolvedOffices) {
      const offline = offlineData[office] || createEmptyResult(office, m);
      const online = onlineData[office] || createEmptyResult(office, m);

      const merged = mergeReports(offline, online, m);
      results.push(merged);
    }
  }

  return results;
}

async function getOnlineReport(offices: string[], month: string, year: string) {
  const results: any = {};
  offices.forEach(o => results[o] = createEmptyResult(o));

  // Firestore "in" query limit is 30. We chunk the offices.
  const CHUNK_SIZE = 30;
  const officeChunks = [];
  for (let i = 0; i < offices.length; i += CHUNK_SIZE) {
    officeChunks.push(offices.slice(i, i + CHUNK_SIZE));
  }

  const queryPromises = officeChunks.map(chunk =>
    db.collection('Responses')
      .where('Office', 'in', chunk)
      .get()
  );

  const snapshots = await Promise.all(queryPromises);

  snapshots.forEach(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.Date);
      const docMonth = date.toLocaleString('en-US', { month: 'long' });
      const docYear = date.getFullYear().toString();

      if (docMonth === month && docYear === year) {
        const office = data.Office;
        if (!results[office]) return;

        // Increment collection counts
        results[office].collection++;
        results[office].visitor++;

        // Increment Gender
        const gender = data.Gender || 'Others';
        results[office].gender[gender] = (results[office].gender[gender] || 0) + 1;

        // QValues processing
        for (let i = 0; i <= 9; i++) {
          const qKey = `Q${i}`;
          const val = data[qKey];
          if (val === 0 || val === '0' || !val) {
            results[office].qValues[qKey].NA++;
          } else {
            results[office].qValues[qKey][String(val)]++;
          }
        }

        // Client Type
        const ct = data.Client_Type || 'Others';
        results[office].clientType[ct] = (results[office].clientType[ct] || 0) + 1;

        // Comments
        const cls = (data.Class || "positive").toLowerCase();
        if (data.Comment) {
          if (cls === "negative") results[office].comments.negative.push(data.Comment);
          else if (cls === "suggestion") results[office].comments.suggestions.push(data.Comment);
          else results[office].comments.positive.push(data.Comment);
        }

        // CC Awareness (Online)
        const cc1 = data.CC1 || 'N/A';
        if (results[office].cc1[cc1] !== undefined) results[office].cc1[cc1]++;

        const cc2 = data.CC2 || 'N/A';
        if (results[office].cc2[cc2] !== undefined) results[office].cc2[cc2]++;

        const cc3 = data.CC3 || 'N/A';
        if (results[office].cc3[cc3] !== undefined) results[office].cc3[cc3]++;
      }
    });
  });

  return results;
}

async function getOfflineReport(offices: string[], month: string, year: string) {
  const results: any = {};
  offices.forEach(o => results[o] = createEmptyResult(o));

  const targetMonthYear = `${month} ${year}`;
  const formattedOffices = offices.map(o => o.replace(/-/g, ' '));

  // Chunking for Firestore "in" query limit (30)
  const CHUNK_SIZE = 30;
  const officeChunks = [];
  for (let i = 0; i < formattedOffices.length; i += CHUNK_SIZE) {
    officeChunks.push(formattedOffices.slice(i, i + CHUNK_SIZE));
  }

  const queryPromises = officeChunks.map(chunk =>
    db.collection('physical_report')
      .where('DEPARTMENT', 'in', chunk)
      .where('FOR_THE_MONTH_OF', '==', targetMonthYear) // Server-side filtering
      .get()
  );

  const snapshots = await Promise.all(queryPromises);

  snapshots.forEach(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data) return;

      const originalOffice = offices.find(o => o.replace(/-/g, ' ') === data.DEPARTMENT?.trim()) || offices[0];
      const res = results[originalOffice];

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

      for (let i = 0; i <= 9; i++) {
        const qKey = `Q${i}`;
        res.qValues[qKey]['1'] += safeInt(data[`${i}1`]);
        res.qValues[qKey]['2'] += safeInt(data[`${i}2`]);
        res.qValues[qKey]['3'] += safeInt(data[`${i}3`]);
        res.qValues[qKey]['4'] += safeInt(data[`${i}4`]);
        res.qValues[qKey]['5'] += safeInt(data[`${i}5`]);
        res.qValues[qKey].NA += safeInt(data[`${i}NA`]);
      }

      // CC Awareness (Offline)
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

      if (data.COMMENTS) {
        if (Array.isArray(data.COMMENTS)) res.comments.positive.push(...data.COMMENTS);
        else res.comments.positive.push(String(data.COMMENTS));
      }

      if (data.DATE_COLLECTED) {
        let date: Date | null = null;
        if (data.DATE_COLLECTED && typeof data.DATE_COLLECTED.toDate === 'function') {
          date = data.DATE_COLLECTED.toDate();
        } else if (data.DATE_COLLECTED instanceof Date) {
          date = data.DATE_COLLECTED;
        } else if (typeof data.DATE_COLLECTED === 'string') {
          const d = new Date(data.DATE_COLLECTED);
          if (!isNaN(d.getTime())) date = d;
        }

        if (date) {
          res.dateCollected = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
          });
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
    clientType: { Citizen: 0, Business: 0, Government: 0 },
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
