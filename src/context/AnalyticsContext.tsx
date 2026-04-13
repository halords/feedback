"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import useSWR from "swr";

interface AnalyticsContextType {
  month: string;
  year: string;
  search: string;
  setFilters: (filters: { month?: string; year?: string; search?: string }) => void;
  data: any;
  isLoading: boolean;
  isValidating: boolean;
  error: any;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

const fetcher = (url: string, body: any) => 
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(res => res.json());

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.toLocaleString('en-US', { month: 'long' });
  
  const [year, setYear] = useState(searchParams.get("year") || currentY.toString());
  const [month, setMonth] = useState(searchParams.get("month") || currentM);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const setFilters = ({ month: newMonth, year: newYear, search: newSearch }: any) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newMonth) {
      setMonth(newMonth);
      params.set("month", newMonth);
    }
    if (newYear) {
      setYear(newYear);
      params.set("year", newYear);
    }
    if (newSearch !== undefined) {
      setSearch(newSearch);
      if (newSearch) params.set("search", newSearch);
      else params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data, error, isLoading, isValidating } = useSWR(
    ["/api/dashboard", ["ALL"], month, year],
    ([url, off, m, y]: [string, string[], string, string]) => fetcher(url, { offices: off, month: m, year: y }),
    { revalidateOnFocus: false }
  );

  const value = useMemo(() => ({
    month,
    year,
    search,
    setFilters,
    data,
    isLoading,
    isValidating,
    error
  }), [month, year, search, data, isLoading, isValidating, error]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
