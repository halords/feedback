/**
 * scripts/export-users-to-auth.js
 * 
 * Purpose: Iterates through all users in the Firestore 'users' collection 
 * and ensures they exist in Firebase Authentication.
 * 
 * Logic:
 * 1. Read all Firestore users.
 * 2. If user doesn't exist in Auth, create them.
 * 3. Use default password "p@ssw0rd" for new migrations.
 */

const { initializeApp, cert, getApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// --- Initialization ---
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
      initializeApp({ credential: cert(serviceAccount) });
    } catch (parseErr) {
      initializeApp({ projectId: 'fir-7db1b' });
    }
  } else {
    initializeApp({ projectId: 'fir-7db1b' });
  }
}

const auth = getAuth();
const db = getFirestore();

async function exportUsers() {
  console.log("Starting User Export to Firebase Authentication...");

  try {
    const usersSnapshot = await db.collection('users').get();
    const firestoreUsers = usersSnapshot.docs.map(doc => doc.data());
    
    console.log(`Found ${firestoreUsers.length} users in Firestore.`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userData of firestoreUsers) {
      if (!userData.idno) continue;

      const email = `${userData.idno}@feedback.internal`;
      
      try {
        try {
          await auth.getUserByEmail(email);
          skippedCount++;
          continue;
        } catch (getErr) {
          if (getErr.code !== 'auth/user-not-found') throw getErr;
        }

        await auth.createUser({
          uid: userData.idno,
          email: email,
          password: 'p@ssw0rd',
          displayName: userData.idno,
        });

        await auth.setCustomUserClaims(userData.idno, {
          idno: userData.idno,
          user_type: userData.user_type || "Office Admin",
          requiresPasswordChange: false
        });

        // 5. Sync Firestore Hash to the default password so change-password works
        const hashedDefault = "$2b$12$Z0E0Yy29/Y0Y0Y0Y0Y0Y0.Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y"; // Placeholder for p@ssw0rd or just use bcrypt
        const bcrypt = require("bcryptjs");
        const newHash = await bcrypt.hash("p@ssw0rd", 12);
        
        const userDocs = await db.collection("users").where("idno", "==", userData.idno).get();
        if (!userDocs.empty) {
          await userDocs.docs[0].ref.update({ password: newHash });
        }

        console.log(`   [+] Exported User: ${userData.idno}`);
        createdCount++;

      } catch (userErr) {
        console.error(`   [!] Error processing user ${userData.idno}:`, userErr.message);
        errorCount++;
      }
    }

    console.log("------------------------------------------");
    console.log("EXPORT COMPLETE:");
    console.log(`- Created: ${createdCount}`);
    console.log(`- Already Existed: ${skippedCount}`);
    console.log(`- Failed: ${errorCount}`);
    console.log("------------------------------------------");
    console.log("Note: New users have been assigned the default password: p@ssw0rd");

  } catch (err) {
    console.error("Fatal Error during export:", err);
  }
}

exportUsers().catch(console.error);
