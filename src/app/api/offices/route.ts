import { NextResponse } from "next/server";
import { getAllOffices, createOffice, updateOffice, getEffectiveOfficesForPeriod } from "@/lib/services/officeService";
import { validateOfficeInput } from "@/lib/validation/apiSchemas";
import { withAuth } from "@/lib/auth/withAuth";

/**
 * GET /api/offices
 * Returns active offices by default. Admins see all.
 */
export const GET = withAuth(async (req, context, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const isAdmin = user.user_type?.toLowerCase() === "superadmin";
    
    let offices;
    if (month && year) {
      console.log(`[OfficesAPI] Fetching effective offices for ${month} ${year}`);
      offices = await getEffectiveOfficesForPeriod(month, year);
    } else {
      offices = await getAllOffices(isAdmin);
    }

    return NextResponse.json(offices, {
      headers: {
        'Cache-Control': isAdmin ? 'no-store' : 'public, s-maxage=3600, stale-while-revalidate=59',
      }
    });
  } catch (error: any) {
    console.error("API error fetching offices:", error);
    return NextResponse.json({ error: "Failed to fetch offices" }, { status: 500 });
  }
});

/**
 * POST /api/offices
 * Creates a new office (Superadmin only)
 */
export const POST = withAuth(async (request) => {
  try {
    const body = await request.clone().json();
    const result = validateOfficeInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { name, fullName } = result.data!;

    const createResult = await createOffice(name, fullName);
    return NextResponse.json(createResult);
  } catch (error: any) {
    console.error("API error creating office:", error);
    return NextResponse.json({ error: "Failed to create office" }, { status: 500 });
  }
}, { role: "superadmin" });

/**
 * PUT /api/offices
 * Updates an existing office and syncs acronym changes (Superadmin only)
 */
export const PUT = withAuth(async (request) => {
  try {
    const body = await request.clone().json();
    const result = validateOfficeInput(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { id, name, fullName, status } = result.data!;

    if (!id) {
      return NextResponse.json({ error: "Office ID is required" }, { status: 400 });
    }

    const updateResult = await updateOffice(id, { name, fullName, status: status as "active" | "disabled" | undefined });
    return NextResponse.json(updateResult);
  } catch (error: any) {
    console.error("API error updating office:", error);
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}, { role: "superadmin" });
