"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { Plus, Edit2, Shield, ShieldOff, Search, History, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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

  const filteredOffices = offices.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.fullName.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredOffices.length / itemsPerPage);
  const paginatedOffices = filteredOffices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <Shell>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Office Management</h1>
            <p className="text-xs text-on-surface/50 font-bold uppercase tracking-widest mt-0.5">Control Center</p>
          </div>
          <Button onClick={handleOpenAdd} size="sm" className="bg-primary text-white shadow-lg shadow-primary/20 gap-2">
            <Plus className="w-4 h-4" />
            Add Office
          </Button>
        </div>

        {/* Compact Stats */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <StatCompact label="Total" value={offices.length} color="text-primary" />
          <StatCompact label="Active" value={offices.filter(o => o.status === 'active').length} color="text-green-600" />
          <StatCompact label="Disabled" value={offices.filter(o => o.status === 'disabled').length} color="text-on-surface/30" />
          
          <div className="ml-auto relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Filter list..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-low rounded-xl border border-on-surface/5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-on-surface/20"
            />
          </div>
        </div>

        {/* Dense Table */}
        <div className="bg-white rounded-3xl border border-on-surface/5 shadow-xl shadow-on-surface/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 uppercase bg-on-surface/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-on-surface/40">Acronym</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-on-surface/40">Full Name</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-on-surface/40 text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-on-surface/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface/5">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => <LoadingRow key={i} />)
                ) : paginatedOffices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-on-surface/30 italic text-sm">No offices found.</td>
                  </tr>
                ) : (
                  paginatedOffices.map((office) => (
                    <tr key={office.id} className="hover:bg-primary/[0.01] transition-colors group">
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-black text-primary text-xs tracking-tighter">
                          {office.name}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-xs font-bold text-on-surface/70 truncate max-w-xs md:max-w-md">{office.fullName}</p>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                          office.status === "active" ? "bg-green-50 text-green-700" : "bg-on-surface/5 text-on-surface/40"
                        )}>
                          <div className={clsx("w-1 h-1 rounded-full", office.status === 'active' ? 'bg-green-500' : 'bg-on-surface/20')}></div>
                          {office.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <IconButton onClick={() => handleOpenEdit(office)} icon={<Edit2 className="w-3.5 h-3.5" />} title="Edit" />
                          <IconButton 
                            onClick={() => toggleStatus(office)} 
                            icon={office.status === 'active' ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />} 
                            title={office.status === 'active' ? 'Disable' : 'Enable'}
                            variant={office.status === 'active' ? 'danger' : 'success'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-3 border-t border-on-surface/5 bg-on-surface/[0.01] flex items-center justify-between">
            <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">
              Showing {(currentPage-1)*itemsPerPage + 1} to {Math.min(currentPage*itemsPerPage, filteredOffices.length)} of {filteredOffices.length}
            </p>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-on-surface/5 hover:bg-white text-on-surface/40 disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      "w-7 h-7 rounded-lg text-[10px] font-black transition-all",
                      currentPage === page ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface/30 hover:bg-white"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-on-surface/5 hover:bg-white text-on-surface/40 disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
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
    <div className="bg-white border border-on-surface/5 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm min-w-fit">
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
