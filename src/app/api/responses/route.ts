import { NextResponse } from "next/server";
import { getResponses } from "@/lib/services/responseService";

export async function POST(request: Request) {
  try {
    const { offices, month, year } = await request.json();

    if (!offices || !month || !year) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    console.log(`[API /api/responses] Fetching for: ${month} ${year}, Offices: ${JSON.stringify(offices)}`);
    
    const responses = await getResponses(offices, month, year);
    
    console.log(`[API /api/responses] Found ${responses.length} records.`);
    return NextResponse.json(responses);
  } catch (error) {
    console.error("API Error in /api/responses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
