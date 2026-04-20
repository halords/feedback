import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/peek
 * Sample endpoint to test session and data connectivity.
 * Protected by Global Auth.
 */
export const GET = withAuth(async () => {
  try {
    const snapshot = await db.collection("Responses").limit(5).get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      date: doc.data().Date,
      type: typeof doc.data().Date
    }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to peek data" }, { status: 500 });
  }
});
