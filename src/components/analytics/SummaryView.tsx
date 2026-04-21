"use client";

import React, { useMemo } from "react";
import { useAnalytics } from "@/context/AnalyticsContext";
import { Card } from "@/components/ui/Card";
import {
  Building2,
  TrendingUp,
  Users,
  CheckCircle2
} from "lucide-react";
import { clsx } from "clsx";

export function SummaryView() {
  const { data, isLoading, isValidating } = useAnalytics();

  const isActuallyLoading = isLoading || (isValidating && !data);

  const displayData = data || [];

  // Aggregated totals for the top stats bar
  const totals = useMemo(() => {
    if (!displayData.length) return { clients: 0, avgRate: 0, topOffice: "N/A" };

    let totalClients = 0;
    let sumRate = 0;
    let countRate = 0;
    let maxRate = -1;
    let topOffice = "N/A";

    displayData.forEach((o: any) => {
      totalClients += o.collection;
      if (o.overrate !== "N/A") {
        const r = parseFloat(o.overrate);
        sumRate += r;
        countRate++;
        if (r > maxRate) {
          maxRate = r;
          topOffice = o.department;
        }
      }
    });

    return {
      clients: totalClients,
      avgRate: countRate > 0 ? (sumRate / countRate).toFixed(2) : "N/A",
      topOffice
    };
  }, [displayData]);

  if (isActuallyLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-on-surface/5 rounded-3xl" />
          ))}
        </div>
        <Card className="p-0 overflow-hidden border border-on-surface/5 shadow-xl bg-surface-lowest">
          <div className="h-14 bg-surface-low/30 border-b border-on-surface/5 w-full" />
          <div className="p-4 space-y-4">
            {Array(10).fill(0).map((_, i) => (
               <div key={i} className="h-10 bg-on-surface/5 rounded-xl w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-6 pb-20 transition-opacity duration-300", isValidating && "opacity-50 pointer-events-none")}>
      {/* Reduced Height Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HighlightCard
          label="Total Reach"
          value={String(totals.clients)}
          icon={<Users className="w-4 h-4 text-primary" />}
        />
        <HighlightCard
          label="Org. Average Rate"
          value={String(totals.avgRate)}
          icon={<TrendingUp className="w-4 h-4 text-tertiary" />}
        />
        <HighlightCard
          label="Peak Office"
          value={totals.topOffice}
          icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
        />
      </div>

      {/* Legacy Parity Comparison Matrix */}
      <Card className="p-0 overflow-hidden border border-border-strong/50 shadow-xl bg-surface-low">
        <div className="p-4 border-b border-on-surface/5 bg-surface-low/30">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Customer Feedback Summary Report
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar-reports">
          <table className="w-full text-center font-sans border-collapse text-[11px]">
            <thead className="bg-background/80 backdrop-blur-md border-b-2 border-border-strong sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-black uppercase tracking-tighter text-on-surface/50 text-left border-r border-on-surface/5">Offices</th>
                <th className="px-3 py-3 font-black uppercase tracking-tighter text-on-surface/50">Responses</th>
                <th className="px-3 py-3 font-black uppercase tracking-tighter text-on-surface/50">Registered</th>
                <th className="px-3 py-3 font-black uppercase tracking-tighter text-tertiary/70 text-[9px]">Col. Rate</th>
                <th className="px-2 py-3 font-black uppercase tracking-tighter text-on-surface/40">Male</th>
                <th className="px-2 py-3 font-black uppercase tracking-tighter text-on-surface/40">Female</th>
                <th className="px-2 py-3 font-black uppercase tracking-tighter text-on-surface/40">LGBTQ</th>
                <th className="px-2 py-3 font-black uppercase tracking-tighter text-on-surface/40">Other</th>
                <th className="px-3 py-3 font-black uppercase tracking-tighter text-primary/60 border-l border-on-surface/5">Env.</th>
                <th className="px-3 py-3 font-black uppercase tracking-tighter text-primary/60">Sys.</th>
                <th className="px-3 py-3 font-black uppercase tracking-tighter text-primary/60">Staff</th>
                <th className="px-3 py-3 font-black uppercase tracking-tighter text-primary border-x border-on-surface/5">General</th>
                <th className="px-2 py-3 font-black uppercase tracking-tighter text-tertiary">Comm.</th>
                <th className="px-2 py-3 font-black uppercase tracking-tighter text-red-400">Compl.</th>
                <th className="px-2 py-3 font-black uppercase tracking-tighter text-primary">Sugg.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-strong/20">
              {displayData.map((office: any) => (
                <tr key={office.department} className="hover:bg-primary/[0.015] transition-colors group">
                  <td className="px-4 py-2.5 text-left border-r border-on-surface/5">
                    <span className="font-bold text-primary truncate max-w-[120px] inline-block">{office.department}</span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-on-surface/70">{office.collection || ""}</td>
                  <td className="px-3 py-2.5 font-bold text-on-surface/70">{office.visitor || ""}</td>
                  <td className="px-3 py-2.5 font-black text-tertiary/70 text-[9px]">{office.collectionRate}</td>
                  {/* Gender */}
                  <td className="px-2 py-2.5 text-on-surface/50">{office.gender.Male || ""}</td>
                  <td className="px-2 py-2.5 text-on-surface/50">{office.gender.Female || ""}</td>
                  <td className="px-2 py-2.5 text-on-surface/50">{office.gender.LGBTQ || ""}</td>
                  <td className="px-2 py-2.5 text-on-surface/50">{office.gender.Others || ""}</td>
                  {/* Rates */}
                  <td className="px-3 py-2.5 border-l border-on-surface/5 font-bold text-primary/60 text-[10px]">
                    {office.qValues.Q1?.RATE !== "N/A" ? office.qValues.Q1?.RATE : ""}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-primary/60 text-[10px]">
                    {office.sysRate !== "N/A" ? office.sysRate : ""}
                  </td>
                  <td className="px-3 py-2.5 font-bold text-primary/60 text-[10px]">
                    {office.staffRate !== "N/A" ? office.staffRate : ""}
                  </td>
                  <td className="px-3 py-2.5 border-x border-border-strong/20 font-black text-primary bg-primary/[0.02]">
                    {office.overrate !== "N/A" ? office.overrate : ""}
                  </td>
                  {/* Comments */}
                  <td className="px-2 py-2.5 font-bold text-tertiary">{office.comments.positive.length || ""}</td>
                  <td className="px-2 py-2.5 font-bold text-red-400">{office.comments.negative.length || ""}</td>
                  <td className="px-2 py-2.5 font-bold text-primary">{office.comments.suggestions.length || ""}</td>
                </tr>
              ))}
            </tbody>
            {/* Total Row */}
            <tfoot className="bg-surface-low/50 border-t-2 border-on-surface/10 font-black text-on-surface italic">
              <tr>
                <td className="px-4 py-3 text-left">Organization Total</td>
                <td className="px-3 py-3 border-r border-on-surface/5">{displayData.reduce((acc: number, o: any) => acc + o.collection, 0)}</td>
                <td className="px-3 py-3 border-r border-on-surface/5">{displayData.reduce((acc: number, o: any) => acc + o.visitor, 0)}</td>
                <td colSpan={5} className="px-2 py-3" />
                <td colSpan={3} className="px-3 py-3" />
                <td className="px-3 py-3 bg-primary/10 text-primary text-[10px] border-x border-border-strong/40">
                  <span className="opacity-40 mr-1">PGLU Avg. Rate:</span>
                  <span className="text-sm underline decoration-double">{totals.avgRate}</span>
                </td>
                <td className="px-2 py-3 border-l border-on-surface/5">{displayData.reduce((acc: number, o: any) => acc + o.comments.positive.length, 0)}</td>
                <td className="px-2 py-3">{displayData.reduce((acc: number, o: any) => acc + o.comments.negative.length, 0)}</td>
                <td className="px-2 py-3">{displayData.reduce((acc: number, o: any) => acc + o.comments.suggestions.length, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HighlightCard({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <Card className="p-4 bg-surface-low border border-border-strong/50 relative overflow-hidden group hover:border-primary/20 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30 mb-1">{label}</p>
          <p className="text-xl font-black text-on-surface truncate max-w-[150px]">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-primary/5 shadow-inner">
          {icon}
        </div>
      </div>
    </Card>
  );
}
