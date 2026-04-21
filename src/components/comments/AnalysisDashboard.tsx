"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  BarChart2, 
  MessageSquare,
  Building2,
  Calendar,
  Users,
  Search,
  ChevronDown,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";
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
  ArcElement,
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  ChartDataLabels
);

interface AnalyticsData {
  year: string;
  monthlyData: {
    month: string;
    negative: number;
    resolvedNegative: number;
    suggestion: number;
    resolvedSuggestion: number;
    positive: number;
  }[];
  overall: {
    negativeResolutionRate: number;
    combinedResolutionRate: number;
    totalNegative: number;
    resolvedNegative: number;
    totalSuggestions: number;
    resolvedSuggestions: number;
    totalResolved: number;
  };
  topOffices: {
    name: string;
    negative: number;
    resolved: number;
    total: number;
  }[];
  allOffices: string[];
  repetitiveComments: {
    text: string;
    count: number;
    offices: string[];
  }[];
}

export function AnalysisDashboard({ year }: { year: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMonthlyTable, setShowMonthlyTable] = useState(false);
  
  // Office Deep-Dive State
  const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
  const [officeData, setOfficeData] = useState<any>(null);
  const [isOfficeLoading, setIsOfficeLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/comments/analytics?year=${year}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [year]);

  useEffect(() => {
    if (!selectedOffice) {
      setOfficeData(null);
      return;
    }

    const fetchOfficeAnalytics = async () => {
      setIsOfficeLoading(true);
      try {
        const res = await fetch(`/api/comments/analytics?year=${year}&office=${encodeURIComponent(selectedOffice)}`);
        if (!res.ok) throw new Error("Failed to fetch office analytics");
        const json = await res.json();
        setOfficeData(json);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsOfficeLoading(false);
      }
    };

    fetchOfficeAnalytics();
  }, [selectedOffice, year]);

  const lineChartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.monthlyData.map(m => m.month.substring(0, 3)),
      datasets: [
        {
          label: 'Total Negative',
          data: data.monthlyData.map(m => m.negative),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: 'Resolved Negative',
          data: data.monthlyData.map(m => m.resolvedNegative),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.4)',
          fill: true,
          tension: 0.4,
          borderDash: [5, 5],
          borderWidth: 1,
        },
        {
          label: 'Total Suggestions',
          data: data.monthlyData.map(m => m.suggestion),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: 'Resolved Suggestions',
          data: data.monthlyData.map(m => m.resolvedSuggestion),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.4)',
          fill: true,
          tension: 0.4,
          borderDash: [5, 5],
          borderWidth: 1,
        }
      ]
    };
  }, [data]);

  const officeChartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.topOffices.map(o => o.name),
      datasets: [
        {
          label: 'Complaints',
          data: data.topOffices.map(o => o.negative),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderRadius: 8,
        }
      ]
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Card className="h-[400px] animate-pulse bg-on-surface/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-[300px] animate-pulse bg-on-surface/5" />
          <Card className="h-[300px] animate-pulse bg-on-surface/5" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-20 text-center bg-surface-low rounded-3xl border border-dashed border-on-surface/10">
        <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-on-surface/60">Analysis Unavailable</h3>
        <p className="text-sm text-on-surface/40 mt-1">{error || "No data found for the selected year."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top row: Core Resolution Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard 
          title="Negative Resolution Rate" 
          subtitle="Yearly performance for critical complaints"
          value={data.overall.negativeResolutionRate} 
          total={`Res: ${data.overall.resolvedNegative} / Total: ${data.overall.totalNegative}`}
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          color="red"
          accent="bg-red-500"
        />
        <MetricCard 
          title="Combined Resolution Efficiency" 
          subtitle="Resolutions including suggestions & negatives"
          value={data.overall.combinedResolutionRate} 
          total={`Res: ${data.overall.totalResolved} / Total: ${data.overall.totalNegative + data.overall.totalSuggestions}`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          color="emerald"
          accent="bg-emerald-500"
        />
      </div>

      {/* Quick Insights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat 
          label="Total Feedback" 
          value={data.overall.totalNegative + data.overall.totalSuggestions + data.monthlyData.reduce((acc, m) => acc + m.positive, 0)} 
          icon={<MessageSquare className="w-4 h-4" />} 
        />
        <QuickStat 
          label="Best Month" 
          value={data.monthlyData.reduce((best, m) => {
            const rate = m.negative > 0 ? (m.resolvedNegative / m.negative) : 0;
            return rate > (best.rate || 0) ? { month: m.month, rate } : best;
          }, { month: "N/A", rate: 0 }).month} 
          icon={<CheckCircle className="w-4 h-4" />} 
        />
        <QuickStat 
          label="Peak Complaints" 
          value={Math.max(...data.monthlyData.map(m => m.negative))} 
          icon={<TrendingDown className="w-4 h-4 text-red-400" />} 
        />
        <QuickStat 
          label="Total Resolved" 
          value={data.overall.totalResolved} 
          icon={<Users className="w-4 h-4" />} 
        />
      </div>

      {/* Monthly Trends */}
      <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <BarChart2 className="w-32 h-32" />
        </div>
        <div className="flex items-center justify-between mb-8 overflow-hidden">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Engagement Trends</h3>
            <h2 className="text-2xl font-black text-on-surface/80">Monthly Feedback Volume</h2>
          </div>
          <button 
            onClick={() => setShowMonthlyTable(!showMonthlyTable)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-on-surface/5 text-[10px] font-black uppercase tracking-widest hover:bg-on-surface/10 transition-all border border-on-surface/5"
          >
            <Calendar className="w-3.5 h-3.5" />
            {showMonthlyTable ? "Show Chart" : "Show Table"}
          </button>
        </div>

        {showMonthlyTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-on-surface/5">
                   <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Month</th>
                   <th className="py-4 text-[10px] font-black uppercase tracking-widest text-red-500/60 text-center">Complaints</th>
                   <th className="py-4 text-[10px] font-black uppercase tracking-widest text-emerald-500/60 text-center">Resolved</th>
                   <th className="py-4 text-[10px] font-black uppercase tracking-widest text-amber-500/60 text-center">Suggestions</th>
                   <th className="py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-right">Success Rate</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-on-surface/5">
                 {data.monthlyData.map(m => {
                   const rate = m.negative > 0 ? (m.resolvedNegative / m.negative) * 100 : 0;
                    return (
                     <tr key={m.month} className="hover:bg-on-surface/[0.02] group/row">
                       <td className="py-4 text-sm font-bold text-on-surface/70">{m.month}</td>
                       <td className="py-4 text-center">
                         <div className="flex flex-col items-center">
                           <span className="font-black text-on-surface/40">{m.negative}</span>
                           <div className="w-12 h-1 bg-red-500/10 rounded-full mt-1 overflow-hidden">
                             <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (m.resolvedNegative / (m.negative || 1)) * 100)}%` }} />
                           </div>
                         </div>
                       </td>
                       <td className="py-4 text-center">
                         <div className="flex flex-col items-center">
                           <span className="font-black text-emerald-600/60">{m.resolvedNegative}</span>
                           <span className="text-[8px] font-black uppercase text-on-surface/20">Resolved</span>
                         </div>
                       </td>
                       <td className="py-4 text-center">
                         <div className="flex flex-col items-center">
                           <span className="font-black text-on-surface/40">{m.suggestion}</span>
                           <div className="w-12 h-1 bg-amber-500/10 rounded-full mt-1 overflow-hidden">
                             <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (m.resolvedSuggestion / (m.suggestion || 1)) * 100)}%` }} />
                           </div>
                         </div>
                       </td>
                       <td className="py-4 text-right">
                         <span className={clsx(
                           "px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap",
                           rate > 80 ? "bg-emerald-500/10 text-emerald-600" : 
                           rate > 50 ? "bg-amber-500/10 text-amber-600" :
                           "bg-red-500/10 text-red-600"
                         )}>
                           {rate.toFixed(1)}% Success
                         </span>
                       </td>
                     </tr>
                    );
                 })}
               </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[300px]">
            {lineChartData && (
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      display: true, 
                      position: 'top' as const,
                      align: 'end' as const,
                      labels: {
                        boxWidth: 8,
                        boxHeight: 8,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 10, weight: 'bold' }
                      }
                    },
                    datalabels: { display: false },
                    tooltip: {
                      backgroundColor: '#1e293b',
                      padding: 12,
                      titleFont: { size: 12, weight: 'bold' },
                      bodyFont: { size: 12 },
                      cornerRadius: 12,
                    }
                  },
                  scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: { 
                      grid: { color: 'rgba(0,0,0,0.03)' }, 
                      border: { display: false },
                      ticks: { stepSize: 1, color: 'rgba(0,0,0,0.3)' }
                    }
                  }
                }} 
              />
            )}
          </div>
        )}
      </Card>

      {/* Bottom Row - Office Breakdown & Repetitive Analysis */}
      <div className={clsx(
        "grid gap-6",
        data.repetitiveComments.length > 0 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      )}>
        {/* Top Offices */}
        <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-red-500/5 flex items-center justify-center border border-red-500/10">
              <Building2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Critical Hotspots</h3>
              <h2 className="text-lg font-black text-on-surface/80">Offices with Most Complaints</h2>
            </div>
          </div>
          
          <div className="h-[300px]">
            {officeChartData && (
              <Bar 
                data={officeChartData}
                options={{
                  indexAxis: 'y' as const,
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    datalabels: {
                      display: true,
                      color: '#ffffff',
                      font: { weight: 'bold', size: 10 },
                      anchor: 'center',
                      align: 'center',
                      formatter: (val: any) => val || ""
                    }
                  },
                  scales: {
                    x: { grid: { display: false }, border: { display: false }, ticks: { display: false } },
                    y: { 
                      grid: { display: false }, 
                      border: { display: false },
                      ticks: { font: { weight: 'bold', size: 10 } }
                    }
                  }
                }}
              />
            )}
          </div>
        </Card>

        {/* Repetitive Comments */}
        {data.repetitiveComments.length > 0 && (
          <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low overflow-hidden relative transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Pattern Detection</h3>
                <h2 className="text-lg font-black text-on-surface/80">Recurring Negative Feedback</h2>
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {data.repetitiveComments.map((pattern: any, idx: number) => (
                  <div key={idx} className="group p-5 bg-on-surface/[0.02] border border-on-surface/5 rounded-[2rem] hover:bg-on-surface/[0.04] transition-all">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="text-sm font-black text-on-surface/80 group-hover:text-primary transition-colors">
                        {pattern.gist}
                      </h4>
                      <span className="flex-shrink-0 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black border border-amber-500/20">
                        ~{pattern.count} instances
                      </span>
                    </div>
                    <p className="text-xs text-on-surface/50 mb-4 leading-relaxed line-clamp-2">
                      {pattern.description}
                    </p>
                    <div className="p-3 bg-white/50 rounded-xl border border-on-surface/5">
                      <p className="text-[10px] font-bold text-on-surface/20 uppercase tracking-widest mb-1">Example Feedback</p>
                      <p className="text-[11px] font-medium text-on-surface/60 italic leading-relaxed">
                        "{pattern.representativeExample}"
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      {/* Office Spotlight Section */}
      <div id="office-spotlight" className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-surface-low p-6 rounded-[2rem] border border-border-strong/50 shadow-xl overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Building2 className="w-24 h-24" />
           </div>
           <div className="relative z-10 text-center md:text-left">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Targeted Deep-Dive</h3>
              <h2 className="text-xl font-black text-on-surface/80">Select Office for Spotlight View</h2>
              <p className="text-xs font-bold text-on-surface/30 mt-1 uppercase tracking-widest">Perform localized trend analysis for any department</p>
           </div>
           
           <div className="relative z-10 w-full md:w-auto min-w-[300px]">
              <select 
                value={selectedOffice || ""} 
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="w-full appearance-none bg-white border border-on-surface/10 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer pr-12 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
              >
                <option value="">-- Choose an Office --</option>
                {data.allOffices.map(off => (
                  <option key={off} value={off}>{off}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                 <ChevronDown className="w-5 h-5" />
              </div>
           </div>
        </div>

        {selectedOffice ? (
          <OfficeSpotlight 
            data={officeData} 
            isLoading={isOfficeLoading} 
            onClose={() => setSelectedOffice(null)}
          />
        ) : (
          <div className="p-20 text-center border-4 border-dashed border-on-surface/[0.03] rounded-[3rem] transition-all hover:border-primary/20 group">
             <div className="w-20 h-20 rounded-[2rem] bg-on-surface/[0.03] group-hover:bg-primary/5 flex items-center justify-center mx-auto mb-6 text-on-surface/10 group-hover:text-primary/40 transition-all group-hover:scale-110">
                <Search className="w-10 h-10" />
             </div>
             <p className="text-sm font-black text-on-surface/20 group-hover:text-primary/40 uppercase tracking-[0.2em] transition-all">Detailed analytical report will appear here</p>
          </div>
        )}
      </div>

    </div>
  );
}

function OfficeSpotlight({ data, isLoading, onClose }: { data: any; isLoading: boolean; onClose: () => void }) {
  if (isLoading) return <Card className="h-[500px] animate-pulse bg-on-surface/5" />;
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Office Deep-Dive</h3>
              <h2 className="text-3xl font-black text-on-surface/80">{data.officeName}</h2>
           </div>
        </div>
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-on-surface/5 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-600 transition-all">
          Close Spotlight
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-6">Resolution Trend Per Month</h3>
              <div className="h-[250px]">
                <Line 
                  data={{
                    labels: data.monthlyData.map((m: any) => m.month.substring(0, 3)),
                    datasets: [
                      {
                        label: 'Resolution Rate (%)',
                        data: data.monthlyData.map((m: any) => m.resolutionRate),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      datalabels: { display: false }
                    },
                    scales: {
                      y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } }
                    }
                  }}
                />
              </div>
           </Card>

           <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-6">Volume Trend</h3>
              <div className="h-[250px]">
                <Bar 
                  data={{
                    labels: data.monthlyData.map((m: any) => m.month.substring(0, 3)),
                    datasets: [
                      {
                        label: 'Negatives',
                        data: data.monthlyData.map((m: any) => m.negative),
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: 'rgb(239, 68, 68)',
                        borderWidth: 1,
                        borderRadius: 4,
                      },
                      {
                        label: 'Resolved Negatives',
                        data: data.monthlyData.map((m: any) => m.resolvedNegative),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderRadius: 4,
                      },
                      {
                        label: 'Suggestions',
                        data: data.monthlyData.map((m: any) => m.suggestion),
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderColor: 'rgb(245, 158, 11)',
                        borderWidth: 1,
                        borderRadius: 4,
                      },
                      {
                        label: 'Resolved Suggestions',
                        data: data.monthlyData.map((m: any) => m.resolvedSuggestion),
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderRadius: 4,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                        align: 'end' as const,
                        labels: {
                          boxWidth: 8,
                          boxHeight: 8,
                          usePointStyle: true,
                          pointStyle: 'circle',
                          font: { size: 10, weight: 'bold' }
                        }
                      },
                      datalabels: { display: false }
                    },
                    scales: {
                      y: { ticks: { stepSize: 1 } }
                    }
                  }}
                />
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-4">Overall Office Health</h3>
              <div className="text-center py-6">
                 <p className="text-5xl font-black text-primary tracking-tighter">{data.overallResolutionRate.toFixed(1)}%</p>
                 <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] mt-2">Resolution Rate</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 border-t border-on-surface/5 pt-6">
                 <div>
                    <p className="text-[8px] font-black text-on-surface/20 uppercase">Complaints (Total/Res)</p>
                    <p className="text-lg font-black text-red-500">{data.totals.negative} / {data.totals.resolvedNegative}</p>
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-on-surface/20 uppercase">Suggestions (Total/Res)</p>
                    <p className="text-lg font-black text-emerald-500">{data.totals.suggestion} / {data.totals.resolvedSuggestion}</p>
                 </div>
              </div>
           </Card>

           {data.repetitiveComplaints.length > 0 && (
             <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low animate-in fade-in slide-in-from-right-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-6">Top Recurring Complaints</h3>
                <div className="space-y-4">
                   {data.repetitiveComplaints.map((pattern: any, idx: number) => (
                     <div key={idx} className="p-4 bg-on-surface/[0.02] border border-on-surface/5 rounded-2xl">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-xs font-black text-on-surface/70">{pattern.gist}</h4>
                          <span className="text-[9px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded-full">{pattern.count} refs</span>
                        </div>
                        <p className="text-[10px] text-on-surface/40 leading-tight mb-2 line-clamp-2">{pattern.description}</p>
                        <p className="text-[10px] font-medium text-on-surface/50 italic border-l-2 border-primary/20 pl-2">
                           "{pattern.representativeExample}"
                        </p>
                     </div>
                   ))}
                </div>
             </Card>
           )}

           <Card className="p-8 border border-border-strong/50 shadow-xl bg-primary text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Info className="w-16 h-16" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Decision Support</h3>
              <p className="text-xs font-black italic relative z-10 leading-relaxed">
                {data.overallResolutionRate < 50 
                  ? "Immediate intervention recommended. Resolution rates are significantly below operational targets."
                  : data.totals.negative > 10
                  ? "Pattern alert: High volume of complaints detected. Review recurring feedback for systemic issues."
                  : "Performance stable. Focus on continuous improvement of response times."}
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="p-4 bg-on-surface/[0.03] border border-on-surface/5 rounded-[1.5rem] flex items-center gap-4 hover:bg-on-surface/[0.05] transition-all group">
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30">{label}</p>
        <p className="text-sm font-black text-on-surface/70">{value}</p>
      </div>
    </Card>
  );
}

function MetricCard({ 
  title, 
  subtitle, 
  value, 
  total, 
  icon, 
  color, 
  accent 
}: { 
  title: string; 
  subtitle: string; 
  value: number; 
  total: string; 
  icon: React.ReactNode; 
  color: "red" | "emerald"; 
  accent: string;
}) {
  return (
    <Card className="p-8 border border-border-strong/50 shadow-xl bg-surface-low relative overflow-hidden group">
      <div className={clsx("absolute top-0 left-0 w-1.5 h-full opacity-60", accent)} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             {icon}
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40">{title}</h3>
          </div>
          <p className="text-xs font-bold text-on-surface/30 mb-6">{subtitle}</p>
          
          <div className="flex items-baseline gap-3">
             <span className="text-5xl font-black text-on-surface/80 tracking-tighter">
               {value.toFixed(1)}<span className="text-2xl text-on-surface/20">%</span>
             </span>
             <div className="flex flex-col">
               <span className={clsx("text-xs font-black", value > 75 ? "text-emerald-500" : value > 50 ? "text-amber-500" : "text-red-500")}>
                 {value > 80 ? "EXCELLENT" : value > 60 ? "TARGET MET" : "CRITICAL"}
               </span>
               <span className="text-[10px] font-medium text-on-surface/30 uppercase tracking-widest">{total}</span>
             </div>
          </div>
        </div>
        
        <div className="w-24 h-24 relative">
          <Doughnut 
            data={{
              datasets: [{
                data: [value, 100 - value],
                backgroundColor: [
                  color === 'red' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)',
                  'rgba(0,0,0,0.05)'
                ],
                borderWidth: 0,
                circumference: 360,
                rotation: 0,
                cutout: '80%'
              }]
            }} 
            options={{ 
              plugins: { 
                tooltip: { enabled: false }, 
                legend: { display: false },
                datalabels: { display: false }
              },
              maintainAspectRatio: false 
            }} 
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Mini Progress Bar at bottom */}
      <div className="mt-8 h-1 w-full bg-on-surface/5 rounded-full overflow-hidden">
        <div 
          className={clsx("h-full transition-all duration-1000 ease-out", accent)}
          style={{ width: `${value}%` }} 
        />
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-8 border border-border-strong/50 bg-surface-low animate-pulse">
      <div className="space-y-4">
        <div className="h-2 w-24 bg-on-surface/5 rounded" />
        <div className="h-10 w-32 bg-on-surface/5 rounded" />
        <div className="h-2 w-48 bg-on-surface/5 rounded" />
      </div>
    </Card>
  );
}
