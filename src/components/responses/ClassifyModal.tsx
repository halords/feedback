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
      const isUnclassified = !res.classification || res.classification === "Unclassified" || res.classification === "";
      const hasComment = res.comment && res.comment.trim().length > 2;
      return isUnclassified && hasComment;
    });
  }, [responses]);

  const handleClassificationChange = (docId: string, value: string) => {
    setSelections(prev => ({ ...prev, [docId]: value }));
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

        <div className="max-h-[500px] overflow-y-auto border border-on-surface/5 rounded-3xl custom-scrollbar-reports">
          {unclassifiedItems.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-low z-10 border-b border-on-surface/5">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Office</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Feedback Comment</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface/40 w-48 text-right">Target Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface/5 text-xs font-sans">
                {unclassifiedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-on-surface/[0.01] transition-all">
                    <td className="px-5 py-4">
                       <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-tighter block whitespace-nowrap">{item.office}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[11px] font-medium leading-relaxed italic text-on-surface/70">{item.comment}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        className={clsx(
                          "bg-surface-lowest border rounded-xl py-1.5 px-3 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer outline-none",
                          selections[item.id] === "Positive" ? "border-green-500 text-green-600" :
                          selections[item.id] === "Negative" ? "border-red-500 text-red-600" :
                          selections[item.id] === "Suggestion" ? "border-amber-500 text-amber-600" :
                          "border-on-surface/10 text-on-surface/40"
                        )}
                        value={selections[item.id] || ""}
                        onChange={(e) => handleClassificationChange(item.id, e.target.value)}
                      >
                        <option value="">Pending...</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                        <option value="Suggestion">Suggestion</option>
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
            {unclassifiedItems.length} records available
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface/40 hover:text-on-surface/60 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting || unclassifiedItems.length === 0}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-10 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
              {isSubmitting ? "Updating..." : "Apply Updates"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
