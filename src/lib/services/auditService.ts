import { db } from "@/lib/firebase/admin";
import { headers } from "next/headers";

export interface AuditLog {
  userId: string;
  action: string;
  details: any;
  timestamp: string;
  ip: string;
  userAgent: string;
}

/**
 * Persists an audit log entry to Firestore.
 */
export async function logAction(
  userId: string,
  action: string,
  details: any = {}
) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    const log: AuditLog = {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
    };

    await db.collection("audit_logs").add(log);
  } catch (error) {
    // We don't want audit logging failures to crash the main request
    console.error("Failed to write audit log:", error);
  }
}
