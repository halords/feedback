import { db } from "@/lib/firebase/admin";

export interface DashboardMetrics {
  department: string;
  collection: number;
  visitor: number;
  overrate: string;
  qValues: Record<string, any>;
  gender: Record<string, number>;
  clientType: Record<string, number>;
  comments: {
    positive: string[];
    negative: string[];
    suggestions: string[];
  };
}

export async function getDashboardMetrics(offices: string[], month: string, year: string): Promise<DashboardMetrics[]> {
  const offlineData = await getOfflineReport(offices, month, year);
  const onlineData = await getOnlineReport(offices, month, year);

  const results: DashboardMetrics[] = [];

  for (const office of offices) {
    const offline = offlineData[office] || createEmptyResult(office);
    const online = onlineData[office] || createEmptyResult(office);

    const merged = mergeReports(offline, online);
    results.push(merged);
  }

  return results;
}

async function getOnlineReport(offices: string[], month: string, year: string) {
  const results: any = {};
  offices.forEach(o => results[o] = createEmptyResult(o));

  // Batch query can only handle up to 30 'in' filters, but legacy uses 10 for compatibility
  const snapshot = await db.collection('Responses')
    .where('Office', 'in', offices)
    .get();

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
      for (let i = 1; i <= 9; i++) {
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
    }
  });

  return results;
}

async function getOfflineReport(offices: string[], month: string, year: string) {
  const results: any = {};
  offices.forEach(o => results[o] = createEmptyResult(o));

  const targetMonthYear = `${month} ${year}`;
  const formattedOffices = offices.map(o => o.replace(/-/g, ' '));

  const snapshot = await db.collection('physical_report')
    .where('DEPARTMENT', 'in', formattedOffices)
    .get();

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.FOR_THE_MONTH_OF !== targetMonthYear) return;

    const originalOffice = offices.find(o => o.replace(/-/g, ' ') === data.DEPARTMENT?.trim()) || offices[0];
    const res = results[originalOffice];

    res.collection += parseInt(data.COLLECTED_FORMS || 0);
    res.visitor += parseInt(data.VISITORS || 0);
    res.gender.Male += parseInt(data.MALE || 0);
    res.gender.Female += parseInt(data.FEMALE || 0);
    res.gender.LGBTQ += parseInt(data.LGBTQ || 0);
    res.gender.Others += parseInt(data.PREFER_NOT_TO_SAY || 0);

    for (let i = 1; i <= 9; i++) {
      const qKey = `Q${i}`;
      res.qValues[qKey]['1'] += parseInt(data[`${i}1`] || 0);
      res.qValues[qKey]['2'] += parseInt(data[`${i}2`] || 0);
      res.qValues[qKey]['3'] += parseInt(data[`${i}3`] || 0);
      res.qValues[qKey]['4'] += parseInt(data[`${i}4`] || 0);
      res.qValues[qKey]['5'] += parseInt(data[`${i}5`] || 0);
      res.qValues[qKey].NA += parseInt(data[`${i}NA`] || 0);
    }

    if (data.COMMENTS) {
      if (Array.isArray(data.COMMENTS)) res.comments.positive.push(...data.COMMENTS);
      else res.comments.positive.push(String(data.COMMENTS));
    }
  });

  return results;
}

function mergeReports(offline: any, online: any): DashboardMetrics {
  const qValues: any = {};
  
  for (let i = 1; i <= 9; i++) {
    const key = `Q${i}`;
    const q1 = offline.qValues[key]['1'] + online.qValues[key]['1'];
    const q2 = offline.qValues[key]['2'] + online.qValues[key]['2'];
    const q3 = offline.qValues[key]['3'] + online.qValues[key]['3'];
    const q4 = offline.qValues[key]['4'] + online.qValues[key]['4'];
    const q5 = offline.qValues[key]['5'] + online.qValues[key]['5'];
    const qNA = offline.qValues[key].NA + online.qValues[key].NA;

    const total = offline.collection + online.collection;
    const denominator = total - qNA;
    const rate = denominator > 0 ? ((q4 + q5) / denominator * 100).toFixed(2) + '%' : 'N/A';

    qValues[key] = { '1': q1, '2': q2, '3': q3, '4': q4, '5': q5, NA: qNA, RATE: rate };
  }

  // Calculate Overrate
  const parseRate = (r: string) => r === 'N/A' ? 0 : parseFloat(r);
  const q1Rate = parseRate(qValues.Q1.RATE);
  
  let sysSum = 0, sysCount = 0;
  for (let i = 2; i <= 6; i++) {
    const r = qValues[`Q${i}`].RATE;
    if (r !== 'N/A') { sysSum += parseRate(r); sysCount++; }
  }
  const sysRate = sysCount > 0 ? sysSum / sysCount : 0;

  let staffSum = 0, staffCount = 0;
  for (let i = 7; i <= 9; i++) {
    const r = qValues[`Q${i}`].RATE;
    if (r !== 'N/A') { staffSum += parseRate(r); staffCount++; }
  }
  const staffRate = staffCount > 0 ? staffSum / staffCount : 0;

  const overrateValue = (q1Rate + sysRate + staffRate) / 3;
  const overrate = overrateValue > 0 ? overrateValue.toFixed(2) + '%' : 'N/A';

  return {
    department: offline.department,
    collection: offline.collection + online.collection,
    visitor: offline.visitor + online.visitor,
    overrate,
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
    }
  };
}

function createEmptyResult(department: string) {
  const qValues: any = {};
  for (let i = 1; i <= 9; i++) {
    qValues[`Q${i}`] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0, RATE: 'N/A' };
  }
  return {
    department,
    collection: 0,
    visitor: 0,
    gender: { Male: 0, Female: 0, LGBTQ: 0, Others: 0 },
    clientType: { Citizen: 0, Business: 0, Government: 0 },
    qValues,
    comments: { positive: [], negative: [], suggestions: [] }
  };
}
