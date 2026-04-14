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
  const SATELLITE_MAP: Record<string, string> = {
    "PHO-Clinic": "PHO",
    "PHO-Warehouse": "PHO",
    "PTO-Cash": "PTO",
    "PTO-Assessor": "PTO",
  };

  const map = new Map<string, any>();

  data.forEach((item) => {
    const parentOffice = SATELLITE_MAP[item.office] || item.office;
    const key = `${parentOffice}_${item.month || 'all'}`;

    if (!map.has(key)) {
      map.set(key, JSON.parse(JSON.stringify({ ...item, office: parentOffice })));
    } else {
      const existing = map.get(key);
      
      existing.collection = (existing.collection || 0) + (item.collection || 0);
      existing.visitor = (existing.visitor || 0) + (item.visitor || 0);
      
      if (item.comments) {
        if (!existing.comments) existing.comments = { positive: [], negative: [] };
        if (item.comments.positive) existing.comments.positive.push(...item.comments.positive);
        if (item.comments.negative) existing.comments.negative.push(...item.comments.negative);
      }
      
      if (item.gender) {
        if (!existing.gender) existing.gender = {};
        for (const g of Object.keys(item.gender)) {
          existing.gender[g] = (existing.gender[g] || 0) + (item.gender[g] || 0);
        }
      }
      
      for (let i = 0; i <= 9; i++) {
        const qKey = `Q${i}`;
        if (item[qKey]) {
          if (!existing[qKey]) existing[qKey] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          for (let s = 1; s <= 5; s++) {
             existing[qKey][s] = (existing[qKey][s] || 0) + (item[qKey][s] || 0);
          }
        }
      }
    }
  });

  return Array.from(map.values());
}
