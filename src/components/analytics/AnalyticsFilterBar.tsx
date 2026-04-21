"use client";

import React, { useMemo, useEffect } from "react";
import { useAnalytics } from "@/context/AnalyticsContext";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, Calendar, FileText, Search, Loader2, Users, Brain } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

const allMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function AnalyticsFilterBar({ activeTab }: { activeTab: string }) {
  const { user } = useAuth();
  const { month, year, search, selectedUserId, setFilters, isGraphsReady, isLoading, isValidating, targetOffices, availablePersonnel } = useAnalytics();
  const [isAIAnalyzing, setIsAIAnalyzing] = React.useState(false);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const baselineYear = 2025;

  const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";

  const availableYears = Array.from(
    { length: currentYear - baselineYear + 1 }, 
    (_, i) => (baselineYear + i).toString()
  );

  const availableMonths = useMemo(() => {
    const selectedYearInt = parseInt(year);
    if (selectedYearInt === currentYear) {
      return allMonths.slice(0, currentMonthIdx + 1);
    }
    return allMonths;
  }, [year, currentYear, currentMonthIdx]);

  useEffect(() => {
    if (!availableMonths.includes(month)) {
      setFilters({ month: availableMonths[availableMonths.length - 1] });
    }
  }, [availableMonths, month, setFilters]);
  

  const handleAIAnalysis = async () => {
    setIsAIAnalyzing(true);
    try {
       const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year, scope: 'organization' })
       });
       const data = await res.json();
       if (data.reportId) {
          window.open(`/analytics/ai-report/${data.reportId}`, '_blank');
       } else {
          alert(data.error || "AI Analysis failed. Check if GEMINI_API_KEY is configured.");
       }
    } catch (err) {
       alert("Failed to connect to AI engine");
    } finally {
       setIsAIAnalyzing(false);
    }
 };

  return (
    <div className="bg-surface-low rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm border border-border-strong/50 w-full transition-colors duration-300">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
        {/* Date Selectors */}
        <div className="flex items-center gap-2 bg-background/50 px-2 py-1.5 rounded-xl border border-border-strong/50 transition-all">
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 w-3.5 h-3.5 text-primary" />
            <select
              value={month}
              onChange={(e) => setFilters({ month: e.target.value })}
              className="bg-transparent pl-9 pr-6 py-1.5 font-sans text-xs font-bold outline-none appearance-none cursor-pointer"
            >
              {availableMonths.map((m: string) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-on-surface/50 pointer-events-none" />
          </div>
          <div className="w-px h-4 bg-on-surface/20 mx-1" />
          <div className="relative flex items-center">
            <select
              value={year}
              onChange={(e) => setFilters({ year: e.target.value })}
              className="bg-transparent pl-2 pr-6 py-1.5 font-sans text-xs font-bold outline-none appearance-none cursor-pointer"
            >
              {availableYears.map((y: string) => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
          </div>
        </div>

        {/* Filters Group - Only show on Data View tab for granular browsing */}
        {activeTab === "data" && (
          <div className="flex flex-1 flex-col md:flex-row items-center gap-3">
            {/* User Dropdown for Superadmin */}
            {isSuperadmin && (
              <div className="relative w-full md:w-64 group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 group-focus-within:text-primary transition-colors" />
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => setFilters({ selectedUserId: e.target.value || null })}
                  className="w-full h-11 bg-background/50 pl-11 pr-10 rounded-xl border border-border-strong/50 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-xs font-bold appearance-none cursor-pointer"
                >
                  <option value="">All Offices (Global)</option>
                  {(availablePersonnel || [])
                    .map((name: string) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/40 pointer-events-none" />
              </div>
            )}

            {/* Search Input */}
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Search by office name..."
                value={search || ""}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full h-11 bg-background/50 pl-11 pr-4 rounded-xl border border-border-strong/50 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-xs font-bold placeholder:text-on-surface/40"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* AI Analysis Button */}
        <Button 
          variant="outline" 
          className={clsx(
            "h-11 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 whitespace-nowrap border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all",
            (isAIAnalyzing || isLoading || isValidating) ? "opacity-50 cursor-not-allowed" : ""
          )}
          disabled={isAIAnalyzing || isLoading || isValidating}
          onClick={handleAIAnalysis}
        >
          {isAIAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          {isAIAnalyzing ? "Processing..." : "AI Insights"}
        </Button>

        {/* Generate PDF Button */}
        <Button 
          variant="primary" 
          className={clsx(
            "h-11 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 whitespace-nowrap shadow-md shadow-primary/10 hover:translate-y-[-1px] transition-all",
            (isLoading || isValidating || (activeTab === "graphs" && !isGraphsReady)) ? "opacity-50 cursor-not-allowed grayscale" : ""
          )}
          disabled={isLoading || isValidating || (activeTab === "graphs" && !isGraphsReady)}
          onClick={() => {
            if (activeTab === "summary") {
              const url = `/api/reports/summary?month=${month}&year=${year}`;
              window.open(url, '_blank');
            } else if (activeTab === "graphs") {
              window.dispatchEvent(new CustomEvent('export-graphs'));
            } else {
              const params = new URLSearchParams({ month, year });
              if (search) params.set("search", search);
              
              // ALWAYS pass the targetOffices from context to the bulk generator
              // This ensures the server uses the EXACT same scoping as the frontend UI
              if (targetOffices && targetOffices.length > 0) {
                params.set("offices", targetOffices.join(","));
              }
              
              const url = `/api/reports/bulk?${params.toString()}`;
              window.open(url, '_blank');
            }
          }}
        >
          {isLoading || (activeTab === "graphs" && !isGraphsReady) ? (
            <Loader2 className="w-4 h-4 text-tertiary animate-spin" />
          ) : (
            <FileText className="w-4 h-4 text-tertiary" />
          )}
          {activeTab === "summary" ? "Generate Summary" : "Generate Report"}
        </Button>
      </div>
      {activeTab === "graphs" && !isGraphsReady && !isLoading && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary uppercase tracking-widest animate-pulse whitespace-nowrap">
          * Waiting for charts to render...
        </span>
      )}
      {(isLoading || isValidating) && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary uppercase tracking-widest animate-pulse whitespace-nowrap">
          * Extracting dashboard data...
        </span>
      )}
    </div>
  );
}
