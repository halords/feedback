"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { DataTable } from "@/components/ui/DataTable";
import { ChartCard } from "./ChartCard";
import useSWR from "swr";

const columns = [
  { header: "OFFICE", accessor: "OFFICE" },
  { header: "AWARE", accessor: "AWARE", align: "center" as const },
  { header: "VISIBLE", accessor: "VISIBLE", align: "center" as const },
  { header: "HELPFUL", accessor: "HELPFUL", align: "center" as const },
  { header: "CLIENTS", accessor: "CLIENTS", align: "center" as const },
];

export function CCTable() {
  const { offices, month, year } = useDashboard();
  
  const { data, isLoading } = useSWR(
    offices.length > 0 ? ["/api/dashboard/cc-awareness", offices, month, year] : null,
    ([url, off, m, y]) => fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offices: off, month: m, year: y })
    }).then(res => res.json())
  );

  return (
    <ChartCard 
      title="Citizen's Charter Awareness" 
      subtitle="Metrics on client awareness, visibility, and helpfulness"
      isLoading={isLoading}
      className="min-h-0" // Table height is dynamic
    >
      <DataTable 
        columns={columns} 
        data={data || []} 
        isLoading={isLoading} 
      />
    </ChartCard>
  );
}
