"use client";

import React, { useMemo } from "react";
import { AIReport } from "@/lib/services/aiReportService";
import { Shell } from "@/components/layout/Shell";
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
import { Line, Bar } from "react-chartjs-2";
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
  Share2
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

export function AIReportClient({ report }: AIReportClientProps) {
  const { content } = report;

  const formatMetric = (val: any) => {
    if (val === null || val === undefined || val === 0 || val === "NA" || val === "N/A") return "N/A";
    if (typeof val === 'number') return val.toFixed(1) + "%";
    return val;
  };

  const satisfactionData = useMemo(() => ({
    labels: content.trends.months,
    datasets: [
      {
        label: "Satisfaction Rate (%)",
        data: content.trends.satisfaction,
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: "#4F46E5"
      }
    ]
  }), [content]);

  const collectionData = useMemo(() => ({
    labels: content.trends.months,
    datasets: [
      {
        label: "Collection Rate (%)",
        data: content.trends.collection,
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: "#10B981"
      }
    ]
  }), [content]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-8 pb-20 print:p-0 print:space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">Gemini Powered Insights</p>
              <h1 className="text-2xl font-display font-black text-on-surface uppercase tracking-tight">{content.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-surface-low border border-on-surface/10 text-on-surface/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface-lowest transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button className="px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
              <Share2 className="w-3.5 h-3.5" /> Share Report
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center space-y-2 border-b-2 border-primary/20 pb-6 mb-8">
            <h1 className="text-3xl font-black text-primary uppercase">Provincial Government of La Union</h1>
            <p className="text-sm font-bold text-on-surface/60 uppercase tracking-widest">AI-Generated Customer Feedback Analysis - {report.year}</p>
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
            label="Annual Satisfaction"
            value={formatMetric(content.metrics.avgSatisfaction)}
            description="Overall citizen delight index"
            color="indigo"
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

        {/* Trends Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Satisfaction Trend" 
            icon={<TrendingUp className="w-4 h-4" />}
          >
            <div className="h-[250px]">
              <Line data={satisfactionData} options={chartOptions} />
            </div>
          </ChartCard>

          <ChartCard 
            title="Collection Trend" 
            icon={<Users className="w-4 h-4" />}
          >
            <div className="h-[250px]">
              <Line data={collectionData} options={chartOptions} />
            </div>
          </ChartCard>
        </div>

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
          <Card className="p-0 border-on-surface/5 overflow-hidden">
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
      </div>
    </Shell>
  );
}

function MetricCard({ icon, label, value, description, color }: any) {
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
            Live 2026
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
