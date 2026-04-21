"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  RefreshCw, 
  AlertCircle, 
  Edit2, 
  ChevronDown, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Search,
  CheckCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";
import { AnalysisDashboard } from "@/components/comments/AnalysisDashboard";

type Status = "Pending" | "Ongoing" | "Resolved";
type Sentiment = "Positive" | "Negative" | "Suggestion";

interface Comment {
  id: string;
  commentText: string;
  sentiment: Sentiment;
  office: string;
  month: string;
  date: string;
  actionPlan: string;
  expectedOutcome: string;
  status: Status;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CommentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"action" | "positive" | "analysis">("action");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filters
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const baselineYear = 2025;

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIdx]);
  const [searchQuery, setSearchQuery] = useState("");
  const [officeFilter, setOfficeFilter] = useState("All Offices");

  const availableYears = useMemo(() => {
    return Array.from(
      { length: currentYear - baselineYear + 1 }, 
      (_, i) => (baselineYear + i).toString()
    );
  }, [currentYear]);

  const availableMonths = useMemo(() => {
    const sYear = parseInt(selectedYear);
    if (sYear === currentYear) {
      return MONTHS.slice(0, currentMonthIdx + 1);
    }
    return MONTHS;
  }, [selectedYear, currentYear, currentMonthIdx]);

  // Adjust month if invalid for year
  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  // Auth check
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user) {
      const isSuperadmin = user.user_type?.toLowerCase() === "superadmin";
      const isAnalytics = !!user.is_analytics_enabled;
      if (!isSuperadmin && !isAnalytics) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  const fetchComments = async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear
      });
      const res = await fetch(`/api/comments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && activeTab !== "analysis") fetchComments();
  }, [user, selectedMonth, selectedYear, activeTab]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/comments", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      showToast(`Database synchronized! Processed ${data.synced} records.`, "success");
      fetchComments();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Comment>) => {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Update failed");
      
      setComments(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      setSelectedComment(null);
      showToast("Management plan updated", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // 1. First, distinguish comments based on the ACTIVE tab
  const tabFilteredComments = useMemo(() => {
    if (activeTab === "analysis") return [];
    return comments.filter(c => 
      activeTab === "positive" 
        ? (c.sentiment === "Positive") 
        : (c.sentiment === "Negative" || c.sentiment === "Suggestion")
    );
  }, [comments, activeTab]);

  // 2. Derive offices ONLY from the tab-filtered list (SUPER DYNAMIC)
  const offices = useMemo(() => {
    const list = Array.from(new Set(tabFilteredComments.map(c => c.office || "Unknown")));
    return ["All Offices", ...list].sort();
  }, [tabFilteredComments]);

  // 3. Reset office filter if it's no longer in the valid list for this tab
  useEffect(() => {
    if (officeFilter !== "All Offices" && !offices.includes(officeFilter)) {
      setOfficeFilter("All Offices");
    }
  }, [offices, officeFilter]);

  // 4. Final filter for search and office selection
  const filteredComments = useMemo(() => {
    const filtered = tabFilteredComments.filter(c => {
      const matchesSearch = (c.commentText || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (c.office || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOffice = officeFilter === "All Offices" || (c.office || "Unknown") === officeFilter;
      
      return matchesSearch && matchesOffice;
    });
    setCurrentPage(1);
    return filtered;
  }, [tabFilteredComments, searchQuery, officeFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredComments.length / rowsPerPage);
  const paginatedComments = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredComments.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredComments, currentPage, rowsPerPage]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl animate-bounce" />
          <div className="h-4 w-32 bg-on-surface/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 pb-20 mt-1">
        
        {/* Compact Unified Control Bar */}
        <div className="bg-surface-low border border-border-strong/50 rounded-2xl p-3 shadow-xl shadow-on-surface/5">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Tabs Group */}
            <div className="flex items-center gap-1.5 bg-surface-lowest p-1.5 rounded-2xl border border-on-surface/5">
              <TabButtonCompact 
                active={activeTab === "action"} 
                onClick={() => { setActiveTab("action"); setOfficeFilter("All Offices"); }}
                label="Action Required" 
                count={comments.filter(c => c.sentiment !== "Positive").length}
                color="red"
              />
              <TabButtonCompact 
                active={activeTab === "positive"} 
                onClick={() => { setActiveTab("positive"); setOfficeFilter("All Offices"); }}
                label="Positive" 
                count={comments.filter(c => c.sentiment === "Positive").length}
                color="green"
              />
              {user?.user_type?.toLowerCase() === "superadmin" && (
                <TabButtonCompact 
                  active={activeTab === "analysis"} 
                  onClick={() => setActiveTab("analysis")}
                  label="Analysis" 
                  count={0}
                  color="blue"
                  icon={<AlertCircle className="w-3.5 h-3.5" />}
                />
              )}
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-8 bg-on-surface/10" />

            {/* Filters Group (Dynamic based on Tab) */}
            <div className="flex items-center gap-3">
               {activeTab !== "analysis" && (
                 <FilterSelectCompact label="Office" value={officeFilter} options={offices} onChange={setOfficeFilter} />
               )}
               
               <div className="flex items-center gap-2 bg-on-surface/5 px-2 py-1 rounded-2xl border border-on-surface/5">
                {activeTab !== "analysis" && (
                  <>
                    <select
                      className="bg-transparent py-1.5 px-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="w-px h-3 bg-on-surface/10" />
                  </>
                )}
                <select
                  className="bg-transparent py-1.5 px-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
               </div>
            </div>

            {/* Search Input */}
            {activeTab !== "analysis" && (
              <div className="flex-1 min-w-[200px] relative group px-2">
                <Search className="w-3.5 h-3.5 absolute left-6 top-1/2 -translate-y-1/2 text-on-surface/20 group-focus-within:text-primary transition-colors" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Quick find comments..." className="w-full bg-on-surface/5 border border-transparent focus:border-primary/20 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all placeholder:text-on-surface/20" />
              </div>
            )}

            {/* Sync Button */}
            {user?.user_type?.toLowerCase() === "superadmin" && (
              <button 
                onClick={handleSync} 
                disabled={isSyncing} 
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm border border-primary/10"
              >
                 {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                 Sync
              </button>
            )}

          </div>
        </div>

        {activeTab === "analysis" && user?.user_type?.toLowerCase() === "superadmin" ? (
          <AnalysisDashboard year={selectedYear} />
        ) : (
          <Card className="p-0 overflow-hidden border border-border-strong/50 shadow-xl bg-surface-low">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans border-collapse">
              <thead>
                <tr className="bg-background/80 backdrop-blur-md border-b-2 border-border-strong">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 w-16 text-center">#</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Comment (Feedback)</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Submitted At</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Sentiment</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Period</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Office</th>
                  {activeTab === "action" && (
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Status</th>
                  )}
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-strong/20">
                {isFetching ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-4 bg-on-surface/5 rounded w-8 mx-auto" /></td>
                      <td className="px-5 py-5"><div className="h-4 bg-on-surface/5 rounded w-full" /></td>
                      <td className="px-5 py-5"><div className="h-4 bg-on-surface/5 rounded w-20 mx-auto" /></td>
                      <td className="px-5 py-5"><div className="h-4 bg-on-surface/5 rounded w-16 mx-auto" /></td>
                      <td className="px-5 py-5"><div className="h-4 bg-on-surface/5 rounded w-20 mx-auto" /></td>
                      <td className="px-5 py-5"><div className="h-4 bg-on-surface/5 rounded w-24 mx-auto" /></td>
                      {activeTab === "action" && <td className="px-5 py-5"><div className="h-4 bg-on-surface/5 rounded w-16 mx-auto" /></td>}
                      <td className="px-6 py-5 ml-auto"><div className="h-4 bg-on-surface/5 rounded w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedComments.length === 0 ? (
                  <tr><td colSpan={8} className="p-20 text-center"><div className="flex flex-col items-center gap-4 opacity-10"><AlertCircle className="w-12 h-12" /><p className="text-sm font-bold uppercase tracking-widest">No entries found for {selectedMonth} {selectedYear}</p></div></td></tr>
                ) : (
                  paginatedComments.map((comment, idx) => (
                    <tr key={comment.id} className="hover:bg-on-surface/[0.015] transition-all group">
                      <td className="px-6 py-3.5 text-xs font-bold text-on-surface/30 text-center">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-on-surface/80 group-hover:translate-x-0.5 transition-transform italic leading-relaxed max-w-[600px]">
                          "{comment.commentText}"
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[10px] font-bold text-on-surface/50 whitespace-nowrap">
                          {comment.date ? new Date(comment.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <SentimentBadge sentiment={comment.sentiment} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[10px] font-black text-on-surface/40 uppercase">
                          {comment.month || "Unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-display font-black text-primary text-sm">
                          {comment.office}
                        </span>
                      </td>
                      {activeTab === "action" && (
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge status={comment.status} />
                        </td>
                      )}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end group-hover:opacity-100 opacity-80 transition-opacity">
                          <button 
                            onClick={() => setSelectedComment(comment)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-tighter"
                          >
                            <Edit2 className="w-3 h-3" />
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-surface-low border-t border-on-surface/5 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                Audit Range <span className="text-primary">{Math.min(filteredComments.length, (currentPage - 1) * rowsPerPage + 1)}-{Math.min(filteredComments.length, currentPage * rowsPerPage)}</span> of {filteredComments.length}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-surface-lowest shadow-sm disabled:opacity-20 transition-all text-primary border border-on-surface/5 hover:border-primary/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-surface-lowest shadow-sm disabled:opacity-20 transition-all text-primary border border-on-surface/5 hover:border-primary/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {selectedComment && (
        <EditModal 
          comment={selectedComment} 
          isOpen={!!selectedComment} 
          onClose={() => setSelectedComment(null)} 
          onSave={handleUpdate}
        />
      )}
    </Shell>
  );
}

function TabButtonCompact({ active, onClick, label, count, color, icon }: { active: boolean; onClick: () => void; label: string; count: number; color: "red" | "green" | "blue"; icon?: React.ReactNode }) {
  const colorStyles = {
    red: active ? "bg-red-500/10 text-red-600" : "bg-on-surface/5 text-on-surface/30",
    green: active ? "bg-emerald-500/10 text-emerald-600" : "bg-on-surface/5 text-on-surface/30",
    blue: active ? "bg-blue-500/10 text-blue-600" : "bg-on-surface/5 text-on-surface/30"
  };
  
  return (
    <button onClick={onClick} className={clsx(
      "flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-bold transition-all duration-300",
      active 
        ? "bg-white text-primary shadow-md translate-y-[-1px]" 
        : "text-on-surface/40 hover:text-on-surface/60 hover:bg-white/50"
    )}>
      {icon}
      {label}
      {count > 0 && <span className={clsx("px-2 py-0.5 rounded-md text-[8px] font-black", colorStyles[color])}>{count}</span>}
    </button>
  );
}

function FilterSelectCompact({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative group">
       <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-on-surface/5 border border-transparent hover:border-on-surface/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer pr-10 transition-all focus:ring-4 focus:ring-primary/5 min-w-[120px] text-center">
         <option disabled>{label}</option>
         {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
       </select>
       <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/20 pointer-events-none group-hover:text-on-surface/40 transition-colors" />
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const styles = { Positive: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", Negative: "bg-red-500/10 text-red-600 border-red-500/20", Suggestion: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  return <span className={clsx("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", styles[sentiment] || "bg-on-surface/10 text-on-surface/40 border-on-surface/20")}>{sentiment}</span>;
}

function StatusBadge({ status }: { status: Status }) {
  const styles = { 
    Pending: "bg-slate-500/5 text-slate-400 font-bold", 
    Ongoing: "bg-primary/5 text-primary", 
    Resolved: "bg-emerald-500/5 text-emerald-600 font-bold" 
  };
  
  // Use a fallback icon if status is not matched
  const IconMap: any = { Pending: Clock, Ongoing: RefreshCw, Resolved: CheckCircle };
  const Icon = IconMap[status] || AlertCircle;
  const currentStyle = styles[status] || "bg-on-surface/5 text-on-surface/30";
  
  return (
    <span className={clsx("flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mx-auto justify-center", currentStyle)}>
      <Icon className={clsx("w-3 h-3", status === "Ongoing" && "animate-spin")} />
      {status || "Unknown"}
    </span>
  );
}

function EditModal({ comment, isOpen, onClose, onSave }: { comment: Comment, isOpen: boolean, onClose: () => void, onSave: (id: string, updates: Partial<Comment>) => void }) {
  const [localValues, setLocalValues] = useState<Partial<Comment>>(comment);
  const isActionNeeded = comment.sentiment !== "Positive";
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isActionNeeded ? "Management Assignment" : "Feedback Analysis"}>
      <div className="space-y-8 p-2">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-on-surface/5 p-6 rounded-[2rem] border border-on-surface/5">
            <div className="space-y-1"><h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Office</h4><p className="text-sm font-black text-primary truncate">{comment.office}</p></div>
            <div className="space-y-1"><h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Period</h4><p className="text-sm font-bold text-on-surface/60">{comment.month || "Unknown"}</p></div>
            <div className="space-y-1"><h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Submitted</h4><p className="text-sm font-bold text-on-surface/60">{comment.date ? new Date(comment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}</p></div>
            <div className="space-y-1 text-right"><h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Class</h4><SentimentBadge sentiment={comment.sentiment} /></div>
         </div>
         <div className="space-y-3">
            <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] ml-2">Raw Sentiment</label>
            <div className="p-8 bg-on-surface/[0.02] border border-on-surface/5 rounded-[2.5rem] italic text-xl font-medium text-on-surface/80 leading-relaxed shadow-inner">"{comment.commentText}"</div>
         </div>
         {isActionNeeded && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3"><label className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] ml-4">Action Taken</label><textarea value={localValues.actionPlan} onChange={(e) => setLocalValues({ ...localValues, actionPlan: e.target.value })} className="w-full bg-white border border-on-surface/10 rounded-3xl p-6 text-sm font-semibold min-h-[150px] outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-sm" placeholder="Details of action taken..." /></div>
              <div className="space-y-3"><label className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] ml-4">Outcome</label><textarea value={localValues.expectedOutcome} onChange={(e) => setLocalValues({ ...localValues, expectedOutcome: e.target.value })} className="w-full bg-white border border-on-surface/10 rounded-3xl p-6 text-sm font-semibold min-h-[150px] outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-sm" placeholder="Expected result..." /></div>
           </div>
         )}
         {isActionNeeded && (
           <div className="flex items-center justify-between p-6 bg-on-surface/5 rounded-3xl border border-on-surface/5">
              <label className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Status</label>
              <div className="flex gap-2">{(["Pending", "Ongoing", "Resolved"] as Status[]).map((st) => (<button key={st} onClick={() => setLocalValues({ ...localValues, status: st })} className={clsx("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", localValues.status === st ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-on-surface/30 hover:bg-gray-200")}>{st}</button>))}</div>
           </div>
         )}
         <div className="flex justify-end gap-3 pt-6 border-t border-on-surface/5">
            <button onClick={onClose} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface/40 hover:text-on-surface/60 transition-colors">Close</button>
            {isActionNeeded ? ( <Button onClick={() => onSave(comment.id, localValues)} className="px-12 shadow-xl shadow-primary/30">Commit Changes</Button>) : (<Button onClick={onClose} className="px-12">Return</Button>)}
         </div>
      </div>
    </Modal>
  );
}
