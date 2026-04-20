import { NextResponse } from "next/server";
import { updateCommentAction } from "@/lib/services/commentManagementService";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * PATCH /api/comments/[id]
 * Updates a specific comment's classification or metadata.
 * Restricted to Superadmins.
 */
export const PATCH = withAuth(async (request, { params }) => {
  try {
    const { id } = await params;
    const body = await request.clone().json();

    const result = await updateCommentAction(id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API error updating comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, { role: 'superadmin' });
