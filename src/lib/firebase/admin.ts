import admin from 'firebase-admin';

/**
 * Simplified Firebase Admin Initialization
 */

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fir-7db1b';
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

function getInitializedApp() {
  // 1. Return existing app if already there
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // 2. Initialize new app
  const isProduction = process.env.NODE_ENV === 'production';
  const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  try {
    if (!isProduction && serviceAccountJson && serviceAccountJson.trim().startsWith('{')) {
      const sa = JSON.parse(serviceAccountJson);
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');

      return admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id || projectId,
        storageBucket
      });
    } else {
      // Production: use ADC
      return admin.initializeApp({
        storageBucket,
        projectId
      });
    }
  } catch (error: any) {
    if (error.code === 'app/duplicate-app' || /already exists/.test(error.message)) {
      return admin.app();
    }
    console.error("Critical Firebase Admin Init Error:", error);
    throw error;
  }
}

// Initialize immediately so services are ready
const app = getInitializedApp();

export const db = app.firestore();
export const auth = app.auth();
export const storage = app.storage();

export { admin };
