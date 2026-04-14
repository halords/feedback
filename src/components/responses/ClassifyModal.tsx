"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle, CheckCircle2, RefreshCw, ChevronRight, Tag } from "lucide-react";
import { clsx } from "clsx";

interface ClassifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  responses: any[];
  selectedMonth: string;
  selectedYear: string;
  onSuccess: () => void;
}

export function ClassifyModal({ 
  isOpen, 
  onClose, 
  responses, 
  selectedMonth, 
  selectedYear, 
  onSuccess 
}: ClassifyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const unclassifiedItems = useMemo(() => {
    if (!responses || !Array.isArray(responses)) return [];
    return responses.filter((res: any) => {
      const cls = (res.classification || "").toLowerCase().trim();
      const isUnclassified = !cls || cls === "unclassified";
      const hasComment = res.comment && res.comment.trim().length > 2;
      return isUnclassified && hasComment;
    });
  }, [responses]);

  // Clear selections when modal opens or items change
  React.useEffect(() => {
    if (isOpen) {
      setSelections({});
      setError(null);
    }
  }, [isOpen, unclassifiedItems.length]);

  const handleClassificationChange = (docId: string, value: string) => {
    setSelections(prev => ({ ...prev, [docId]: value }));
  };

  const setAllAs = (type: string) => {
    const newSelections: Record<string, string> = {};
    unclassifiedItems.forEach(item => {
      newSelections[item.id] = type;
    });
    setSelections(newSelections);
  };

  const handleSubmit = async () => {
    const updates = Object.entries(selections)
      .filter(([_, classification]) => classification !== "")
      .map(([docId, classification]) => ({ docId, classification }));

    if (updates.length === 0) {
      setError("Please classify at least one comment before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/responses/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: updates })
      });

      if (!response.ok) throw new Error("Failed to update classifications");
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Classify Feedback: ${selectedMonth} ${selectedYear}`}
    >
      <div className="space-y-6 py-4 px-2">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-tight">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Bulk Actions */}
        {unclassifiedItems.length > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface-low rounded-2xl border border-on-surface/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Quick Actions</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAllAs("Positive")}
                className="px-4 py-2 rounded-xl bg-green-500/10 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-500/20 hover:bg-green-500 hover:text-white transition-all"
              >
                Mark All Positive
              </button>
              <button 
                onClick={() => setAllAs("Negative")}
                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
              >
                Mark All Negative
              </button>
              <button 
                onClick={() => setAllAs("Not Applicable")}
                className="px-4 py-2 rounded-xl bg-slate-500/10 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-500/20 hover:bg-slate-500 hover:text-white transition-all"
              >
                Mark All N/A
              </button>
            </div>
          </div>
        )}

        <div className="max-h-[450px] overflow-y-auto border border-on-surface/5 rounded-3xl custom-scrollbar-reports bg-white/50">
          {unclassifiedItems.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-on-surface/5">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Office / Feedback</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 w-48 text-right">Target Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface/5 text-xs font-sans">
                {unclassifiedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-on-surface/[0.01] transition-all group">
                    <td className="px-5 py-5">
                       <div className="space-y-1">
                          <span className="text-[9px] font-black text-primary uppercase tracking-tighter block">{item.office}</span>
                          <p className="text-[11px] font-medium leading-relaxed italic text-on-surface/70 line-clamp-3 group-hover:line-clamp-none transition-all pr-4 italic">"{item.comment}"</p>
                       </div>
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <select
                        className={clsx(
                          "bg-white border rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer outline-none min-w-[140px] shadow-sm",
                          selections[item.id] === "Positive" ? "border-green-500 text-green-600 bg-green-50/50" :
                          selections[item.id] === "Negative" ? "border-red-500 text-red-600 bg-red-50/50" :
                          selections[item.id] === "Suggestion" ? "border-amber-500 text-amber-600 bg-amber-50/50" :
                          selections[item.id] === "Not Applicable" ? "border-slate-500 text-slate-600 bg-slate-50/50" :
                          "border-on-surface/10 text-on-surface/40"
                        )}
                        value={selections[item.id] || ""}
                        onChange={(e) => handleClassificationChange(item.id, e.target.value)}
                      >
                        <option value="">Pending Selection</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                        <option value="Suggestion">Suggestion</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto border border-primary/10">
                <CheckCircle2 className="w-8 h-8 text-primary/30" />
              </div>
              <div>
                <p className="text-sm font-black text-on-surface uppercase tracking-tight italic">All Clear!</p>
                <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mt-1">No unclassified comments for this period.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-on-surface/5">
          <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest italic ml-2">
            {unclassifiedItems.length} records pending
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface/40 hover:text-on-surface/60 transition-colors"
            >
              Close
            </button>
            <button
              disabled={isSubmitting || unclassifiedItems.length === 0}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-10 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
              {isSubmitting ? "Updating Database..." : "Commit Classifications"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
