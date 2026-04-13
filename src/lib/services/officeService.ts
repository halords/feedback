import { db } from "@/lib/firebase/admin";

export interface Office {
  id: string;
  name: string;
}

export async function getAllOffices(): Promise<Office[]> {
  const snapshot = await db.collection("offices").get();
  const offices: Office[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    offices.push({
      id: doc.id,
      name: data.name || data.Office || "Unknown Office", // Handling different potential field names
    });
  });

  // Sort by name alphabetically
  return offices.sort((a, b) => a.name.localeCompare(b.name));
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

    // 2. Look up user by idno (Note: the user said to look up fullName using idno)
    // We'll check if a document exists with ID 'idno' first, then try filtering by field 'idno'
    const userDoc = await db.collection("users").doc(String(idno)).get();
    
    if (userDoc.exists) {
      return userDoc.data()?.fullName || "__________________________";
    }

    // Fallback search by idno field if doc ID and idno field are different
    const userQuery = await db.collection("users").where("idno", "==", idno).limit(1)
      .get();

    if (!userQuery.empty) {
      return userQuery.docs[0].data().fullName || "__________________________";
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

    // Fetch users in chunks of 30 (Firestore in limit)
    const idList = Array.from(userIds);
    const CHUNK_SIZE = 30;
    for (let i = 0; i < idList.length; i += CHUNK_SIZE) {
      const chunk = idList.slice(i, i + CHUNK_SIZE);
      const userSnapshot = await db.collection("users")
        .where("idno", "in", chunk)
        .get();
      
      userSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.idno && data.fullName) {
          // Find which offices are assigned to this idno
          Object.entries(assignmentMap).forEach(([off, id]) => {
            if (id === String(data.idno)) {
              result.set(off, data.fullName);
            }
          });
        }
      });
      
      // Also check Doc IDs for those that might not have idno field but doc ID matches
      const docPromises = chunk.map(id => db.collection("users").doc(id).get());
      const docSnapshots = await Promise.all(docPromises);
      docSnapshots.forEach(doc => {
        if (doc.exists) {
          const data = doc.data();
          if (data?.fullName) {
            Object.entries(assignmentMap).forEach(([off, id]) => {
              if (id === doc.id) {
                result.set(off, data.fullName);
              }
            });
          }
        }
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching all assignees:", error);
    return result;
  }
}


