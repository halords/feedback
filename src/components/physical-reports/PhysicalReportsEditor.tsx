"use client";

import React, { useState, useMemo, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { 
  User, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  Plus,
  Trash2,
  Save,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Calendar,
  ChevronDown
} from "lucide-react";
import { clsx } from "clsx";
import { calculateQuestionRate, calculateSatisfactionAverages, calculateCollectionRate } from "@/lib/services/analyticsService";

const FEEDBACK_STATEMENTS = [
  "0. I am satisfied with the service that I availed.",
  "1. Place is tidy, customer & PWD friendly, and safety signs are present.",
  "2. I spent a reasonable amount of time for my transaction.",
  "3. The office/staff followed the transaction's requirements and steps based on the information provided.",
  "4. The steps I needed to do for my transaction were simple.",
  "5. I easily found information about my transaction from the office or its website.",
  "6. I paid a reasonable amount of fees for my transaction. (If no fee, select N/A-0)",
  "7. The office/staff was fair to everyone during my transaction.",
  "8. I was treated courteously and (if asked questions) the staff was helpful.",
  "9. I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me."
];

const ITEMS_PER_PAGE = 10;

const fetcher = (url: string) => fetch(url).then(r => r.json());

const allMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PhysicalReportsEditor() {
  const now = new Date();
  const [month, setMonth] = useState(allMonths[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear().toString());
  const { data: reports, isLoading, mutate: refreshReports } = useSWR<any[]>(`/api/physical-reports?month=${month}&year=${year}`, fetcher);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const baselineYear = 2025;
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const availableYears = Array.from(
    { length: currentYear - baselineYear + 1 }, 
    (_, i) => (baselineYear + i).toString()
  );

  const availableMonths = useMemo(() => {
    const selectedYearInt = parseInt(year);
    if (selectedYearInt === currentYear) {
      return allMonths.slice(0, currentMonthIdx + 1);
    }
    return allMonths;
  }, [year, currentYear, currentMonthIdx]);

  useEffect(() => {
    if (!availableMonths.includes(month)) {
      setMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, month]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (!search) return reports;
    const s = search.toLowerCase();
    return reports.filter(r => 
      r.DEPARTMENT?.toLowerCase().includes(s) || 
      r.FOR_THE_MONTH_OF?.toLowerCase().includes(s)
    );
  }, [reports, search]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const handleEdit = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedReport(null);
    setIsModalOpen(true);
  };

  if (isLoading && !reports) {
    return (
      <Card className="p-0 overflow-hidden border border-on-surface/5 shadow-xl bg-white animate-pulse">
        <div className="h-14 bg-surface-low border-b border-on-surface/5 w-full" />
        <div className="divide-y divide-on-surface/5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-64 h-5 bg-on-surface/5 rounded" />
              </div>
              <div className="w-20 h-8 bg-on-surface/5 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-on-surface/5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          {/* Date Selectors */}
          <div className="flex items-center gap-2 bg-surface-lowest px-3 py-2 rounded-2xl border border-on-surface/5">
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-3.5 h-3.5 text-primary" />
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent pl-9 pr-6 py-1 font-sans text-xs font-bold outline-none appearance-none cursor-pointer"
              >
                {availableMonths.map((m: string) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
            </div>
            <div className="relative flex items-center border-l border-on-surface/10 ml-1">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-transparent pl-3 pr-6 py-1 font-sans text-xs font-bold outline-none appearance-none cursor-pointer"
              >
                {availableYears.map((y: string) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
            </div>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30" />
            <input 
              type="text"
              placeholder="Search office name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-surface-lowest border border-on-surface/5 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm transition-all"
            />
          </div>
        </div>

        <Button onClick={handleCreate} className="rounded-2xl flex items-center gap-2 h-11 px-6">
          <Plus className="w-4 h-4" />
          Add Physical Report
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border border-on-surface/5 shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-surface-low border-b border-on-surface/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 w-12 text-center">#</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Office Name</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Period</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Forms</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Visitors</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface/5">
              {paginatedData.map((report: any, idx: number) => (
                <tr key={report.id} className="hover:bg-on-surface/[0.015] transition-all group">
                  <td className="px-6 py-3.5 text-xs font-bold text-on-surface/30 text-center">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-display font-black text-primary text-sm group-hover:translate-x-0.5 transition-transform inline-block">
                      {report.DEPARTMENT}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-black text-on-surface/40 uppercase">
                      {report.FOR_THE_MONTH_OF}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-black text-on-surface">{report.COLLECTED_FORMS}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-black text-on-surface">{report.VISITORS}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button 
                      onClick={() => handleEdit(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-tighter ml-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <p className="text-on-surface/30 font-bold italic">No reports found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-low border-t border-on-surface/5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
              Showing Page <span className="text-primary">{currentPage}</span> of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-white disabled:opacity-20 transition-all text-primary border border-transparent hover:border-on-surface/5"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-white disabled:opacity-20 transition-all text-primary border border-transparent hover:border-on-surface/5"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedReport ? `Editing ${selectedReport.DEPARTMENT}` : "New Physical Report"}
      >
        <ReportForm report={selectedReport} onClose={() => setIsModalOpen(false)} onSaveSuccess={refreshReports} />
      </Modal>
    </div>
  );
}

function ReportForm({ report, onClose, onSaveSuccess }: { report: any, onClose: () => void, onSaveSuccess: () => void }) {
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (report) {
      const data = { ...report };
      // Format DATE_COLLECTED to MM/DD/YYYY if it's a timestamp or date string
      if (data.DATE_COLLECTED) {
        let date: Date | null = null;
        if (data.DATE_COLLECTED && typeof data.DATE_COLLECTED.toDate === 'function') {
          date = data.DATE_COLLECTED.toDate();
        } else if (data.DATE_COLLECTED instanceof Date) {
          date = data.DATE_COLLECTED;
        } else if (typeof data.DATE_COLLECTED === 'string') {
          const d = new Date(data.DATE_COLLECTED);
          if (!isNaN(d.getTime())) date = d;
        }

        if (date) {
          // Format to YYYY-MM-DD for date input
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          data.DATE_COLLECTED = `${y}-${m}-${d}`;
        }
      }
      setFormData(data);
    } else {
      // Initialize empty report
      const empty: any = {
        DEPARTMENT: "",
        FOR_THE_MONTH_OF: "",
        COLLECTED_FORMS: 0,
        VISITORS: 0,
        MALE: 0,
        FEMALE: 0,
        LGBTQ: 0,
        PREFER_NOT_TO_SAY: 0,
        CITIZEN: 0,
        BUSINESS: 0,
        GOVERNMENT: 0,
        YES: 0,
        JUST_NOW: 0,
        NO: 0,
        VISIBLE: 0,
        SOMEWHAT_VISIBLE: 0,
        DIFFICULT_TO_SEE: 0,
        NOT_VISIBLE: 0,
        NA: 0,
        VERY_MUCH: 0,
        SOMEWHAT: 0,
        DID_NOT_HELP: 0,
        NA2: 0,
        COMMENTS: [],
        CLASSIFY: [],
        DATE_COLLECTED: (() => {
          const date = new Date();
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        })()
      };
      // Q-values
      for (let i = 0; i <= 9; i++) {
        empty[`${i}1`] = 0;
        empty[`${i}2`] = 0;
        empty[`${i}3`] = 0;
        empty[`${i}4`] = 0;
        empty[`${i}5`] = 0;
        empty[`${i}NA`] = 0;
      }
      setFormData(empty);
    }
  }, [report]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleNumericChange = (field: string, value: string) => {
    const n = parseInt(value) || 0;
    setFormData((prev: any) => ({ ...prev, [field]: n }));
  };

  // Logic to auto-calculate '5' ratings as a remainder
  useEffect(() => {
    if (!formData) return;
    
    setFormData((prev: any) => {
      const next = { ...prev };
      let changed = false;

      for (let i = 0; i <= 9; i++) {
        const total = prev.COLLECTED_FORMS || 0;
        const sumOthers = 
          (prev[`${i}1`] || 0) + 
          (prev[`${i}2`] || 0) + 
          (prev[`${i}3`] || 0) + 
          (prev[`${i}4`] || 0) + 
          (prev[`${i}NA`] || 0);
        
        const calculatedFive = Math.max(0, total - sumOthers);
        
        if (prev[`${i}5`] !== calculatedFive) {
          next[`${i}5`] = calculatedFive;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [formData?.COLLECTED_FORMS, 
      formData?.['01'], formData?.['02'], formData?.['03'], formData?.['04'], formData?.['0NA'],
      formData?.['11'], formData?.['12'], formData?.['13'], formData?.['14'], formData?.['1NA'],
      formData?.['21'], formData?.['22'], formData?.['23'], formData?.['24'], formData?.['2NA'],
      formData?.['31'], formData?.['32'], formData?.['33'], formData?.['34'], formData?.['3NA'],
      formData?.['41'], formData?.['42'], formData?.['43'], formData?.['44'], formData?.['4NA'],
      formData?.['51'], formData?.['52'], formData?.['53'], formData?.['54'], formData?.['5NA'],
      formData?.['61'], formData?.['62'], formData?.['63'], formData?.['64'], formData?.['6NA'],
      formData?.['71'], formData?.['72'], formData?.['73'], formData?.['74'], formData?.['7NA'],
      formData?.['81'], formData?.['82'], formData?.['83'], formData?.['84'], formData?.['8NA'],
      formData?.['91'], formData?.['92'], formData?.['93'], formData?.['94'], formData?.['9NA']
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = report ? `/api/physical-reports/${report.id}` : "/api/physical-reports";
      const method = report ? "PUT" : "POST";
      
      // Convert date back to MM/DD/YYYY for database storage
      const dataToSave = { ...formData };
      if (dataToSave.DATE_COLLECTED && dataToSave.DATE_COLLECTED.includes('-')) {
        const [y, m, d] = dataToSave.DATE_COLLECTED.split('-');
        dataToSave.DATE_COLLECTED = `${m}/${d}/${y}`;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave)
      });
      
      if (res.ok) {
        onSaveSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to save"}`);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!formData) return null;

  // Computed Values
  const qRates: Record<string, string> = {};
  for (let i = 0; i <= 9; i++) {
    const qv = {
      '1': formData[`${i}1`],
      '2': formData[`${i}2`],
      '3': formData[`${i}3`],
      '4': formData[`${i}4`],
      '5': formData[`${i}5`],
      NA: formData[`${i}NA`]
    };
    qRates[`Q${i}`] = calculateQuestionRate(qv, formData.COLLECTED_FORMS);
  }
  const { sysRate, staffRate, overrate } = calculateSatisfactionAverages(qRates);
  const collectionRate = calculateCollectionRate(formData.COLLECTED_FORMS, formData.VISITORS);

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex items-center gap-2 mb-6 bg-surface-low p-1.5 rounded-2xl border border-on-surface/5">
        <FormTab active={activeTab === "general"} onClick={() => setActiveTab("general")} icon={<Search className="w-4 h-4" />} label="General" />
        <FormTab active={activeTab === "demographics"} onClick={() => setActiveTab("demographics")} icon={<User className="w-4 h-4" />} label="Demographics" />
        <FormTab active={activeTab === "ratings"} onClick={() => setActiveTab("ratings")} icon={<FileText className="w-4 h-4" />} label="Ratings" />
        <FormTab active={activeTab === "comments"} onClick={() => setActiveTab("comments")} icon={<Plus className="w-4 h-4" />} label="Comments" />
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-reports">
        {activeTab === "general" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">Office Name</label>
                <Input value={formData.DEPARTMENT} onChange={(e) => handleChange("DEPARTMENT", e.target.value)} placeholder="e.g. CMO" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">Period</label>
                <Input value={formData.FOR_THE_MONTH_OF} onChange={(e) => handleChange("FOR_THE_MONTH_OF", e.target.value)} placeholder="e.g. April 2026" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">Collected Forms</label>
                <Input type="number" value={formData.COLLECTED_FORMS} onChange={(e) => handleNumericChange("COLLECTED_FORMS", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">Total Visitors</label>
                <Input type="number" value={formData.VISITORS} onChange={(e) => handleNumericChange("VISITORS", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">Date Collected</label>
                <Input type="date" value={formData.DATE_COLLECTED || ""} onChange={(e) => handleChange("DATE_COLLECTED", e.target.value)} />
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Initial Real-time Stats</h4>
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="OVERALL SATISFACTION" value={overrate} />
                <StatBox label="COLLECTION RATE" value={collectionRate} />
                <StatBox label="STAFF RATE" value={staffRate} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "demographics" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 flex items-center gap-2">
                <User className="w-3 h-3" /> Gender Identity Distribution
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <InputGroup label="Male" value={formData.MALE} onChange={(v) => handleNumericChange("MALE", v)} />
                <InputGroup label="Female" value={formData.FEMALE} onChange={(v) => handleNumericChange("FEMALE", v)} />
                <InputGroup label="LGBTQ+" value={formData.LGBTQ} onChange={(v) => handleNumericChange("LGBTQ", v)} />
                <InputGroup label="Others" value={formData.PREFER_NOT_TO_SAY} onChange={(v) => handleNumericChange("PREFER_NOT_TO_SAY", v)} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 flex items-center gap-2">
                <User className="w-3 h-3" /> Client Type Distribution
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <InputGroup label="Citizen" value={formData.CITIZEN} onChange={(v) => handleNumericChange("CITIZEN", v)} />
                <InputGroup label="Business" value={formData.BUSINESS} onChange={(v) => handleNumericChange("BUSINESS", v)} />
                <InputGroup label="Government" value={formData.GOVERNMENT} onChange={(v) => handleNumericChange("GOVERNMENT", v)} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 flex items-center gap-2">
                <BookOpen className="w-3 h-3" /> Citizen's Charter Awareness
              </h4>
              <div className="bg-surface-lowest p-5 rounded-2xl border border-on-surface/5 space-y-6">
                 <div className="grid grid-cols-3 gap-4">
                    <InputGroup label="CC1: Yes" value={formData.YES} onChange={(v) => handleNumericChange("YES", v)} />
                    <InputGroup label="CC1: Just Now" value={formData.JUST_NOW} onChange={(v) => handleNumericChange("JUST_NOW", v)} />
                    <InputGroup label="CC1: No" value={formData.NO} onChange={(v) => handleNumericChange("NO", v)} />
                 </div>
                 <hr className="border-on-surface/5" />
                 <div className="grid grid-cols-5 gap-3">
                    <InputGroup label="CC2: Visible" value={formData.VISIBLE} onChange={(v) => handleNumericChange("VISIBLE", v)} size="xs" />
                    <InputGroup label="CC2: Somewhat" value={formData.SOMEWHAT_VISIBLE} onChange={(v) => handleNumericChange("SOMEWHAT_VISIBLE", v)} size="xs" />
                    <InputGroup label="CC2: Difficult" value={formData.DIFFICULT_TO_SEE} onChange={(v) => handleNumericChange("DIFFICULT_TO_SEE", v)} size="xs" />
                    <InputGroup label="CC2: Not Visible" value={formData.NOT_VISIBLE} onChange={(v) => handleNumericChange("NOT_VISIBLE", v)} size="xs" />
                    <InputGroup label="CC2: N/A" value={formData.NA} onChange={(v) => handleNumericChange("NA", v)} size="xs" />
                 </div>
                 <hr className="border-on-surface/5" />
                 <div className="grid grid-cols-4 gap-4">
                    <InputGroup label="CC3: Very Much" value={formData.VERY_MUCH} onChange={(v) => handleNumericChange("VERY_MUCH", v)} />
                    <InputGroup label="CC3: Somewhat" value={formData.SOMEWHAT} onChange={(v) => handleNumericChange("SOMEWHAT", v)} />
                    <InputGroup label="CC3: Did Not Help" value={formData.DID_NOT_HELP} onChange={(v) => handleNumericChange("DID_NOT_HELP", v)} />
                    <InputGroup label="CC3: N/A" value={formData.NA2} onChange={(v) => handleNumericChange("NA2", v)} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ratings" && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="overflow-x-auto rounded-2xl border border-on-surface/5">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-low border-b border-on-surface/5">
                      <th className="px-4 py-3 font-black uppercase text-on-surface/40 w-1/2">Question</th>
                      <th className="px-2 py-3 font-black uppercase text-on-surface/40 text-center">NA</th>
                      <th className="px-2 py-3 font-black uppercase text-on-surface/40 text-center">1</th>
                      <th className="px-2 py-3 font-black uppercase text-on-surface/40 text-center">2</th>
                      <th className="px-2 py-3 font-black uppercase text-on-surface/40 text-center">3</th>
                      <th className="px-2 py-3 font-black uppercase text-on-surface/40 text-center">4</th>
                      <th className="px-2 py-3 font-black uppercase text-on-surface/40 text-center">5</th>
                      <th className="px-4 py-3 font-black uppercase text-primary text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-on-surface/5">
                    {FEEDBACK_STATEMENTS.map((stmt, i) => (
                      <tr key={i} className="hover:bg-on-surface/[0.01]">
                        <td className="px-4 py-3 font-bold text-on-surface/60">{stmt}</td>
                        <td className="px-1 py-1"><RatingInput value={formData[`${i}NA`]} onChange={(v) => handleNumericChange(`${i}NA`, v)} /></td>
                        <td className="px-1 py-1"><RatingInput value={formData[`${i}1`]} onChange={(v) => handleNumericChange(`${i}1`, v)} /></td>
                        <td className="px-1 py-1"><RatingInput value={formData[`${i}2`]} onChange={(v) => handleNumericChange(`${i}2`, v)} /></td>
                        <td className="px-1 py-1"><RatingInput value={formData[`${i}3`]} onChange={(v) => handleNumericChange(`${i}3`, v)} /></td>
                        <td className="px-1 py-1"><RatingInput value={formData[`${i}4`]} onChange={(v) => handleNumericChange(`${i}4`, v)} /></td>
                        <td className="px-1 py-1"><RatingInput value={formData[`${i}5`]} onChange={(v) => handleNumericChange(`${i}5`, v)} readOnly /></td>
                        <td className="px-4 py-3 text-right font-black text-primary italic">{qRates[`Q${i}`]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="bg-tertiary/5 border border-tertiary/10 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-tertiary">Bulk CSV Import (Comments)</h4>
                  <p className="text-[9px] text-tertiary/60 font-bold uppercase italic tracking-widest">Format: comment | classification (e.g. Good staff | Positive)</p>
                </div>
                <textarea 
                  className="w-full h-32 p-3 rounded-xl bg-white border border-tertiary/20 text-xs focus:outline-none focus:ring-1 focus:ring-tertiary/30 font-medium"
                  placeholder="Insert comment | positive&#10;Insert complaint | negative..."
                  onBlur={(e) => {
                    if (!e.target.value.trim()) return;
                    const lines = e.target.value.split('\n');
                    const newComments = [...formData.COMMENTS];
                    const newClassify = [...formData.CLASSIFY];
                    lines.forEach(line => {
                      if (!line.trim()) return;
                      const parts = line.split('|').map(s => s?.trim());
                      const comment = parts[0];
                      const classification = parts.length > 1 ? parts[1] : "Positive";
                      
                      if (comment) {
                        newComments.push(comment);
                        newClassify.push(classification);
                      }
                    });
                    setFormData({ ...formData, COMMENTS: newComments, CLASSIFY: newClassify });
                    e.target.value = "";
                  }}
                />
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Raw Comments List ({formData.COMMENTS.length})</h4>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const newComments = [...formData.COMMENTS, ""];
                    const newClassify = [...formData.CLASSIFY, "Positive"];
                    setFormData({ ...formData, COMMENTS: newComments, CLASSIFY: newClassify });
                  }} className="text-primary h-7 px-2 text-[10px] font-black uppercase tracking-widest border border-primary/10">
                    <Plus className="w-3 h-3 mr-1" /> Add Entry
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.COMMENTS.map((c: string, i: number) => (
                    <div key={i} className="flex gap-3 items-start animate-in slide-in-from-right-2 duration-300">
                      <div className="flex-1">
                        <textarea 
                          className="w-full text-xs p-2.5 rounded-xl border border-on-surface/5 bg-surface-low focus:outline-none focus:ring-1 focus:ring-primary/20 italic font-medium"
                          value={c}
                          onChange={(e) => {
                            const nc = [...formData.COMMENTS];
                            nc[i] = e.target.value;
                            handleChange("COMMENTS", nc);
                          }}
                          placeholder="Feedback comment content..."
                        />
                      </div>
                      <div className="w-32">
                        <select 
                          className="w-full text-[10px] p-2.5 rounded-xl border border-on-surface/5 bg-surface-low font-black uppercase tracking-tight focus:outline-none h-[42px]"
                          value={formData.CLASSIFY[i]}
                          onChange={(e) => {
                            const nc = [...formData.CLASSIFY];
                            nc[i] = e.target.value;
                            handleChange("CLASSIFY", nc);
                          }}
                        >
                          <option value="Positive">Commendation</option>
                          <option value="Negative">Complaint</option>
                          <option value="Suggestion">Suggestion</option>
                          <option value="Not Applicable">N/A</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          const nc = formData.COMMENTS.filter((_: any, idx: number) => idx !== i);
                          const ncl = formData.CLASSIFY.filter((_: any, idx: number) => idx !== i);
                          setFormData({ ...formData, COMMENTS: nc, CLASSIFY: ncl });
                        }}
                        className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.COMMENTS.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-on-surface/5 rounded-3xl">
                      <p className="text-xs font-bold text-on-surface/20 italic">No comments added yet.</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-on-surface/5 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10">
              <span className="text-[10px] font-black tracking-widest uppercase text-primary/50 mr-2">OVERALL:</span>
              <span className="text-sm font-black text-primary">{overrate}</span>
            </div>
         </div>
         <div className="flex gap-3">
           <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl px-6 font-bold">Cancel</Button>
           <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-8 flex items-center gap-2 shadow-lg shadow-primary/20">
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Save Changes
           </Button>
         </div>
      </div>
    </div>
  );
}

function FormTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-[10px] font-black uppercase tracking-widest transition-all duration-300",
        active 
          ? "bg-white text-primary shadow-sm" 
          : "text-on-surface/30 hover:text-on-surface/50 hover:bg-white/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white/50 p-2.5 rounded-xl border border-primary/5">
      <p className="text-[8px] font-black uppercase tracking-tighter text-on-surface/40 mb-0.5">{label}</p>
      <p className="text-sm font-black text-primary">{value}</p>
    </div>
  );
}

function InputGroup({ label, value, onChange, size = "md" }: { label: string, value: number, onChange: (v: string) => void, size?: "md" | "xs" }) {
  return (
    <div className="space-y-1">
      <label className={clsx("font-bold uppercase tracking-tight text-on-surface/30 block ml-0.5", size === "xs" ? "text-[8px]" : "text-[9px]")}>{label}</label>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-low border border-on-surface/5 rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:ring-1 focus:ring-primary/20 text-on-surface"
      />
    </div>
  );
}

function RatingInput({ value, onChange, readOnly = false }: { value: number, onChange: (v: string) => void, readOnly?: boolean }) {
  return (
    <input 
      type="number" 
      value={value} 
      onChange={(e) => !readOnly && onChange(e.target.value)}
      readOnly={readOnly}
      className={clsx(
        "w-full text-center font-bold text-xs focus:outline-none h-8 rounded-lg hover:bg-on-surface/5 focus:bg-white border border-transparent focus:border-on-surface/10 transition-all",
        readOnly ? "bg-on-surface/5 text-on-surface/40 cursor-not-allowed selection:bg-transparent" : "bg-transparent text-on-surface"
      )}
    />
  );
}
