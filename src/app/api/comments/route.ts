import { NextResponse } from "next/server";
import { getManagedComments, syncComments } from "@/lib/services/commentManagementService";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/comments
 * Lists managed comments with optional filters.
 * Restricted to Superadmins.
 */
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const year = searchParams.get("year") || undefined;
    const sentiment = searchParams.get("sentiment") || undefined;
    const status = searchParams.get("status") || undefined;

    const comments = await getManagedComments({ month, year, sentiment, status });
    return NextResponse.json(comments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}, { role: 'superadmin' });

/**
 * POST /api/comments
 * Triggers re-sync of comments from source.
 * Restricted to Superadmins.
 */
export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const result = await syncComments(body.force === true);
    return NextResponse.json({ success: true, synced: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}, { role: 'superadmin' });
