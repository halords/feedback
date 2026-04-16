"use client";

import React, { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { 
  ShieldCheck, 
  Database, 
  FileJson, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";
import { clsx } from "clsx";
import { useToast } from "@/components/ui/Toast";
import { useSystem } from "@/context/SystemContext";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS_FALLBACK = [new Date().getFullYear().toString(), "2025"];

export function SavingMeasuresClient() {
  const { isOverrideActive } = useSystem();
  const { showToast } = useToast();
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Default to previous month
  const defaultMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const defaultYear = (currentMonthIndex === 0 ? currentYear - 1 : currentYear).toString();

  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[defaultMonthIndex]);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [status, setStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (logs.length > 0) {
      const el = document.getElementById('logs-end');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/admin/archive?mode=years');
      const data = await res.json();
      if (data.years && data.years.length > 0) {
        setAvailableYears(data.years);
      } else {
        setAvailableYears(YEARS_FALLBACK);
      }
    } catch (err) {
      setAvailableYears(YEARS_FALLBACK);
    }
  };

  const checkStatus = async () => {
    if (!selectedMonth || !selectedYear) return;
    setIsChecking(true);
    try {
      const res = await fetch(`/api/admin/archive?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      // Ignored for quiet init
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    checkStatus();
  }, [selectedMonth, selectedYear]);

  // Filter months to "Only legacy" (Previous of current)
  const getAllowedMonths = (year: string) => {
    if (parseInt(year) < currentYear) return MONTHS;
    if (parseInt(year) > currentYear) return []; // Should not happen
    // Current Year: only months before current month
    return MONTHS.slice(0, currentMonthIndex);
  };

  const allowedMonths = getAllowedMonths(selectedYear);

  // Synchronize month if it becomes invalid for the selected year
  useEffect(() => {
    if (allowedMonths.length > 0 && !allowedMonths.includes(selectedMonth)) {
      setSelectedMonth(allowedMonths[allowedMonths.length - 1]);
    }
  }, [allowedMonths, selectedMonth]);

  const handleArchive = async () => {
    setIsArchiving(true);
    setLogs([]);
    setIsConfirmModalOpen(false);
    
    addLog(`Initiating archival for ${selectedMonth} ${selectedYear}...`);
    addLog(`Calculating metrics and raw response snapshots...`);

    try {
      const res = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: "Failed to parse server response" };
      }

      if (res.ok && data) {
        addLog(`Successfully uploaded metrics to ${data.metricsPath || 'N/A'}`);
        addLog(`Successfully uploaded responses to ${data.responsesPath || 'N/A'}`);
        addLog(`Counts: ${data.counts?.officesArchived || 0} offices, ${data.counts?.rawResponses || 0} responses.`);
        showToast(`Archived ${selectedMonth} ${selectedYear} successfully!`, "success");
        checkStatus();
      } else {
        const errorMsg = data?.error || "Archival failed";
        addLog(`Error: ${errorMsg}`);
        showToast(errorMsg, "error");
      }
    } catch (err) {
      console.error("Archival technical error:", err);
      addLog(`Critical error occurred during archival.`);
      showToast("An unexpected error occurred", "error");
    } finally {

      setIsArchiving(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Controls Card */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="p-0 border-on-surface/5 relative overflow-hidden group bg-surface shadow-xl shadow-primary/5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000" />
              
              <div className="p-8 border-b border-on-surface/5 flex flex-wrap items-center justify-between gap-4 relative z-10 bg-surface-low/50">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Database className="w-4 h-4" /> Archival Configuration
                  </h3>
                  <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-wider">Manage monthly JSON snapshots</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">99.2% Reduced Reads</span>
                </div>
              </div>

              <div className="p-8 space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">Archive Period (Month)</label>
                    <div className="relative">
                      <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full h-14 px-5 rounded-2xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-bold text-on-surface appearance-none cursor-pointer hover:bg-white shadow-sm"
                      >
                        {allowedMonths.map(m => <option key={m} value={m}>{m}</option>)}
                        {allowedMonths.length === 0 && <option disabled>No valid months</option>}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">Archive Period (Year)</label>
                    <div className="relative">
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full h-14 px-5 rounded-2xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-bold text-on-surface appearance-none cursor-pointer hover:bg-white shadow-sm"
                      >
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-surface-low border border-on-surface/5 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-grow space-y-1.5 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      {isChecking ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      ) : status?.archived ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <h4 className="font-black text-on-surface text-sm uppercase tracking-tight">
                        {isChecking ? "Checking Status..." : status?.archived ? "Snapshot Exists" : "Ready for Archival"}
                      </h4>
                    </div>
                    <p className="text-[11px] text-on-surface/40 font-bold leading-relaxed max-w-md">
                      {status?.archived 
                        ? "This month is already optimized. Re-archiving will overwrite existing snapshots with current Firestore data."
                        : "No archives found. Generate JSON snapshots now to enable 99% read optimization for this month."}
                    </p>
                  </div>

                  <div className="w-full md:w-auto">
                    <Button 
                      onClick={() => setIsConfirmModalOpen(true)}
                      disabled={isArchiving || isChecking}
                      variant={status?.archived ? "outline" : "primary"}
                      className="w-full md:w-auto px-8 h-12 rounded-xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/10"
                    >
                      {isArchiving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
                      {isArchiving ? "Processing..." : status?.archived ? "Re-Generate" : "Generate Now"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Logs Area */}
            {logs.length > 0 && (
              <div className="p-8 rounded-3xl bg-[#0f1113] text-green-400 font-mono text-[10px] space-y-1.5 border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                <div className="flex items-center gap-2 mb-4 text-white/40 font-sans font-black uppercase tracking-widest text-[9px]">
                  <RefreshCw className={clsx("w-3 h-3", isArchiving && "animate-spin")} /> Process Stream
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                    {logs.map((log, i) => (
                    <div key={i} className="flex gap-3">
                        <span className="opacity-20 flex-shrink-0 w-4">{i + 1}</span>
                        <span className="break-all opacity-90">{log}</span>
                    </div>
                    ))}
                    <div id="logs-end" />
                </div>
                {isArchiving && <div className="animate-pulse flex items-center gap-2 mt-4 text-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="font-sans font-black uppercase tracking-widest text-[9px]">Awaiting Completion...</span>
                </div>}
              </div>
            )}
          </div>

          {/* Info Side Column */}
          <div className="space-y-6">
            <Card className="p-8 border-on-surface/5 bg-primary/5 border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldCheck className="w-24 h-24" />
              </div>
              
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2 relative z-10">
                <Info className="w-4 h-4" /> Optimization Flow
              </h3>
              
              <div className="space-y-8 relative z-10">
                {[
                  { title: "Snapshot", desc: "Builds a definitive monthly metrics blob from Firestore records." },
                  { title: "Storage", desc: "Saves JSON files to Firebase Storage with secure IAM protection." },
                  { title: "Routing", desc: "Dashboards automatically pivot to JSON to bypass database reads." }
                ].map((step, i) => (
                  <div key={i} className="relative pl-8">
                    {i !== 2 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-primary/20" />}
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-black text-primary">{i+1}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-on-surface uppercase tracking-tight">{step.title}</p>
                      <p className="text-[11px] text-on-surface/50 font-bold leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {isOverrideActive && (
              <Card className="p-6 border-amber-500/20 bg-amber-500/5 border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-amber-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-amber-900 text-[11px] uppercase tracking-tight">Override Mode</h4>
                    <p className="text-[10px] text-amber-900/60 font-bold leading-relaxed">
                      You have bypassed archive protection. If you made changes, you <strong>MUST</strong> re-generate archives for changes to take effect.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 border-on-surface/5 bg-surface-low border shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center text-on-surface/40 flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-on-surface text-[11px] uppercase tracking-tight">System Policy</h4>
                  <p className="text-[10px] text-on-surface/40 font-bold leading-relaxed">
                    Once archived, response edits are disabled in optimized views unless a superadmin override is specifically requested.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Archival"
      >
        <div className="space-y-6 p-2">
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <p className="text-xs font-bold text-amber-700 leading-relaxed">
              Generating an archive will perform a high-read operation across the entire {selectedMonth} dataset. 
              {status?.archived && " This will overwrite the existing archive file."}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
               onClick={handleArchive}
               className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-xs"
            >
              Confirm and Generate
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmModalOpen(false)}
              className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Shell>
  );
}
