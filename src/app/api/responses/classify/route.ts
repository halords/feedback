import { NextResponse } from "next/server";
import { classifyComments } from "@/lib/services/responseService";

export async function POST(request: Request) {
  try {
    const { assignments } = await request.json();

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ error: "Invalid classification data" }, { status: 400 });
    }

    // Note: In a production environment, we should verify the user's role 
    // and whether they are assigned to the offices of the comments being simplified.

    await classifyComments(assignments);
    return NextResponse.json({ success: true, message: "Classifications updated" });
  } catch (error) {
    console.error("API Error in /api/responses/classify:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
