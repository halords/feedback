import { NextResponse } from "next/server";
import { getAllOffices } from "@/lib/services/officeService";

export async function GET() {
  try {
    const offices = await getAllOffices();
    return NextResponse.json(offices, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59', // Cache for 1hr, swr for 1min
      }
    });
  } catch (error) {
    console.error("API error fetching offices:", error);
    return NextResponse.json({ error: "Failed to fetch offices" }, { status: 500 });
  }
}
