import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

/**
 * GET /api/auth/resolve-id?username=xxx
 * Returns the official ID Number (idno) for a given username or ID.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier");

  if (!identifier) {
    return NextResponse.json({ error: "Identifier required" }, { status: 400 });
  }

  try {
    // 1. Try finding by idno first (in case they already entered the ID)
    const idnoSnapshot = await db.collection("users").where("idno", "==", identifier).limit(1).get();
    if (!idnoSnapshot.empty) {
      return NextResponse.json({ idno: identifier });
    }

    // 2. Fallback: Try finding by username
    const usernameSnapshot = await db.collection("users").where("username", "==", identifier).limit(1).get();
    if (!usernameSnapshot.empty) {
      const userData = usernameSnapshot.docs[0].data();
      return NextResponse.json({ idno: userData.idno });
    }

    // 3. Not found
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error("ID Resolution Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
