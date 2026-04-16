import { NextResponse } from "next/server";
import { getResponses } from "@/lib/services/responseService";
import { verifySession } from "@/lib/auth/verifySession";
import { resolveAuthorizedOffices } from "@/lib/auth/rbac";
import { validateResponsesInput } from "@/lib/validation/apiSchemas";
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

    // Authenticate user
    const user = await verifySession();

    const body = await request.json();
    const validation = validateResponsesInput(body);

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

    console.log(`[API /api/responses] Fetching for: ${month} ${year}, User: ${user.email}, Authorized Offices: ${JSON.stringify(authorizedOffices)}, OptEnabled: ${isOptEnabled}`);
    
    // Call service with authorized scope ONLY
    let responses = await getResponses(authorizedOffices, month, year, !isOptEnabled);

    // Enforce masking of classifications for non-superadmins in global view
    const isSuperadmin = user.user_type?.toLowerCase() === 'superadmin';
    if (!isSuperadmin && authorizedOffices.includes("ALL")) {
      console.log(`[API /api/responses] Masking classifications for non-superadmin in global view.`);
      responses = responses.map(r => ({
        ...r,
        classification: "Restricted" // or simply "" if preferred, but "Restricted" is clearer for debugging
      }));
    }
    
    console.log(`[API /api/responses] Found ${responses.length} records.`);
    return NextResponse.json(responses);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
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
}
