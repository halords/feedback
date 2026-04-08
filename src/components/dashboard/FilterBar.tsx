"use client";

import React from "react";
import useSWR from "swr";
import { useDashboard } from "@/context/DashboardContext";
import { ChevronDown, Calendar, Search, Map } from "lucide-react";
import { clsx } from "clsx";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const years = ["2023", "2024", "2025"];

export function FilterBar() {
  const { offices: selectedOffices, month, year, setFilters } = useDashboard();
  
  // Fetch office list
  const { data: officeList } = useSWR("/api/offices", (url) => fetch(url).then(r => r.json()));

  return (
    <div className="bg-surface-low rounded-2xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-end gap-6 shadow-sm border border-on-surface/5">
      {/* Office Selector */}
      <div className="flex-grow w-full md:w-auto">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface/50 mb-2 px-1">
          Target Department(s)
        </label>
        <div className="relative group">
          <select
            multiple={false} // Simple single select for now, could be multi-select later
            value={selectedOffices[0] || ""}
            onChange={(e) => setFilters({ offices: [e.target.value] })}
            className={clsx(
              "w-full bg-surface-lowest border-b-2 border-transparent px-10 py-3 rounded-lg font-sans text-sm font-semibold",
              "appearance-none outline-none transition-all duration-200 focus:border-primary shadow-sm"
            )}
          >
            <option value="">Select an office...</option>
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
            {months.map(m => <option key={m} value={m}>{m}</option>)}
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
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-[14px] w-4 h-4 text-on-surface/40" />
        </div>
      </div>
    </div>
  );
}
