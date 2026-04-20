import { NextResponse } from "next/server";
import { updateUserAnalyticsFlag } from "@/lib/services/userService";
import { logAction } from "@/lib/services/auditService";
import { validateUserPatchInput } from "@/lib/validation/apiSchemas";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * PATCH /api/users/[id]
 * Updates specific user flags (e.g., analyticsEnabled).
 * Restricted to Super Admins only.
 */
export const PATCH = withAuth(async (request, { params }, admin) => {
  const { id } = await params;
  try {
    const body = await request.clone().json();
    const result = validateUserPatchInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { analyticsEnabled } = result.data!;

    const updateResult = await updateUserAnalyticsFlag(id, analyticsEnabled);

    // Audit Log
    await logAction(admin.idno, "USER_ANALYTICS_UPDATED", { 
      targetUserId: id, 
      analyticsEnabled 
    });

    return NextResponse.json(updateResult);
  } catch (error: any) {
    console.error(`[API/Users/${id}] PATCH Error:`, error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}, { role: "superadmin" });
