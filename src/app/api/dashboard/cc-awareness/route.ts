import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";

export async function POST(request: Request) {
  try {
    const { offices, month, year } = await request.json();
    const data = await getDashboardMetrics(offices, month, year);
    
    // Transform specifically for tableCCQ
    const tableData = data.map(d => ({
      OFFICE: d.department,
      AWARE: d.awareCount,
      VISIBLE: d.visibleCount,
      HELPFUL: d.helpfulCount,
      CLIENTS: d.collection
    }));

    return NextResponse.json(tableData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
