import { db } from "@/lib/firebase/admin";
import { calculateQuestionRate, calculateSatisfactionAverages } from "./analyticsService";

export interface PhysicalReport {
  id: string;
  officeId: string;
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
    const monthMap: Record<string, string> = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const periodIso = `${year}-${monthMap[month]}`;
    query = db.collection("physical_report")
      .where("period_iso", "==", periodIso)
      .orderBy("period_iso", "desc");
  } else if (year) {
    // Range query for the whole year
    query = db.collection("physical_report")
      .where("period_iso", ">=", `${year}-01`)
      .where("period_iso", "<=", `${year}-12`)
      .orderBy("period_iso", "desc");
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
