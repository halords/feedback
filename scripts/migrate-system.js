/**
 * scripts/migrate-system.js
 * 
 * Purpose: A full-scale migration to add sortable ISO fields to BOTH 'Responses' 
 * and 'physical_report' collections to eliminate technical debt.
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
          // Remove quotes if present
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
    // Fallback to project ID
    initializeApp({ projectId: 'fir-7db1b' });
  }
}

const db = getFirestore();

const MONTH_MAP = {
  'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
  'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
  'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
};

async function migrateSystem() {
  console.log("🚀 Starting Full System Migration...");

  // --- 1. RESPONSES MIGRATION ---
  console.log("\n📁 Migrating 'Responses'...");
  const resSnapshot = await db.collection('Responses').get();
  let resCount = 0;
  let batch = db.batch();

  for (const doc of resSnapshot.docs) {
    const data = doc.data();
    if (data.date_iso) continue; // Skip if already done

    const rawDate = data.Date;
    if (!rawDate) continue;

    const dateObj = new Date(rawDate);
    if (!isNaN(dateObj.getTime())) {
      const isoDate = dateObj.toISOString().split('T')[0];
      batch.update(doc.ref, { date_iso: isoDate });
      resCount++;
    }

    if (resCount % 500 === 0 && resCount > 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`   [Responses] Updated ${resCount}...`);
    }
  }
  await batch.commit();
  console.log(`✅ [Responses] Finished: ${resCount} updated.`);


  // --- 2. PHYSICAL REPORTS MIGRATION ---
  console.log("\n📁 Migrating 'physical_report'...");
  const prSnapshot = await db.collection('physical_report').get();
  let prCount = 0;
  batch = db.batch();

  for (const doc of prSnapshot.docs) {
    const data = doc.data();
    if (data.period_iso) continue;

    const rawPeriod = data['FOR_THE_MONTH_OF'] || data['FOR THE MONTH OF'] || ""; // Format: "JANUARY 2025"
    const parts = rawPeriod.trim().split(/\s+/); // Handle multiple spaces
    
    if (parts.length >= 2) {
      const month = parts[0].toUpperCase();
      const year = parts[parts.length - 1]; // Take the last part as the year
      const monthDigit = MONTH_MAP[month];

      if (monthDigit) {
        const periodIso = `${year}-${monthDigit}`;
        batch.update(doc.ref, { period_iso: periodIso });
        prCount++;
      } else {
        console.warn(`[!] Could not parse period for PR ${doc.id}: "${rawPeriod}"`);
      }
    } else if (rawPeriod) {
      console.warn(`[!] Invalid period format for PR ${doc.id}: "${rawPeriod}"`);
    } else {
      // Look for any keys to see if we're missing the field name entirely
      const keys = Object.keys(data).filter(k => k.includes('MONTH') || k.includes('FOR'));
      if (keys.length > 0) {
        console.warn(`[!] Field 'FOR_THE_MONTH_OF' not found in PR ${doc.id}. Found potential candidates: ${keys.join(', ')}`);
      }
    }

    if (prCount % 500 === 0 && prCount > 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`   [physical_report] Updated ${prCount}...`);
    }
  }
  await batch.commit();
  console.log(`✅ [physical_report] Finished: ${prCount} updated.`);

  console.log("\n──────────────────────────────────────────");
  console.log("🏁 TOTAL SYSTEM MIGRATION COMPLETE");
  console.log("──────────────────────────────────────────");
}

migrateSystem().catch(console.error);
