import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { getAllPhysicalReports } from "@/lib/services/physicalReportService";
import { calculateSatisfactionAverages, calculateCollectionRate, calculateQuestionRate } from "@/lib/services/analyticsService";
import { analyzeFeedbackData } from "@/lib/ai/gemini";
import { saveAIReport } from "@/lib/services/aiReportService";

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

    // 1. Fetch reports for the year
    const reports = await getAllPhysicalReports(null, year);
    
    // 2. Filter by office if scope is office
    const targetReports = scope === "office" && officeId
      ? reports.filter(r => r.officeId === officeId)
      : reports;

    if (targetReports.length === 0) {
      return NextResponse.json({ error: "No data found for this period" }, { status: 404 });
    }

    // 3. Process into AI-friendly format
    const aggregatedData = targetReports.map(r => {
      const qRates: Record<string, string> = {};
      for (let i = 1; i <= 9; i++) {
        const qKey = `Q${i}`;
        if (r[qKey]) {
          qRates[qKey] = calculateQuestionRate(r[qKey], r.COLLECTED_FORMS || 0);
        }
      }

      const { sysRate, staffRate, overrate } = calculateSatisfactionAverages(qRates);
      const collectionRate = calculateCollectionRate(r.COLLECTED_FORMS || 0, r.VISITORS || 0);
      
      return {
        month: r.FOR_THE_MONTH_OF,
        department: r.DEPARTMENT,
        visitors: r.VISITORS,
        collected: r.COLLECTED_FORMS,
        satisfaction: overrate,
        sysRate,
        staffRate,
        collectionRate,
        ccVisibility: {
          visible: r.VISIBLE || 0,
          somewhat: r.SOMEWHAT_VISIBLE || 0,
          difficult: r.DIFFICULT_TO_SEE || 0,
          not: r.NOT_VISIBLE || 0,
          na: r.NA || 0
        }
      };
    });

    // 4. Analyze with Gemini
    const analysis = await analyzeFeedbackData({
      year,
      data: aggregatedData,
      scope,
      officeName: targetReports[0]?.DEPARTMENT
    });

    // 5. Save report for persistence
    const reportId = await saveAIReport({
      userId: session.uid,
      scope,
      officeId,
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
