import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { analyzeFeedbackData } from "@/lib/ai/gemini";
import { saveAIReport } from "@/lib/services/aiReportService";

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { year, officeId, scope = "organization" } = body;

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    // 1. Fetch optimized metrics (STRICTLY uses JSON archives - Zero Firestore Reads)
    const targetOffices = (scope === "office" && officeId) ? [officeId] : ["ALL"];
    const metrics = await getDashboardMetrics(targetOffices, ALL_MONTHS, year, false, true);
    
    // 2. Filter out entries with no activity to save tokens
    const activeMetrics = metrics.filter(m => m.collection > 0 || m.visitor > 0);

    if (activeMetrics.length === 0) {
      return NextResponse.json({ error: "No data found for this period" }, { status: 404 });
    }

    // 3. Map to AI-friendly structure (already computed by metricsService)
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
      userId: session.uid,
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
}
