import { NextResponse } from "next/server";
import { getAllPhysicalReports, createPhysicalReport } from "@/lib/services/physicalReportService";
import { validatePhysicalReportInput } from "@/lib/validation/apiSchemas";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/physical-reports
 * Returns list of physical reports.
 * Restricted to Superadmins.
 */
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const reports = await getAllPhysicalReports(month, year);
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("API error fetching physical reports:", error);
    return NextResponse.json({ error: "Failed to fetch physical reports" }, { status: 500 });
  }
}, { role: "superadmin" });

/**
 * POST /api/physical-reports
 * Creates a new physical report.
 * Restricted to Superadmins.
 */
export const POST = withAuth(async (request) => {
  try {
    let body;
    try {
      body = await request.clone().json();
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
    console.error("API error creating physical report:", error);
    return NextResponse.json({ error: "Failed to create physical report" }, { status: 500 });
  }
}, { role: "superadmin" });
