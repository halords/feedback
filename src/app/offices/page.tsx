"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { Plus, Edit2, Shield, ShieldOff, Search, History, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface Office {
  id: string;
  name: string;
  fullName: string;
  status: "active" | "disabled";
  updatedAt?: string;
}

export default function OfficesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    } else if (!isAuthLoading && user && user.user_type?.toLowerCase() !== "superadmin") {
      router.push("/dashboard");
    }
  }, [user, isAuthLoading, router]);

  const { data: offices = [], mutate, isLoading } = useSWR<Office[]>("/api/offices", fetcher);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form State
  const [formData, setFormData] = useState({ name: "", fullName: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();

  const handleOpenAdd = () => {
    setEditingOffice(null);
    setFormData({ name: "", fullName: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (office: Office) => {
    setEditingOffice(office);
    setFormData({ name: office.name, fullName: office.fullName });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const method = editingOffice ? "PUT" : "POST";
      const body = editingOffice 
        ? { id: editingOffice.id, ...formData }
        : formData;

      const res = await fetch("/api/offices", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Operation failed");
      }

      showToast(editingOffice ? "Office updated and synchronized" : "Office created", "success");
      setIsModalOpen(false);
      mutate();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (office: Office) => {
    const newStatus = office.status === "active" ? "disabled" : "active";
    try {
      const res = await fetch("/api/offices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: office.id, status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      showToast(`Office ${newStatus === 'active' ? 'enabled' : 'disabled'}`, "success");
      mutate();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };


  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter, Sort and Paginate
  const sortedAndFilteredOffices = useMemo(() => {
    return offices
      .filter(o => 
        o.name.toLowerCase().includes(search.toLowerCase()) || 
        o.fullName.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        // First: Status (Active first, Disabled last)
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        
        // Second: Alphabetical by Name
        return a.name.localeCompare(b.name);
      });
  }, [offices, search]);

  const totalPages = Math.ceil(sortedAndFilteredOffices.length / rowsPerPage);
  const paginatedOffices = useMemo(() => {
    return sortedAndFilteredOffices.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [sortedAndFilteredOffices, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Unified Data Table Card */}
        <Card className="overflow-hidden border border-border-strong/50 shadow-sm bg-surface-low rounded-3xl">
          <div className="px-4 py-2.5 border-b border-border-strong/50 flex flex-col xl:flex-row gap-4 xl:items-center justify-between bg-background/50">
            <div className="flex flex-wrap items-center gap-2">
                <StatCompact label="Total" value={offices.length} color="text-primary" />
                <StatCompact label="Active" value={offices.filter(o => o.status === 'active').length} color="text-green-600" />
                <StatCompact label="Disabled" value={offices.filter(o => o.status === 'disabled').length} color="text-on-surface/30" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 flex-grow justify-end">
              <div className="relative w-full md:w-64 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface/30" />
                <input 
                  type="text"
                  placeholder="Filter offices..." 
                  className="w-full bg-background/50 border border-border-strong/50 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="bg-background/50 border border-border-strong/50 rounded-xl px-2 py-2 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer"
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>Show {n}</option>)}
                </select>
                <Button 
                    onClick={handleOpenAdd} 
                    size="sm"
                    className="bg-primary text-white shadow-lg shadow-primary/10 h-9 px-6 min-w-[140px] flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Add Office</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/80 border-b-2 border-border-strong text-on-surface/30">
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest w-12 text-center">No.</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest w-24">Acronym</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Full Department Name</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest w-24 text-center">Status</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right w-24 px-6">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-strong/20 text-[11px]">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => <LoadingRow key={i} />)
                ) : paginatedOffices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-on-surface/20 italic font-medium">No results found matching your search.</td>
                  </tr>
                ) : (
                  paginatedOffices.map((office, idx) => {
                    const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                    return (
                      <tr key={office.id} className="hover:bg-on-surface/[0.01] transition-all group">
                        <td className="px-4 py-2.5 text-on-surface/30 font-bold text-center">
                          {globalIdx}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono font-black text-primary text-[11px] uppercase tracking-tighter">
                            {office.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-xs font-bold text-on-surface/70 truncate max-w-md">{office.fullName}</p>
                        </td>
                        <td className="px-4 py-2.5 text-center px-1">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                            office.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-on-surface/10 text-on-surface/60 border-on-surface/20"
                          )}>
                            {office.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right px-6">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button 
                                    onClick={() => handleOpenEdit(office)}
                                    className="p-2 rounded-lg text-on-surface/30 hover:text-primary hover:bg-primary/5 transition-all"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => toggleStatus(office)}
                                    className={clsx(
                                        "p-2 rounded-lg transition-all",
                                        office.status === 'active' ? "text-on-surface/30 hover:text-red-600 hover:bg-red-50" : "text-on-surface/30 hover:text-green-600 hover:bg-green-50"
                                    )}
                                >
                                    {office.status === 'active' ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-on-surface/5 flex items-center justify-between bg-surface-low/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30">
                    Page {currentPage} of {totalPages} — {sortedAndFilteredOffices.length} Offices Total
                </p>
                <div className="flex items-center gap-1">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:bg-surface-lowest"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1 px-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={clsx(
                                "w-8 h-8 rounded-xl text-[9px] font-black transition-all",
                                currentPage === page ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "text-on-surface/30 hover:text-on-surface/60"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-20 hover:bg-surface-lowest"
                    >
                        Next
                    </button>
                </div>
            </div>
          )}
        </Card>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingOffice ? "Edit Office" : "Register Office"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 gap-5 px-1">
            <Input 
               label="Acronym"
               placeholder="ABC"
               value={formData.name}
               onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
               required
               disabled={!!editingOffice && isSubmitting}
               className="font-mono"
            />
            <Input 
               label="Full Name"
               placeholder="Official Department Name"
               value={formData.fullName}
               onChange={(e) => setFormData({...formData, fullName: e.target.value})}
               required
               disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-on-surface/5">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" type="submit" className="bg-primary text-white" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : editingOffice ? "Save Changes" : "Finalize Registration"}
            </Button>
          </div>
        </form>
      </Modal>
    </Shell>
  );
}

function StatCompact({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-background/50 border border-border-strong/50 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm min-w-fit transition-colors">
      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">{label}</span>
      <span className={clsx("text-lg font-display font-black", color)}>{value}</span>
    </div>
  );
}

function IconButton({ icon, onClick, title, variant = 'default' }: any) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={clsx(
        "p-2 rounded-lg transition-all border border-transparent hover:shadow-md",
        variant === 'default' && "text-on-surface/40 hover:text-primary hover:bg-primary/5 hover:border-primary/10",
        variant === 'danger' && "text-on-surface/40 hover:text-red-600 hover:bg-red-50 hover:border-red-100",
        variant === 'success' && "text-on-surface/40 hover:text-green-600 hover:bg-green-50 hover:border-green-100"
      )}
    >
      {icon}
    </button>
  );
}

function LoadingRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-12 bg-on-surface/5 rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-64 bg-on-surface/5 rounded" /></td>
      <td className="px-6 py-4"><div className="mx-auto h-4 w-16 bg-on-surface/5 rounded-full" /></td>
      <td className="px-6 py-4"><div className="ml-auto h-8 w-16 bg-on-surface/5 rounded-lg" /></td>
    </tr>
  );
}

// Minimal clsx helper since I used it above
function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
