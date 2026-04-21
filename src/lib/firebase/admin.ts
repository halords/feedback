import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fir-7db1b';

if (!getApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

    if (serviceAccountJson && serviceAccountJson.length > 20) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id || projectId,
                storageBucket,
            });
        } catch (e) {
            console.error("❌ Firebase Admin init error (Service Account):", e);
            initializeApp({ projectId, storageBucket });
        }
    } else {
        // Use Application Default Credentials (Standard for Cloud Functions)
        initializeApp({
            projectId,
            storageBucket,
        });
    }
}

// These are exported as singletons
const app = getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { admin };


