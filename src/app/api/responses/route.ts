import { NextResponse } from "next/server";
import { getResponses } from "@/lib/services/responseService";
import { validateResponsesInput } from "@/lib/validation/apiSchemas";
import { checkRateLimitAsync } from "@/lib/security/rateLimit";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * POST /api/responses
 * Returns sorted feedback responses for specified offices.
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
    const validation = validateResponsesInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { month, year } = validation.data!;

    // Check for optimization bypass cookie
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const isOptEnabled = cookieStore.get('read_opt_enabled')?.value !== 'false';

    console.log(`[API /api/responses] Fetching for: ${month} ${year}, User: ${user.email}, Scoped Offices: ${JSON.stringify(scopedOffices)}, OptEnabled: ${isOptEnabled}`);
    
    // Call service with authorized scopedOffices provided by withAuth
    let responses = await getResponses(scopedOffices || [], month, year, !isOptEnabled);

    // Enforce masking of classifications for non-superadmins in global view
    const isSuperadmin = user.user_type?.toLowerCase() === 'superadmin';
    if (!isSuperadmin && (scopedOffices || []).includes("ALL")) {
      console.log(`[API /api/responses] Masking classifications for non-superadmin in global view.`);
      responses = responses.map(r => ({
        ...r,
        classification: "Restricted"
      }));
    }
    
    return NextResponse.json(responses);
  } catch (error: any) {
    // Specific handling for missing Firestore index
    if (error.message?.includes('FAILED_PRECONDITION') || error.code === 9) {
      console.error("[Responses API] Index Missing Error:", error.message);
      return NextResponse.json({ 
        error: "INDEX_MISSING", 
        message: "A required database index is currently being built. Please wait a few minutes and try again." 
      }, { status: 500 });
    }

    console.error("API Error in /api/responses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, { requireOfficeScoping: true });
