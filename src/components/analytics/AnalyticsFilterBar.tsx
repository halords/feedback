"use client";

import React, { useMemo, useEffect } from "react";
import { useAnalytics } from "@/context/AnalyticsContext";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, Calendar, FileText, Search, Loader2, Users } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

const allMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function AnalyticsFilterBar({ activeTab }: { activeTab: string }) {
  const { user } = useAuth();
  const { month, year, search, selectedUserId, setFilters, isGraphsReady, isLoading } = useAnalytics();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const baselineYear = 2025;

  const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
  const { data: users } = useSWR(isSuperadmin ? "/api/users" : null, (url) => fetch(url).then(res => res.json()));

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
  
  const currentTargetOffices = useMemo(() => {
    if (isSuperadmin && selectedUserId && Array.isArray(users)) {
      const selectedUser = users.find(u => u.idno === selectedUserId);
      return selectedUser?.officeAssignments || [];
    }
    return [];
  }, [isSuperadmin, selectedUserId, users]);

  return (
    <div className="bg-surface-low rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm border border-on-surface/5 w-full">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
        {/* Date Selectors */}
        <div className="flex items-center gap-2 bg-surface-lowest px-2 py-1.5 rounded-xl border border-on-surface/5">
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 w-3.5 h-3.5 text-primary" />
            <select
              value={month}
              onChange={(e) => setFilters({ month: e.target.value })}
              className="bg-transparent pl-9 pr-6 py-1.5 font-sans text-xs font-bold outline-none appearance-none cursor-pointer"
            >
              {availableMonths.map((m: string) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
          </div>
          <div className="w-px h-4 bg-on-surface/10 mx-1" />
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

        {/* Filters Group - Only show on Data View tab */}
        {activeTab === "data" && (
          <div className="flex flex-1 flex-col md:flex-row items-center gap-3">
            {/* User Dropdown for Superadmin */}
            {isSuperadmin && (
              <div className="relative w-full md:w-64 group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 group-focus-within:text-primary transition-colors" />
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => setFilters({ selectedUserId: e.target.value || null })}
                  className="w-full h-11 bg-surface-lowest pl-11 pr-10 rounded-xl border border-on-surface/5 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-xs font-bold appearance-none cursor-pointer"
                >
                  <option value="">User Filter: None</option>
                  <option value="ALL_OFFICES">All Offices (Global)</option>
                  {Array.isArray(users) && users
                    .filter(u => Array.isArray(u.officeAssignments) && u.officeAssignments.length > 0)
                    .sort((a, b) => {
                      const aSuper = a.userType?.toLowerCase() === 'superadmin';
                      const bSuper = b.userType?.toLowerCase() === 'superadmin';
                      if (aSuper && !bSuper) return -1;
                      if (!aSuper && bSuper) return 1;
                      return a.fullName.localeCompare(b.fullName);
                    })
                    .map((u: any) => (
                      <option key={u.idno} value={u.idno}>{u.fullName} {u.userType?.toLowerCase() === 'superadmin' ? '(Superadmin)' : ''}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20 pointer-events-none" />
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
                className="w-full h-11 bg-surface-lowest pl-11 pr-4 rounded-xl border border-on-surface/5 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-xs font-bold placeholder:text-on-surface/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate PDF Button */}
      <Button 
        variant="primary" 
        className={clsx(
          "h-11 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 whitespace-nowrap shadow-md shadow-primary/10 hover:translate-y-[-1px] transition-all",
          (isLoading || (activeTab === "graphs" && !isGraphsReady)) ? "opacity-50 cursor-not-allowed grayscale" : ""
        )}
        disabled={isLoading || (activeTab === "graphs" && !isGraphsReady)}
        onClick={() => {
          if (activeTab === "summary") {
            const url = `/api/reports/summary?month=${month}&year=${year}`;
            window.open(url, '_blank');
          } else if (activeTab === "graphs") {
            window.dispatchEvent(new CustomEvent('export-graphs'));
          } else {
            const params = new URLSearchParams({ month, year });
            if (search) params.set("search", search);
            
            // If superadmin has selected a user, pass those offices to the bulk generator
            if (isSuperadmin && currentTargetOffices.length > 0) {
              params.set("offices", currentTargetOffices.join(","));
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
      {activeTab === "graphs" && !isGraphsReady && !isLoading && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-primary/40 uppercase tracking-widest animate-pulse whitespace-nowrap">
          * Waiting for charts to render...
        </span>
      )}
      {isLoading && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-primary/40 uppercase tracking-widest animate-pulse whitespace-nowrap">
          * Extracting dashboard data...
        </span>
      )}
    </div>
  );
}
