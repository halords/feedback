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
    
    // Strictly return only active offices
    if (status === "active") {
      offices.push({
        id: doc.id,
        name: data.name || data.Office || doc.id,
        fullName: data.fullName || data.name || "",
        status: "active",
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
    // 1. Look up office_assignment
    const assignmentSnapshot = await db
      .collection("office_assignment")
      .where("officeId", "==", officeId)
      .limit(1)
      .get();

    if (assignmentSnapshot.empty) {
      return "__________________________"; // Default placeholder if no assignment
    }

    const idno = assignmentSnapshot.docs[0].data().idno;

    // 2. Look up user profile by idno in 'user_data' collection
    const profileQuery = await db.collection("user_data")
      .where("idnumber", "==", idno)
      .limit(1)
      .get();
    
    if (!profileQuery.empty) {
      return profileQuery.docs[0].data().full_name?.toUpperCase() || "__________________________";
    }

    // Fallback: Check 'users' collection for legacy data
    const userDoc = await db.collection("users").doc(String(idno)).get();
    if (userDoc.exists && userDoc.data()?.fullName) {
      return userDoc.data()?.fullName.toUpperCase();
    }

    return "__________________________";
  } catch (error) {
    console.error(`Error fetching assignee for ${officeId}:`, error);
    return "__________________________";
  }
}


let assigneeCache: Map<string, string> | null = null;
let lastCacheFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getAllOfficeAssignees(): Promise<Map<string, string>> {
  const now = Date.now();
  if (assigneeCache && (now - lastCacheFetch < CACHE_TTL)) {
    console.log("[OfficeService] Returning cached assignee map");
    return new Map(assigneeCache);
  }

  const result = new Map<string, string>();
  try {
    const assignments = await db.collection("office_assignment").get();
    const userIds = new Set<string>();
    const assignmentMap: Record<string, string> = {};

    assignments.forEach(doc => {
      const data = doc.data();
      if (data.officeId && data.idno) {
        assignmentMap[data.officeId] = String(data.idno);
        userIds.add(String(data.idno));
      }
    });

    if (userIds.size === 0) return result;

    // 2. Fetch profiles from 'user_data' in chunks of 30
    const idList = Array.from(userIds);
    const CHUNK_SIZE = 30;
    for (let i = 0; i < idList.length; i += CHUNK_SIZE) {
      const chunk = idList.slice(i, i + CHUNK_SIZE);
      const profileSnapshot = await db.collection("user_data")
        .where("idnumber", "in", chunk)
        .get();
      
      profileSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.idnumber && data.full_name) {
          // Find which offices are assigned to this idno
          Object.entries(assignmentMap).forEach(([off, id]) => {
            if (id === String(data.idnumber)) {
              result.set(off, data.full_name.toUpperCase());
            }
          });
        }
      });
    }

    assigneeCache = new Map(result);
    lastCacheFetch = Date.now();

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

    return result.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error in getEffectiveOfficesForPeriod:", error);
    // Fallback to active offices only on failure
    return getAllOffices(false);
  }
}
