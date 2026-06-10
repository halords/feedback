
"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Brain, Calendar, Clock, Check, BarChart3, TrendingUp, Info, AlertCircle, Layers } from "lucide-react";
import { clsx } from "clsx";

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (config: { timeScope: "month" | "quarter" | "year"; value: string }) => void;
  currentMonth: string;
  currentYear: string;
  isAnalyzing: boolean;
}

export function AIAnalysisModal({ isOpen, onClose, onAnalyze, currentMonth, currentYear, isAnalyzing }: AIAnalysisModalProps) {
  const [selectedScope, setSelectedScope] = useState<"month" | "quarter" | "year">("month");
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const now = new Date();
  const nowMonth = now.getMonth(); // 0-11
  const nowYear = now.getFullYear();

  // Helper to check if a period is "Finished" (archived/stable)
  const isMonthFinished = (mIdx: number, year: string) => {
    const y = parseInt(year);
    if (y < nowYear) return true;
    return mIdx < nowMonth; // Only previous months are "finished"
  };

  const isQuarterFinished = (q: number, year: string) => {
    const y = parseInt(year);
    if (y < nowYear) return true;
    const lastMonthOfQ = q * 3 - 1;
    return nowMonth > lastMonthOfQ;
  };

  const isYearFinished = (year: string) => {
    return parseInt(year) < nowYear;
  };

  const quarters = [
    { label: "Q1 (Jan-Mar)", value: "Q1", finished: isQuarterFinished(1, currentYear) },
    { label: "Q2 (Apr-Jun)", value: "Q2", finished: isQuarterFinished(2, currentYear) },
    { label: "Q3 (Jul-Sep)", value: "Q3", finished: isQuarterFinished(3, currentYear) },
    { label: "Q4 (Oct-Dec)", value: "Q4", finished: isQuarterFinished(4, currentYear) },
  ];

  const handleScopeChange = (scope: "month" | "quarter" | "year") => {
    setSelectedScope(scope);
    setSelectedValue(null); // Force re-selection on scope change
  };

  const isSelectionValid = useMemo(() => {
    if (!selectedValue) return false;
    if (selectedScope === "month") {
      const mIdx = ALL_MONTHS.indexOf(selectedValue);
      return isMonthFinished(mIdx, currentYear) || selectedValue === currentMonth;
    }
    if (selectedScope === "quarter") {
      const q = quarters.find(q => q.value === selectedValue);
      return q?.finished;
    }
    if (selectedScope === "year") {
      return isYearFinished(currentYear);
    }
    return false;
  }, [selectedValue, selectedScope, currentYear, currentMonth]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="AI Intelligence Scope"
      maxWidth="max-w-2xl"
      padding="p-6"
    >
      <div className="space-y-4">
        {/* Header/Info - Compact */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-[10px] text-on-surface/60 font-medium leading-tight">
            Quarterly and Yearly insights are only available for "Finished" periods to ensure accuracy.
          </p>
        </div>

        {/* Scope Selection */}
        <div className="grid grid-cols-3 gap-2">
          <ScopeButton 
            active={selectedScope === "month"} 
            onClick={() => handleScopeChange("month")}
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Monthly"
          />
          <ScopeButton 
            active={selectedScope === "quarter"} 
            onClick={() => handleScopeChange("quarter")}
            icon={<Layers className="w-3.5 h-3.5" />}
            label="Quarterly"
          />
          <ScopeButton 
            active={selectedScope === "year"} 
            onClick={() => handleScopeChange("year")}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Yearly"
          />
        </div>

        {/* Value Selection */}
        <div className="space-y-4 pt-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 px-1">
            Select {selectedScope === "month" ? "Month" : selectedScope === "quarter" ? "Quarter" : "Year"}
          </label>
          
          <div className={clsx(
            "grid gap-2",
            selectedScope === "month" ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-4"
          )}>
            {selectedScope === "month" && ALL_MONTHS.map((m, idx) => {
              const finished = isMonthFinished(idx, currentYear);
              const current = m === currentMonth;
              return (
                <OptionButton 
                  key={m}
                  label={m}
                  active={selectedValue === m}
                  onClick={() => setSelectedValue(m)}
                  disabled={!finished && !current}
                  badge={current ? "Active" : !finished ? "Pending" : ""}
                />
              );
            })}

            {selectedScope === "quarter" && quarters.map((q) => (
              <OptionButton 
                key={q.value}
                label={q.label}
                active={selectedValue === q.value}
                onClick={() => setSelectedValue(q.value)}
                disabled={!q.finished}
                badge={!q.finished ? "In Progress" : ""}
              />
            ))}

            {selectedScope === "year" && (
              <OptionButton 
                label={`${currentYear} (Full Year)`}
                active={selectedValue === currentYear}
                onClick={() => setSelectedValue(currentYear)}
                disabled={!isYearFinished(currentYear)}
                badge={!isYearFinished(currentYear) ? "Active Year" : ""}
              />
            )}
          </div>
        </div>

        {/* Action */}
        <div className="pt-4 border-t border-border-strong flex flex-col items-center gap-3">
          {!isYearFinished(currentYear) && selectedScope === "year" && (
            <div className="flex items-center gap-2 text-[9px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50">
              <AlertCircle className="w-3 h-3" />
              Yearly analysis is best after the year ends.
            </div>
          )}
          
          <Button 
            variant="primary" 
            className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
            disabled={isAnalyzing || !isSelectionValid}
            onClick={() => selectedValue && onAnalyze({ timeScope: selectedScope, value: selectedValue })}
          >
            {isAnalyzing ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
            {isAnalyzing ? "Processing Intelligence..." : "Begin AI Analysis"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ScopeButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-center group",
        active 
          ? "bg-primary/5 border-primary text-primary shadow-md shadow-primary/5" 
          : "bg-surface border-border-strong text-on-surface/40 hover:border-on-surface/20"
      )}
    >
      <div className={clsx(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
        active ? "bg-primary text-white" : "bg-on-surface/5 text-on-surface/40 group-hover:bg-on-surface/10"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider">{label}</p>
      </div>
    </button>
  );
}

function OptionButton({ label, active, onClick, disabled, badge }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "relative px-1.5 py-2.5 rounded-lg border text-[9px] font-black uppercase tracking-tight transition-all text-center",
        disabled 
          ? "bg-on-surface/[0.02] border-on-surface/5 text-on-surface/20 cursor-not-allowed" 
          : active
            ? "bg-primary/10 border-primary text-primary shadow-inner"
            : "bg-surface border-border-strong text-on-surface/60 hover:bg-on-surface/5"
      )}
    >
      {label}
      {badge && (
        <span className={clsx(
          "absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border",
          badge === "Active" || badge === "Live 2026" ? "bg-emerald-500 text-white border-emerald-400" :
          badge === "Pending" || badge === "In Progress" || badge === "Active Year" ? "bg-amber-500 text-white border-amber-400" :
          "bg-on-surface/10 text-on-surface/40 border-on-surface/10"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}
