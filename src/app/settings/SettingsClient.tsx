"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import {
  User,
  Shield,
  Moon,
  Palette,
  Monitor,
  Lock,
  RefreshCw,
  Database,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { clsx } from "clsx";

export function SettingsClient() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl" />
          <div className="h-4 w-32 bg-on-surface/5 rounded" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "security", name: "Security", icon: Shield },
    { id: "appearance", name: "Appearance", icon: Palette },
    ...(user?.user_type?.toLowerCase() === 'superadmin' ? [{ id: "data", name: "Data Management", icon: Database }] : []),
  ];


  return (
    <Shell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black p-0 uppercase tracking-[0.2em] text-on-surface/40">Access Level</p>
              <p className="text-xs font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                {user?.user_type || "Standard User"} 
                {user?.user_type?.toLowerCase() === 'superadmin' 
                  ? <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[8px] border border-primary/20">Authorized</span>
                  : <span className="bg-on-surface/5 text-on-surface/40 px-2 py-0.5 rounded text-[8px] border border-on-surface/10">Restricted</span>
                }
              </p>
            </div>
          </div>

          {user?.requiresPasswordChange && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-pulse">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs font-black text-red-700 uppercase tracking-widest">Action Required</p>
                  <p className="text-[10px] text-red-600 font-bold">Please update your default password to unlock full dashboard access.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 bg-surface-low p-1.5 rounded-2xl border border-on-surface/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-5 py-2 rounded-xl font-sans text-xs font-bold transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-surface-lowest text-primary shadow-md translate-y-[-1px]"
                    : "text-on-surface/50 hover:text-on-surface/70 hover:bg-surface-lowest/50"
                )}
              >
                <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-primary" : "text-on-surface/30")} />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full">
          {/* Content Area */}
          <div className="animate-in fade-in duration-500">
            {activeTab === "profile" && <ProfileSection user={user} />}
            {activeTab === "security" && <SecuritySection />}
            {activeTab === "appearance" && <AppearanceSection />}
            {activeTab === "data" && <DataSection />}

          </div>
        </div>
      </div>
    </Shell>
  );
}

