import { NextResponse } from "next/server";
import { getAllUsers, addUser } from "@/lib/services/userService";
import { logAction } from "@/lib/services/auditService";
import { validateUserInput } from "@/lib/validation/apiSchemas";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/users
 * Returns joined user profiles for the management table.
 * Restricted to Super Admins only.
 */
export const GET = withAuth(async () => {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("[API/Users] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}, { role: "superadmin" });

/**
 * POST /api/users
 * Adds a new user with default password.
 * Restricted to Super Admins only.
 */
export const POST = withAuth(async (request, context, admin) => {
  try {
    const body = await request.clone().json();
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
    console.error("[API/Users] POST Error:", error);
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}, { role: "superadmin" });
