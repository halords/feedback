/**
 * 🚀 DATA NORMALIZATION MIGRATION
 * -----------------------------------------------
 * Populates 'officeId' across all collections based on legacy name fields.
 * Collections affected: Responses, physical_report, office_assignment, user_data
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 🛠️ Manual .env.local parser (Logic synced with fetch-negative-comments.js)
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

let serviceAccount;
try {
  serviceAccount = require('../service-account.json');
} catch (e) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
    } catch (e) {
        console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY from .env.local.");
        process.exit(1);
    }
  } else {
    console.error("❌ No service account found in service-account.json or .env.local");
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrateNormalization() {
  console.log("Starting Data Normalization Migration (Document ID Resolution)...");

  // 1. Build an in-memory map of Acronym -> Document ID
  const officeMap = new Map();
  const officeSnapshot = await db.collection("offices").get();
  officeSnapshot.forEach(doc => {
    const data = doc.data();
    const acronym = (data.name || data.Office || doc.id).toUpperCase();
    officeMap.set(acronym, doc.id);
  });

  // Helper for robust matching (Stripping spaces/hyphens)
  const resolveRobustId = (rawName) => {
    if (!rawName) return null;
    const name = rawName.toUpperCase();
    if (officeMap.has(name)) return officeMap.get(name);
    
    const normalized = name.replace(/[-\s]/g, "");
    for (const [key, value] of officeMap.entries()) {
        if (key.replace(/[-\s]/g, "") === normalized) return value;
    }
    
    // Partial Match for sub-units (e.g., OPA-ASMU -> OPA)
    if (name.includes("-")) {
        const parent = name.split("-")[0];
        if (officeMap.has(parent)) return officeMap.get(parent);
    }

    return null;
  };

  console.log(`Loaded ${officeMap.size} offices for mapping.`);

  const collections = [
    { name: "Responses", nameField: "Office", idField: "officeId" },
    { name: "physical_report", nameField: "DEPARTMENT", idField: "officeId" },
    { name: "office_assignment", nameField: "office", idField: "officeId" },
    { name: "user_data", nameField: "office", idField: "officeId" }
  ];

  for (const col of collections) {
    console.log(`Processing collection: ${col.name}...`);
    let count = 0;
    let lastDoc = null;

    while (true) {
      let query = db.collection(col.name).limit(500);
      if (lastDoc) query = query.startAfter(lastDoc);

      const snapshot = await query.get();
      if (snapshot.empty) break;

      const batch = db.batch();
      let batchSize = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data[col.idField]) {
            const legacyName = data[col.nameField];
            const resolvedId = resolveRobustId(legacyName);
            
            if (resolvedId) {
                batch.update(doc.ref, { [col.idField]: resolvedId });
                batchSize++;
                count++;
            } else if (legacyName) {
                console.warn(`⚠️ Unresolved: "${legacyName}" in ${col.name}/${doc.id}`);
            }
        }
      });

      if (batchSize > 0) {
        await batch.commit();
        console.log(`Updated ${count} records in ${col.name}...`);
      }

      if (snapshot.size < 500) break;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }
  }

  console.log("\nALL COLLECTIONS NORMALIZED! 🚀");
  process.exit(0);
}

migrateNormalization().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
