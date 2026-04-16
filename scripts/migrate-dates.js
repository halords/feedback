/**
 * scripts/migrate-dates.js
 * 
 * Purpose: Migrates legacy 'Date' strings to a sortable format for improved performance.
 * 
 * Usage: 
 * TO RUN: node scripts/migrate-dates.js
 * (Requires FIREBASE_SERVICE_ACCOUNT_KEY or environment initialized with admin access)
 */

const { initializeApp, cert, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const fs = require('fs');
const path = require('path');

// Function to load env variables from .env.local if they exist
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
  } catch (err) {
    console.warn("Could not load .env.local:", err.message);
  }
}

loadEnvLocal();

try {
  getApp();
} catch (e) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (parseErr) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", parseErr.message);
      initializeApp({ projectId: 'fir-7db1b' });
    }
  } else {
    initializeApp({ projectId: 'fir-7db1b' });
  }
}

const db = getFirestore();

async function migrateDates() {
  console.log("🚀 Starting Date Migration...");
  
  const snapshot = await db.collection('Responses').get();
  console.log(`Found ${snapshot.size} documents in 'Responses'.`);

  const batchSize = 500;
  let batch = db.batch();
  let count = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already migrated
    if (data.date_iso) {
      skipped++;
      continue;
    }

    const rawDate = data.Date;
    if (!rawDate) {
      skipped++;
      continue;
    }

    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) {
      console.warn(`[!] Invalid date found in doc ${doc.id}: ${rawDate}`);
      skipped++;
      continue;
    }

    // Convert to ISO-8601 (YYYY-MM-DD)
    const isoDate = dateObj.toISOString().split('T')[0];
    
    batch.update(doc.ref, { 
      date_iso: isoDate,
      // Optional: Store as native Timestamp for even better indexing
      // date_timestamp: Timestamp.fromDate(dateObj)
    });

    count++;

    if (count % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`[+] Committed ${count} updates...`);
    }
  }

  // Final commit
  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log("──────────────────────────────────────────");
  console.log(`✅ Migration Complete.`);
  console.log(`Updated: ${count} documents`);
  console.log(`Skipped: ${skipped} documents`);
  console.log("──────────────────────────────────────────");
}

migrateDates().catch(console.error);
