import { getDashboardMetrics } from "@/lib/services/metricsService";
import { generateSummaryReport } from "@/lib/reports/pdfGenerator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return new Response("Missing parameters", { status: 400 });
    }

    // 1. Fetch metrics for ALL offices
    // Note: We use ["ALL"] to get the full organizational list for the matrix
    const allMetrics = await getDashboardMetrics(["ALL"], month, year);
    
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
    console.error("[API] Summary Report Error:", error);
    return new Response(error.message || "Internal server error", { status: 500 });
  }
}
