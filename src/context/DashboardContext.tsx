"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import useSWR from "swr";

interface DashboardContextType {
  offices: string[];
  month: string;
  year: string;
  setFilters: (filters: { offices?: string[]; month?: string; year?: string }) => void;
  data: any;
  isLoading: boolean;
  isValidating: boolean;
  error: any;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const fetcher = (url: string, body: any) => 
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(res => res.json());

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL or defaults
  const [offices, setOffices] = useState<string[]>(
    searchParams.get("offices")?.split(",") || []
  );
  const [month, setMonth] = useState(
    searchParams.get("month") || new Date().toLocaleString('en-US', { month: 'long' })
  );
  const [year, setYear] = useState(
    searchParams.get("year") || new Date().getFullYear().toString()
  );

  // Sync state to URL
  const setFilters = ({ offices: newOffices, month: newMonth, year: newYear }: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newOffices) {
      setOffices(newOffices);
      params.set("offices", newOffices.join(","));
    }
    if (newMonth) {
      setMonth(newMonth);
      params.set("month", newMonth);
    }
    if (newYear) {
      setYear(newYear);
      params.set("year", newYear);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Fetch data with SWR
  // Only fetch if offices are selected
  const swrKey = offices.length > 0 ? ["/api/dashboard", offices, month, year] : null;
  const { data, error, isLoading, isValidating } = useSWR(
    swrKey,
    ([url, off, m, y]) => fetcher(url, { offices: off, month: m, year: y }),
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const value = useMemo(() => ({
    offices,
    month,
    year,
    setFilters,
    data,
    isLoading,
    isValidating,
    error
  }), [offices, month, year, data, isLoading, isValidating, error]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