function ProfileSection({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <Card className="p-6 border-on-surface/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center border-4 border-surface-lowest shadow-xl ring-4 ring-primary/5">
            <span className="text-3xl font-display font-black text-white">{(user?.full_name || "A")[0]}</span>
          </div>

          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-black text-on-surface">{user?.full_name || "Admin User"}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                {user?.user_type || "Superadmin"}
              </span>
              <span className="px-3 py-1 rounded-lg bg-on-surface/5 text-on-surface/40 text-[10px] font-black uppercase tracking-widest">
                Account ID: #{user?.username || "12345"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-on-surface/5">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
          <Monitor className="w-4 h-4" /> Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Username</label>
            <div className="p-3.5 rounded-xl bg-surface-lowest/50 border border-on-surface/10 text-on-surface/70 font-bold group hover:border-primary/20 transition-colors">
              {user?.username || "admin_feedback"}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Full Name</label>
            <div className="p-3.5 rounded-xl bg-surface-lowest/50 border border-on-surface/10 text-on-surface/70 font-bold group hover:border-primary/20 transition-colors">
              {user?.full_name || "Default Administrator"}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Assigned Offices</label>
            <div className="p-2 rounded-xl bg-surface-low border border-on-surface/5 flex flex-wrap gap-2">
              {(user?.offices || ["Governor's Office", "HR Management", "Accounting"]).map((office: string) => (
                <span key={office} className="px-3 py-1.5 rounded-lg bg-surface-lowest text-[10px] font-bold text-primary shadow-sm border border-on-surface/10 uppercase tracking-tight">
                  {office}
                </span>
              ))}
              {(!user?.offices || user.offices.length === 0) && (
                <span className="p-2 text-xs font-bold text-on-surface/40 italic">No specific offices assigned (Global Access)</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SecuritySection() {
  const { mutate } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus({ type: 'error', message: 'All fields are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: 'Password updated successfully' });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Re-validate auth state to clear requiresPasswordChange flag immediately
        mutate();
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-on-surface/5">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change Password
        </h3>

        <div className="max-w-md space-y-5">
          {status && (
            <div className={clsx(
              "p-4 rounded-xl text-[10px] font-black uppercase tracking-widest",
              status.type === 'success' ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
            )}>
              {status.message}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-sans text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-sans text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-sans text-sm"
              placeholder="••••••••••••"
            />
          </div>

          <button 
            onClick={handleUpdatePassword}
            disabled={isLoading}
            className={clsx(
              "px-6 py-3.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-center flex justify-center items-center gap-2",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </Card>

      <Card className="p-6 border-on-surface/5 bg-on-surface/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-on-surface text-xs uppercase tracking-tight">Two-Factor Authentication</h4>
            <p className="text-[10px] text-on-surface/40 font-bold">Add an extra layer of security to your account.</p>
          </div>
          <button className="ml-auto px-4 py-2 rounded-lg border border-tertiary text-tertiary text-[9px] font-black uppercase tracking-widest hover:bg-tertiary hover:text-white transition-all">
            Setup
          </button>
        </div>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        onClick={() => setTheme("dark")}
        className={clsx(
          "p-6 border-on-surface/5 flex flex-col items-center text-center space-y-3 transition-all cursor-pointer group",
          theme === "dark" ? "border-primary/20 bg-primary/5 shadow-lg shadow-primary/5" : "hover:border-primary/20"
        )}
      >
        <div className={clsx(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
          theme === "dark" ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-surface-low text-on-surface/30 group-hover:text-primary"
        )}>
          <Moon className="w-8 h-8" />
        </div>
        <div>
          <h4 className={clsx("font-black", theme === "dark" ? "text-primary" : "text-on-surface")}>Dark Mode</h4>
          <p className="text-xs text-on-surface/40 font-bold">Switch to a darker interface for low light conditions.</p>
        </div>
        <div className="w-full h-2 rounded-full bg-on-surface/5 overflow-hidden">
          <div className={clsx("h-full bg-primary transition-all duration-500", theme === "dark" ? "w-full" : "w-0")} />
        </div>
        <p className={clsx("text-[10px] font-black uppercase", theme === "dark" ? "text-primary" : "text-primary/40")}>
          {theme === "dark" ? "Active Theme" : "Click to Enable"}
        </p>
      </Card>

      <Card
        onClick={() => setTheme("light")}
        className={clsx(
          "p-6 border-on-surface/5 flex flex-col items-center text-center space-y-3 transition-all cursor-pointer group",
          theme === "light" ? "border-primary/20 bg-primary/5 shadow-lg shadow-primary/5" : "hover:border-primary/20"
        )}
      >
        <div className={clsx(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
          theme === "light" ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-surface-low text-on-surface/30 group-hover:text-primary"
        )}>
          <Monitor className="w-8 h-8" />
        </div>
        <div>
          <h4 className={clsx("font-black", theme === "light" ? "text-primary" : "text-on-surface")}>Indigo Light</h4>
          <p className="text-xs text-on-surface/40 font-bold">The current premium indigo slate professional theme.</p>
        </div>
        <div className="w-full h-2 rounded-full bg-on-surface/5 overflow-hidden">
          <div className={clsx("h-full bg-primary transition-all duration-500", theme === "light" ? "w-full" : "w-0")} />
        </div>
        <p className={clsx("text-[10px] font-black uppercase", theme === "light" ? "text-primary" : "text-primary/40")}>
          {theme === "light" ? "Active Theme" : "Click to Select"}
        </p>
      </Card>
    </div>
  );
}

function DataSection() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card className="p-6 border-on-surface/5">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
          <Database className="w-4 h-4" /> System Data Management
        </h3>

        <div className="grid grid-cols-1 gap-5">
          <div 
            onClick={() => router.push('/settings/saving-measures')}
            className="group cursor-pointer p-5 rounded-xl bg-surface-low border border-on-surface/5 hover:border-primary/20 hover:bg-primary/5 transition-all flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-grow">
              <h4 className="font-black text-on-surface text-base uppercase tracking-tight">Saving Measures</h4>
              <p className="text-[11px] text-on-surface/40 font-bold">Archive historical data into optimized JSON snapshots to reduce database costs.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface/20 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-on-surface/5 bg-on-surface/[0.02]">
        <div className="flex items-center gap-4 opacity-50">
          <div className="w-10 h-10 rounded-xl bg-on-surface/10 flex items-center justify-center text-on-surface">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-on-surface text-xs uppercase tracking-tight">Automated Archival</h4>
            <p className="text-[10px] text-on-surface/40 font-bold">Planned: Schedule monthly snapshots to run automatically.</p>
          </div>
          <span className="ml-auto px-2 py-0.5 rounded-md bg-on-surface/10 text-[8px] font-black uppercase tracking-widest text-on-surface/40">
            Coming Soon
          </span>
        </div>
      </Card>
    </div>
  );
}

