import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie } from "@/lib/auth/verifySession";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { logAction } from "@/lib/services/auditService";

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting (5 attempts per 15 minutes)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "login", 5, 15 * 60 * 1000);
    
    if (!ratelimit.success) {
      return NextResponse.json({ 
        error: "Too many login attempts. Please try again later.",
        reset: ratelimit.reset
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': ratelimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': ratelimit.reset.toString()
        }
      });
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // 1. Fetch user by username
    const userSnapshot = await db.collection("users").where("username", "==", username).get();
    if (userSnapshot.empty) {
      // Use generic error message for security
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const userData = userSnapshot.docs[0].data();
    const uid = userSnapshot.docs[0].id;

    // 2. Validate password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // 3. Fetch profile data from user_data
    const userInfoSnapshot = await db.collection("user_data").where("idnumber", "==", userData.idno).get();
    const profileData = !userInfoSnapshot.empty ? userInfoSnapshot.docs[0].data() : {};
    const fullName = profileData.full_name || "Unknown User";
    const isAnalyticsEnabled = !!profileData.is_analytics_enabled;

    // 4. Fetch office assignments
    const officeSnapshot = await db.collection("office_assignment").where("idno", "==", userData.idno).get();
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
      idno: userData.idno,
      email: userData.email || "",
      username: userData.username,
      user_type: userData.user_type,
      full_name: fullName,
      offices: [...new Set(offices)],
      requiresPasswordChange: userData.requiresPasswordChange === true,
      is_analytics_enabled: isAnalyticsEnabled,
    };

    // 5. Create Session Token
    const token = await createSessionToken(sessionUser as any);

    // 6. Build response and set cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: sessionUser,
    });

    setSessionCookie(response, token);

    // 7. Audit Log
    await logAction(userData.idno, "LOGIN", { username: userData.username });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
