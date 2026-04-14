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
  const { data: responses, isLoading, mutate } = useSWR(
    targetOffices.length > 0 ? ["/api/responses", targetOffices, selectedMonth, selectedYear] : null,
    ([url, off, month, year]) => fetcher(url, off, month, year)
  );

  const displayResponses = useMemo(() => {
    if (!responses || !Array.isArray(responses)) return [];

    return responses.filter((res: any) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        res.name.toLowerCase().includes(search) ||
        res.comment.toLowerCase().includes(search) ||
        res.office.toLowerCase().includes(search);

      return matchesSearch;
    });
  }, [responses, searchTerm]);

  const unclassifiedCount = useMemo(() => {
    if (!responses || !Array.isArray(responses)) return 0;
    return responses.filter((res: any) => {
      const isUnclassified = !res.classification || res.classification === "Unclassified" || res.classification === "";
      const hasComment = res.comment && res.comment.trim().length > 2;
      return isUnclassified && hasComment;
    }).length;
  }, [responses]);

  if (authLoading || (targetOffices.length > 0 && isLoading && !responses)) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-primary w-8 h-8" />
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Loading responses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-surface-low p-1 rounded-2xl flex items-center gap-1 border border-on-surface/5">
          <button
            onClick={() => setActiveTab("my")}
            className={clsx(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "my" ? "bg-white text-primary shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
            )}
          >
            My Assignments
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={clsx(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === "all" ? "bg-white text-primary shadow-sm" : "text-on-surface/40 hover:text-on-surface/60"
            )}
          >
            All Responses
          </button>
        </div>

        {activeTab === "all" && !isSuperadmin && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl">
             <Filter className="w-3.5 h-3.5 text-amber-600" />
             <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Global View (Read-Only)</span>
          </div>
        )}
      </div>

      <Card className="p-4 border-on-surface/5 bg-white/50 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30" />
              <input
                type="text"
                placeholder="Search responses..."
                className="w-full bg-white border border-on-surface/5 rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="bg-white border border-on-surface/5 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all shadow-sm cursor-pointer outline-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              className="bg-white border border-on-surface/5 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all shadow-sm cursor-pointer outline-none"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            {activeTab === "all" && (
              <select
                className="bg-white border border-on-surface/5 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all shadow-sm cursor-pointer outline-none min-w-[160px]"
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
              >
                <option value="ALL">ALL OFFICES</option>
                {offices?.filter((o: any) => o.status !== "disabled").map((o: any) => (
                  <option key={o.id} value={o.name}>{o.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {(activeTab === "my" || isSuperadmin) && (
              <button
                onClick={() => setIsClassifyModalOpen(true)}
                className={clsx(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  (unclassifiedCount > 0 && !(activeTab === "all" && !isSuperadmin))
                    ? "bg-primary text-white hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/20" 
                    : "bg-surface-low text-on-surface/30 border border-on-surface/5 cursor-not-allowed"
                )}
                disabled={unclassifiedCount === 0 || (activeTab === "all" && !isSuperadmin)}
              >
                <Tag className="w-3.5 h-3.5" />
                {activeTab === "all" && !isSuperadmin ? "View Only Mode" : "Classify Comments"}
                {unclassifiedCount > 0 && !(activeTab === "all" && !isSuperadmin) && (
                  <span className="bg-white text-primary px-1.5 py-0.5 rounded-md ml-1">{unclassifiedCount}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </Card>

      <ResponsesTable 
        responses={displayResponses} 
        isLoading={isLoading} 
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
