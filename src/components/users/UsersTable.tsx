"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Search, UserPlus, Settings, Shield, Briefcase, MapPin, Loader2, Check, Building2, Building } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { MultiSelectPills } from "@/components/ui/MultiSelectPills";
import { clsx } from "clsx";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UsersTable() {
  const { data: users, mutate, isLoading } = useSWR("/api/users", fetcher);
  const { data: offices } = useSWR("/api/offices", fetcher);
  const { showToast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter((u: any) => 
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.idno?.toLowerCase().includes(search.toLowerCase()) ||
      u.office?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // Reset page when searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const allAssignedOffices = useMemo(() => {
    if (!users || !Array.isArray(users)) return new Set<string>();
    const set = new Set<string>();
    users.forEach((u: any) => {
      u.officeAssignments?.forEach((off: string) => {
        if (off) set.add(off);
      });
    });
    return set;
  }, [users]);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border border-border-strong/50 shadow-sm bg-surface-low rounded-3xl">
        <div className="px-4 py-3 border-b border-border-strong/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-background/50">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface/30" />
            <input 
              type="text"
              placeholder="Search by name, ID, or office..." 
              className="w-full bg-surface border border-on-surface/5 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="bg-surface border border-on-surface/5 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>Show {n}</option>)}
            </select>
            <Button 
                onClick={() => setIsAddModalOpen(true)} 
                size="sm"
                className="bg-primary text-white shadow-lg shadow-primary/10 h-10 px-8 min-w-[170px] flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">New User</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/80 border-b-2 border-border-strong text-on-surface/30">
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest w-12 text-center">No.</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Employee Name</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">ID Number</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Role</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Primary Office</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Office Access</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-center">Analytics</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-strong/20 text-[11px]">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <LoadingRow key={i} />)
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-on-surface/20 italic font-medium">
                    No results found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user: any, idx) => {
                  const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                  return (
                    <tr key={user.idno} className="hover:bg-on-surface/[0.01] transition-all group">
                      <td className="px-4 py-2.5 text-on-surface/30 font-bold text-center">
                        {globalIdx}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-display font-black text-on-surface uppercase tracking-tight">{user.fullName}</p>
                      </td>
                      <td className="px-4 py-2.5 text-on-surface/40 font-mono font-bold">
                        {user.idno}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={clsx(
                        "px-2 py-0.5 rounded-md font-black text-[8px] uppercase tracking-widest border transition-colors",
                        user.userType === "Superadmin" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                        )}>
                        {user.userType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-on-surface/60 font-bold">
                          <span>{user.office}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                            {user.officeAssignments?.slice(0, 3).map((off: string) => (
                                <span key={off} className="bg-surface-low border border-on-surface/5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter text-on-surface/30">
                                    {off}
                                </span>
                            ))}
                            {user.officeAssignments?.length > 3 && (
                                <span className="text-[8px] font-black text-primary px-1.5 py-0.5 tracking-tighter truncate">+ {user.officeAssignments.length - 3} More</span>
                            )}
                            {!user.officeAssignments?.length && <span className="text-on-surface/10 italic text-[9px]">None</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-md font-black text-[8px] uppercase tracking-widest border transition-colors",
                          user.isAnalyticsEnabled ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-on-surface/5 text-on-surface/20 border-on-surface/10"
                        )}>
                          {user.isAnalyticsEnabled ? "ENABLED" : "DISABLED"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button 
                            onClick={() => {
                                setSelectedUser(user);
                                setIsAssignModalOpen(true);
                            }}
                            className="bg-surface-low p-2 rounded-lg border border-on-surface/5 text-on-surface/30 hover:text-primary hover:border-primary/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
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
                    Page {currentPage} of {totalPages} — {filteredUsers.length} Users Total
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

      {/* Modals */}
      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        offices={offices}
        allAssignedOffices={allAssignedOffices}
        onSuccess={() => mutate()}
      />

      <AssignModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        user={selectedUser}
        allOffices={offices}
        allAssignedOffices={allAssignedOffices}
        onSuccess={() => mutate()}
      />
    </div>
  );
}

/**
 * Add User Modal Component
 */
function AddUserModal({ isOpen, onClose, offices, allAssignedOffices, onSuccess }: any) {
  const [formData, setFormData] = useState({
    full_name: "",
    idno: "",
    position: "",
    office: "",
    user_type: "User",
    office_assignment: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast(`Account for ${formData.full_name} created successfully!`, "success");
        onSuccess();
        onClose();
        setFormData({ full_name: "", idno: "", position: "", office: "", user_type: "User", office_assignment: [] });
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Failed to create account", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("A network error occurred", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOffice = (off: string) => {
    setFormData(prev => ({
      ...prev,
      office_assignment: prev.office_assignment.includes(off)
        ? prev.office_assignment.filter(o => o !== off)
        : [...prev.office_assignment, off]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Account" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Full Name" 
            required 
            placeholder="Juan Dela Cruz"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <Input 
            label="Employee ID / ID Number" 
            required 
            placeholder="2024-XXXX"
            value={formData.idno}
            onChange={(e) => setFormData({...formData, idno: e.target.value})}
          />
          <Input 
            label="Position" 
            required 
            placeholder="Administrative Aide"
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
          />
          <div className="space-y-1 px-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface/60">Primary Office</label>
            <select 
              className="w-full bg-surface border-b-2 border-border-strong/50 px-4 py-3 rounded-t-lg font-sans text-on-surface outline-none focus:border-primary transition-colors"
              value={formData.office}
              required
              onChange={(e) => setFormData({...formData, office: e.target.value})}
            >
              <option value="">Select Office...</option>
              {offices?.filter((o: any) => o.status === "active" && !allAssignedOffices.has(o.name)).map((o: any) => (
                <option key={o.id} value={o.name}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 px-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface/60">User Type</label>
            <div className="flex gap-4">
              {["User", "Superadmin"].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, user_type: type})}
                  className={clsx(
                    "flex-1 py-3 rounded-xl border-2 transition-all font-bold text-sm",
                    formData.user_type === type 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-on-surface/5 text-on-surface/30 hover:border-on-surface/10"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <MultiSelectPills 
            label="Grant Office Access"
            options={offices?.filter((o: any) => o.status === "active" && !allAssignedOffices.has(o.name)) || []}
            selectedValues={formData.office_assignment}
            onChange={(vals) => setFormData({...formData, office_assignment: vals})}
            placeholder="Search and add unassigned offices..."
          />
        </div>

        <div className="pt-6 border-t border-on-surface/5 flex justify-end gap-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="min-w-[140px]">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Assign Modal Component
 */
function AssignModal({ isOpen, onClose, user, allOffices, allAssignedOffices, onSuccess }: any) {
  const [selected, setSelected] = useState<string[]>([]);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  // Initialize selected offices and flags when user changes
  React.useEffect(() => {
    if (user) {
      setSelected(user.officeAssignments || []);
      setAnalyticsEnabled(!!user.isAnalyticsEnabled);
    }
  }, [user]);

  const toggle = (off: string) => {
    setSelected(prev => prev.includes(off) ? prev.filter(o => o !== off) : [...prev, off]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log(`[AssignModal] Saving settings for ${user.idno}: Analytics=${analyticsEnabled}`);
    try {
      // 1. Update Assignments
      const resAssign = await fetch("/api/users/assignment", {
        method: "POST",
        body: JSON.stringify({ idno: user.idno, offices: selected })
      });

      // 2. Update Analytics Flag
      const resAnalytics = await fetch(`/api/users/${user.idno}`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsEnabled })
      });

      if (resAssign.ok && resAnalytics.ok) {
        showToast("User settings updated successfully", "success");
        onSuccess();
        onClose();
      } else {
        const err1 = await resAssign.text();
        const err2 = await resAnalytics.text();
        console.error("Save failed:", { assign: err1, analytics: err2 });
        showToast("Some settings failed to update", "error");
      }
    } catch (err) {
      console.error("Network Error during save:", err);
      showToast("A network error occurred", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Assignments" maxWidth="max-w-3xl">
      <div className="space-y-8">
        <div className="bg-primary/5 p-6 rounded-3xl flex items-center gap-4">
           <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-black shadow-xl">
             {user?.fullName?.charAt(0)}
           </div>
           <div>
             <h3 className="text-xl font-black text-primary">{user?.fullName}</h3>
             <p className="text-sm font-bold text-on-surface/50">{user?.idno} • {user?.position}</p>
           </div>
        </div>

        <div className="space-y-4">
           <MultiSelectPills 
             label="Assigned Offices"
             options={allOffices?.filter((o: any) => {
               const isActive = o.status === "active";
               const isAssignedToOthers = allAssignedOffices.has(o.name) && !user?.officeAssignments?.includes(o.name);
               return isActive && !isAssignedToOthers;
             }) || []}
             selectedValues={selected}
             onChange={setSelected}
             placeholder="Add office access..."
           />
           <p className="text-[10px] text-on-surface/30 px-1 font-bold italic">
             * To remove access, click the 'x' on the pill. Only unassigned active offices can be added.
           </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-on-surface/5">
           <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-on-surface/5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-on-surface">Analytics Access</p>
                <p className="text-[10px] text-on-surface/40 font-bold">Allows user to view global Summary and Graphs reports.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  console.log(`[AssignModal] Toggling Analytics to: ${!analyticsEnabled}`);
                  setAnalyticsEnabled(!analyticsEnabled);
                }}
                className={clsx(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 border-2",
                  analyticsEnabled ? "bg-primary border-primary" : "bg-on-surface/10 border-on-surface/20"
                )}
              >
                <span
                  className={clsx(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm",
                    analyticsEnabled ? "translate-x-6" : "translate-x-0.5"
                  )}
                />
              </button>
           </div>
        </div>

        <div className="pt-6 flex justify-end gap-4">
           <Button variant="secondary" onClick={onClose}>Discard Changes</Button>
           <Button onClick={handleSave} disabled={isSaving} className="min-w-[160px]">
             {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Update Access"}
           </Button>
        </div>
      </div>
    </Modal>
  );
}

function LoadingRow() {
  return (
    <tr className="animate-pulse">
      <td className="p-6"><div className="flex gap-4 items-center"><div className="w-12 h-12 rounded-2xl bg-on-surface/5" /><div className="space-y-2"><div className="h-4 w-32 bg-on-surface/5 rounded" /><div className="h-3 w-20 bg-on-surface/5 rounded" /></div></div></td>
      <td className="p-6"><div className="space-y-2"><div className="h-5 w-16 bg-on-surface/5 rounded-full" /><div className="h-3 w-24 bg-on-surface/5 rounded" /></div></td>
      <td className="p-6"><div className="h-5 w-32 bg-on-surface/5 rounded" /></td>
      <td className="p-6"><div className="flex gap-1.5"><div className="h-5 w-14 bg-on-surface/5 rounded" /><div className="h-5 w-14 bg-on-surface/5 rounded" /></div></td>
      <td className="p-6"><div className="ml-auto h-12 w-12 bg-on-surface/5 rounded-xl" /></td>
    </tr>
  );
}
