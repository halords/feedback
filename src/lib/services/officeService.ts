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
