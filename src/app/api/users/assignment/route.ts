import { NextResponse } from "next/server";
import { updateAssignments } from "@/lib/services/userService";
import { withAuth } from "@/lib/auth/withAuth";
import { validateOfficeAssignmentInput } from "@/lib/validation/apiSchemas";

/**
 * POST /api/users/assignment
 * Replaces a user's office access assignments.
 * Restricted to Superadmins.
 */
export const POST = withAuth(async (request) => {
  try {
    const body = await request.clone().json();
    const result = validateOfficeAssignmentInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { idno, offices } = result.data!;
    const assignmentResult = await updateAssignments(idno, offices);
    return NextResponse.json(assignmentResult);
  } catch (error) {
    console.error("[API/Users/Assignment] POST Error:", error);
    return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 });
  }
}, { role: 'superadmin' });
