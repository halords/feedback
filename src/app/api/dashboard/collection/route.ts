import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";

export async function POST(request: Request) {
  try {
    const { offices, month, year } = await request.json();
    const data = await getDashboardMetrics(offices, month, year);
    
    // Transform specifically for tableCollect
    const tableData = data.map(d => ({
      office: d.department,
      primaryGroup: d.primaryGroup,
      collection: d.collection,
      visitor: d.visitor
    }));

    return NextResponse.json(tableData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
