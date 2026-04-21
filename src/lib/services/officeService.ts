import { db } from "@/lib/firebase/admin";

export interface Office {
  id: string;
  name: string;
  fullName?: string;
  status: "active" | "disabled";
  updatedAt?: string;
}

export async function getAllOffices(includeDisabled = false): Promise<Office[]> {
  const snapshot = await db.collection("offices").get();
  console.log(`[OfficeService] Firestore fetch: ${snapshot.size} documents found in 'offices' collection.`);
  const offices: Office[] = [];
  
  snapshot.forEach((doc: any) => {
    const data = doc.data();
    const status = data.status || "active";
    
    // Return based on inclusion flag
    if (includeDisabled || status === "active") {
      offices.push({
        id: doc.id,
        name: data.name || data.Office || doc.id,
        fullName: data.fullName || data.name || "",
        status: status as "active" | "disabled",
        updatedAt: data.updatedAt
      });
    }
  });

  return offices.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates a new office record.
 */
export async function createOffice(acronym: string, fullName: string) {
  const docRef = db.collection("offices").doc(acronym);
  const data: Partial<Office> = {
    name: acronym,
    fullName: fullName,
    status: "active",
    updatedAt: new Date().toISOString()
  };
  await docRef.set(data);
  return { id: acronym, ...data };
}

/**
 * Updates office metadata.
 * With normalization, renaming an office's full name no longer requires
 * updates to other collections, as they reference the office by ID.
 */
export async function updateOffice(id: string, updates: { name?: string; fullName?: string; status?: "active" | "disabled" }) {
  const docRef = db.collection("offices").doc(id);
  const oldDoc = await docRef.get();
  if (!oldDoc.exists) throw new Error("Office not found");
  
  const oldData = oldDoc.data()!;
  
  // Clean 'updates' of undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  
  await docRef.update({
    ...cleanUpdates,
    updatedAt: new Date().toISOString()
  });

  // If the office was disabled, we must unassign it from all users
  if (updates.status === "disabled" && oldData.status !== "disabled") {
    console.log(`[OfficeSync] Office ${id} disabled. Cleaning up assignments...`);
    await cleanupDisabledOfficeAssignments(id);
  }

  return { success: true };
}

/**
 * Removes a disabled office from all user assignments and profiles.
 */
async function cleanupDisabledOfficeAssignments(officeId: string) {
  // 1. Delete from office_assignment
  const assignments = await db.collection("office_assignment").where("officeId", "==", officeId).get();
  const aBatch = db.batch();
  assignments.forEach(doc => aBatch.delete(doc.ref));
  await aBatch.commit();
  console.log(`[OfficeSync] Removed ${assignments.size} assignments for ${officeId}`);

  // 2. Reset primary office in user_data to "Unassigned"
  const profiles = await db.collection("user_data").where("officeId", "==", officeId).get();
  const pBatch = db.batch();
  profiles.forEach(doc => pBatch.update(doc.ref, { officeId: "Unassigned", office: "Unassigned" }));
  await pBatch.commit();
  console.log(`[OfficeSync] Reset ${profiles.size} profiles from ${officeId} to Unassigned`);
}

export async function getOfficeAssignee(officeId: string): Promise<string> {
  try {
    const allOffices = await getAllOffices(true);
    const resolvedOffice = allOffices.find(o => o.id === officeId || o.name === officeId);
    const lookupId = resolvedOffice ? resolvedOffice.id : officeId;

    // 1. Look up office_assignment
    const assignmentSnapshot = await db
      .collection("office_assignment")
      .where("officeId", "==", lookupId)
      .limit(1)
      .get();

    if (assignmentSnapshot.empty) {
      // Satellite Fallback: If "PTO-Assessor", try "PTO"
      if (officeId.includes("-")) {
        const parentId = officeId.split("-")[0];
        console.log(`[OfficeService] No assignment for ${officeId}, falling back to parent ${parentId}`);
        return getOfficeAssignee(parentId);
      }
      return "__________________________"; // Default placeholder if no assignment
    }

    const idno = String(assignmentSnapshot.docs[0].data().idno || "");
    if (!idno) return "__________________________";

    // 2. Look up user profile by idno in 'user_data' collection
    const profileQuery = await db.collection("user_data")
      .where("idnumber", "==", idno)
      .limit(1)
      .get();
    
    if (!profileQuery.empty) {
      const data = profileQuery.docs[0].data();
      return (data.full_name || data.fullName || "__________________________").toUpperCase();
    }
  } catch (error) {
    console.error(`Error fetching assignee for ${officeId}:`, error);
    return "__________________________";
  }
}

/**
 * Optimized fetch for all office assignees.
 * Explicitly maps personnel from 'user_data' via 'office_assignment'.
 */
export async function getAllOfficeAssignees(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const assignments = await db.collection("office_assignment").get();
    const userIds = new Set<string>();
    const assignmentMap: Record<string, string[]> = {};

    assignments.forEach(doc => {
      const data = doc.data();
      const targetId = data.officeId || data.office;
      const idno = String(data.idno || "");
      
      if (targetId && idno) {
        if (!assignmentMap[idno]) assignmentMap[idno] = [];
        assignmentMap[idno].push(targetId);
        userIds.add(idno);
      }
    });

    if (userIds.size === 0) return result;

    // 2. Fetch profiles and all offices for mapping
    const [idList, allOffices] = await Promise.all([
        Array.from(userIds),
        getAllOffices(true)
    ]);

    const CHUNK_SIZE = 30;
    for (let i = 0; i < idList.length; i += CHUNK_SIZE) {
      const chunk = idList.slice(i, i + CHUNK_SIZE);
      const profileSnapshot = await db.collection("user_data")
        .where("idnumber", "in", chunk)
        .get();
      
      profileSnapshot.forEach(doc => {
        const data = doc.data();
        const id = String(data.idnumber || "");
        const name = (data.full_name || data.fullName || "").toUpperCase();
        
        if (id && name) {
          const matchedIds = assignmentMap[id] || [];
          matchedIds.forEach(mId => {
            // Map the Doc ID
            result.set(mId, name);
            
            // Map the Acronym too for compatibility
            const office = allOffices.find(o => o.id === mId || o.name === mId);
            if (office) {
              result.set(office.name, name);
              
              // Handle satellite fallbacks in the map
              if (office.name === "PHO") {
                result.set("PHO-Clinic", name);
                result.set("PHO-Warehouse", name);
              } else if (office.name === "PTO") {
                result.set("PTO-Cash", name);
                result.set("PTO-Assessor", name);
              }
            }
          });
        }
      });
    }

    console.log(`[OfficeService] Resolved ${result.size} office/ID assignees`);
    return result;
  } catch (error) {
    console.error("Error fetching all assignees:", error);
    return result;
  }
}

