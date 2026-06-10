import { NextResponse } from "next/server";
import { getCommentAnalytics, getOfficeAnalytics } from "@/lib/services/commentManagementService";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/comments/analytics
 * Returns detailed analytics for comments for a specific year.
 * Restricted to Superadmins or users with analytics enabled.
 */
export const GET = withAuth(async (request, context, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();
    const office = searchParams.get("office") || undefined;

    // Allow superadmins OR users with comments analytics access
    const isSuperadmin = (user.user_type || "").toLowerCase() === "superadmin";
    const hasCommentsAccess = !!(user as any).is_comments_analytics_enabled;
    if (!isSuperadmin && !hasCommentsAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let analytics;
    if (office) {
      analytics = await getOfficeAnalytics(year, office);
    } else {
      analytics = await getCommentAnalytics(year);
    }
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error("Comment Analytics API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
