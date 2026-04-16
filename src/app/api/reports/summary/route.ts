import { getDashboardMetrics } from "@/lib/services/metricsService";
import { generateSummaryReport } from "@/lib/reports/pdfGenerator";
import { verifySession } from "@/lib/auth/verifySession";
import { resolveAuthorizedOffices } from "@/lib/auth/rbac";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";


export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "pdf_summary", 5, 5 * 60 * 1000); // 5 per 5 mins

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

    const user = await verifySession();
    const isAdmin = user.user_type?.toLowerCase() === "superadmin";

    // 1. Fetch metrics for authorized offices
    // RBAC: Non-admins are limited to their assignments via resolveAuthorizedOffices
    const officeList = resolveAuthorizedOffices(user, ["ALL"], true);
    const allMetrics = await getDashboardMetrics(officeList, month, year);
    
    if (!allMetrics || allMetrics.length === 0) {
      return new Response("No data found for the selected period", { status: 404 });
    }

    // 2. Sort by department to match legacy matrix orientation
    allMetrics.sort((a, b) => a.department.localeCompare(b.department));

    const pdfBytes = await generateSummaryReport(allMetrics, month, year);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return new Response("Unauthorized", { status: 401 });
    if (error.message === 'Forbidden') return new Response("Forbidden", { status: 403 });
    console.error("[API] Summary Report Error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
