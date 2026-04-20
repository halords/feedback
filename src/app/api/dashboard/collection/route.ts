import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { validateDashboardInput } from "@/lib/validation/apiSchemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateDashboardInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { offices, month, year } = result.data!;
    const data = await getDashboardMetrics(offices, month as string, year);
    
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
