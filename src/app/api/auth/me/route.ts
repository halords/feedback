import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/verifySession";

export async function GET() {
  try {
    const user = await getSessionUser();
    
    // We return 200 even if no user found to prevent noisy "401 Unauthorized" 
    // red errors in the browser console during legitimate unauthenticated states.
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth Me API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
