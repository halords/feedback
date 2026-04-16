import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { verifySession } from "@/lib/auth/verifySession";
import { resolveAuthorizedOffices } from "@/lib/auth/rbac";
import { validateDashboardInput } from "@/lib/validation/apiSchemas";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting (60 requests per minute)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ratelimit = await checkRateLimitAsync(ip, "api_data", 60, 60000);
    
    if (!ratelimit.success) {
      return NextResponse.json({ 
        error: "Too many requests. Please try again later.",
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': ratelimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': ratelimit.reset.toString()
        }
      });
    }

    // Authenticate and get session user
    const user = await verifySession();

    // Enforce analytics permission is NOT required for the main dashboard 
    // since it is already scoped by office assignments in Phase 1.
    
    const body = await request.json();
    const validation = validateDashboardInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { offices, month, year } = validation.data!;

    // Enforce server-side RBAC scoping
    const authorizedOffices = resolveAuthorizedOffices(user, offices);

    // Check for optimization bypass cookie
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const isOptEnabled = cookieStore.get('read_opt_enabled')?.value !== 'false';

    // Call service with authorized scope ONLY
    const data = await getDashboardMetrics(authorizedOffices, month, year, !isOptEnabled);


    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, no-store',
      }
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Specific handling for missing Firestore index
    if (error.message?.includes('FAILED_PRECONDITION') || error.code === 9) {
      console.error("[Dashboard API] Index Missing Error:", error.message);
      return NextResponse.json({ 
        error: "INDEX_MISSING", 
        message: "A required database index is currently being built. Please wait a few minutes and try again." 
      }, { status: 500 });
    }

    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
