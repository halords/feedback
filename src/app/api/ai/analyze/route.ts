import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { analyzeFeedbackData } from "@/lib/ai/gemini";
import { saveAIReport } from "@/lib/services/aiReportService";
import { withAuth } from "@/lib/auth/withAuth";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * POST /api/ai/analyze
 * Generates an AI insight report.
 * Automatically scoped based on user role.
 */
export const POST = withAuth(async (req, context, user, scopedOffices) => {
  try {
    // Rate Limiting: 10 AI analysis requests per hour per IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "ai_analyze", 10, 60 * 60 * 1000);
    if (!ratelimit.success) {
      return NextResponse.json(
        { error: "Too many AI analysis requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": ratelimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": ratelimit.reset.toString(),
          },
        }
      );
    }

    const body = await req.clone().json();
    const { year, officeId, scope = "organization" } = body;

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    // Use scopedOffices injected by the wrapper
    // If user requested organization scope but is constrained to an office, 
    // scopedOffices will already reflect the constrained list.
    const metrics = await getDashboardMetrics(scopedOffices || [], ALL_MONTHS, year, false, true);
    
    // 2. Filter out entries with no activity to save tokens
    const activeMetrics = metrics.filter(m => m.collection > 0 || m.visitor > 0);

    if (activeMetrics.length === 0) {
      return NextResponse.json({ error: "No data found for this period" }, { status: 404 });
    }

    // 3. Map to AI-friendly structure
    const aggregatedData = activeMetrics.map(m => ({
      month: m.month,
      department: m.department,
      visitors: m.visitor,
      collected: m.collection,
      online: m.online,
      offline: m.offline,
      satisfaction: m.overrate,
      sysRate: m.sysRate,
      staffRate: m.staffRate,
      collectionRate: m.collectionRate,
      cc1: {
        yes: m.cc1?.Yes || 0,
        justNow: m.cc1?.["Just Now"] || 0,
        no: m.cc1?.No || 0
      },
      cc2: {
        visible: m.cc2?.Visible || 0,
        somewhat: m.cc2?.["Somewhat Visible"] || 0,
        difficult: m.cc2?.["Difficult to see"] || 0,
        not: m.cc2?.["Not Visible"] || 0,
        na: m.cc2?.["N/A"] || 0
      },
      cc3: {
        veryMuch: m.cc3?.["Very Much"] || 0,
        somewhat: m.cc3?.Somewhat || 0,
        didNotHelp: m.cc3?.["Did Not Help"] || 0,
        na: m.cc3?.["N/A"] || 0
      }
    }));

    // 4. Analyze with Gemini
    const analysis = await analyzeFeedbackData({
      year,
      data: aggregatedData,
      scope,
      officeName: activeMetrics[0]?.department
    });

    // 5. Save report for persistence
    const reportId = await saveAIReport({
      userId: user.uid,
      scope,
      officeId: officeId || null,
      year,
      title: analysis.title,
      content: analysis
    });

    return NextResponse.json({ reportId, ...analysis });

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}, { role: "superadmin", requireOfficeScoping: true });
