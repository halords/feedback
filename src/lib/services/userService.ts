import { db, auth } from "@/lib/firebase/admin";
import { getAllOffices } from "./officeService";
import bcrypt from "bcryptjs";

export interface UserProfile {
  idno: string;
  fullName: string;
  position: string;
  office: string;
  userType: string;
  username: string;
  officeAssignments: string[];
  isAnalyticsEnabled?: boolean;
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
        const officeVal = data.officeId || data.office;
        const idno = String(data.idno || "");
        
        if (officeVal && idno) {
          const existing = assignmentsMap.get(idno) || [];
          if (Array.isArray(officeVal)) {
            assignmentsMap.set(idno, [...existing, ...officeVal]);
          } else {
            assignmentsMap.set(idno, [...existing, officeVal]);
          }
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
        officeAssignments: [...new Set(offices)], // Ensure uniqueness
        isAnalyticsEnabled: !!profile.is_analytics_enabled
      };
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}

/**
 * adds a new user to both Firestore AND Firebase Authentication.
 */
export async function addUser(userData: {
  idno: string;
  full_name: string;
  position: string;
  office: string;
  user_type: string;
  office_assignment: string[];
  is_analytics_enabled?: boolean;
}) {
  try {
    const rawPassword = "p@ssw0rd";
    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    const identifier = `${userData.idno}@feedback.internal`;

    // 1. Create in Firebase Authentication
    // We attempt to set the UID to the idno for system consistency.
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        uid: userData.idno,
        email: identifier,
        password: rawPassword,
        displayName: userData.full_name,
      });
      
      // Set initial custom claims for the new user
      await auth.setCustomUserClaims(firebaseUser.uid, {
        idno: userData.idno,
        user_type: userData.user_type,
        full_name: userData.full_name,
        is_analytics_enabled: !!userData.is_analytics_enabled
      });
    } catch (authError: any) {
      if (authError.code === 'auth/uid-already-exists' || authError.code === 'auth/email-already-exists') {
        console.warn(`[UserService] User ${userData.idno} already exists in Firebase Auth. Continuing with Firestore sync.`);
      } else {
        throw authError;
      }
    }

    const batch = db.batch();

    // 2. Create entry in 'users' (legacy compatibility and metadata)
    const userRef = db.collection("users").doc();
    batch.set(userRef, {
      idno: userData.idno,
      username: userData.idno, 
      user_type: userData.user_type,
      password: hashedPassword, // Kept for legacy system compatibility
      createdAt: new Date().toISOString(),
      requiresPasswordChange: false
    });

    // 3. Create entry in 'user_data' (profile)
    const profileRef = db.collection("user_data").doc();
    batch.set(profileRef, {
      full_name: userData.full_name,
      idnumber: userData.idno,
      office: userData.office || "Unknown",
      position: userData.position,
      is_analytics_enabled: userData.is_analytics_enabled || false,
      createdAt: new Date().toISOString()
    });

    // 4. Create entries in 'office_assignment'
    const allOffices = await getAllOffices(true);
    userData.office_assignment.forEach(officeAcronym => {
        const officeDoc = allOffices.find(o => o.name === officeAcronym);
        const assignRef = db.collection("office_assignment").doc();
        batch.set(assignRef, {
            idno: userData.idno,
            office: officeAcronym, // Acronym
            officeId: officeDoc ? officeDoc.id : officeAcronym // Document ID from offices collection
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
    const allOffices = await getAllOffices(true);
    offices.forEach(officeAcronym => {
      const officeDoc = allOffices.find(o => o.name === officeAcronym);
      const assignRef = db.collection("office_assignment").doc();
      batch.set(assignRef, {
        idno: idno,
        office: officeAcronym, // Acronym
        officeId: officeDoc ? officeDoc.id : officeAcronym // Document ID
      });
    });

    await batch.commit();

    try {
      await auth.revokeRefreshTokens(idno);
      console.log(`[UserService] Successfully revoked tokens for ${idno}`);
    } catch (authErr) {
      console.warn(`[UserService] Could not revoke tokens for ${idno} (might not exist in Auth yet)`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateAssignments:", error);
    throw error;
  }
}

/**
 * Updates the analytics permission flag for a specific user.
 */
export async function updateUserAnalyticsFlag(idno: string, isEnabled: boolean) {
  try {
    const snapshot = await db.collection("user_data")
      .where("idnumber", "==", idno)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error(`Profile not found for ID: ${idno}`);
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.update({ is_analytics_enabled: isEnabled });

    try {
      await auth.revokeRefreshTokens(idno);
      console.log(`[UserService] Successfully revoked tokens for ${idno}`);
    } catch (authErr) {
      console.warn(`[UserService] Could not revoke tokens for ${idno} (might not exist in Auth yet)`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in updateUserAnalyticsFlag:", error);
    throw error;
  }
}
