import { NextResponse } from "next/server";
import { verifySuperadmin } from "@/lib/auth/verifySession";
import { updatePhysicalReport } from "@/lib/services/physicalReportService";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifySuperadmin();
    const { id } = await params;
    
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const result = await updatePhysicalReport(id, data);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }
    console.error("API error updating physical report:", error);
    return NextResponse.json({ error: "Failed to update physical report" }, { status: 500 });
  }
}
