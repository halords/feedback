import { db } from "@/lib/firebase/admin";

export interface ResponseEntry {
  id: string;
  name: string;
  clientType: string;
  office: string;
  serviceAvailed: string;
  comment: string;
  classification: string;
  date: string;
}

/**
 * Fetches raw response entries for a set of offices, filtered by month and year.
 */
export async function getResponses(
  offices: string[],
  month: string,
  year: string
): Promise<ResponseEntry[]> {
  if (!offices || offices.length === 0) return [];

  const isGlobal = offices.includes("ALL");
  let snapshots: any[] = [];

  if (isGlobal) {
    // Global fetch for Superadmins
    const snapshot = await db.collection('Responses').get();
    snapshots = [snapshot];
  } else {
    // Chunked office fetch
    const CHUNK_SIZE = 30;
    const officeChunks = [];
    for (let i = 0; i < offices.length; i += CHUNK_SIZE) {
      officeChunks.push(offices.slice(i, i + CHUNK_SIZE));
    }

    const queryPromises = officeChunks.map(chunk => 
      db.collection('Responses')
        .where('Office', 'in', chunk)
        .get()
    );
    snapshots = await Promise.all(queryPromises);
  }

  const responses: ResponseEntry[] = [];

  snapshots.forEach(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.Date) return; // Skip records without date

      const date = new Date(data.Date);
      if (isNaN(date.getTime())) return; // Skip invalid dates

      const docMonth = date.toLocaleString('en-US', { month: 'long' });
      const docYear = date.getFullYear().toString();

      if (docMonth === month && docYear === year) {
        responses.push({
          id: doc.id,
          name: data.Name || "Anonymous",
          clientType: data.Client_Type || "Unknown",
          office: data.Office,
          serviceAvailed: data.Service_Availed || "None",
          comment: data.Comment || "",
          classification: data.Class || "Unclassified",
          date: data.Date
        });
      }
    });
  });

  // Sort by date descending (assuming data.Date is a valid date string or timestamp)
  return responses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Updates the classification of multiple comments in a single batch operation.
 */
export async function classifyComments(
  assignments: { docId: string; classification: string }[]
) {
  const batch = db.batch();
  
  assignments.forEach(({ docId, classification }) => {
    const docRef = db.collection('Responses').doc(docId);
    batch.update(docRef, { Class: classification });
  });

  await batch.commit();
}
