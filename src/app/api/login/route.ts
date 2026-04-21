import { NextResponse } from "next/server";
import { db, auth as adminAuth } from "@/lib/firebase/admin";
import { setSessionCookie } from "@/lib/auth/verifySession";
import { logAction } from "@/lib/services/auditService";
import { validateLoginInput } from "@/lib/validation/apiSchemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateLoginInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { idToken } = result.data!;

    // 1. Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Fetch user metadata from Firestore
    const email = decodedToken.email || "";
    const identifier = email.split('@')[0];

    // Try finding user by idno first, then fall back to username
    let userSnapshot = await db.collection("users").where("idno", "==", identifier).get();
    
    if (userSnapshot.empty) {
      // Fallback: Check if the identifier matches the 'username' field instead
      userSnapshot = await db.collection("users").where("username", "==", identifier).get();
    }
    
    if (userSnapshot.empty) {
      return NextResponse.json({ error: "User profile not found in system" }, { status: 404 });
    }

    const userData = userSnapshot.docs[0].data();
    const idno = userData.idno; // Always use the official idno from Firestore for subsequent lookups

    // 3. Fetch profile data from user_data
    const userInfoSnapshot = await db.collection("user_data").where("idnumber", "==", idno).get();
    const profileData = !userInfoSnapshot.empty ? userInfoSnapshot.docs[0].data() : {};
    const fullName = profileData.full_name || "Unknown User";
    const isAnalyticsEnabled = !!profileData.is_analytics_enabled;

    // 4. Fetch office assignments
    const officeSnapshot = await db.collection("office_assignment").where("idno", "==", idno).get();
    let offices: string[] = [];
    officeSnapshot.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.office)) {
        offices = offices.concat(data.office);
      } else if (typeof data.office === "string") {
        offices.push(data.office);
      }
    });

    const sessionUser = {
      uid: uid,
      idno: idno,
      email: email,
      username: userData.username || idno,
      user_type: userData.user_type,
      full_name: fullName,
      offices: [...new Set(offices)],
      requiresPasswordChange: userData.requiresPasswordChange === true,
      is_analytics_enabled: isAnalyticsEnabled,
    };

    // 5. Enhance Firebase Token with Custom Claims for future verification
    // This allows getSessionUser to return the full profile without Firestore hits
    await adminAuth.setCustomUserClaims(uid, {
      idno: sessionUser.idno,
      username: sessionUser.username,
      user_type: sessionUser.user_type,
      full_name: sessionUser.full_name,
      offices: sessionUser.offices,
      is_analytics_enabled: sessionUser.is_analytics_enabled,
      requiresPasswordChange: sessionUser.requiresPasswordChange
    });

    // 6. Create Firebase Session Cookie (10 hours)
    const expiresIn = 10 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // 7. Build response and set cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: sessionUser,
    });

    setSessionCookie(response, sessionCookie);

    // 8. Audit Log
    await logAction(idno, "LOGIN", { method: "firebase-auth" });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
