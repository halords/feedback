"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { DataTable } from "@/components/ui/DataTable";
import { ChartCard } from "./ChartCard";
import useSWR from "swr";
import { clsx } from "clsx";

const columns = [
  { header: "Office / Satellite", accessor: "office" },
  { header: "Collection Forms", accessor: "collection", align: "center" as const },
  { header: "Visitors (Logbook)", accessor: "visitor", align: "center" as const },
];

export function CollectionTable() {
  const { offices, month, year } = useDashboard();
  
  const { data, isLoading } = useSWR(
    offices.length > 0 ? ["/api/dashboard/collection", offices, month, year] : null,
    ([url, off, m, y]) => fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offices: off, month: m, year: y })
    }).then(res => res.json())
  );

  return (
    <ChartCard 
      title="Detailed Breakdown of Collection" 
      subtitle="Detailed tabular data for collection and visitors including satellites"
      isLoading={isLoading}
      className="min-h-0"
    >
      <DataTable 
        columns={columns} 
        data={data?.map((d: any) => ({
          ...d,
          office: (
            <div className="flex flex-col">
              <span className={clsx(d.primaryGroup && "text-primary/70 text-xs font-bold uppercase tracking-widest pl-1")}>
                {d.office}
              </span>
              {d.primaryGroup && <span className="text-[10px] text-on-surface/30 pl-1">Part of {d.primaryGroup}</span>}
            </div>
          )
        })) || []} 
        isLoading={isLoading} 
      />
    </ChartCard>
  );
}
