import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { verifySuperadmin } from "@/lib/auth/verifySession";

export async function GET() {
  try {
    // 1. Enforce Super Admin only
    await verifySuperadmin();

    const results: any = {};

    // Peek at physical_report
    const pSnapshot = await db.collection("physical_report").limit(3).get();
    results.physical_report = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Peek at Responses
    const rSnapshot = await db.collection("Responses").limit(3).get();
    results.responses = rSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Peek at offices
    const oSnapshot = await db.collection("offices").limit(3).get();
    results.offices = oSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
