import { getDashboardMetrics } from "@/lib/services/metricsService";
import { getAllOfficeAssignees } from "@/lib/services/officeService";
import { generateIndividualReport, mergeReportPDFs, ReportData } from "@/lib/reports/pdfGenerator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return new Response("Missing parameters", { status: 400 });
    }

    // 1. Fetch metrics for ALL offices
    const allMetrics = await getDashboardMetrics(["ALL"], month, year);
    if (!allMetrics || allMetrics.length === 0) {
      return new Response("No data found for the selected period", { status: 404 });
    }

    // 2. Fetch all office assignees for signatures
    const assigneeMap = await getAllOfficeAssignees();

    const pdfBuffers: Uint8Array[] = [];

    // Filter and Sort
    const activeMetrics = allMetrics.filter(m => m.collection > 0);
    activeMetrics.sort((a, b) => a.department.localeCompare(b.department));

    for (const data of activeMetrics) {
      const assigneeName = (assigneeMap.get(data.department) || "__________________________").toUpperCase();

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

      const pdfBytes = await generateIndividualReport(reportData);
      pdfBuffers.push(pdfBytes);
    }

    if (pdfBuffers.length === 0) {
      return new Response("No collection found for any office", { status: 404 });
    }

    const mergedPdfBytes = await mergeReportPDFs(pdfBuffers);

    return new Response(Buffer.from(mergedPdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Bulk Report API error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
