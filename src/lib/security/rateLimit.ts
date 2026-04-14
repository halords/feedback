/**
 * Simple in-memory rate limiter for serverless environments.
 * Note: Since this is in-memory, counts are per-instance.
 */

interface RateRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateRecord>();

// Periodically clean up expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000 * 5); // Every 5 minutes
}

export function checkRateLimit(ip: string, limit: number, windowMs: number): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    const newRecord = {
      count: 1,
      resetAt: now + windowMs
    };
    rateLimitMap.set(ip, newRecord);
    return { success: true, limit, remaining: limit - 1, reset: newRecord.resetAt };
  }

  record.count++;
  
  if (record.count > limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt };
  }

  return { success: true, limit, remaining: limit - record.count, reset: record.resetAt };
}
