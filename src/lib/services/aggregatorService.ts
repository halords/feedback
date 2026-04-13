export const SATELLITE_GROUPS = {
  PHO: ["PHO", "PHO-Clinic", "PHO-Warehouse"],
  PTO: ["PTO", "PTO-Cash", "PTO-Assessor"],
};

export const ALL_OFFICES = [
  "OPG", "OPA", "SPO", "OPAss", "PTO", "PTO-Assessor", "PTO-Cash", "PBO", "OPAcc", 
  "PEO", "PGSO", "PLO", "PPDC", "PHO", "PHO-Clinic", "PSWDO", 
  "OPAg", "OPVet", "PGENRO", "MAO", "LUPTO", "PICTO", "BACSD", "LEEIPO", 
  "PHRMDO", "SSD", "LUPJ", "PDRRMO", "PESO", "LIBRARY", "PYESDO", "PCDO"
];

/**
 * Returns all individual office IDs belonging to a group if the input is a primary group (PHO/PTO),
 * otherwise returns the office ID as is.
 */
export function expandOfficeGroup(officeId: string): string[] {
  if (officeId === "PHO") return SATELLITE_GROUPS.PHO;
  if (officeId === "PTO") return SATELLITE_GROUPS.PTO;
  return [officeId];
}

/**
 * Determines if a given office list contains a primary group ID.
 */
export function resolveTargetOffices(offices: string[]): string[] {
  const result = new Set<string>();
  
  offices.forEach(office => {
    if (office === "ALL") ALL_OFFICES.forEach(o => result.add(o));
    else if (office === "PHO") SATELLITE_GROUPS.PHO.forEach(o => result.add(o));
    else if (office === "PTO") SATELLITE_GROUPS.PTO.forEach(o => result.add(o));
    else result.add(office);
  });

  return Array.from(result);
}

/**
 * Merges detailed individual satellite results into a grouped result if needed.
 */
export function aggregateSatelliteResults(data: any[]): any[] {
  // Logic to condense individual satellites back into primary groups for specific charts
  // to be used by metricsService.ts
  return data;
}
