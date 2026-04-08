const admin = require("firebase-admin");

// Init once
if (!admin.apps.length) {
  const serviceAccount = require("./serviceAccount.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

const OFFICE_MAP = {
  PESU: "PESO"
};

async function updateCollection(collectionName, fieldName) {
  const snapshot = await db.collection(collectionName).get();

  let batch = db.batch();
  let ops = 0;
  let updated = 0;

  // 🔢 Counter per office
  const counters = {};

  for (const doc of snapshot.docs) {
    const value = doc.get(fieldName);
        
    if (OFFICE_MAP[value]) {
      // Count per office
      counters[value] = (counters[value] || 0) + 1;

      // =======================
      // DRY RUN MODE START
      // =======================
      // console.log(
      //   `[DRY RUN] ${collectionName}/${doc.id}: ${value} → ${OFFICE_MAP[value]}`
      // );
      // continue;
      // =======================
      // DRY RUN MODE END
      // =======================

      
      // ===== REAL UPDATE (UNCOMMENT AFTER DRY RUN) =====
      batch.update(doc.ref, {
        [fieldName]: OFFICE_MAP[value],
      });

      ops++;
      updated++;

      if (ops === 500) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
      
    }
  }

  
  if (ops > 0) {
    await batch.commit();
  }

  console.log(`\n📊 ${collectionName} summary:`);
  for (const oldOffice in counters) {
    console.log(
      `  ${oldOffice} → ${OFFICE_MAP[oldOffice]} : ${counters[oldOffice]}`
    );
  }

  console.log(`✅ ${collectionName}: total affected ${updated}\n`);
}

async function run() {
  await updateCollection("Responses", "Office");
  await updateCollection("physical_report", "DEPARTMENT");
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