/**
 * Unified logic for determining which offices should be displayed/archived
 * based on the month and year context.
 */
export async function getEffectiveOfficesForPeriod(month: string, year: string): Promise<Office[]> {
  try {
    // 1. Fetch all offices (including disabled)
    const allOffices = await getAllOffices(true);
    
    // 2. Filter by special exclusions (PYESDO/PCDO in 2025)
    let offices = allOffices.filter(office => {
      const is2025 = String(year) === "2025";
      if (is2025) {
        const id = office.id.toUpperCase();
        const name = office.name.toUpperCase();
        if (id === "PYESDO" || id === "PCDO" || name === "PYESDO" || name === "PCDO") {
          return false;
        }
      }
      return true;
    });

    // 3. Keep only active offices
    const result = offices.filter(o => o.status === "active");

    // 4. Inject Satellite Offices as Independent Entities if not already present
    // This allows them to be archived and reported on individually even if not in the main 'offices' collection
    const SATELLITE_NAMES: Record<string, string[]> = {
      PHO: ["PHO-Clinic", "PHO-Warehouse"],
      PTO: ["PTO-Cash", "PTO-Assessor"],
    };

    const existingIds = new Set(result.map(o => o.id.toUpperCase()));
    
    Object.values(SATELLITE_NAMES).flat().forEach(satelliteId => {
      if (!existingIds.has(satelliteId.toUpperCase())) {
        result.push({
          id: satelliteId,
          name: satelliteId,
          fullName: satelliteId.replace(/-/g, ' '),
          status: "active"
        });
      }
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error in getEffectiveOfficesForPeriod:", error);
    // Fallback to active offices only on failure
    return getAllOffices(false);
  }
}
