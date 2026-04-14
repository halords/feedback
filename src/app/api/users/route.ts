import { NextResponse } from "next/server";
import { getAllUsers, addUser } from "@/lib/services/userService";
import { verifySuperadmin } from "@/lib/auth/verifySession";
import { logAction } from "@/lib/services/auditService";

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

    const userData = await request.json();
    
    // Basic validation
    const { idno, full_name, user_type } = userData;
    if (!idno || !full_name || !user_type) {
      return NextResponse.json({ error: "Missing required fields (idno, full_name, user_type)" }, { status: 400 });
    }

    const result = await addUser(userData);

    // 2. Audit Log
    await logAction(admin.idno, "USER_CREATED", { newUserId: idno, fullName: full_name });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === 'Forbidden') return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[API/Users] POST Error:", error);
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}
