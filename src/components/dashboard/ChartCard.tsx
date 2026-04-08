"use client";

import React, { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { initCharts } from "@/lib/charts/init";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

initCharts();

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, isLoading, children, className }: ChartCardProps) {
  return (
    <Card className={clsx("flex flex-col h-full overflow-hidden min-h-[350px]", className)}>
      <div className="mb-6">
        <h3 className="font-display text-lg font-bold text-on-surface">{title}</h3>
        {subtitle && <p className="text-on-surface/50 text-sm">{subtitle}</p>}
      </div>
      
      <div className="flex-grow relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Processing Data</span>
            </div>
          </div>
        )}
        
        <div className={clsx("h-full w-full transition-opacity duration-300", isLoading && "opacity-20 blur-[1px]")}>
          {children}
        </div>
      </div>
    </Card>
  );
}
