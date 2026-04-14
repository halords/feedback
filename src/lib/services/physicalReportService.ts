import { db } from "@/lib/firebase/admin";
import { calculateQuestionRate, calculateSatisfactionAverages } from "./analyticsService";

export interface PhysicalReport {
  id: string;
  DEPARTMENT: string;
  FOR_THE_MONTH_OF: string;
  COLLECTED_FORMS: number;
  VISITORS: number;
  MALE: number;
  FEMALE: number;
  LGBTQ: number;
  PREFER_NOT_TO_SAY: number;
  CITIZEN: number;
  BUSINESS: number;
  GOVERNMENT: number;
  YES: number;
  JUST_NOW: number;
  NO: number;
  VISIBLE: number;
  SOMEWHAT_VISIBLE: number;
  DIFFICULT_TO_SEE: number;
  NOT_VISIBLE: number;
  NA: number;
  VERY_MUCH: number;
  SOMEWHAT: number;
  DID_NOT_HELP: number;
  NA2: number;
  COMMENTS: string[];
  CLASSIFY: string[];
  DATE_COLLECTED: any;
  [key: string]: any; // For Q-values like "01", "02", etc.
}

export async function getAllPhysicalReports(month?: string | null, year?: string | null): Promise<PhysicalReport[]> {
  let query: any = db.collection("physical_report").orderBy("FOR_THE_MONTH_OF", "desc");
  
  if (month && year) {
    const period = `${month} ${year}`;
    query = db.collection("physical_report")
      .where("FOR_THE_MONTH_OF", "==", period)
      .orderBy("FOR_THE_MONTH_OF", "desc");
  } else if (year) {
    // If only year is provided, we might need a different approach since period is "Month Year"
    // For now, let's assume if year is provided, month is usually provided too.
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  })) as PhysicalReport[];
}

export async function updatePhysicalReport(id: string, data: Partial<PhysicalReport>) {
  const docRef = db.collection("physical_report").doc(id);
  await docRef.update({
    ...data,
    updatedAt: new Date()
  });
  return { id, success: true };
}

export async function createPhysicalReport(data: Omit<PhysicalReport, "id">) {
  const docRef = await db.collection("physical_report").add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: docRef.id, success: true };
}
