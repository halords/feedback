import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/services/metricsService";
import { validateDashboardInput } from "@/lib/validation/apiSchemas";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * POST /api/dashboard
 * Returns aggregated dashboard metrics for specified offices.
 * Automatically scoped based on user role.
 */
export const POST = withAuth(async (request, context, user, scopedOffices) => {
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

    const body = await request.clone().json();
    const validation = validateDashboardInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { month, year } = validation.data!;

    // Check for optimization bypass cookie
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const isOptEnabled = cookieStore.get('read_opt_enabled')?.value !== 'false';

    // Call service with authorized scope ONLY
    const data = await getDashboardMetrics(scopedOffices || [], month, year, !isOptEnabled);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, no-store',
      }
    });
  } catch (error: any) {
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
}, { requireOfficeScoping: true });
