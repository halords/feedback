import { NextResponse } from "next/server";
import { classifyComments } from "@/lib/services/responseService";
import { verifySession } from "@/lib/auth/verifySession";
import { resolveAuthorizedOffices, hasGlobalAccess } from "@/lib/auth/rbac";
import { db } from "@/lib/firebase/admin";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { validateClassificationInput } from "@/lib/validation/apiSchemas";

export async function POST(request: Request) {
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

    // 1. Authenticate user
    const user = await verifySession();

    const body = await request.json();
    const result = validateClassificationInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { assignments } = result.data!;

    // 2. Enforce RBAC for non-superadmins
    if (!hasGlobalAccess(user)) {
      const authorizedOffices = resolveAuthorizedOffices(user);
      
      // Fetch documents to verify office ownership
      // This preserves Functional Immutability of responseService.ts
      const docRefs = assignments.map(a => db.collection('Responses').doc(a.docId));
      const snapshots = await db.getAll(...docRefs);

      const isUnauthorized = snapshots.some(snap => {
        if (!snap.exists) return true;
        const data = snap.data();
        return !authorizedOffices.includes(data?.Office);
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
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("API Error in /api/responses/classify:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
