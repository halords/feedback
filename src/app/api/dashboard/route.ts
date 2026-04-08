import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";

export async function POST(request: Request) {
  try {
    const { offices, month, year } = await request.json();

    if (!offices || !month || !year) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const data = await getDashboardMetrics(offices, month, year);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=59', // Cache for 5min for dashboard
      }
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
