"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { Search, Tag, Filter, RefreshCw } from "lucide-react";
import { ResponsesTable } from "@/components/responses/ResponsesTable";
import { ClassifyModal } from "@/components/responses/ClassifyModal";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";

const fetcher = (url: string, offices: string[], month: string, year: string) => 
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offices, month, year })
  }).then(res => res.json());

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2025", "2026"];

export function ResponsesClient() {
  const { user, isLoading: authLoading } = useAuth();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const baselineYear = 2025;
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIdx]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("ALL");
  const [isClassifyModalOpen, setIsClassifyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");

  const availableYears = useMemo(() => {
    return Array.from(
      { length: currentYear - baselineYear + 1 }, 
      (_, i) => (baselineYear + i).toString()
    );
  }, [currentYear]);

  const availableMonths = useMemo(() => {
    const selectedYearInt = parseInt(selectedYear);
    if (selectedYearInt === currentYear) {
      return MONTHS.slice(0, currentMonthIdx + 1);
    }
    return MONTHS;
  }, [selectedYear, currentYear, currentMonthIdx]);

  // Adjust month if invalid for year
  React.useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  const { data: offices } = useSWR("/api/offices", (url) => fetch(url).then(res => res.json()));

  const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";

  // Office selection logic based on tab
  const targetOffices = useMemo(() => {
    if (!user) return [];
    if (activeTab === "all") {
        return selectedOffice === "ALL" ? ["ALL"] : [selectedOffice];
    }
    return user.offices || [];
  }, [user, activeTab, selectedOffice]);

  // Fetch data
  const { data: responses, isLoading, mutate, error } = useSWR(
    targetOffices.length > 0 ? ["/api/responses", targetOffices, selectedMonth, selectedYear] : null,
    ([url, off, month, year]) => fetcher(url, off, month, year)
  );

  const filteredResponses = useMemo(() => {
    if (!responses || !Array.isArray(responses)) return [];

    return responses.filter((res: any) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        (res.name || "").toLowerCase().includes(search) ||
        (res.comment || "").toLowerCase().includes(search) ||
        (res.office || "").toLowerCase().includes(search) ||
        (res.classification || "").toLowerCase().includes(search) ||
        (res.serviceAvailed || "").toLowerCase().includes(search);

      return matchesSearch;
    });
  }, [responses, searchTerm]);

  const displayResponses = filteredResponses;

  const unclassifiedCount = useMemo(() => {
    if (!responses || !Array.isArray(responses)) return 0;
    return responses.filter((res: any) => {
      const isUnclassified = !res.classification || res.classification === "Unclassified" || res.classification === "";
      const hasComment = res.comment && res.comment.trim().length > 2;
      return isUnclassified && hasComment;
    }).length;
  }, [responses]);

  const isAnalyticsEnabled = !!user?.is_analytics_enabled;
  const canSeeAllResponses = isSuperadmin || isAnalyticsEnabled;

  if (authLoading || (targetOffices.length > 0 && isLoading && !responses)) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-primary w-8 h-8" />
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Loading responses...</p>
      </div>
    );
  }

  // Handle index missing error state
  if (responses?.error === "INDEX_MISSING") {
    return (
      <div className="py-20 flex flex-col items-center gap-6 max-w-md mx-auto text-center border-2 border-dashed border-on-surface/5 rounded-3xl bg-surface-low/50 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <Tag className="w-8 h-8 text-amber-600 animate-pulse" />
        </div>
        <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Database Preparation</h3>
            <p className="text-[11px] font-bold text-on-surface/40 leading-relaxed px-8">
                The database is currently optimizing records for high-speed retrieval. This usually takes 2-5 minutes during initial setup.
            </p>
        </div>
        <button 
            onClick={() => mutate()}
            className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
        >
            Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unified Command Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-2 rounded-3xl border border-on-surface/5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-grow">
          {/* Tabs */}
          <div className="bg-surface-low p-1 rounded-2xl flex items-center gap-1 border border-on-surface/5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("my")}
              className={clsx(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === "my" ? "bg-white text-primary shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
              )}
            >
              My Assignments
            </button>
            {canSeeAllResponses && (
              <button
                onClick={() => setActiveTab("all")}
                className={clsx(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === "all" ? "bg-white text-primary shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
                )}
              >
                All Responses
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface/30" />
            <input
              type="text"
              placeholder="Quick search..."
              className="w-full bg-surface-low border border-on-surface/5 rounded-2xl py-2.5 pl-10 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end px-2">
            {activeTab === "all" && !isSuperadmin && (
                <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-100/50 px-3 py-1.5 rounded-xl mr-2">
                    <Filter className="w-3 h-3 text-amber-600" />
                    <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Read Only</span>
                </div>
            )}

          <div className="flex items-center gap-2 bg-surface-low/50 px-2 py-1 rounded-2xl border border-on-surface/5">
            <select
              className="bg-transparent py-1.5 px-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="w-px h-3 bg-on-surface/10" />
            <select
              className="bg-transparent py-1.5 px-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {activeTab === "all" && (
              <>
                <div className="w-px h-3 bg-on-surface/10" />
                <select
                  className="bg-transparent py-1.5 px-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer max-w-[120px]"
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                >
                  <option value="ALL">ALL OFFICES</option>
                  {offices?.filter((o: any) => o.status !== "disabled").map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          {(activeTab === "my" || isSuperadmin) && (
            <button
              onClick={() => setIsClassifyModalOpen(true)}
              className={clsx(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                (unclassifiedCount > 0 && !(activeTab === "all" && !isSuperadmin))
                  ? "bg-primary text-white hover:shadow-lg hover:shadow-primary/20" 
                  : "bg-surface-low text-on-surface/20 border border-on-surface/5 cursor-not-allowed"
              )}
              disabled={unclassifiedCount === 0 || (activeTab === "all" && !isSuperadmin)}
            >
              <Tag className="w-3.5 h-3.5" />
              Classify {unclassifiedCount > 0 && !(activeTab === "all" && !isSuperadmin) && (
                <span className="bg-white text-primary px-1.5 py-0.5 rounded-lg ml-1 font-black">{unclassifiedCount}</span>
              )}
            </button>
          )}
        </div>
      </div>


      <ResponsesTable 
        responses={displayResponses} 
        isLoading={isLoading} 
        isGlobalView={activeTab === "all"}
      />

      <ClassifyModal 
        isOpen={isClassifyModalOpen}
        onClose={() => setIsClassifyModalOpen(false)}
        responses={responses || []}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSuccess={() => {
          setIsClassifyModalOpen(false);
          mutate();
        }}
      />
    </div>
  );
}
