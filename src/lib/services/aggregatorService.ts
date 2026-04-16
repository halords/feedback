import { db } from "@/lib/firebase/admin";

export const SATELLITE_GROUPS = {
  PHO: ["PHO", "PHO-Clinic", "PHO-Warehouse"],
  PTO: ["PTO", "PTO-Cash", "PTO-Assessor"],
};

/**
 * Returns all individual office IDs belonging to a group if the input is a primary group (PHO/PTO),
 * otherwise returns the office ID as is.
 */
export function expandOfficeGroup(officeId: string): string[] {
  if (officeId === "PHO") return SATELLITE_GROUPS.PHO;
  if (officeId === "PTO") return SATELLITE_GROUPS.PTO;
  return [officeId];
}

import { getAllOffices } from "./officeService";

/**
 * Determines if a given office list contains a primary group ID.
 * Dynamically resolves "ALL" by checking the 'offices' collection for active records.
 */
export async function resolveTargetOffices(offices: string[], year?: string): Promise<string[]> {
  const result = new Set<string>();
  const is2025 = String(year) === "2025";
  
  // 1. Get the authoritative list of active offices from the service
  const activeOffices = await getAllOffices();
  console.log(`[Aggregator] Authority: ${activeOffices.length} active offices found in DB.`);
  const activeNames = new Set(activeOffices.map(o => o.name));
  const activeIds = new Set(activeOffices.map(o => o.id));

  // 2. Process requests
  if (offices.includes("ALL")) {
    activeOffices.forEach(o => {
      // Add ID, Name, and Full Name for absolute matching resilience
      result.add(o.id);
      if (o.name) result.add(o.name);
      if (o.fullName) result.add(o.fullName);
      
      // Expand groups for ALL
      expandOfficeGroup(o.id).forEach(expanded => {
        result.add(expanded);
      });
    });
  }

  // Also process specific offices and groups
  offices.forEach(office => {
    if (office === "ALL") return; 
    
    let toAdd: string[] = [];
    if (office === "PHO") toAdd = SATELLITE_GROUPS.PHO;
    else if (office === "PTO") toAdd = SATELLITE_GROUPS.PTO;
    else toAdd = [office];

    toAdd.forEach(o => {
      // Find matching office record to get BOTH Name and ID
      const match = activeOffices.find(doff => 
        doff.id === o || 
        doff.name === o || 
        doff.fullName === o ||
        doff.id === o.trim() ||
        doff.name === o.trim()
      );

      if (match) {
        result.add(match.id);
        if (match.name) result.add(match.name);
        if (match.fullName) result.add(match.fullName);
      } else {
        // Fallback for satellites or missing metadata
        result.add(o);
      }
    });
  });

  // Apply 2025 organizational exclusion rules
  if (is2025) {
    for (const item of Array.from(result)) {
      const upper = item.toUpperCase();
      if (upper === "PYESDO" || upper === "PCDO") {
        result.delete(item);
      }
    }
  }

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
