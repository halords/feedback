import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { validateDashboardInput } from "@/lib/validation/apiSchemas";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * POST /api/dashboard/collection
 * Returns feedback collection metrics for specified offices.
 * Automatically scoped based on user role.
 */
export const POST = withAuth(async (request, context, user, scopedOffices) => {
  try {
    const body = await request.clone().json();
    const result = validateDashboardInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { month, year } = result.data!;
    
    // Use scopedOffices injected by the wrapper instead of body.offices
    const data = await getDashboardMetrics(scopedOffices || [], month as string, year);
    
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
}, { requireOfficeScoping: true });
