import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/verifySession";

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth Me API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
