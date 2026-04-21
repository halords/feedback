import admin from 'firebase-admin';

/**
 * Optimized Firebase Admin Singleton for Next.js 15
 * 
 * Uses a Proxy for lazy initialization (prevents startup crashes)
 * and globalThis for persistence (prevents duplicate app errors during hot-reloads).
 */

const globalForFirebase = globalThis as unknown as {
  __firebaseApp?: admin.app.App;
};

const ensureInitialized = () => {
  if (globalForFirebase.__firebaseApp) return globalForFirebase.__firebaseApp;
  
  if (admin.apps.length > 0) {
    globalForFirebase.__firebaseApp = admin.app();
    return globalForFirebase.__firebaseApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fir-7db1b';
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
  const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  try {
    let app: admin.app.App;
    
    if (serviceAccountJson && serviceAccountJson.length > 20) {
      const sa = JSON.parse(serviceAccountJson);
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      
      app = admin.initializeApp({
        credential: admin.credential.cert(sa),
        projectId: sa.project_id || projectId,
        storageBucket
      });
    } else {
      // Standard Application Default Credentials
      app = admin.initializeApp({
        storageBucket,
        projectId
      });
    }
    
    globalForFirebase.__firebaseApp = app;
    return app;
  } catch (err: any) {
    if (!/already exists/.test(err.message)) {
      console.error('❌ Firebase Admin init error:', err);
    }
    globalForFirebase.__firebaseApp = admin.app();
    return globalForFirebase.__firebaseApp;
  }
};

// Lazy Getters
export const db = new Proxy({} as admin.firestore.Firestore, {
  get: (_, prop) => {
    const instance = ensureInitialized().firestore();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const auth = new Proxy({} as admin.auth.Auth, {
  get: (_, prop) => {
    const instance = ensureInitialized().auth();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const storage = new Proxy({} as admin.storage.Storage, {
  get: (_, prop) => {
    const instance = ensureInitialized().storage();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export { admin };


