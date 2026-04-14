"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { clsx } from "clsx";
import { User, Building2, Calendar, MessageSquare, Tag, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ResponsesTableProps {
  responses: any[];
  isLoading: boolean;
}

export function ResponsesTable({ responses, isLoading }: ResponsesTableProps) {
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
      <Card className="p-0 overflow-hidden border-on-surface/5 shadow-xl bg-white/80 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-surface-low border-b border-on-surface/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 w-16 text-center">No.</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Client Profile</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Office / Service</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Feedback Comment</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Comment Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-right">Date of Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface/5 text-xs">
              {paginatedData.map((res, idx) => {
                const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                return (
                  <tr key={res.id} className="hover:bg-on-surface/[0.015] transition-all group">
                    <td className="px-6 py-4 text-on-surface/30 font-bold text-center">
                      {globalIdx}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-display font-black text-on-surface text-[11px] uppercase tracking-tight">{res.name}</p>
                          <p className="text-[9px] font-black text-on-surface/40 tracking-wider uppercase italic">{res.clientType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-on-surface/70 font-bold text-[10px]">
                          <Building2 className="w-3 h-3 text-on-surface/30" />
                          <span>{res.office}</span>
                        </div>
                        <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-tighter truncate max-w-[120px]">
                          {res.serviceAvailed}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-sm">
                      <div className="flex gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-primary/30 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] leading-relaxed text-on-surface/70 italic line-clamp-2">
                          {res.comment || <span className="text-on-surface/20 italic">No comment provided</span>}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border",
                        res.classification === "Positive" ? "bg-green-50 text-green-600 border-green-100" :
                        res.classification === "Negative" ? "bg-red-50 text-red-600 border-red-100" :
                        res.classification === "Suggestion" ? "bg-amber-50 text-amber-600 border-amber-100" :
                        res.classification === "Not Applicable" ? "bg-slate-50 text-slate-600 border-slate-100" :
                        "bg-on-surface/5 text-on-surface/30 border-on-surface/5"
                      )}>
                        {res.classification || "Unclassified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] font-black text-on-surface/40 uppercase tracking-tighter">
                        <Calendar className="w-3 h-3" />
                        {res.date}
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
                className="bg-white border border-on-surface/5 rounded-xl py-1 px-2 text-[10px] font-black text-on-surface/60 outline-none"
              >
                {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-on-surface/5 bg-white text-on-surface/40 disabled:opacity-30 hover:bg-surface-low transition-colors"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-on-surface/5 bg-white text-on-surface/40 disabled:opacity-30 hover:bg-surface-low transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <div className="px-4 py-1.5 rounded-xl bg-primary/5 border border-primary/10 mx-1">
                <span className="text-[10px] font-black text-primary uppercase">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-on-surface/5 bg-white text-on-surface/40 disabled:opacity-30 hover:bg-surface-low transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-on-surface/5 bg-white text-on-surface/40 disabled:opacity-30 hover:bg-surface-low transition-colors"
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
