import { db } from "@/lib/firebase/admin";
import bcrypt from "bcryptjs";

export interface UserProfile {
  idno: string;
  fullName: string;
  position: string;
  office: string;
  userType: string;
  username: string;
  officeAssignments: string[];
}

/**
 * Fetches all users with their joined profile and office assignments.
 * Optimized with batched queries to avoid N+1 bottlenecks.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    // 1. Fetch all users from the auth collection
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (users.length === 0) return [];

    const idnos = users.map(u => u.idno).filter(id => !!id);
    const CHUNK_SIZE = 30;

    // 2. Fetch user_data (profiles) in chunks
    const userDataMap = new Map<string, any>();
    for (let i = 0; i < idnos.length; i += CHUNK_SIZE) {
      const chunk = idnos.slice(i, i + CHUNK_SIZE);
      const snapshot = await db.collection("user_data")
        .where("idnumber", "in", chunk)
        .get();
      snapshot.forEach(doc => {
        const data = doc.data();
        userDataMap.set(data.idnumber, data);
      });
    }

    // 3. Fetch office_assignments in chunks
    const assignmentsMap = new Map<string, string[]>();
    for (let i = 0; i < idnos.length; i += CHUNK_SIZE) {
      const chunk = idnos.slice(i, i + CHUNK_SIZE);
      const snapshot = await db.collection("office_assignment")
        .where("idno", "in", chunk)
        .get();
      snapshot.forEach(doc => {
        const data = doc.data();
        const existing = assignmentsMap.get(data.idno) || [];
        
        // Handle both string and array formats for legacy compatibility
        if (Array.isArray(data.office)) {
          assignmentsMap.set(data.idno, [...existing, ...data.office]);
        } else if (typeof data.office === "string") {
          assignmentsMap.set(data.idno, [...existing, data.office]);
        }
      });
    }

    // 4. Join the data into UserProfile objects
    return users.map(u => {
      const profile = userDataMap.get(u.idno) || {};
      const offices = assignmentsMap.get(u.idno) || [];
      
      return {
        idno: u.idno,
        username: u.username,
        userType: u.user_type,
        fullName: profile.full_name || "Unknown",
        position: profile.position || "Unknown",
        office: profile.office || "Unknown",
        officeAssignments: [...new Set(offices)] // Ensure uniqueness
      };
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}

/**
 * Adds a new user, profile, and office assignments in an atomic-like batch.
 */
export async function addUser(userData: {
  idno: string;
  full_name: string;
  position: string;
  office: string;
  user_type: string;
  office_assignment: string[];
}) {
  try {
    const hashedPassword = await bcrypt.hash("p@ssw0rd", 12);
    const batch = db.batch();

    // 1. Create entry in 'users' (auth)
    const userRef = db.collection("users").doc();
    batch.set(userRef, {
      idno: userData.idno,
      username: userData.idno, // Default username is ID number
      user_type: userData.user_type,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    });

    // 2. Create entry in 'user_data' (profile)
    const profileRef = db.collection("user_data").doc();
    batch.set(profileRef, {
      full_name: userData.full_name,
      idnumber: userData.idno,
      office: userData.office || "Unknown",
      position: userData.position,
      createdAt: new Date().toISOString()
    });

    // 3. Create entries in 'office_assignment'
    userData.office_assignment.forEach(officeId => {
      const assignRef = db.collection("office_assignment").doc();
      batch.set(assignRef, {
        idno: userData.idno,
        office: officeId
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error in addUser:", error);
    throw error;
  }
}

/**
 * Updates office assignments for a specific user ID number.
 * Replaces all existing assignments with the new list.
 */
export async function updateAssignments(idno: string, offices: string[]) {
  try {
    // Find all existing assignment documents for this user
    const snapshot = await db.collection("office_assignment")
      .where("idno", "==", idno)
      .get();

    const batch = db.batch();

    // Delete existing assignments
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add new assignments
    offices.forEach(officeId => {
      const assignRef = db.collection("office_assignment").doc();
      batch.set(assignRef, {
        idno: idno,
        office: officeId
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error in updateAssignments:", error);
    throw error;
  }
}
