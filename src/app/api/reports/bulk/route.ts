import { getDashboardMetrics } from "@/lib/services/metricsService";
import { getAllOfficeAssignees } from "@/lib/services/officeService";
import { generateIndividualReport, mergeReportPDFs, ReportData } from "@/lib/reports/pdfGenerator";
import { logAction } from "@/lib/services/auditService";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/reports/bulk
 * Generates a merged PDF of all office reports.
 * Automatically scoped based on user role.
 */
export const GET = withAuth(async (request, context, user, scopedOffices) => {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "pdf_bulk", 5, 5 * 60 * 1000);

    if (!ratelimit.success) {
      return new Response("Too many report requests. Please wait before trying again.", { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': ratelimit.limit.toString(),
          'X-RateLimit-Reset': ratelimit.reset.toString()
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const search = searchParams.get("search");

    if (!month || !year) {
      return new Response("Missing parameters", { status: 400 });
    }

    // Use scopedOffices injected by the wrapper
    const allMetrics = await getDashboardMetrics(scopedOffices || [], month, year);
    
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
      activeMetrics = activeMetrics.filter(m => 
        m.department.toLowerCase().includes(s) || 
        (m.officeName && m.officeName.toLowerCase().includes(s))
      );
    }

    activeMetrics.sort((a, b) => a.department.localeCompare(b.department));

    // 3. Process in batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < activeMetrics.length; i += BATCH_SIZE) {
      const batch = activeMetrics.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (data) => {
        // Use archived fullname if available, otherwise fetch live from map
        const assigneeName = (data.fullname || assigneeMap.get(data.department) || "__________________________").toUpperCase();

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
    await logAction(user.uid, "BULK_REPORT_GENERATED", { month, year, offices: scopedOffices });

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
}, { requireOfficeScoping: true });
