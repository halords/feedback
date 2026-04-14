import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

export async function GET() {
  const snapshot = await db.collection("Responses").limit(5).get();
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    date: doc.data().Date,
    type: typeof doc.data().Date
  }));
  return NextResponse.json(data);
}
