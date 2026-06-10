import { db, admin } from "@/lib/firebase/admin";

export interface AIReport {
  id: string;
  userId: string;
  scope: "office" | "organization";
  officeId?: string;
  year: string;
  timeScope: "month" | "quarter" | "year";
  period: string;
  title: string;
  content: any; // The JSON from the AI provider
  createdAt: any;
}

export async function saveAIReport(data: Omit<AIReport, "id" | "createdAt">) {
  const docRef = await db.collection("ai_reports").add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

export async function getAIReport(id: string): Promise<AIReport | null> {
  const doc = await db.collection("ai_reports").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as AIReport;
}
export async function updateAIReport(id: string, content: any) {
  await db.collection("ai_reports").doc(id).update({
    content,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}
