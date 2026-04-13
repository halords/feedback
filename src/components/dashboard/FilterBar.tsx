"use client";

import React, { useMemo, useEffect } from "react";
import useSWR from "swr";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, Calendar, Search, Map } from "lucide-react";
import { clsx } from "clsx";

const allMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function FilterBar() {
  const { offices: selectedOffices, month, year, setFilters } = useDashboard();
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const baselineYear = 2025;

  // Generate years from 2025 to current year
  const availableYears = Array.from(
    { length: currentYear - baselineYear + 1 }, 
    (_, i) => (baselineYear + i).toString()
  );

  // Generate months based on selected year
  const availableMonths = useMemo(() => {
    const selectedYearInt = parseInt(year);
    if (selectedYearInt === currentYear) {
      return allMonths.slice(0, currentMonthIdx + 1);
    }
    return allMonths;
  }, [year, currentYear, currentMonthIdx]);

  // Handle case where current selected month becomes invalid when switching years
  useEffect(() => {
    if (!availableMonths.includes(month)) {
      setFilters({ month: availableMonths[availableMonths.length - 1] });
    }
  }, [availableMonths, month, setFilters]);
  
  // Fetch office list
  const { data: rawOfficeList } = useSWR("/api/offices", (url) => fetch(url).then(r => r.json()));
  const { user } = useAuth();
  
  const officeList = useMemo(() => {
    if (!rawOfficeList) return [];
    const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
    if (isSuperadmin) return rawOfficeList;
    
    const userOffices = user?.offices || [];
    return rawOfficeList.filter((off: any) => userOffices.includes(off.name));
  }, [rawOfficeList, user]);

  return (
    <div className="bg-surface-low rounded-2xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-end gap-6 shadow-sm border border-on-surface/5">
      {/* Office Selector */}
      <div className="flex-grow w-full md:w-auto">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface/50 mb-2 px-1">
          Target Department(s)
        </label>
        <div className="relative group">
          <select
            value={selectedOffices.length === officeList.length && officeList.length > 1 ? "ALL_AUTHORIZED" : (selectedOffices.length > 1 ? "MULTIPLE" : (selectedOffices[0] || ""))}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "ALL_AUTHORIZED") {
                setFilters({ offices: officeList.map((o: any) => o.name) });
              } else if (val === "MULTIPLE") {
                // Keep current multiple or do nothing
              } else {
                setFilters({ offices: val ? [val] : [] });
              }
            }}
            className={clsx(
              "w-full bg-surface-lowest border-b-2 border-transparent px-10 py-3 rounded-lg font-sans text-sm font-semibold",
              "appearance-none outline-none transition-all duration-200 focus:border-primary shadow-sm"
            )}
          >
            <option value="">{user?.user_type?.toLowerCase() === "superadmin" ? "All Offices (Global)" : "Select an office..."}</option>
            {officeList.length > 1 && (
              <option value="ALL_AUTHORIZED">
                {user?.user_type?.toLowerCase() === "superadmin" ? "Compare All Offices" : "All My Assigned Offices"}
              </option>
            )}
            {selectedOffices.length > 1 && selectedOffices.length < officeList.length && (
              <option value="MULTIPLE" disabled>Multiple Selected ({selectedOffices.length})</option>
            )}
            {officeList?.map((off: any) => (
              <option key={off.id} value={off.name}>{off.name}</option>
            ))}
          </select>
          <Map className="absolute left-4 top-[14px] w-4 h-4 text-primary" />
          <ChevronDown className="absolute right-4 top-[14px] w-4 h-4 text-on-surface/40 group-focus-within:rotate-180 transition-transform" />
        </div>
      </div>

      {/* Month Selector */}
      <div className="w-full md:w-48">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface/50 mb-2 px-1">
          Period (Month)
        </label>
        <div className="relative group">
          <select
            value={month}
            onChange={(e) => setFilters({ month: e.target.value })}
            className="w-full bg-surface-lowest border-b-2 border-transparent px-10 py-3 rounded-lg font-sans text-sm font-semibold appearance-none outline-none focus:border-primary shadow-sm"
          >
            {availableMonths.map((m: string) => <option key={m} value={m}>{m}</option>)}
          </select>
          <Calendar className="absolute left-4 top-[14px] w-4 h-4 text-primary" />
          <ChevronDown className="absolute right-4 top-[14px] w-4 h-4 text-on-surface/40" />
        </div>
      </div>

      {/* Year Selector */}
      <div className="w-full md:w-32">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface/50 mb-2 px-1">
          Year
        </label>
        <div className="relative group">
          <select
            value={year}
            onChange={(e) => setFilters({ year: e.target.value })}
            className="w-full bg-surface-lowest border-b-2 border-transparent px-10 py-3 rounded-lg font-sans text-sm font-semibold appearance-none outline-none focus:border-primary shadow-sm"
          >
            {availableYears.map((y: string) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-[14px] w-4 h-4 text-on-surface/40" />
        </div>
      </div>
    </div>
  );
}
