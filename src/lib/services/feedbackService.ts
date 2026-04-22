import { db } from "@/lib/firebase/admin";
import { admin } from "@/lib/firebase/admin";

export interface FeedbackResponse {
  docID: string;
  user: {
    no: number;
    Name: string;
    Client_Type: string;
    Office: string;
    Service_Availed: string;
    Date: string;
    Comment: string;
    Class: string;
  };
}

/**
 * Fetches detailed feedback responses.
 */
export async function getOfficeResponses(
  month?: string,
  year?: string
): Promise<FeedbackResponse[]> {
  try {
    const data: any[] = [];
    const chunkSize = 30;

    // 1. Dynamically determine "Assigned Offices"
    const assignmentSnapshot = await db.collection('office_assignment').get();
    const assignedOfficesSet = new Set<string>();

    assignmentSnapshot.docs.forEach(doc => {
      const office = doc.data().office;
      if (office) {
        if (Array.isArray(office)) {
          office.forEach(o => assignedOfficesSet.add(o));
        } else {
          assignedOfficesSet.add(office);
        }
      }
    });

    const targetOffices = Array.from(assignedOfficesSet);
    if (targetOffices.length === 0) return [];

    // 2. Fetch responses in chunks
    for (let i = 0; i < targetOffices.length; i += chunkSize) {
      const officeChunk = targetOffices.slice(i, i + chunkSize);
      const snapshot = await db.collection('Responses')
        .where('Office', 'in', officeChunk)
        .get();

      snapshot.docs.forEach((doc) => {
        const docData = doc.data();
        const docDate = new Date(docData.Date);

        // Temporal filter (In-memory for legacy string format robustness)
        if (month && year) {
          if (isNaN(docDate.getTime())) return;
          const docMonth = docDate.toLocaleString('en-US', { month: 'long' });
          const docYear = docDate.getFullYear().toString();
          if (docMonth !== month || docYear !== year) return;
        }

        data.push({ id: doc.id, ...docData });
      });
    }

    // 3. SORT FIRST (Default newest first to match legacy expected view)
    data.sort((a, b) => {
      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();
      // Use date descending (newest first)
      return dateB - dateA;
    });

    // 4. ASSIGN NUMBERS AFTER SORTING (Ensures sequential "No." column)
    return data.map((item, index) => normalizeResponse(item.id, item, index + 1));
  } catch (error) {
    console.error("[feedbackService] getOfficeResponses Error:", error);
    throw error;
  }
}

/**
 * Performs batch updates to comment classifications.
 */
export async function updateCommentClassifications(updates: { documentID: string, classification: string }[]) {
  try {
    const batch = db.batch();

    updates.forEach(({ documentID, classification }) => {
      const ref = db.collection('Responses').doc(documentID);
      batch.update(ref, {
        Class: classification,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    return { success: true, message: "Classifications updated successfully" };
  } catch (error: any) {
    console.error("[feedbackService] updateCommentClassifications Error:", error);
    throw new Error("Failed to update classifications: " + error.message);
  }
}

function normalizeResponse(id: string, data: any, index: number): FeedbackResponse {
  const d = new Date(data.Date);
  const formattedDate = !isNaN(d.getTime())
    ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : "Invalid Date";

  return {
    docID: id,
    user: {
      no: index,
      Name: data.Name || "Anonymous",
      Client_Type: data.Client_Type || "Others",
      Office: data.Office || "Unknown",
      Service_Availed: data.Service_Availed || "N/A",
      Date: formattedDate,
      Comment: data.Comment || "",
      Class: data.Class || "",
    }
  };
}
