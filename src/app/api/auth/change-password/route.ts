import { NextResponse } from "next/server";
import { verifySession, createSessionToken, setSessionCookie } from "@/lib/auth/verifySession";
import { db } from "@/lib/firebase/admin";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/services/auditService";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { validateChangePasswordInput } from "@/lib/validation/apiSchemas";

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting (5 attempts per 15 minutes)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "auth_password_change", 5, 900000);

    if (!ratelimit.success) {
      return NextResponse.json({ 
        error: "Too many attempts. Please try again in 15 minutes.",
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': ratelimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': ratelimit.reset.toString()
        }
      });
    }

    const user = await verifySession();
    const body = await request.json();
    const result = validateChangePasswordInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data!;

    // 1. Fetch user from 'users' collection
    // Using UID (Doc ID) is faster and more reliable than a query
    const userDocRef = db.collection("users").doc(user.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    // 3. Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await userDoc.ref.update({
      password: hashedNewPassword,
      requiresPasswordChange: false,
      updatedAt: new Date().toISOString()
    });

    // 4. Audit Log
    await logAction(user.idno, "PASSWORD_CHANGE");

    // 5. Update Session Token (Clear the requiresPasswordChange flag)
    const updatedUser = { ...user, requiresPasswordChange: false };
    const newToken = await createSessionToken(updatedUser);
    
    const response = NextResponse.json({ 
      success: true, 
      message: "Password updated successfully",
      user: updatedUser 
    });

    setSessionCookie(response, newToken);

    return response;

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
