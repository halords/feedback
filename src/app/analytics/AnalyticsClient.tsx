"use client";

import React, { useState } from "react";
import { AnalyticsProvider, useAnalytics } from "@/context/AnalyticsContext";
import { Shell } from "@/components/layout/Shell";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clsx } from "clsx";
import { Table, LayoutGrid, PieChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/analytics/DataView";
import { SummaryView } from "@/components/analytics/SummaryView";
import { GraphsView } from "@/components/analytics/GraphsView";

type Tab = "data" | "summary" | "graphs";

function AnalyticsHeader({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (t: Tab) => void }) {
  const { month, year } = useAnalytics();
  
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <h1 className="font-display text-4xl font-extrabold text-primary tracking-tight">Analytics & Reports</h1>
        <p className="text-on-surface/50 font-medium mt-1">Generate and visualize detailed satisfaction reports for organizational audits.</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-low p-1.5 rounded-2xl border border-on-surface/5">
          <TabButton 
            active={activeTab === "data"} 
            onClick={() => setActiveTab("data")} 
            icon={<Table className="w-4 h-4" />}
            label="Data View"
          />
          <TabButton 
            active={activeTab === "summary"} 
            onClick={() => setActiveTab("summary")} 
            icon={<LayoutGrid className="w-4 h-4" />}
            label="Summary"
          />
          <TabButton 
            active={activeTab === "graphs"} 
            onClick={() => setActiveTab("graphs")} 
            icon={<PieChart className="w-4 h-4" />}
            label="Graphs"
          />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("data");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="animate-pulse bg-surface h-screen" />;

  return (
    <AnalyticsProvider activeTab={activeTab}>
      <Shell>
        <AnalyticsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mb-6">
          <AnalyticsFilterBar activeTab={activeTab} />
        </div>

        {/* Tab Content Rendering */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "data" && <DataView />}
          {activeTab === "summary" && <SummaryView />}
          {activeTab === "graphs" && <GraphsView />}
        </div>
      </Shell>
    </AnalyticsProvider>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-bold transition-all duration-300",
        active 
          ? "bg-white text-primary shadow-md translate-y-[-1px]" 
          : "text-on-surface/40 hover:text-on-surface/60 hover:bg-white/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
