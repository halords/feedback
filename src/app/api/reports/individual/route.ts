import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { getOfficeAssignee } from "@/lib/services/officeService";
import { generateIndividualReport, ReportData } from "@/lib/reports/pdfGenerator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const office = searchParams.get("office");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!office || !month || !year) {
      return new Response("Missing parameters", { status: 400 });
    }

    // 1. Fetch metrics for this specific office
    const metrics = await getDashboardMetrics([office], month, year);
    if (!metrics || metrics.length === 0) {
      return new Response("No data found for this office", { status: 404 });
    }

    // 2. Fetch assignee name from Firestore
    const assigneeName = (await getOfficeAssignee(office)).toUpperCase();

    const data = metrics[0];

    // 3. Map DashboardMetrics to ReportData
    const reportData: ReportData = {
      department: data.department,
      month: data.month,
      year: year,
      collection: data.collection,
      visitor: data.visitor,
      gender: {
        Male: data.gender.Male,
        Female: data.gender.Female,
        LGBTQ: data.gender.LGBTQ,
        Others: data.gender.Others
      },
      clientType: {
        Citizen: data.clientType.Citizen,
        Business: data.clientType.Business,
        Government: data.clientType.Government
      },
      cc1: data.cc1,
      cc2: data.cc2,
      cc3: data.cc3,
      date_collected: data.dateCollected,
      sysrate: data.sysRate,
      staffrate: data.staffRate,
      overrate: data.overrate,
      qValues: data.qValues,
      comments: data.comments,
      fullname: assigneeName,
      collection_rate: data.collectionRate
    };

    console.log(`[API] Generating individual PDF for ${reportData.department} (Assignee: ${assigneeName})`);

    const pdfBytes = await generateIndividualReport(reportData);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Individual Report API error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
