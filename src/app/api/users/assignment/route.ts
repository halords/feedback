import { NextResponse } from "next/server";
import { updateAssignments } from "@/lib/services/userService";

/**
 * POST /api/users/assignment
 * Replaces a user's office access assignments.
 */
export async function POST(request: Request) {
  try {
    const { idno, offices } = await request.json();

    if (!idno || !Array.isArray(offices)) {
      return NextResponse.json({ error: "Missing required fields (idno string, offices array)" }, { status: 400 });
    }

    const result = await updateAssignments(idno, offices);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API/Users/Assignment] POST Error:", error);
    return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 });
  }
}
