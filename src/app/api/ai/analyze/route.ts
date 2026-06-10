import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { analyzeFeedbackData } from "@/lib/ai/openrouter";
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
    const { year, month, quarter, officeId, scope = "organization" } = body;

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    // Determine time scope and target months
    let targetMonths = ALL_MONTHS;
    let timeScope: "month" | "quarter" | "year" = "year";
    let period = "Full Year";

    if (month && ALL_MONTHS.includes(month)) {
      targetMonths = [month];
      timeScope = "month";
      period = month;
    } else if (quarter) {
      const q = parseInt(quarter.toString().replace("Q", ""));
      if (q >= 1 && q <= 4) {
        targetMonths = ALL_MONTHS.slice((q - 1) * 3, q * 3);
        timeScope = "quarter";
        period = `Quarter ${q}`;
      }
    }

    // Use scopedOffices injected by the wrapper
    const metrics = await getDashboardMetrics(scopedOffices || [], targetMonths, year, false, true);
    
    // 2. Filter out entries with no activity to save tokens
    const activeMetrics = metrics.filter(m => m.collection > 0 || m.visitor > 0);

    if (activeMetrics.length === 0) {
      return NextResponse.json({ error: "No data found for this period" }, { status: 404 });
    }

    // 3. SERVER-SIDE COMPUTATION (SINGLE SOURCE OF TRUTH)
    const monthlySummary = targetMonths.map(m => {
      const monthData = activeMetrics.filter(curr => curr.month === m);
      if (monthData.length === 0) return null;

      const totalColl = monthData.reduce((sum, curr) => sum + (curr.collection || 0), 0);
      const totalVisitor = monthData.reduce((sum, curr) => sum + (curr.visitor || 0), 0);
      const totalOnline = monthData.reduce((sum, curr) => sum + (curr.online || 0), 0);
      
      const scores = monthData
        .map(curr => curr.overrate && curr.overrate !== "N/A" ? parseFloat(curr.overrate.replace('%', '')) : null)
        .filter(s => s !== null) as number[];
      const avgSat = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // CC Compliance (Weighted)
      const ccAware = monthData.reduce((sum, curr) => sum + (curr.awareCount || 0), 0);
      const ccVisible = monthData.reduce((sum, curr) => sum + (curr.visibleCount || 0), 0);
      const ccHelpful = monthData.reduce((sum, curr) => sum + (curr.helpfulCount || 0), 0);
      const avgCC = totalColl > 0 ? ((ccAware + ccVisible + ccHelpful) / (totalColl * 3)) * 100 : 0;

      return {
        month: m,
        collection: totalColl,
        visitor: totalVisitor,
        online: totalOnline,
        satisfaction: avgSat,
        compliance: avgCC
      };
    }).filter(m => m !== null) as any[];

    // Overall Period Metrics (Ground Truth)
    const totalColl = monthlySummary.reduce((sum, m) => sum + m.collection, 0);
    const totalVisitor = monthlySummary.reduce((sum, m) => sum + m.visitor, 0);
    const totalOnline = monthlySummary.reduce((sum, m) => sum + m.online, 0);
    
    const finalSatisfaction = monthlySummary.length > 0 ? monthlySummary.reduce((sum, m) => sum + m.satisfaction, 0) / monthlySummary.length : 0;
    const finalCollection = totalVisitor > 0 ? (totalColl / totalVisitor) * 100 : 0;
    const finalAdoption = totalColl > 0 ? (totalOnline / totalColl) * 100 : 0;
    const finalCompliance = monthlySummary.length > 0 ? monthlySummary.reduce((sum, m) => sum + m.compliance, 0) / monthlySummary.length : 0;

    const groundTruthTrends = {
      months: monthlySummary.map(m => m.month),
      satisfaction: monthlySummary.map(m => parseFloat(m.satisfaction.toFixed(2))),
      collection: monthlySummary.map(m => m.collection)
    };

    // Departmental Aggregation
    const aggregatedByDept = activeMetrics.reduce((acc: any, curr: any) => {
      const dept = curr.department;
      if (!acc[dept]) {
        acc[dept] = { 
          department: dept, officeName: curr.officeName,
          collection: 0, visitor: 0, online: 0, satisfactionScores: [] 
        };
      }
      acc[dept].collection += curr.collection || 0;
      acc[dept].visitor += curr.visitor || 0;
      acc[dept].online += curr.online || 0;
      if (curr.overrate && curr.overrate !== "N/A") acc[dept].satisfactionScores.push(parseFloat(curr.overrate.replace('%', '')));
      return acc;
    }, {});

    const deptFinalData = Object.values(aggregatedByDept).map((dept: any) => ({
      department: dept.department,
      officeName: dept.officeName,
      collection: dept.collection,
      visitor: dept.visitor,
      satisfaction: dept.satisfactionScores.length > 0 
        ? (dept.satisfactionScores.reduce((a: any, b: any) => a + b, 0) / dept.satisfactionScores.length).toFixed(2) + "%"
        : "N/A"
    }));

    // 4. AI NARRATIVE GENERATION (AI only writes text)
    const analysis = await analyzeFeedbackData({
      year,
      data: {
        summary: {
          satisfaction: finalSatisfaction.toFixed(2) + "%",
          collection: finalCollection.toFixed(2) + "%",
          adoption: finalAdoption.toFixed(2) + "%",
          compliance: finalCompliance.toFixed(2) + "%",
          trends: groundTruthTrends
        },
        departments: deptFinalData
      },
      scope,
      officeName: activeMetrics[0]?.officeName,
      timeScope,
      period: timeScope === 'month' ? month : timeScope === 'quarter' ? quarter : "Full Year"
    });

    // 5. MERGE: Prioritize Server Computation over AI potential hallucinations
    const finalizedReport = {
      ...analysis,
      metrics: {
        avgSatisfaction: parseFloat(finalSatisfaction.toFixed(2)),
        avgCollection: parseFloat(finalCollection.toFixed(2)),
        ccComplianceScore: parseFloat(finalCompliance.toFixed(2)),
        digitalAdoptionRate: parseFloat(finalAdoption.toFixed(2))
      },
      trends: groundTruthTrends
    };

    return NextResponse.json(finalizedReport);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}, { role: "superadmin", requireOfficeScoping: true });
