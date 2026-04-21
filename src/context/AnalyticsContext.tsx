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
  isGraphsReady: boolean;
  setIsGraphsReady: (ready: boolean) => void;
  selectedUserId: string | null;
  targetOffices: string[];
  availablePersonnel: string[];
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

const fetcher = (url: string, body: any) => 
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(res => res.json());

import { useAuth } from "@/context/AuthContext";

export function AnalyticsProvider({ children, activeTab = "data" }: { children: React.ReactNode, activeTab?: string }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentY = prevMonthDate.getFullYear().toString();
  const currentM = prevMonthDate.toLocaleString('en-US', { month: 'long' });
  
  const [year, setYear] = useState(searchParams.get("year") || currentY);
  const [month, setMonth] = useState(searchParams.get("month") || currentM);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get("userId"));
  const [isGraphsReady, setIsGraphsReady] = useState(false);

  // Fetch all users for superadmin filter
  const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
  const { data: users } = useSWR(isSuperadmin ? "/api/users" : null, (url) => fetch(url).then(res => res.json()));

  const setFilters = ({ month: newMonth, year: newYear, search: newSearch, selectedUserId: newUserId }: any) => {
    const params = new URLSearchParams(searchParams.toString());
    let urlChanged = false;

    if (newMonth && newMonth !== month) {
      setMonth(newMonth);
      params.set("month", newMonth);
      urlChanged = true;
    }
    if (newYear && newYear !== year) {
      setYear(newYear);
      params.set("year", newYear);
      urlChanged = true;
    }
    if (newSearch !== undefined) {
      setSearch(newSearch);
      if (newSearch) params.set("search", newSearch);
      else params.delete("search");
      // Search change doesn't necessarily need URL push immediately for 'independence'
    }
    if (newUserId !== undefined) {
      setSelectedUserId(newUserId);
      if (newUserId) params.set("userId", newUserId);
      else params.delete("userId");
      urlChanged = true;
    }

    if (urlChanged) {
      // Use replace instead of push to avoid history stack bloat and potential state resets
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const targetOffices = useMemo(() => {
    if (!user) return [];

    // Summary and Graphs are independent global views
    if (activeTab === "summary" || activeTab === "graphs") {
      return ["ALL"];
    }

    const isSuper = user.user_type?.toLowerCase() === "superadmin";
    if (isSuper) return ["ALL"];

    // Office Admin Data View: Their assigned scope
    return user.offices && user.offices.length > 0 ? user.offices : ["NONE_ASSIGNED"];
  }, [user, activeTab]);

  const swrKey = targetOffices.length > 0 ? ["/api/dashboard", targetOffices, month, year] : null;

  // Debug logging for development
  React.useEffect(() => {
    if (targetOffices.length > 0) {
      console.log(`[AnalyticsContext] Tab: ${activeTab} | Targeting: ${JSON.stringify(targetOffices)} | Period: ${month} ${year}`);
    }
  }, [activeTab, targetOffices, month, year]);

  const { data: rawData, error, isLoading, isValidating } = useSWR(
    swrKey,
    ([url, off, m, y]: [string, string[], string, string]) => fetcher(url, { offices: off, month: m, year: y }),
    { revalidateOnFocus: false }
  );

  const availablePersonnel = useMemo(() => {
    if (!Array.isArray(rawData)) return [];
    const names = rawData
      .map((item: any) => item.fullname)
      .filter((name): name is string => !!name && typeof name === 'string');
    return Array.from(new Set(names)).sort();
  }, [rawData]);

  const data = useMemo(() => {
    if (!Array.isArray(rawData)) return rawData;
    if (isSuperadmin && selectedUserId && selectedUserId !== "ALL_OFFICES") {
      return rawData.filter((item: any) => item.fullname === selectedUserId);
    }
    return rawData;
  }, [rawData, isSuperadmin, selectedUserId]);

  const value = useMemo(() => ({
    month,
    year,
    search,
    setFilters,
    data,
    isLoading,
    isValidating,
    error,
    isGraphsReady,
    setIsGraphsReady,
    selectedUserId,
    targetOffices,
    availablePersonnel
  }), [month, year, search, data, isLoading, isValidating, error, isGraphsReady, selectedUserId, targetOffices, availablePersonnel]);

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
