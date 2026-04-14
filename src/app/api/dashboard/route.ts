import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { verifySession } from "@/lib/auth/verifySession";
import { resolveAuthorizedOffices } from "@/lib/auth/rbac";

export async function POST(request: Request) {
  try {
    // Authenticate and get session user
    const user = await verifySession();

    const { offices, month, year } = await request.json();

    if (!offices || !month || !year) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Enforce server-side RBAC scoping
    // We allow global access if 'ALL' is requested, which powers organizational-wide Analytics Summary/Graphs
    const isGlobalRequested = Array.isArray(offices) && offices.length === 1 && offices[0] === "ALL";
    const authorizedOffices = resolveAuthorizedOffices(user, offices, isGlobalRequested);

    // Call service with authorized scope ONLY (Functional Immutability maintained)
    const data = await getDashboardMetrics(authorizedOffices, month, year);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, no-store',
      }
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
