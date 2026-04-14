import { getDashboardMetrics } from "@/lib/services/metricsService";
import { getAllOfficeAssignees } from "@/lib/services/officeService";
import { generateIndividualReport, mergeReportPDFs, ReportData } from "@/lib/reports/pdfGenerator";
import { logAction } from "@/lib/services/auditService";
import { verifySession } from "@/lib/auth/verifySession";
import { resolveAuthorizedOffices } from "@/lib/auth/rbac";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const search = searchParams.get("search");
    const officesParam = searchParams.get("offices");

    if (!month || !year) {
      return new Response("Missing parameters", { status: 400 });
    }

    const user = await verifySession();

    // 1. Fetch metrics for targeted offices (RBAC aware)
    const officeList = resolveAuthorizedOffices(user, officesParam ? officesParam.split(",") : ["ALL"]);
    const allMetrics = await getDashboardMetrics(officeList, month, year);
    
    if (!allMetrics || allMetrics.length === 0) {
      return new Response("No data found for the selected period", { status: 404 });
    }

    // 2. Fetch all office assignees for signatures
    const assigneeMap = await getAllOfficeAssignees();

    const pdfBuffers: Uint8Array[] = [];

    // Filter and Sort
    let activeMetrics = allMetrics.filter(m => m.collection > 0);
    
    if (search) {
      const s = search.toLowerCase();
      activeMetrics = activeMetrics.filter(m => m.department.toLowerCase().includes(s));
    }

    activeMetrics.sort((a, b) => a.department.localeCompare(b.department));

    // 3. Process in batches to manage memory
    const BATCH_SIZE = 5;
    for (let i = 0; i < activeMetrics.length; i += BATCH_SIZE) {
      const batch = activeMetrics.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (data) => {
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

        return await generateIndividualReport(reportData);
      });

      const results = await Promise.all(batchPromises);
      pdfBuffers.push(...results);
      
      console.log(`[API] Generated batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(activeMetrics.length/BATCH_SIZE)}`);
    }

    if (pdfBuffers.length === 0) {
      return new Response("No collection found for any office", { status: 404 });
    }

    const mergedPdfBytes = await mergeReportPDFs(pdfBuffers);

    // 4. Audit Log
    await logAction(user.uid, "BULK_REPORT_GENERATED", { month, year, offices: officeList });

    return new Response(Buffer.from(mergedPdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return new Response("Unauthorized", { status: 401 });
    if (error.message === 'Forbidden') return new Response("Forbidden", { status: 403 });
    console.error("Bulk Report API error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
