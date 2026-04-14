"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Search, UserPlus, Settings, Shield, Briefcase, MapPin, Loader2, Check } from "lucide-react";
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

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter((u: any) => 
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.idno?.toLowerCase().includes(search.toLowerCase()) ||
      u.office?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

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
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name, ID, or office..." 
            className="pl-12 !py-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto gap-2 flex items-center justify-center">
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      <Card className="overflow-hidden border-none shadow-2xl bg-surface-low rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-primary/5">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Employee</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Access Level</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Primary Office</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-on-surface/40">Office Access</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-on-surface/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface/5">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <LoadingRow key={i} />)
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center text-on-surface/20 font-sans italic text-lg">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.idno} className="hover:bg-on-surface/5 transition-all duration-300 group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black shadow-inner">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-on-surface text-base">{user.fullName}</p>
                          <p className="text-xs text-on-surface/40 font-mono tracking-tighter">{user.idno}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1.5">
                        <span className={clsx(
                          "text-[9px] font-black px-2.5 py-1 rounded-full w-fit uppercase tracking-wider shadow-sm",
                          user.userType === "Superadmin" ? "bg-red-500 text-white" : "bg-tertiary text-white"
                        )}>
                          {user.userType}
                        </span>
                        <p className="text-[11px] font-bold text-on-surface/60 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-primary/50" />
                          {user.position}
                        </p>
                      </div>
                    </td>
                    <td className="p-6">
                       <div className="text-sm font-black text-on-surface/70 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {user.office}
                       </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {user.officeAssignments?.length > 0 ? (
                          user.officeAssignments.slice(0, 2).map((off: string) => (
                            <span key={off} className="bg-surface border border-on-surface/5 px-2 py-0.5 rounded-md text-[10px] font-bold text-on-surface/40 shadow-sm">
                              {off}
                            </span>
                          ))
                        ) : (
                          <span className="text-on-surface/10 italic text-[10px]">Restricted</span>
                        )}
                        {user.officeAssignments?.length > 2 && (
                          <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                            +{user.officeAssignments.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <Button 
                        variant="secondary" 
                        className="!p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsAssignModalOpen(true);
                        }}
                      >
                        <Settings className="w-5 h-5 text-primary" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              className="w-full bg-[#e0e3e5] border-b-2 border-transparent px-4 py-3 rounded-t-lg font-sans text-on-surface outline-none focus:border-primary"
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
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  // Initialize selected offices when user changes
  React.useEffect(() => {
    if (user) setSelected(user.officeAssignments || []);
  }, [user]);

  const toggle = (off: string) => {
    setSelected(prev => prev.includes(off) ? prev.filter(o => o !== off) : [...prev, off]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/assignment", {
        method: "POST",
        body: JSON.stringify({ idno: user.idno, offices: selected })
      });
      if (res.ok) {
        showToast("Assigned offices updated successfully", "success");
        onSuccess();
        onClose();
      } else {
        showToast("Failed to update assignments", "error");
      }
    } catch (err) {
      console.error(err);
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
             {user?.fullName.charAt(0)}
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
