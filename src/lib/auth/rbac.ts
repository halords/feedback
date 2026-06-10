import { SessionUser, hasGlobalAccess, verifySession } from './verifySession';

export { hasGlobalAccess };

/**
 * Derives the server-authoritative list of offices based on user session and requested scope.
 * 
 * Logic:
 * 1. Super Admin: Can access any requested offices. If no offices requested, returns ["ALL"].
 *    This allows them to query the global scope or specific offices.
 * 2. Office Admin: Restricted to intersection of their assigned offices and requested offices.
 *    If no offices requested, returns all their assigned offices.
 * 3. Default: Empty array (no access).
 * 
 * Functional Immutability: This utility is external to core services and is used to
 * sanitize inputs before they reach the services.
 */
export function resolveAuthorizedOffices(
  user: SessionUser, 
  requestedOffices?: string[] | string
): string[] {
  // Normalize string to array if necessary
  const requested = typeof requestedOffices === 'string' 
    ? [requestedOffices] 
    : requestedOffices;

  // 1. Super Admin or Global Access logic: Full organizational visibility
  if (hasGlobalAccess(user) || !!user.can_access_all_reports) {
    // If they requested specific offices, return them
    if (requested && requested.length > 0) {
      return requested;
    }
    // Default to "ALL" which represents the global scope in services
    return ["ALL"];
  }

  // 2. Restricted User logic: 
  const userOffices = user.offices || [];

  // 2a. Global Access logic:
  // If they explicitly requested "ALL" or no scope specified, allow it.
  // This supports the Global Summary and Graphs views for all users.
  if (!requested || requested.length === 0 || (requested.length === 1 && requested[0] === "ALL")) {
    return ["ALL"];
  }

  // 2b. Granular/Data-View requests: Strictly intersect with assigned offices
  const normalizedAssignments = userOffices.map(o => o.toLowerCase());
  return requested.filter(office => normalizedAssignments.includes(office.toLowerCase()));
}
