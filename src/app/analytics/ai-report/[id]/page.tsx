import { getAIReport } from "@/lib/services/aiReportService";
import { AIReportClient } from "./AIReportClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = await getAIReport(params.id);
  return {
    title: report ? `${report.title} | PGLU AI` : "AI Report",
    description: "AI-generated feedback trend analysis",
  };
}

export default async function AIReportPage({ params }: Props) {
  const report = await getAIReport(params.id);

  if (!report) {
    notFound();
  }

  return <AIReportClient report={report} />;
}
