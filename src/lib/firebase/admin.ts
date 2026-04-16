import admin from 'firebase-admin';

// Use a singleton pattern to prevent multiple initializations
const initializeAdmin = () => {
  if (admin.apps.length > 0) return admin.app();

  try {
    const isEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fir-7db1b';

    if (isEmulator) {
      return admin.initializeApp({ 
        projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

    } else {
      // In Production, Firebase Admin initializes automatically via environment auth
      return admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  } catch (err: any) {
    if (!/already exists/.test(err.message)) {
      console.error('❌ Firebase Admin init error:', err.message);
    }
    return admin.app();
  }
};

const app = initializeAdmin();
export const db = app.firestore();
export const auth = app.auth();
export const storage = app.storage();
export { admin };


