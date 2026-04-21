import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockAuthUser, createMockRequest, invokeHandler, MOCK_USERS } from "./helpers";
import { GET as peekGET } from "@/app/api/peek/acronyms/route";
import { POST as assignPOST } from "@/app/api/users/assignment/route";
import { POST as awarenessPOST } from "@/app/api/dashboard/cc-awareness/route";

// Mock the services to avoid DB calls
vi.mock("@/lib/services/metricsService", () => ({
  getDashboardMetrics: vi.fn(async (offices) => {
    return (offices || []).map((dept: string) => ({
      department: dept,
      awareCount: 10,
      visibleCount: 5,
      helpfulCount: 2,
      collection: 100
    }));
  })
}));

vi.mock("@/lib/services/userService", () => ({
  updateAssignments: vi.fn(async () => ({ success: true }))
}));

vi.mock("@/lib/services/commentManagementService", () => ({
  getManagedComments: vi.fn(async () => []),
  syncComments: vi.fn(async () => 0)
}));

describe("Security Architecture Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Middleware & Global Perimeter", () => {
    it("should reject anonymous requests to protected routes with 401", async () => {
      mockAuthUser(null);
      const req = createMockRequest({ method: "GET" });
      const res = await invokeHandler(peekGET, req);
      
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("RBAC Enforcement (withAuth)", () => {
    it("should allow superadmin to access administrative endpoints", async () => {
      mockAuthUser(MOCK_USERS.SUPERADMIN);
      const req = createMockRequest({ 
        method: "POST",
        body: { idno: "9999", offices: ["ICTU"] }
      });
      const res = await invokeHandler(assignPOST, req);
      
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });

    it("should reject non-superadmin from administrative endpoints with 403", async () => {
      mockAuthUser(MOCK_USERS.OFFICE_ADMIN);
      const req = createMockRequest({ 
        method: "POST",
        body: { idno: "9999", offices: ["ICTU"] }
      });
      const res = await invokeHandler(assignPOST, req);
      
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Forbidden");
    });
  });

  describe("Automated Office Scoping", () => {
    it("should intersect requested offices with authorized offices for standard users", async () => {
      mockAuthUser(MOCK_USERS.OFFICE_ADMIN);
      const req = createMockRequest({ 
        method: "POST",
        body: { offices: ["ICTU", "GHO"], month: "January", year: "2024" }
      });
      
      const res = await invokeHandler(awarenessPOST, req);
      const body = await res.json();
      
      expect(res.status).toBe(200);
      
      // Since MOCK_USERS.OFFICE_ADMIN only has ICTU, 
      // the output should only contain ICTU data even though they asked for GHO.
      expect(body.length).toBeGreaterThan(0);
      body.forEach((item: any) => {
        expect(item.OFFICE).toBe("ICTU");
        expect(item.OFFICE).not.toBe("GHO");
      });
    });

    it("should allow 'ALL' for superadmins", async () => {
      mockAuthUser(MOCK_USERS.SUPERADMIN);
      const req = createMockRequest({ 
        method: "POST",
        body: { offices: ["ICTU", "GHO"], month: "January", year: "2024" }
      });
      
      const res = await invokeHandler(awarenessPOST, req);
      const body = await res.json();

      expect(res.status).toBe(200);
      
      // Superadmin should see both
      const departments = body.map((i: any) => i.OFFICE);
      expect(departments).toContain("ICTU");
      expect(departments).toContain("GHO");
    });
  });
});
