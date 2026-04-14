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
  requestedOffices?: string[] | string,
  allowGlobal: boolean = false
): string[] {
  // Normalize string to array if necessary
  const requested = typeof requestedOffices === 'string' 
    ? [requestedOffices] 
    : requestedOffices;

  // 1. Super Admin logic: Full organizational visibility
  if (hasGlobalAccess(user)) {
    // If they requested specific offices, return them
    if (requested && requested.length > 0) {
      return requested;
    }
    // Default to "ALL" which represents the global scope in services
    return ["ALL"];
  }

  // 2. Restricted User logic (Standard User / Office Admin)
  // Standardize the user type for comparison
  const type = user.user_type?.toLowerCase().replace(/\s/g, '');
  const userOffices = user.offices || [];
  
  // If no specific offices requested, or if they requested "ALL" (which they aren't allowed to see globally)
  // return all offices they are assigned to
  if (!requested || requested.length === 0 || (requested.length === 1 && requested[0] === "ALL")) {
    if (allowGlobal && requested?.[0] === "ALL") return ["ALL"];
    return userOffices;
  }

  // Return the intersection of assigned offices and requested offices
  // This prevents non-admins from querying offices they aren't assigned to
  return requested.filter(office => userOffices.includes(office));
}
