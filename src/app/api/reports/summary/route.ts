import { getDashboardMetrics } from "@/lib/services/metricsService";
import { generateSummaryReport } from "@/lib/reports/pdfGenerator";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/reports/summary
 * Generates a summary PDF report.
 * Automatically scoped based on user role.
 */
export const GET = withAuth(async (request, context, user, scopedOffices) => {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "pdf_summary", 5, 5 * 60 * 1000);

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

    if (!month || !year) {
      return new Response("Missing parameters", { status: 400 });
    }

    // Use scopedOffices injected by the wrapper
    const allMetrics = await getDashboardMetrics(scopedOffices || [], month, year);
    
    if (!allMetrics || allMetrics.length === 0) {
      return new Response("No data found for the selected period", { status: 404 });
    }

    // Sort by department
    allMetrics.sort((a, b) => a.department.localeCompare(b.department));

    const pdfBytes = await generateSummaryReport(allMetrics, month, year);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("[API] Summary Report Error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}, { requireOfficeScoping: true });
