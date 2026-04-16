"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { useAnalytics } from "@/context/AnalyticsContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { 
  User, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  Printer, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "@/components/ui/Modal";

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

export function DataView() {
  const { user } = useAuth();
  const { data, isLoading, month, year, search } = useAnalytics();
  
  // Fetch context-aware office list to respect archival inclusion rules
  const { data: rawOfficeList } = useSWR(`/api/offices?month=${month}&year=${year}`, (url) => fetch(url).then(r => r.json()));
  const [selectedOffice, setSelectedOffice] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const displayData = useMemo(() => {
    if (!data) return [];
    
    // Filter by User's assigned offices if not Superadmin
    const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
    const userOffices = user?.offices || [];
    
    let filtered: any[] = data;
    
    // Server now handles 'disabled' office filtering based on period context
    // We only need to apply local search and user assignment filters
    if (!isSuperadmin) {
      filtered = filtered.filter((o: any) => userOffices.includes(o.department));
    }

    if (!search) return filtered;
    const s = search.toLowerCase();
    return filtered.filter((o: any) => o.department.toLowerCase().includes(s));
  }, [data, search, user]);

  // Reset pagination on filter change
  useMemo(() => {
    setCurrentPage(1);
  }, [month, year, search]);

  const totalPages = Math.ceil(displayData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayData.slice(start, start + ITEMS_PER_PAGE);
  }, [displayData, currentPage]);

  if (isLoading && !data) {
    return (
      <Card className="p-0 overflow-hidden border border-border-strong/50 shadow-xl bg-surface-low animate-pulse mb-10">
        <div className="h-14 bg-surface-low border-b border-on-surface/5 w-full" />
        <div className="divide-y divide-on-surface/5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-4 bg-on-surface/5 rounded" />
                 <div className="w-64 h-5 bg-on-surface/5 rounded" />
              </div>
              <div className="flex gap-4">
                 <div className="w-20 h-5 bg-on-surface/5 rounded" />
                 <div className="w-32 h-8 bg-on-surface/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden border border-border-strong/50 shadow-xl bg-surface-low">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-background/80 backdrop-blur-md border-b-2 border-border-strong">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 w-12 text-center">#</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Office Name</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Period</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Responses</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Collection Rate</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-center">Satisfaction</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-strong/20">
              {paginatedData.map((office: any, idx: number) => (
                <tr key={office.department} className="hover:bg-on-surface/[0.015] transition-all group">
                  <td className="px-6 py-3.5 text-xs font-bold text-on-surface/30 text-center">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-display font-black text-primary text-sm group-hover:translate-x-0.5 transition-transform inline-block">
                      {office.department}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-black text-on-surface/40 uppercase">
                      {month} {year}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-black text-on-surface">{office.collection}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-[10px] font-black text-on-surface/60">{office.collectionRate}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={clsx(
                      "text-xs font-black px-2 py-1 rounded-lg",
                      office.overrate === "N/A" ? "text-on-surface/20 bg-surface-lowest" : "text-tertiary bg-tertiary/5"
                    )}>
                      {office.overrate}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedOffice(office)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-tighter"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </button>
                      <button 
                        onClick={() => {
                          const url = `/api/reports/individual?office=${encodeURIComponent(office.department)}&month=${encodeURIComponent(month)}&year=${year}`;
                          window.open(url, '_blank');
                        }}
                        className="p-1.5 rounded-lg border border-on-surface/5 hover:bg-on-surface/5 transition-all text-on-surface/30 hover:text-on-surface"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-low border-t border-on-surface/5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
              Showing Page <span className="text-primary">{currentPage}</span> of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-surface-lowest disabled:opacity-20 transition-all text-primary border border-transparent hover:border-border-strong/50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-surface-lowest disabled:opacity-20 transition-all text-primary border border-transparent hover:border-border-strong/50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedOffice} 
        onClose={() => setSelectedOffice(null)} 
        title={`${selectedOffice?.department} Detailed Report`}
      >
        {selectedOffice && <OfficeReportDetail office={selectedOffice} />}
      </Modal>
    </div>
  );
}

function OfficeReportDetail({ office }: { office: any }) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <DetailCard title="Demographics" icon={<User className="w-4 h-4" />} color="primary">
            <div className="grid grid-cols-2 gap-y-5">
              <DataLabel label="Male" value={office.gender.Male} />
              <DataLabel label="Female" value={office.gender.Female} />
              <DataLabel label="LGBTQ+" value={office.gender.LGBTQ} />
              <DataLabel label="Others" value={office.gender.Others} />
              <div className="col-span-2 pt-5 border-t border-primary/10 grid grid-cols-2 gap-y-5">
                <DataLabel label="Citizen" value={office.clientType.Citizen} />
                <DataLabel label="Business" value={office.clientType.Business} />
                <DataLabel label="Government" value={office.clientType.Government} />
              </div>
              <div className="col-span-2 pt-5 border-t border-primary/10">
                <DataLabel label="Collection Rate" value={office.collectionRate} />
              </div>
            </div>
          </DetailCard>

          <DetailCard title="Citizen's Charter" icon={<BookOpen className="w-4 h-4" />} color="tertiary">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-3 ml-1">Awareness</p>
                <div className="grid grid-cols-3 gap-2">
                  <Badge label="Yes" value={office.awareCount} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-2xl border border-border-strong/50">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-1 ml-1">Visibility</p>
                  <p className="text-xl font-black text-on-surface">{office.visibleCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 mb-1 ml-1">Relevance</p>
                  <p className="text-xl font-black text-on-surface">{office.helpfulCount}</p>
                </div>
              </div>
            </div>
          </DetailCard>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-surface-low rounded-3xl border border-border-strong/50 overflow-hidden shadow-sm">
             <div className="p-6 md:p-8 border-b border-border-strong/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 font-display">
                  <FileText className="w-4 h-4" /> Multi-Point Satisfaction Analysis
                </h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left font-sans border-collapse">
                  <thead>
                    <tr className="bg-background/80 border-b-2 border-border-strong">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-on-surface/50 w-1/3">Criteria</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-center text-on-surface/40">0</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-center text-on-surface/40">1</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-center text-on-surface/40">2</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-center text-on-surface/40">3</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-center text-on-surface/40">4</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-center text-on-surface/40">5</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-right text-primary">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-strong/20">
                    {FEEDBACK_STATEMENTS.map((stmt, i) => {
                      const qKey = `Q${i}`;
                      const qv = office.qValues[qKey] || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, NA: 0, RATE: 'N/A' };
                      return (
                        <tr key={i} className="hover:bg-on-surface/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-on-surface/70 leading-relaxed group-hover:text-primary transition-colors">{stmt}</p>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-on-surface/40 text-center">{qv.NA}</td>
                          <td className="px-4 py-4 text-xs font-medium text-on-surface/40 text-center">{qv['1']}</td>
                          <td className="px-4 py-4 text-xs font-medium text-on-surface/40 text-center">{qv['2']}</td>
                          <td className="px-4 py-4 text-xs font-medium text-on-surface/40 text-center">{qv['3']}</td>
                          <td className="px-4 py-4 text-xs font-medium text-on-surface/40 text-center">{qv['4']}</td>
                          <td className="px-4 py-4 text-xs font-medium text-on-surface/40 text-center">{qv['5']}</td>
                          <td className="px-6 py-4 text-sm font-black text-primary text-right italic">{qv.RATE}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
          <FeedbackList title="Commendations" data={office.comments.positive} color="text-tertiary" bg="bg-tertiary/5" dot="bg-tertiary" />
          <FeedbackList title="Complaints" data={office.comments.negative} color="text-red-500" bg="bg-red-50/50" dot="bg-red-500" />
          <FeedbackList title="Suggestions" data={office.comments.suggestions} color="text-primary" bg="bg-primary/5" dot="bg-primary" />
      </div>
    </div>
  );
}

function DetailCard({ title, icon, color, children }: { title: string, icon: any, color: "primary" | "tertiary", children: React.ReactNode }) {
  return (
    <div className={clsx(
      "p-6 rounded-3xl border shadow-sm relative overflow-hidden group",
      color === "primary" ? "bg-primary/5 border-primary/10" : "bg-tertiary/5 border-tertiary/10"
    )}>
      <h3 className={clsx(
        "text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2",
        color === "primary" ? "text-primary" : "text-tertiary"
      )}>
        {icon}
        {title}
      </h3>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function DataLabel({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-tight text-on-surface/30 mb-0.5">{label}</p>
      <p className="text-lg font-black text-on-surface">{value || 0}</p>
    </div>
  );
}

function Badge({ label, value }: { label: string, value: any }) {
  return (
    <div className="px-3 py-2 rounded-xl flex flex-col items-center justify-center bg-background/50 shadow-sm border border-border-strong/50 text-center">
      <span className="text-[8px] font-black uppercase text-on-surface/40 mb-0.5">{label}</span>
      <span className="text-sm font-black text-primary">{value}</span>
    </div>
  );
}

function FeedbackList({ title, data, color, bg, dot }: { title: string, data: string[], color: string, bg: string, dot: string }) {
  return (
    <Card className={clsx(bg, "border border-border-strong/50 p-6 shadow-xl")}>
      <h3 className={clsx("text-[10px] font-black uppercase tracking-widest mb-6", color)}>{title}</h3>
      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar-reports text-xs">
        {data.length > 0 ? (
          data.map((c, i) => (
            <div key={i} className="flex gap-3 group">
              <div className={clsx("w-1 h-1 rounded-full mt-1.5 flex-shrink-0", dot)} />
              <p className="font-semibold text-on-surface/60 leading-relaxed italic">"{c}"</p>
            </div>
          ))
        ) : (
          <p className="font-bold text-on-surface/25 italic">No feedback entries.</p>
        )}
      </div>
    </Card>
  );
}
