import { db } from "@/lib/firebase/admin";
import { getMonthBounds } from "@/lib/utils/dateUtils";
import { getJsonArchive } from "./storageService";
import { resolveTargetOffices } from "./aggregatorService";

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
  year: string,
  skipArchive = false
): Promise<ResponseEntry[]> {
  if (!offices || offices.length === 0) return [];
  const resolvedOffices = await resolveTargetOffices(offices, year);

  // 1. Try fetching from archives first
  if (!skipArchive) {
    const archivePath = `archives/${year}/${month}/responses.json`;
    const archivedData = await getJsonArchive<any[]>(archivePath);

    if (archivedData) {
      console.log(`[ResponseService] Archive HIT: Using optimized JSON for ${month} ${year}`);
      
      const responses = archivedData
        .filter(data => {
          const id = data.officeId || data.Office || "";
          return resolvedOffices.some(ro => ro.trim() === id.trim());
        })
        .map(data => {
          const officeId = data.officeId || data.Office;
          const officeName = officesInDb.find(o => o.id === officeId)?.name || officeId;
          return {
            id: data.id,
            name: data.Name || "Anonymous",
            clientType: data.Client_Type || "Unknown",
            office: officeName,
            serviceAvailed: data.Service_Availed || "None",
            comment: data.Comment || "",
            classification: data.Class || "Unclassified",
            date: data.Date
          };
        });
        
      return responses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }


  // 2. Fallback to Firestore
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthIndex = months.indexOf(month);
  const monthNum = String(monthIndex + 1).padStart(2, '0');
  
  const startDateIso = `${year}-${monthNum}-01`;
  const endDateIso = `${year}-${monthNum}-31`; // Firestore range filters handle this safely

  const isGlobal = offices.includes("ALL");
  let snapshots: any[] = [];

  if (isGlobal) {
    // Global fetch for Superadmins - Now targeted by date range!
    const snapshot = await db.collection('Responses')
      .where('date_iso', '>=', startDateIso)
      .where('date_iso', '<=', endDateIso)
      .get();
    snapshots = [snapshot];
  } else {
    // Chunked office fetch - Now targeted by date range!
    const CHUNK_SIZE = 30;
    const officeChunks = [];
    for (let i = 0; i < resolvedOffices.length; i += CHUNK_SIZE) {
      officeChunks.push(resolvedOffices.slice(i, i + CHUNK_SIZE));
    }

    // With normalization, we search by officeId
    const queryPromises = officeChunks.map(chunk => 
      db.collection('Responses')
        .where('officeId', 'in', chunk)
        .where('date_iso', '>=', startDateIso)
        .where('date_iso', '<=', endDateIso)
        .get()
    );
    snapshots = await Promise.all(queryPromises);
  }

  const officesInDb = await import("./officeService").then(m => m.getAllOffices());
  const responses: ResponseEntry[] = [];

  snapshots.forEach(snapshot => {
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const officeId = data.officeId || data.Office;
      const officeName = officesInDb.find(o => o.id === officeId)?.name || officeId;

      responses.push({
        id: doc.id,
        name: data.Name || "Anonymous",
        clientType: data.Client_Type || "Unknown",
        office: officeName,
        serviceAvailed: data.Service_Availed || "None",
        comment: data.Comment || "",
        classification: data.Class || "Unclassified",
        date: data.date_iso || data.Date
      });
    });
  });

  // Sort by date descending
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
