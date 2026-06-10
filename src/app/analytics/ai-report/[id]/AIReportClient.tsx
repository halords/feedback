"use client";

import React, { useMemo } from "react";
import { AIReport } from "@/lib/services/aiReportService";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import ReactMarkdown from "react-markdown";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  Brain,
  TrendingUp,
  Users,
  Eye,
  Target,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Share2,
  RefreshCw,
  Save,
  X,
  Copy,
  ExternalLink
} from "lucide-react";
import { clsx } from "clsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AIReportClientProps {
  report: AIReport;
}

export function AIReportClient({ report: initialReport }: AIReportClientProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSharedView = searchParams.get("shared") === "true";
  const isPrintView = searchParams.get("print") === "true";

  const [report, setReport] = React.useState(initialReport);
  const isNewReport = report.id === 'new';
  const [previewContent, setPreviewContent] = React.useState<any>(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

  const content = previewContent || report.content;

  // Authorization Check: AI Insights are restricted to superadmins (unless shared view)
  React.useEffect(() => {
    if (!isSharedView && !authLoading && user && user.user_type?.toLowerCase() !== "superadmin") {
      router.replace("/analytics");
    }
  }, [user, authLoading, router, isSharedView]);

  // Auto-trigger analysis for new reports
  React.useEffect(() => {
    if (isNewReport && !report.content && !isRegenerating && !previewContent) {
      handleRegenerate(true);
    }
  }, [isNewReport, report.content, isRegenerating, previewContent]);

  // Auto-trigger print if in print view
  React.useEffect(() => {
    if (isPrintView) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [isPrintView]);

  const handleRegenerate = async (isAuto = false) => {
    if (!isAuto && !confirm("Regenerate analysis? This will call the AI again.")) return;
    
    // If it's a new report and the user cancels the auto-confirm (if we added one)
    // or if the generation fails, we handle it below.
    
    setIsRegenerating(true);
    try {
      const year = report?.year || searchParams.get('year');
      const timeScope = report?.timeScope || searchParams.get('timeScope');
      const value = isNewReport ? searchParams.get('value') : report?.period;

      const body: any = { year, scope: 'organization', timeScope };
      if (timeScope === 'month') body.month = value;
      if (timeScope === 'quarter') body.quarter = value;

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, isRegenerate: true }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPreviewContent(data);
      if (!isAuto) alert("New analysis generated! Review it below, then click 'Save Report' to keep it.");
    } catch (err: any) {
      if (isNewReport) {
        alert("Initial generation failed. Closing tab.");
        window.close();
      } else {
        alert("Regeneration failed: " + err.message);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveUpdate = async () => {
    const contentToSave = previewContent || content;
    if (!contentToSave) return;
    
    setIsSaving(true);
    try {
      if (isNewReport) {
        const res = await fetch("/api/ai/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: contentToSave,
            year: searchParams.get('year'),
            timeScope: searchParams.get('timeScope'),
            period: searchParams.get('value'),
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        router.push(`/analytics/ai-report/${data.reportId}`);
      } else {
        const res = await fetch(`/api/ai/reports/${report.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: contentToSave }),
        });
        if (!res.ok) throw new Error("Failed to update report");
        setReport(prev => ({ ...prev, content: contentToSave }));
        setPreviewContent(null);
      }
      alert("Analysis saved successfully!");
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPremiumPDF = async () => {
    setIsSaving(true); // Re-use saving state for loading
    try {
      // 1. Capture all charts on the page
      const chartIds = ["satisfactionTrend", "collectionTrend"];
      const images: string[] = [];
      
      for (const id of chartIds) {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        if (canvas) {
          images.push(canvas.toDataURL("image/png"));
        }
      }

      // 2. Submit to Premium Generator
      const res = await fetch("/api/reports/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          images,
          period: report.period,
          year: report.year,
          preparedBy: user?.full_name || "PGLU STAFF",
          position: user?.position || "Administrative Officer"
        }),
      });

      if (!res.ok) throw new Error("PDF Generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      // window.URL.revokeObjectURL(url); // Don't revoke immediately or the tab might fail to load
    } catch (err: any) {
      alert("Error generating premium PDF: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("shared", "true");
    navigator.clipboard.writeText(url.toString());
    alert("Shareable link copied to clipboard!");
  };

  const formatMetric = (val: unknown) => {
    if (val === null || val === undefined || val === "NA" || val === "N/A") return "N/A";
    if (typeof val === 'number') return val.toFixed(2) + "%";
    return String(val);
  };

  const satisfactionData = useMemo(() => {
    const trends = content?.trends;
    return {
      labels: trends?.months ?? [],
      datasets: [
        {
          label: "Satisfaction Rate (%)",
          data: trends?.satisfaction ?? [],
          borderColor: "#4F46E5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#4F46E5"
        }
      ]
    };
  }, [content]);

  const periodLabel = useMemo(() => {
    const scope = report.timeScope || searchParams.get('timeScope');
    const period = report.period || searchParams.get('value');

    if (scope === 'month') return `${period} Satisfaction`;
    if (scope === 'quarter') return `${period} Satisfaction`;
    if (scope === 'year') return "Annual Satisfaction";
    
    if (!content) return "Performance Analysis";
    
    // Fallback for older reports based on title content parsing
    const title = content.title || "";
    if (title.includes("Rate - ")) {
      const monthPart = title.split("Rate - ")[1];
      return `${monthPart} Satisfaction`;
    }
    if (title.includes(" Quarter")) {
      const qPart = title.split(" Satisfaction")[0]; // e.g. "1st Quarter"
      return `${qPart} Satisfaction`;
    }
    
    return "Annual Satisfaction";
  }, [report, content, searchParams]);

  const collectionData = useMemo(() => {
    const trends = content?.trends;
    return {
      labels: trends?.months ?? [],
      datasets: [
        {
          label: "Collection Rate (%)",
          data: trends?.collection ?? [],
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#10B981"
        }
      ]
    };
  }, [content]);

  if (authLoading || !user || user.user_type?.toLowerCase() !== "superadmin") {
    return (
      <Shell>
        <div className="h-[60vh] flex items-center justify-center">
          <p className="text-on-surface/40 font-black uppercase tracking-widest animate-pulse">Checking Permissions...</p>
        </div>
      </Shell>
    );
  }

  if (!content && isRegenerating) {
    return (
      <Shell>
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-on-surface">Initializing AI Intelligence</h2>
            <p className="text-sm font-bold text-on-surface/40 uppercase tracking-widest animate-pulse">Crunching metrics & generating insights...</p>
          </div>
        </div>
      </Shell>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        font: { size: 14, weight: 'bold' as const },
        padding: { top: 10, bottom: 30 }
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#111827",
        bodyColor: "#4B5563",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 10, weight: "bold" as const }, color: "rgba(0,0,0,0.4)" }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: "bold" as const }, color: "rgba(0,0,0,0.4)" }
      }
    }
  };

  const handlePrint = () => window.print();

  const MainContent = (
    <div className={clsx("max-w-6xl mx-auto space-y-8 pb-32 print:p-0 print:space-y-4", isSharedView && "py-12 px-6")}>
      {/* Regeneration Preview Header */}
      {previewContent && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-primary p-4 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4 text-white">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Previewing New Analysis</p>
              <p className="text-[10px] opacity-70">This response is not yet saved. Review it before updating.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isNewReport) {
                  router.push('/analytics');
                } else {
                  setPreviewContent(null);
                }
              }}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Discard
            </button>
            <button
              onClick={handleSaveUpdate}
              disabled={isSaving}
              className="px-6 py-2 rounded-lg bg-white text-primary hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save & Update Analysis"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Brain className={clsx("w-6 h-6", isRegenerating && "animate-spin")} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">AI Powered Insights</p>
            <h1 className="text-2xl font-display font-black text-on-surface uppercase tracking-tight">{content.title}</h1>
          </div>
        </div>

        {!isSharedView && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRegenerate(false)}
              disabled={isRegenerating}
              className="px-4 py-2.5 rounded-xl bg-surface-low border border-on-surface/10 text-on-surface/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface-lowest transition-all disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
              {isRegenerating ? "Generating..." : "Regenerate"}
            </button>
            <button
              onClick={handleExportPremiumPDF}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-surface-low border border-on-surface/10 text-on-surface/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface-lowest transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isSaving ? "Preparing..." : "Export PDF"}
            </button>
            <button
              onClick={handleSaveUpdate}
              disabled={isSaving || (!previewContent && !isNewReport)}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isNewReport ? "Save Report" : previewContent ? "Update Report" : "Saved"}
            </button>
          </div>
        )}
      </div>


        {/* Print Header */}
        <div className="hidden print:block text-center space-y-2 border-b-2 border-primary/20 pb-6 mb-8">
          <h1 className="text-3xl font-black text-primary uppercase">Provincial Government of La Union</h1>
          <p className="text-sm font-bold text-on-surface/60 uppercase tracking-widest">{content.title}</p>
        </div>

        {/* Executive Summary */}
        <Card className="p-8 border-primary/10 bg-primary/[0.02] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              <h2 className="text-sm font-black uppercase tracking-widest">Executive Summary</h2>
            </div>
            <div className="prose prose-sm max-w-none text-on-surface/70 font-medium leading-relaxed prose-headings:font-black prose-headings:text-on-surface prose-strong:text-primary">
              <ReactMarkdown>{content.executiveSummary}</ReactMarkdown>
            </div>
          </div>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
            label={periodLabel}
            value={formatMetric(content.metrics.avgSatisfaction)}
            description="Overall citizen delight index"
            color="indigo"
            year={report.year}
          />
          <MetricCard
            icon={<Users className="w-5 h-5 text-emerald-500" />}
            label="Collection Rate"
            value={formatMetric(content.metrics.avgCollection)}
            description="Feedback forms vs unique visitors"
            color="emerald"
          />
          <MetricCard
            icon={<Eye className="w-5 h-5 text-amber-500" />}
            label="CC Implementation"
            value={formatMetric(content.metrics.ccComplianceScore)}
            description="Familiarity, Visibility & Helpfulness"
            color="amber"
          />
          <MetricCard
            icon={<Brain className="w-5 h-5 text-violet-500" />}
            label="Digital Adoption"
            value={formatMetric(content.metrics.digitalAdoptionRate)}
            description="Online vs Offline feedback ratio"
            color="indigo"
          />
        </div>

        {/* Trends Charts - Only for Quarter/Year */}
        {report.timeScope !== 'month' && content.trends?.months?.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Satisfaction Trend"
              icon={<TrendingUp className="w-4 h-4" />}
            >
              <div className="h-[300px] p-4">
                <Line 
                  id="satisfactionTrend" 
                  data={satisfactionData} 
                  options={{
                    ...chartOptions,
                    plugins: { 
                      ...chartOptions.plugins,
                      title: { ...chartOptions.plugins.title, text: "QUARTERLY SATISFACTION TREND (%)" }
                    }
                  }} 
                />
              </div>
              {content.chartExplanations?.satisfactionTrend && (
                <div className="px-6 pb-6 pt-2">
                  <p className="text-[10px] text-on-surface/50 font-medium leading-relaxed italic border-t border-on-surface/5 pt-4">
                    {content.chartExplanations.satisfactionTrend}
                  </p>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Collection Trend"
              icon={<Users className="w-4 h-4" />}
            >
              <div className="h-[300px] p-4">
                <Line 
                  id="collectionTrend" 
                  data={collectionData} 
                  options={{
                    ...chartOptions,
                    plugins: { 
                      ...chartOptions.plugins,
                      title: { ...chartOptions.plugins.title, text: "QUARTERLY COLLECTION VOLUME" }
                    }
                  }} 
                />
              </div>
              {content.chartExplanations?.collectionTrend && (
                <div className="px-6 pb-6 pt-2">
                  <p className="text-[10px] text-on-surface/50 font-medium leading-relaxed italic border-t border-on-surface/5 pt-4">
                    {content.chartExplanations.collectionTrend}
                  </p>
                </div>
              )}
            </ChartCard>
          </div>
        )}

        {/* Metrics Explanation (Optional UI addition) */}
        {content.chartExplanations?.metricsOverview && (
          <div className="p-6 rounded-2xl bg-surface-low border border-on-surface/5">
            <p className="text-[11px] text-on-surface/60 font-semibold leading-relaxed">
              <span className="text-primary mr-2 underline decoration-primary/30">AI Analysis:</span>
              {content.chartExplanations.metricsOverview}
            </p>
          </div>
        )}

        {/* Detailed Insights & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 border-on-surface/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Strategic Insights
            </h3>
            <ul className="space-y-4">
              {content.keyInsights.map((insight: string, i: number) => (
                <li key={i} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-low border border-on-surface/5 flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <p className="text-xs font-bold text-on-surface/60 leading-relaxed">{insight}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8 border-on-surface/5 bg-on-surface/[0.01]">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> Proposed Recommendations
            </h3>
            <div className="space-y-3">
              {content.recommendations.map((rec: string, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-white/50 border border-on-surface/5 flex gap-4 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-on-surface/70 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Department Performance */}
        {content.departmentBreakdown && content.departmentBreakdown.length > 0 && (
          <Card className="p-0 border-on-surface/5 overflow-hidden no-print">
            <div className="p-6 bg-surface-low border-b border-on-surface/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface/40">Departmental Comparative Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-lowest text-[9px] font-black uppercase tracking-[0.2em] text-on-surface/30">
                  <tr>
                    <th className="px-8 py-4">Department</th>
                    <th className="px-6 py-4">Satisfaction</th>
                    <th className="px-6 py-4">Core Strength</th>
                    <th className="px-6 py-4">Growth Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-on-surface/5 text-xs">
                  {content.departmentBreakdown.map((dept: any, i: number) => (
                    <tr key={i} className="hover:bg-on-surface/[0.01] transition-colors">
                      <td className="px-8 py-5 font-black text-on-surface uppercase tracking-tight">{dept.name}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="flex-grow w-16 h-1.5 rounded-full bg-on-surface/5 overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${dept.satisfaction}%` }} />
                          </div>
                          <span className="font-black text-primary">{dept.satisfaction}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-on-surface/60 font-bold italic">{dept.strength}</td>
                      <td className="px-6 py-5 text-on-surface/60 font-bold italic">{dept.weakness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* CUSTOM PRINT LAYOUT (HIDDEN ON SCREEN) */}
        <div className="hidden print:block font-serif text-black p-4">
          {/* Page 1: Letterhead & Policy */}
          <div className="min-h-[90vh] flex flex-col justify-center border-b-2 border-gray-100 mb-10 pb-10">
            <div className="text-center space-y-2 mb-20">
              <h1 className="text-2xl font-bold uppercase tracking-widest">Republic of the Philippines</h1>
              <h2 className="text-3xl font-black uppercase tracking-tight">Provincial Government of La Union</h2>
              <p className="text-sm font-bold text-gray-600">Office of the Provincial Governor</p>
              <div className="w-24 h-24 mx-auto my-8 border-4 border-gray-200 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-black text-gray-300 uppercase">OFFICIAL SEAL</span>
              </div>
            </div>

            <div className="space-y-12 max-w-2xl mx-auto text-center">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Official Document</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-tight">
                  AI Intelligence Feedback Report: {report.year}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-8 border-t border-b border-gray-200 py-8 text-left uppercase text-[10px] font-bold">
                <div><span className="text-gray-400">Reference ID:</span> {report.id.substring(0, 12).toUpperCase()}</div>
                <div className="text-right"><span className="text-gray-400">Generated:</span> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div><span className="text-gray-400">Analysis Type:</span> {report.timeScope} Audit</div>
                <div className="text-right"><span className="text-gray-400">Target Period:</span> {periodLabel.replace(" Satisfaction", "")}</div>
              </div>

              <p className="text-xs leading-relaxed text-gray-500 italic">
                This document contains automated analytical insights derived from citizen feedback data. 
                It is intended for strategic decision-making and performance monitoring by authorized PGLU officers.
              </p>
            </div>
          </div>

          {/* Page 2: Summary & KPIs (Forces New Page) */}
          <div className="space-y-10 break-before-page pt-10">
            <div className="border-b-4 border-double border-gray-800 pb-4">
              <h4 className="text-lg font-black uppercase tracking-widest">Section I: Executive Intelligence Overview</h4>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: periodLabel, val: formatMetric(content.metrics.avgSatisfaction) },
                { label: "Collection Rate", val: formatMetric(content.metrics.avgCollection) },
                { label: "CC Implementation", val: formatMetric(content.metrics.ccComplianceScore) },
                { label: "Digital Adoption", val: formatMetric(content.metrics.digitalAdoptionRate) }
              ].map((m, i) => (
                <div key={i} className="p-4 border border-gray-300 text-center rounded-lg bg-gray-50">
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-2xl font-black mt-1">{m.val}</p>
                </div>
              ))}
            </div>

            {/* Executive Summary */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analysis Narrative</h5>
              <div className="text-sm leading-relaxed text-gray-800 font-medium">
                <ReactMarkdown>{content.executiveSummary}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Page 3: Trends & Visuals (If applicable) */}
          {report.timeScope !== 'month' && content.trends?.months?.length > 0 && (
            <div className="space-y-10 break-before-page pt-10">
              <div className="border-b-4 border-double border-gray-800 pb-4">
                <h4 className="text-lg font-black uppercase tracking-widest">Section II: Visual Performance Trends</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-12">
                <div className="space-y-4 break-inside-avoid">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">A. Satisfaction Progression</h5>
                  <div className="h-[280px] border border-gray-200 p-4 rounded-xl">
                    <Line data={satisfactionData} options={{ ...chartOptions, animation: false }} />
                  </div>
                </div>

                <div className="space-y-4 break-inside-avoid">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">B. Collection Volume Progression</h5>
                  <div className="h-[280px] border border-gray-200 p-4 rounded-xl">
                    <Line data={collectionData} options={{ ...chartOptions, animation: false }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page 4: Detailed Breakdown */}
          {content.departmentBreakdown && content.departmentBreakdown.length > 0 && (
            <div className="space-y-8 pt-10 break-before-page">
              <div className="border-b-4 border-double border-gray-800 pb-4">
                <h4 className="text-lg font-black uppercase tracking-widest">Section III: Departmental Performance Audit</h4>
              </div>
              <table className="w-full text-[10px] border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 uppercase font-black tracking-widest">
                    <th className="border border-gray-300 p-3 text-left">Department</th>
                    <th className="border border-gray-300 p-3 text-center">Score</th>
                    <th className="border border-gray-300 p-3 text-left">Analytical Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {content.departmentBreakdown.map((dept: any, i: number) => (
                    <tr key={i} className="break-inside-avoid">
                      <td className="border border-gray-300 p-3 font-bold uppercase">{dept.name}</td>
                      <td className="border border-gray-300 p-3 text-center font-black">{dept.satisfaction}%</td>
                      <td className="border border-gray-300 p-3 italic text-gray-600">{dept.strength}. {dept.weakness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Page 5: Insights & Roadmap */}
          <div className="space-y-10 pt-10 break-before-page">
            <div className="border-b-4 border-double border-gray-800 pb-4">
              <h4 className="text-lg font-black uppercase tracking-widest">Section IV: Strategic Roadmap</h4>
            </div>

            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-6 break-inside-avoid border border-gray-200 p-8 rounded-2xl bg-gray-50/50">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic Insights</h5>
                <ul className="list-disc pl-6 space-y-4 text-xs font-medium italic">
                  {content.keyInsights.map((insight: string, i: number) => (
                    <li key={i} className="text-gray-700 leading-relaxed">{insight}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6 break-inside-avoid border border-gray-200 p-8 rounded-2xl bg-gray-50/50">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Actionable Recommendations</h5>
                <div className="space-y-4">
                  {content.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex gap-4 items-start text-xs font-bold text-gray-800 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Final Page */}
          <div className="pt-20 text-center space-y-4 break-inside-avoid">
            <div className="flex justify-around items-end pt-12">
              <div className="border-t border-black px-12 pt-2">
                <p className="text-[9px] font-black uppercase">Authorized Reviewer</p>
                <p className="text-[7px] text-gray-400">PGLU Governance Team</p>
              </div>
              <div className="border-t border-black px-12 pt-2">
                <p className="text-[9px] font-black uppercase">Provincial Governor</p>
                <p className="text-[7px] text-gray-400">Final Verification</p>
              </div>
            </div>
            <p className="text-[7px] text-gray-300 italic pt-12 uppercase tracking-[0.4em]">
              Confidential Document | PGLU AI-Intelligence Report | Form 2026-A
            </p>
          </div>
        </div>

      <style jsx global>{`
        @media print {
          @page { 
            margin: 1cm; 
            size: 8.5in 13in;
          }
          body { 
            background: white !important; 
            color: black !important;
            margin: 0;
            padding: 0;
          }
          .Shell_nav, .Shell_header, .no-print, .print-hidden { 
            display: none !important; 
          }
          .Shell_content { 
            padding: 0 !important; 
            margin: 0 !important; 
            display: block !important;
          }
          /* Bulletproof Page Break Controls */
          .break-before-page { 
            page-break-before: always !important; 
            break-before: page !important;
            padding-top: 2rem;
          }
          .break-inside-avoid { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
            display: block; /* Ensure it's not inline */
            margin-bottom: 1rem;
          }
          /* Protect Charts from being split or clipped */
          canvas {
            max-width: 100% !important;
            height: 350px !important; /* Fixed height for consistency in PDF */
            margin: 0 auto;
          }
          .chart-container {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            height: 400px;
            margin-bottom: 2rem;
          }
          /* Ensure Card content doesn't split */
          .Card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px solid #eee !important;
            box-shadow: none !important;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        }
      `}</style>
      </div>
  );

  if (isSharedView || isPrintView) {
    return <div className="min-h-screen bg-surface-lowest">{MainContent}</div>;
  }

  return <Shell>{MainContent}</Shell>;
}

function MetricCard({ icon, label, value, description, color, year }: any) {
  return (
    <Card className="p-6 border-on-surface/5 flex flex-col gap-4 relative overflow-hidden group">
      <div className={clsx(
        "absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 bg-opacity-5 blur-2xl group-hover:bg-opacity-10 transition-all",
        color === "indigo" ? "bg-indigo-500" : color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
      )} />
      <div className="flex items-center justify-between relative z-10">
        <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center">
          {icon}
        </div>
        <div className={clsx(
          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
          color === "indigo" ? "bg-indigo-500/10 text-indigo-600" : color === "emerald" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
        )}>
          Live {year || "2026"}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 mb-1">{label}</p>
        <p className="text-3xl font-display font-black text-on-surface">{value}</p>
        <p className="text-[10px] font-bold text-on-surface/30 mt-1">{description}</p>
      </div>
    </Card>
  );
}

function ChartCard({ title, icon, children }: any) {
  return (
    <Card className="p-6 border-on-surface/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-on-surface/5 flex items-center justify-center text-primary">
            {icon}
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">{title}</h3>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <div className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
        </div>
      </div>
      {children}
    </Card>
  );
}
