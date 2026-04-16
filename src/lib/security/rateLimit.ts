import { db } from "@/lib/firebase/admin";

interface RateRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// ----------------------------------------
// IN-MEMORY FALLBACK (For Sync Contexts)
// ----------------------------------------
const rateLimitMap = new Map<string, RateRecord>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000 * 5);
}

export function checkRateLimit(ip: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    const newRecord = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(ip, newRecord);
    return { success: true, limit, remaining: limit - 1, reset: newRecord.resetAt };
  }

  record.count++;
  if (record.count > limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt };
  }

  return { success: true, limit, remaining: limit - record.count, reset: record.resetAt };
}

// ----------------------------------------
// FIRESTORE DISTRIBUTED LIMITER
// ----------------------------------------
export async function checkRateLimitAsync(ip: string, action: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const docId = `${action}_${ip}`.replace(/\//g, '_'); // Safe ID
  const docRef = db.collection("_system_rate_limits").doc(docId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      
      if (!doc.exists) {
        const resetAt = now + windowMs;
        transaction.set(docRef, { count: 1, resetAt });
        return { success: true, limit, remaining: limit - 1, reset: resetAt };
      }

      const data = doc.data() as RateRecord;
      
      if (now > data.resetAt) {
        // Expired, reset it
        const resetAt = now + windowMs;
        transaction.set(docRef, { count: 1, resetAt });
        return { success: true, limit, remaining: limit - 1, reset: resetAt };
      }

      const newCount = data.count + 1;
      transaction.update(docRef, { count: newCount });

      if (newCount > limit) {
        return { success: false, limit, remaining: 0, reset: data.resetAt };
      }

      return { success: true, limit, remaining: limit - newCount, reset: data.resetAt };
    });

    return result as RateLimitResult;
  } catch (error) {
    console.error("Rate limit transaction failed, falling back to sync:", error);
    // Fallback to in-memory if Firestore fails so legitimate users aren't fully blocked (they might bypass but DB stays up)
    return checkRateLimit(`${action}_${ip}`, limit, windowMs);
  }
}
