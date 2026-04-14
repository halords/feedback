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
  const offices: Office[] = [];
  
  snapshot.forEach((doc: any) => {
    const data = doc.data();
    const status = data.status || "active";
    
    // Filter active offices unless requested otherwise (Admins see all)
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
 * Updates office metadata and propagates acronym renames to other collections.
 */
export async function updateOffice(id: string, updates: { name?: string; fullName?: string; status?: "active" | "disabled" }) {
  const docRef = db.collection("offices").doc(id);
  const oldDoc = await docRef.get();
  if (!oldDoc.exists) throw new Error("Office not found");
  
  const oldData = oldDoc.data()!;
  const oldName = oldData.name;
  const newName = updates.name;

  const batch = db.batch();
  
  // Clean 'updates' of undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );
  
  // 1. Update the office document itself
  batch.update(docRef, {
    ...cleanUpdates,
    updatedAt: new Date().toISOString()
  });

  // 2. If the acronym (name) changed, we need to sync other collections
  if (newName && newName !== oldName) {
    console.log(`[OfficeSync] Renaming ${oldName} to ${newName}. Propagation started...`);
    await syncOfficeRename(oldName, newName);
  }

  // 3. If the office was disabled, we must unassign it from all users
  if (updates.status === "disabled" && oldData.status !== "disabled") {
    console.log(`[OfficeSync] Office ${oldName} disabled. Cleaning up assignments...`);
    await cleanupDisabledOfficeAssignments(oldName);
  }

  await batch.commit();
  return { success: true };
}

/**
 * Robust synchronization for office rename across all affected collections.
 */
async function syncOfficeRename(oldName: string, newName: string) {
  const collections = [
    { name: "Responses", field: "Office" },
    { name: "office_assignment", field: "office" },
    { name: "physical_report", field: "DEPARTMENT" },
    { name: "user_data", field: "office" }
  ];

  for (const col of collections) {
    let count = 0;
    let lastDoc: any = null;
    
    while (true) {
      let query = db.collection(col.name).where(col.field, "==", oldName).limit(500);
      if (lastDoc) query = query.startAfter(lastDoc);
      
      const snapshot = await query.get();
      if (snapshot.empty) break;

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { [col.field]: newName });
      });

      await batch.commit();
      count += snapshot.size;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      console.log(`[OfficeSync] Updated ${count} records in ${col.name}`);
      if (snapshot.size < 500) break;
    }
  }
}

/**
 * Removes a disabled office from all user assignments and profiles.
 */
async function cleanupDisabledOfficeAssignments(officeName: string) {
  // 1. Delete from office_assignment
  const assignments = await db.collection("office_assignment").where("office", "==", officeName).get();
  const aBatch = db.batch();
  assignments.forEach(doc => aBatch.delete(doc.ref));
  await aBatch.commit();
  console.log(`[OfficeSync] Removed ${assignments.size} assignments for ${officeName}`);

  // 2. Reset primary office in user_data to "Unassigned"
  const profiles = await db.collection("user_data").where("office", "==", officeName).get();
  const pBatch = db.batch();
  profiles.forEach(doc => pBatch.update(doc.ref, { office: "Unassigned" }));
  await pBatch.commit();
  console.log(`[OfficeSync] Reset ${profiles.size} profiles from ${officeName} to Unassigned`);
}

export async function getOfficeAssignee(officeId: string): Promise<string> {
  try {
    // 1. Look up office_assignment
    const assignmentSnapshot = await db
      .collection("office_assignment")
      .where("office", "==", officeId)
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

export async function getAllOfficeAssignees(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const assignments = await db.collection("office_assignment").get();
    const userIds = new Set<string>();
    const assignmentMap: Record<string, string> = {};

    assignments.forEach(doc => {
      const data = doc.data();
      if (data.office && data.idno) {
        assignmentMap[data.office] = String(data.idno);
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

    return result;
  } catch (error) {
    console.error("Error fetching all assignees:", error);
    return result;
  }
}
