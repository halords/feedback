/**
 * scripts/add-user.js
 * 
 * Usage: node scripts/add-user.js <email> <password> "<full_name>"
 * Example: node scripts/add-user.js 12345@feedback.internal p@ssword "John Doe"
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

async function createUser() {
  const [,, email, password, fullName] = process.argv;

  if (!email || !password) {
    console.error("Usage: node scripts/add-user.js <email> <password> [full_name]");
    process.exit(1);
  }

  const idno = email.split('@')[0];
  const name = fullName || "New User";

  try {
    console.log(`[Adding User] Email: ${email}...`);

    // 1. Create User in Firebase Authentication
    // We set the UID to the idno for system consistency as requested in previous steps.
    const user = await auth.createUser({
      uid: idno,
      email: email,
      password: password,
      displayName: name,
    });

    console.log(`Successfully created Auth user with UID: ${user.uid}`);

    // 2. Set Custom Claims (Role and metadata)
    await auth.setCustomUserClaims(user.uid, {
      idno: idno,
      user_type: "Office Admin", // Default to Office Admin
      full_name: name,
      is_analytics_enabled: false
    });

    console.log(`Set custom claims for UID: ${user.uid}`);

    // 3. Create Placeholder Firestore Entry if user info isn't already there
    // This allows the metadata fallback in getSessionUser to work immediately.
    const userRef = db.collection('users').doc();
    await userRef.set({
      idno: idno,
      username: idno,
      user_type: "Office Admin",
      password: "ENCRYPTED_IN_AUTH", // The real password is in Firebase Auth
      createdAt: new Date().toISOString()
    });

    const profileRef = db.collection('user_data').doc();
    await profileRef.set({
      idnumber: idno,
      full_name: name,
      office: "Unknown",
      position: "Admin",
      is_analytics_enabled: false,
      createdAt: new Date().toISOString()
    });

    console.log(`Successfully created Firestore records for ${idno}`);
    console.log("\nUser is ready to log in!");

  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }
}

createUser();
