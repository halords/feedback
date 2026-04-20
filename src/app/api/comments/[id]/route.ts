import { NextResponse } from "next/server";
import { updateCommentAction } from "@/lib/services/commentManagementService";
import { verifySession } from "@/lib/auth/verifySession";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifySession();
    const { id } = await params;
    const body = await request.json();

    const result = await updateCommentAction(id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("API error updating comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
