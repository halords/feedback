import { NextResponse } from "next/server";
import { verifySession, verifySuperadmin, SessionUser } from "./verifySession";
import { resolveAuthorizedOffices, hasGlobalAccess } from "./rbac";

export interface AuthConfig {
  role?: "superadmin";
  requireOfficeScoping?: boolean;
}

export type AuthenticatedHandler = (
  request: Request,
  context: { params: Promise<any> },
  user: SessionUser,
  scopedOffices?: string[]
) => Promise<Response>;

/**
 * Higher-Order Function to protect API routes with Auth and RBAC
 */
export function withAuth(handler: AuthenticatedHandler, config: AuthConfig = {}) {
  return async (request: Request, context: { params: Promise<any> }) => {
    try {
      // 1. Authenticate & Check Role
      let user: SessionUser;
      if (config.role === "superadmin") {
        user = await verifySuperadmin();
      } else {
        user = await verifySession();
      }

      // 2. Automated Office Scoping (Option B logic)
      let scopedOffices: string[] | undefined = undefined;
      
      if (config.requireOfficeScoping) {
        let requestedOffices: any = undefined;
        
        // Only try to parse body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const body = await request.clone().json();
            requestedOffices = body.offices;
          } catch (e) {
            // No body or invalid JSON, ignore
          }
        } else {
          // For GET, try query params
          const { searchParams } = new URL(request.url);
          requestedOffices = searchParams.get('offices')?.split(',') || undefined;
        }

        // Apply authorized intersection
        scopedOffices = resolveAuthorizedOffices(user, requestedOffices);
      }

      // 3. Execute Handler
      return await handler(request, context, user, scopedOffices);

    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
