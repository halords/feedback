import { NextResponse } from "next/server";
import { verifySuperadmin } from "@/lib/auth/verifySession";
import { updateUserAnalyticsFlag } from "@/lib/services/userService";
import { logAction } from "@/lib/services/auditService";

/**
 * PATCH /api/users/[id]
 * Updates specific user flags (e.g., analyticsEnabled).
 * Restricted to Super Admins only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifySuperadmin();
    const { id } = await params;
    
    const body = await request.json();
    const { analyticsEnabled } = body;

    if (typeof analyticsEnabled !== 'boolean') {
      return NextResponse.json({ error: "Invalid analyticsEnabled flag" }, { status: 400 });
    }

    const result = await updateUserAnalyticsFlag(id, analyticsEnabled);

    // Audit Log
    await logAction(admin.idno, "USER_ANALYTICS_UPDATED", { 
      targetUserId: id, 
      analyticsEnabled 
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === 'Forbidden') return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    console.error(`[API/Users/${params.id}] PATCH Error:`, error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
