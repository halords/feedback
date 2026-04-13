"use client";

import React from "react";
import DashboardClient from "./DashboardClient";
import { useDashboard } from "@/context/DashboardContext";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Card } from "@/components/ui/Card";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Users, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { CCTable } from "@/components/dashboard/CCTable";
import { CollectionTable } from "@/components/dashboard/CollectionTable";

export default function DashboardPage() {
  return (
    <DashboardClient>
      <DashboardContent />
    </DashboardClient>
  );
}

function DashboardContent() {
  const { data, month: selectedMonth, isLoading } = useDashboard();
  
  // Filter data for the strictly selected month (Summary Cards)
  const currentMonthData = data?.filter((d: any) => d.month === selectedMonth) || [];

  // Logic for Avg. Satisfaction (NaN Fix)
  const validOffices = currentMonthData.filter((d: any) => d.collection > 0 && d.overrate !== "N/A");
  const avgSat = validOffices.length > 0
    ? (validOffices.reduce((acc: number, curr: any) => {
        const val = parseFloat(curr.overrate);
        return acc + (isNaN(val) ? 0 : val);
      }, 0) / validOffices.length).toFixed(2) + "%"
    : "No Data";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Total Collection"
          value={currentMonthData.reduce((acc: number, curr: any) => acc + curr.collection, 0).toLocaleString()}
          isLoading={isLoading}
          trend="+12%"
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          label="Avg. Satisfaction"
          value={avgSat}
          isLoading={isLoading}
          trend="+5%"
        />
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5 text-tertiary" />}
          label="Total Positive"
          value={currentMonthData.reduce((acc: number, curr: any) => acc + curr.comments.positive.length, 0).toLocaleString()}
          isLoading={isLoading}
          trend="+8%"
        />
        <StatCard 
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          label="Pending Complaints"
          value={currentMonthData.reduce((acc: number, curr: any) => acc + curr.comments.negative.length, 0).toLocaleString()}
          isLoading={isLoading}
          trend="-2%"
        />
      </div>

      {/* Analytics KPI Grid (4 Spec Charts) */}
      <KPIGrid />

      {/* Advanced Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
        <CollectionTable />
        <CCTable />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, isLoading }: { icon: any, label: string, value: string, trend: string, isLoading?: boolean }) {
  return (
    <Card className="flex flex-col gap-2 p-6 hover:translate-y-[-4px] transition-transform duration-300">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-surface-low rounded-lg">{icon}</div>
        {!isLoading ? (
          <span className={clsx("text-xs font-bold", trend.startsWith('+') ? "text-tertiary" : "text-red-500")}>{trend}</span>
        ) : (
          <div className="h-4 w-8 bg-on-surface/5 rounded animate-pulse" />
        )}
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40">{label}</p>
        {!isLoading ? (
          <p className="text-2xl font-black text-on-surface">{value}</p>
        ) : (
          <div className="h-8 w-24 bg-on-surface/5 rounded mt-1 animate-pulse" />
        )}
      </div>
    </Card>
  );
}
