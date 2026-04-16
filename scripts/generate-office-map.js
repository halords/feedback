/**
 * 🛠️ OFFICE MAP GENERATOR
 * -----------------------------------------------
 * Fetches all offices from Firestore and generates a JSON mapping
 * of Acronym (name) to Document ID.
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
        console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY from .env.local. Ensure it is valid JSON.");
        console.error(e);
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

async function generateMap() {
  console.log("Fetching offices from Firestore...");
  const snapshot = await db.collection("offices").get();
  
  const map = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    // Prioritize 'name' field, fall back to doc.id
    const acronym = (data.name || data.Office || doc.id).toUpperCase();
    map[acronym] = doc.id;
  });

  const outputPath = path.join(__dirname, 'office_map.json');
  fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));
  
  console.log(`\n✅ Success! Mapping generated for ${Object.keys(map).length} offices.`);
  console.log(`📄 Saved to: ${outputPath}`);
  process.exit(0);
}

generateMap().catch(err => {
  console.error("Failed to generate map:", err);
  process.exit(1);
});
