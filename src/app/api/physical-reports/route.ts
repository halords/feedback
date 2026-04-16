import { NextResponse } from "next/server";
import { verifySuperadmin } from "@/lib/auth/verifySession";
import { getAllPhysicalReports, createPhysicalReport } from "@/lib/services/physicalReportService";
import { validatePhysicalReportInput } from "@/lib/validation/apiSchemas";

export async function GET(request: Request) {
  try {
    await verifySuperadmin();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const reports = await getAllPhysicalReports(month, year);
    return NextResponse.json(reports);
  } catch (error: any) {
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }
    console.error("API error fetching physical reports:", error);
    return NextResponse.json({ error: "Failed to fetch physical reports" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifySuperadmin();
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = validatePhysicalReportInput(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await createPhysicalReport(validation.data!);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }
    console.error("API error creating physical report:", error);
    return NextResponse.json({ error: "Failed to create physical report" }, { status: 500 });
  }
}
