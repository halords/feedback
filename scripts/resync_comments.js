const { initializeApp, cert, getApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          process.env[key] = value;
        }
      });
    }
  } catch (err) {}
}
loadEnvLocal();
let app;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
try { app = getApp(); } catch (e) {
  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    app = initializeApp({ credential: cert(serviceAccount), storageBucket: bucketName });
  } else {
    app = initializeApp({ projectId: 'fir-7db1b', storageBucket: bucketName });
  }
}
const db = getFirestore();
const storage = getStorage(app);
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

async function smartResync() {
  console.log("🚀 Starting FINAL CANONICAL-ID BASED Smart Resync...");
  const officeSnap = await db.collection('offices').get();
  const activeOffices = officeSnap.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || doc.data().Office || doc.id,
    status: doc.data().status || "active"
  })).filter(o => o.status === 'active');
  
  let totalCount = 0;
  let batch = db.batch();
  let operationCount = 0;

  const now = new Date();
  const syncPeriods = [];
  for (let y = 2025; y <= now.getFullYear(); y++) {
    for (const m of months) {
      syncPeriods.push({ month: m, year: String(y) });
      if (y === now.getFullYear() && months.indexOf(m) === now.getMonth()) break;
    }
  }

  for (const period of syncPeriods) {
    const monthYearLabel = `${period.month} ${period.year}`;
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    const periodIso = `${period.year}-${monthMap[period.month]}`;
    const archivePath = `archives/${period.year}/${period.month}/metrics.json`;
    const bucket = storage.bucket();
    const file = bucket.file(archivePath);

    const existingSnap = await db.collection("comment_management").where("month", "==", monthYearLabel).get();
    const existingDocs = existingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const claimedDocIds = new Set();
    let archiveData = null;
    try { const [exists] = await file.exists(); if (exists) { const [content] = await file.download(); archiveData = JSON.parse(content.toString()); } } catch (e) {}

    if (archiveData) {
      console.log(`📦 [Archive] ${monthYearLabel}`);
      for (const officeMetrics of archiveData) {
        const officeId = officeMetrics.department;
        const canonical = activeOffices.find(o => o.id.toLowerCase() === officeId.toLowerCase() || o.name.toLowerCase() === officeId.toLowerCase());
        const officeKey = canonical ? canonical.id : officeId; // BACK TO CANONICAL ID

        const sentiments = { Positive: officeMetrics.comments?.positive || [], Negative: officeMetrics.comments?.negative || [], Suggestion: officeMetrics.comments?.suggestions || [] };
        for (const [sentiment, comments] of Object.entries(sentiments)) {
          for (let i = 0; i < comments.length; i++) {
            const commentText = comments[i];
            if (!commentText || commentText.length < 2) continue;
            const matchingDoc = existingDocs.find(d => !claimedDocIds.has(d.id) && d.commentText === commentText && (d.office === officeKey || (canonical && d.office === canonical.name)) && d.sentiment === sentiment);
            const docId = matchingDoc ? matchingDoc.id : `archive_${period.year}_${period.month}_${officeKey}_${sentiment.toLowerCase()}_${i}`;
            const ref = db.collection('comment_management').doc(docId);
            if (matchingDoc) {
              claimedDocIds.add(matchingDoc.id);
              batch.update(ref, { office: officeKey, updatedAt: FieldValue.serverTimestamp() });
            } else {
              batch.set(ref, {
                sourceId: `archive_${period.year}_${period.month}`, sourceCollection: "Archive",
                commentText, sentiment, office: officeKey, month: monthYearLabel,
                date: new Date(`${period.month} 1, ${period.year}`),
                status: "Pending", actionPlan: "", expectedOutcome: "",
                createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
              });
            }
            totalCount++; operationCount++;
            if (operationCount >= 500) { await batch.commit(); batch = db.batch(); operationCount = 0; }
          }
        }
      }
    } else {
      console.log(`☁️ [Firestore] ${monthYearLabel}`);
      const startDateIso = `${periodIso}-01`;
      const endDateIso = `${periodIso}-31`;
      const resSnap = await db.collection("Responses").where("date_iso", ">=", startDateIso).where("date_iso", "<=", endDateIso).get();
      for (const doc of resSnap.docs) {
        const data = doc.data();
        if (!data.Comment || !data.Class) continue;
        const rawOffice = (data.officeId || data.Office || "").trim().toLowerCase();
        const canonical = activeOffices.find(o => o.id.toLowerCase() === rawOffice || o.name.toLowerCase() === rawOffice);
        if (!canonical) continue;
        let sentiment = ""; const rawClass = data.Class.toLowerCase();
        if (rawClass === "positive") sentiment = "Positive";
        else if (rawClass === "negative") sentiment = "Negative";
        else if (rawClass === "suggestion" || rawClass === "suggestions") sentiment = "Suggestion";
        else continue;
        batch.set(db.collection('comment_management').doc(`response_${doc.id}`), {
          sourceId: doc.id, sourceCollection: "Responses",
          commentText: data.Comment, sentiment, office: canonical.id, month: monthYearLabel,
          date: data.Date ? (typeof data.Date === 'string' ? new Date(data.Date) : (data.Date.toDate ? data.Date.toDate() : new Date())) : new Date(),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        totalCount++; operationCount++;
        if (operationCount >= 500) { await batch.commit(); batch = db.batch(); operationCount = 0; }
      }
    }
  }
  await batch.commit();
  console.log("🏁 Resync Complete. Total:", totalCount);
}
smartResync().catch(console.error);
