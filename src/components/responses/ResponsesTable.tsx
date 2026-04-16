"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";
import { User, Building2, Calendar, MessageSquare, Tag, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ResponsesTableProps {
  responses: any[];
  isLoading: boolean;
  isGlobalView?: boolean;
}

import { useAuth } from "@/context/AuthContext";

export function ResponsesTable({ responses, isLoading, isGlobalView }: ResponsesTableProps) {
  const { user } = useAuth();
  const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
  const showCategory = !isGlobalView || isSuperadmin;

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(responses.length / rowsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return responses.slice(start, start + rowsPerPage);
  }, [responses, currentPage, rowsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(rowsPerPage)].map((_, i) => (
          <div key={i} className="h-16 bg-on-surface/5 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden border-border-strong/50 shadow-xl bg-surface-low">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-background/50 border-b-2 border-border-strong text-on-surface/30">
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest w-12 text-center">No.</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Client Name</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Office</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Service</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Feedback Comment</th>
                {showCategory && <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Category</th>}
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right">Visit Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-strong/20 text-[11px]">
              {paginatedData.map((res, idx) => {
                const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                
                // Format date: MM/DD/YYYY to MMMM dd, YYYY
                let formattedDate = res.date;
                try {
                    const dateObj = new Date(res.date);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleDateString('en-US', {
                            month: 'long',
                            day: '2-digit',
                            year: 'numeric'
                        });
                    }
                } catch (e) {
                   // Fallback to raw date if parse fails
                }

                return (
                  <tr key={res.id} className="hover:bg-on-surface/[0.015] transition-all group">
                    <td className="px-4 py-3 text-on-surface/30 font-bold text-center">
                      {globalIdx}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-display font-black text-on-surface uppercase tracking-tight">{res.name}</p>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-on-surface/70 font-bold">
                          <Building2 className="w-3 h-3 text-on-surface/20" />
                          <span>{res.office}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-tighter truncate max-w-[150px]">
                          {res.serviceAvailed}
                        </p>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="flex gap-2">
                        <MessageSquare className="w-3 h-3 text-primary/20 mt-0.5 flex-shrink-0" />
                        <p className="leading-relaxed text-on-surface/60 italic line-clamp-1 group-hover:line-clamp-none transition-all">
                          {res.comment || <span className="text-on-surface/10 italic">None</span>}
                        </p>
                      </div>
                    </td>
                    {showCategory && (
                      <td className="px-4 py-3">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-md font-black text-[8px] uppercase tracking-widest border transition-colors",
                          res.classification === "Positive" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" :
                          res.classification === "Negative" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" :
                          res.classification === "Suggestion" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                          res.classification === "Not Applicable" ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" :
                          "bg-on-surface/5 text-on-surface/30 border-on-surface/5"
                        )}>
                          {res.classification || "Unclassified"}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold text-on-surface/30 uppercase tracking-tighter whitespace-nowrap">
                        {formattedDate}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {responses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <p className="text-on-surface/20 font-display font-black text-lg uppercase italic tracking-tighter">No feedback records found for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Controls */}
      {responses.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">
            Showing <span className="text-on-surface/60">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-on-surface/60">{Math.min(currentPage * rowsPerPage, responses.length)}</span> of <span className="text-on-surface/60">{responses.length}</span> results
          </p>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
              <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mr-2">Rows:</span>
                <select 
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-surface border border-border-strong/50 rounded-xl py-1 px-2 text-[10px] font-black text-on-surface/60 outline-none"
                >
                  {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-border-strong/50 bg-surface text-on-surface/40 disabled:opacity-30 hover:bg-surface-lowest transition-colors"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-border-strong/50 bg-surface text-on-surface/40 disabled:opacity-30 hover:bg-surface-lowest transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <div className="px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 mx-1">
                <span className="text-[10px] font-black text-primary uppercase">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-border-strong/50 bg-surface text-on-surface/40 disabled:opacity-30 hover:bg-surface-lowest transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-border-strong/50 bg-surface text-on-surface/40 disabled:opacity-30 hover:bg-surface-lowest transition-colors"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
