import { NextResponse } from "next/server";
import { classifyComments } from "@/lib/services/responseService";
import { db } from "@/lib/firebase/admin";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { validateClassificationInput } from "@/lib/validation/apiSchemas";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * POST /api/responses/classify
 * Updates classifications for multiple feedback entries.
 * Automatically scoped based on user role.
 */
export const POST = withAuth(async (request, context, user, scopedOffices) => {
  try {
    // 0. Rate Limiting (10 attempts per minute)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "response_classify", 10, 60000);

    if (!ratelimit.success) {
      return NextResponse.json({ 
        error: "Too many classify requests. Please try again in a minute.",
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': ratelimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': ratelimit.reset.toString()
        }
      });
    }

    const body = await request.clone().json();
    const result = validateClassificationInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { assignments } = result.data!;

    // 2. Enforce RBAC for non-superadmins
    const type = user.user_type?.toLowerCase().replace(/\s/g, '');
    if (type !== 'superadmin') {
      const docRefs = assignments.map(a => db.collection('Responses').doc(a.docId));
      const snapshots = await db.getAll(...docRefs);

      const isUnauthorized = snapshots.some(snap => {
        if (!snap.exists) return true;
        const data = snap.data();
        const officeId = data?.officeId || data?.Office;
        return !(scopedOffices || []).includes(officeId);
      });

      if (isUnauthorized) {
        return NextResponse.json({ 
          error: "Forbidden: You are not authorized to classify comments outside your assigned offices" 
        }, { status: 403 });
      }
    }

    // 3. Perform classification
    await classifyComments(assignments);
    return NextResponse.json({ success: true, message: "Classifications updated" });
  } catch (error: any) {
    console.error("API Error in /api/responses/classify:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, { requireOfficeScoping: true });
