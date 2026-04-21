"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import useSWR from "swr";

interface DashboardContextType {
  offices: string[];
  month: string;
  year: string;
  visibleMonths: string[];
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

import { useAuth } from "@/context/AuthContext";

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentY = prevMonthDate.getFullYear().toString();
  const currentM = prevMonthDate.toLocaleString('en-US', { month: 'long' });
  
  const [offices, setOffices] = useState<string[]>([]);

  const initialYear = searchParams.get("year");
  const [year, setYear] = useState(() => {
    if (initialYear && parseInt(initialYear) >= 2025) return initialYear;
    return currentY.toString();
  });

  const [month, setMonth] = useState(() => {
    const m = searchParams.get("month");
    if (m) return m;
    return currentM;
  });

  // RBAC Initialization & Sync
  useEffect(() => {
    if (authLoading || !user) return;

    const fromUrl = searchParams.get("offices")?.split(",").filter(Boolean) || [];
    const isSuperadmin = user.user_type?.toLowerCase() === "superadmin";
    const userOffices = user.offices || [];

    if (isSuperadmin) {
      if (fromUrl.length > 0) setOffices(fromUrl);
      else setOffices([]); // Defaults to empty (0 reads) for Superadmin
    } else {
      if (fromUrl.length > 0) {
        // Intersect requested offices with assigned ones
        const intersection = fromUrl.filter(o => userOffices.includes(o));
        setOffices(intersection);
        
        // Correct URL if it contains unauthorized offices
        if (intersection.length !== fromUrl.length) {
          const params = new URLSearchParams(searchParams.toString());
          if (intersection.length > 0) {
            params.set("offices", intersection.join(","));
          } else {
            params.delete("offices");
          }
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
      } else {
        // Default behavior: If exactly 1 office, auto-load it. Otherwise, show "Select an office..."
        // to prevent unnecessary bulk fetches on page load for multi-office users.
        if (userOffices.length === 1) {
          setOffices(userOffices);
        } else {
          setOffices([]);
        }
      }
    }
  }, [user, authLoading, searchParams, pathname, router]);

  // Sync state to URL
  const setFilters = useCallback(({ offices: newOffices, month: newMonth, year: newYear }: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newOffices) {
      // Hard check non-superadmins against their assignments
      const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
      const userOffices = user?.offices || [];
      const validated = isSuperadmin ? newOffices : newOffices.filter((o: string) => userOffices.includes(o));

      setOffices(validated);
      params.set("offices", validated.join(","));
    }
    
    const targetY = newYear || year;
    const targetM = newMonth || month;

    // Boundary check for current month/year
    if (parseInt(targetY) === parseInt(currentY)) {
      const monthsArr = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const maxMIdx = new Date().getMonth();
      const targetMIdx = monthsArr.indexOf(targetM);
      
      if (targetMIdx > maxMIdx) {
        // Force current month if future month requested for current year
        setMonth(currentM);
        params.set("month", currentM);
      } else if (newMonth) {
        setMonth(newMonth);
        params.set("month", newMonth);
      }
    } else if (newMonth) {
      setMonth(newMonth);
      params.set("month", newMonth);
    }

    if (newYear) {
      setYear(newYear);
      params.set("year", newYear);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname, user, year, month, currentY, currentM]);

  // Ensure baseline and future dates are corrected
  useEffect(() => {
    if (parseInt(year) > parseInt(currentY)) {
      setFilters({ year: currentY.toString() });
    }
    if (parseInt(year) < 2025) {
      setFilters({ year: "2025" });
    }
  }, [year, currentY, setFilters]);

  // Compute visible months (Cumulative up to selected month)
  const visibleMonths = useMemo(() => {
    const monthsArr = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const selectedIdx = monthsArr.indexOf(month);
    return monthsArr.slice(0, selectedIdx + 1);
  }, [month]);

  // Fetch data with SWR
  // Only fetch if offices are selected
  const swrKey = offices.length > 0 ? ["/api/dashboard", offices, visibleMonths, year] : null;
  const { data, error, isLoading, isValidating } = useSWR(
    swrKey,
    ([url, off, months, y]: [string, string[], string[], string]) => fetcher(url, { offices: off, month: months, year: y }),
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const value = useMemo(() => ({
    offices,
    month,
    year,
    visibleMonths,
    setFilters,
    data,
    isLoading,
    isValidating,
    error
  }), [offices, month, year, visibleMonths, data, isLoading, isValidating, error]);

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
