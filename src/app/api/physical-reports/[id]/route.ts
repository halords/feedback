import { NextResponse } from "next/server";
import { updatePhysicalReport } from "@/lib/services/physicalReportService";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * PUT /api/physical-reports/[id]
 * Updates an existing physical report.
 * Restricted to Superadmins.
 */
export const PUT = withAuth(async (request, { params }) => {
  try {
    const { id } = await params;
    
    let data;
    try {
      data = await request.clone().json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const result = await updatePhysicalReport(id, data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API error updating physical report:", error);
    return NextResponse.json({ error: "Failed to update physical report" }, { status: 500 });
  }
}, { role: "superadmin" });
