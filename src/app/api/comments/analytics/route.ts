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
}, { role: "superadmin" });
