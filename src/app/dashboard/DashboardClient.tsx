"use client";

import React from "react";
import { DashboardProvider } from "@/context/DashboardContext";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl" />
          <div className="h-4 w-32 bg-on-surface/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <Shell>
        
        <div className="space-y-4">
          <FilterBar />
          {children}
        </div>
      </Shell>
    </DashboardProvider>
  );
}
