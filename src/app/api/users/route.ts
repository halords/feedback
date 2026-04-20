import { NextResponse } from "next/server";
import { getAllUsers, addUser } from "@/lib/services/userService";
import { verifySuperadmin } from "@/lib/auth/verifySession";
import { logAction } from "@/lib/services/auditService";
import { validateUserInput } from "@/lib/validation/apiSchemas";

/**
 * GET /api/users
 * Returns joined user profiles for the management table.
 * Restricted to Super Admins only.
 */
export async function GET() {
  try {
    // 1. Enforce Super Admin only
    await verifySuperadmin();

    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === 'Forbidden') return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[API/Users] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Adds a new user with default password.
 * Restricted to Super Admins only.
 */
export async function POST(request: Request) {
  try {
    // 1. Enforce Super Admin only
    const admin = await verifySuperadmin();

    const body = await request.json();
    const result = validateUserInput(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const userData = result.data!;
    const addUserResult = await addUser(userData);

    // 2. Audit Log
    await logAction(admin.idno, "USER_CREATED", { newUserId: userData.idno, fullName: userData.full_name });

    return NextResponse.json(addUserResult);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === 'Forbidden') return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[API/Users] POST Error:", error);
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}
