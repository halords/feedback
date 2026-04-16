import { NextResponse } from "next/server";
import { verifySuperadmin, getSessionUser, verifySession } from "@/lib/auth/verifySession";
import { getAllOffices, createOffice, updateOffice, getEffectiveOfficesForPeriod } from "@/lib/services/officeService";

/**
 * GET /api/offices
 * Returns active offices by default. Admins see all.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const user = await verifySession(); // Throws if not authenticated
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
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("API error fetching offices:", error);
    return NextResponse.json({ error: "Failed to fetch offices" }, { status: 500 });
  }
}

/**
 * POST /api/offices
 * Creates a new office (Superadmin only)
 */
export async function POST(request: Request) {
  try {
    await verifySuperadmin();
    const { name, fullName } = await request.json();

    if (!name || !fullName) {
      return NextResponse.json({ error: "Name and Full Name are required" }, { status: 400 });
    }

    const result = await createOffice(name, fullName);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }
    console.error("API error creating office:", error);
    return NextResponse.json({ error: "Failed to create office" }, { status: 500 });
  }
}

/**
 * PUT /api/offices
 * Updates an existing office and syncs acronym changes (Superadmin only)
 */
export async function PUT(request: Request) {
  try {
    await verifySuperadmin();
    const { id, name, fullName, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Office ID is required" }, { status: 400 });
    }

    const result = await updateOffice(id, { name, fullName, status });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }
    console.error("API error updating office:", error);
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}
