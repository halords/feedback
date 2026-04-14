import { NextResponse } from "next/server";
import { getResponses } from "@/lib/services/responseService";
import { verifySession } from "@/lib/auth/verifySession";
import { resolveAuthorizedOffices } from "@/lib/auth/rbac";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await verifySession();

    const { offices, month, year } = await request.json();

    if (!offices || !month || !year) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Enforce server-side RBAC scoping
    // We allow global 'ALL' access for visibility, but UI controls should restrict write actions
    const isGlobalRequested = Array.isArray(offices) && offices.length === 1 && offices[0] === "ALL";
    const authorizedOffices = resolveAuthorizedOffices(user, offices, isGlobalRequested);

    console.log(`[API /api/responses] Fetching for: ${month} ${year}, User: ${user.email}, Authorized Offices: ${JSON.stringify(authorizedOffices)}`);
    
    // Call service with authorized scope ONLY
    const responses = await getResponses(authorizedOffices, month, year);
    
    console.log(`[API /api/responses] Found ${responses.length} records.`);
    return NextResponse.json(responses);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("API Error in /api/responses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
