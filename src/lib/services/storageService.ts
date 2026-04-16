import { storage } from "@/lib/firebase/admin";

/**
 * Fetches a JSON archive from Firebase Storage.
 * @param path The relative path in the bucket (e.g., 'archives/2025/March/metrics.json')
 * @returns The parsed JSON object or null if it doesn't exist.
 */
export async function getJsonArchive<T>(path: string): Promise<T | null> {
  try {
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(path);
    
    const [exists] = await file.exists();
    if (!exists) return null;

    const [content] = await file.download();
    return JSON.parse(content.toString()) as T;
  } catch (error) {
    console.error(`Error fetching archive at ${path}:`, error);
    return null;
  }
}
