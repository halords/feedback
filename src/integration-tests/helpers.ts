import { vi } from "vitest";
import * as verifySessionModule from "@/lib/auth/verifySession";
import { SessionUser } from "@/lib/auth/verifySession";

// Mock the auth module entirely to prevent cookies() errors
vi.mock("@/lib/auth/verifySession", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getSessionUser: vi.fn(),
    verifySession: vi.fn(),
    verifySuperadmin: vi.fn(),
  };
});

/**
 * Mocks the authenticated user for the duration of the test.
 */
export const mockAuthUser = (user: Partial<SessionUser> | null) => {
  const mockValue = user ? (user as SessionUser) : null;
  
  // Mock getSessionUser
  vi.mocked(verifySessionModule.getSessionUser).mockResolvedValue(mockValue);
  
  // Mock verifySession (throws if no user)
  vi.mocked(verifySessionModule.verifySession).mockImplementation(async () => {
    if (!mockValue) throw new Error('Unauthorized');
    return mockValue;
  });

  // Mock verifySuperadmin (throws if no user or not superadmin)
  vi.mocked(verifySessionModule.verifySuperadmin).mockImplementation(async () => {
    if (!mockValue) throw new Error('Unauthorized');
    const type = mockValue.user_type?.toLowerCase().replace(/\s/g, '');
    if (type !== 'superadmin') throw new Error('Forbidden');
    return mockValue;
  });
};

/**
 * Creates a mocked Next.js Request object.
 */
export const createMockRequest = (options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
}) => {
  const { 
    method = "GET", 
    url = "http://localhost:3000/api/mock", 
    body, 
    headers = {} 
  } = options;

  return new Request(url, {
    method,
    headers: new Headers({
      "Content-Type": "application/json",
      ...headers,
    }),
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * Invokes a Next.js 15 Route Handler.
 */
export const invokeHandler = async (
  handler: any,
  request: Request,
  params: any = {}
) => {
  // Next.js 15 Route Handlers take (request, { params })
  return await handler(request, { params: Promise.resolve(params) });
};

/**
 * Common Mock Users
 */
export const MOCK_USERS = {
  SUPERADMIN: {
    idno: "1111",
    username: "superadmin",
    user_type: "superadmin",
    full_name: "God Mode",
    offices: ["ALL"],
    is_analytics_enabled: true,
  },
  OFFICE_ADMIN: {
    idno: "2222",
    username: "officeadmin",
    user_type: "Office Admin",
    full_name: "Department Head",
    offices: ["ICTU"],
    is_analytics_enabled: false,
  },
  ANALYTICS_USER: {
    idno: "3333",
    username: "analyst",
    user_type: "Office Admin",
    full_name: "Metrics Analyst",
    offices: ["ICTU", "GHO"],
    is_analytics_enabled: true,
  }
};
