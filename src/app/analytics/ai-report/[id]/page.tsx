import { getAIReport } from "@/lib/services/aiReportService";
import { AIReportClient } from "./AIReportClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const report = await getAIReport(id);
  return {
    title: report ? `${report.title} | PGLU AI` : "AI Report",
    description: "AI-generated feedback trend analysis",
  };
}

export default async function AIReportPage({ params }: Props) {
  const { id } = await params;
  const report = await getAIReport(id);

  if (!report) {
    notFound();
  }

  // Serialize report for client component (convert Timestamps to ISO strings)
  const serializedReport = {
    ...report,
    createdAt: report.createdAt?.toDate 
      ? report.createdAt.toDate().toISOString() 
      : report.createdAt instanceof Date 
        ? report.createdAt.toISOString()
        : JSON.parse(JSON.stringify(report.createdAt))
  };

  return <AIReportClient report={serializedReport as any} />;
}
