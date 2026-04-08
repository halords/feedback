import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require('../../../legacy/functions/auth/serviceAccount.json')),
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };
