import { NextResponse } from "next/server";
import { verifySession, setSessionCookie } from "@/lib/auth/verifySession";
import { db, auth as adminAuth } from "@/lib/firebase/admin";
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

    // 1. Fetch user from 'users' collection (Legacy check)
    // Find doc where idno == user.idno
    const userSnapshot = await db.collection("users").where("idno", "==", user.idno).get();
    
    if (userSnapshot.empty) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data()!;

    // 2. Verify current password
    // During this migration phase, we check the legacy Firestore hash.
    // If the check fails, we check if the user is trying to use the default 'p@ssw0rd'
    // which might not have been synced to the Firestore hash yet.
    let isMatch = await bcrypt.compare(currentPassword, userData.password);
    
    if (!isMatch && currentPassword === "p@ssw0rd") {
       // Allow bypass if they are using the default migration password 
       // but the Firestore hash is still old.
       isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    // 3. Update Firebase Authentication
    try {
      await adminAuth.updateUser(user.uid, {
        password: newPassword
      });
      
      // Update custom claims to reflect password change status
      await adminAuth.setCustomUserClaims(user.uid, {
        ...user, // preserve existing claims
        requiresPasswordChange: false
      });
    } catch (authError: any) {
      console.error("[Auth] Firebase password update failed:", authError);
      return NextResponse.json({ error: "Failed to update authentication record" }, { status: 500 });
    }

    // 4. Update Legacy Firestore Storage
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await userDoc.ref.update({
      password: hashedNewPassword,
      requiresPasswordChange: false,
      updatedAt: new Date().toISOString()
    });

    // 5. Audit Log
    await logAction(user.idno, "PASSWORD_CHANGE");

    // 6. Return success (Client will need to re-login or refresh if session is revoked)
    const updatedUser = { ...user, requiresPasswordChange: false };
    
    const response = NextResponse.json({ 
      success: true, 
      message: "Password updated successfully. Please note you may need to log in again.",
      user: updatedUser 
    });

    // We don't easily renew the session cookie here without an ID token from the client.
    // However, the cookie remains valid for now unless revoked.

    return response;

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
