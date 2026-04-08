import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // 1. Fetch user by username
    const userSnapshot = await db.collection("users").where("username", "==", username).get();
    if (userSnapshot.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.docs[0].data();

    // 2. Validate password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // 3. Fetch full name from user_data
    const userInfoSnapshot = await db.collection("user_data").where("idnumber", "==", userData.idno).get();
    const fullName = !userInfoSnapshot.empty ? userInfoSnapshot.docs[0].data().full_name : "Unknown";

    // 4. Fetch office assignments
    const officeSnapshot = await db.collection("office_assignment").where("idno", "==", userData.idno).get();
    let offices: string[] = [];
    officeSnapshot.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.office)) {
        offices = offices.concat(data.office);
      }
    });

    // 5. Build and return the response
    return NextResponse.json({
      message: "Login successful",
      user: {
        fullname: fullName,
        username: userData.username,
        user_type: userData.user_type,
        offices: [...new Set(offices)], // Unique offices
      },
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
