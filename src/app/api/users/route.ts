import { NextResponse } from "next/server";
import { getAllUsers, addUser } from "@/lib/services/userService";

/**
 * GET /api/users
 * Returns joined user profiles for the management table.
 */
export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("[API/Users] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Adds a new user with default password.
 */
export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Basic validation
    const { idno, full_name, user_type } = userData;
    if (!idno || !full_name || !user_type) {
      return NextResponse.json({ error: "Missing required fields (idno, full_name, user_type)" }, { status: 400 });
    }

    const result = await addUser(userData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API/Users] POST Error:", error);
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}
