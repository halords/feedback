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
  Lock
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
  ];

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-black text-primary tracking-tight">Account Settings</h1>
            <p className="text-on-surface/40 font-medium mt-1">Manage your profile, security, and application preferences.</p>
          </div>

          <div className="flex items-center gap-2 bg-surface-low p-1.5 rounded-2xl border border-on-surface/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl font-sans text-sm font-bold transition-all duration-300",
                  activeTab === tab.id 
                    ? "bg-white text-primary shadow-md translate-y-[-1px]" 
                    : "text-on-surface/40 hover:text-on-surface/60 hover:bg-white/50"
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
          </div>
        </div>
      </div>
    </Shell>
  );
}

function ProfileSection({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <Card className="p-8 border-on-surface/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 rounded-3xl bg-primary flex items-center justify-center border-4 border-white shadow-xl ring-8 ring-primary/5">
            <span className="text-4xl font-display font-black text-white">{(user?.fullname || "A")[0]}</span>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-black text-on-surface">{user?.fullname || "Admin User"}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                {user?.user_type || "Superadmin"}
              </span>
              <span className="px-3 py-1 rounded-lg bg-on-surface/5 text-on-surface/40 text-[10px] font-black uppercase tracking-widest">
                Account ID: #{user?.idno || "12345"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 border-on-surface/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
          <Monitor className="w-4 h-4" /> Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Username</label>
            <div className="p-4 rounded-2xl bg-surface-low border border-on-surface/5 text-on-surface/60 font-bold group hover:border-primary/20 transition-colors">
              {user?.username || "admin_feedback"}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Full Name</label>
            <div className="p-4 rounded-2xl bg-surface-low border border-on-surface/5 text-on-surface/60 font-bold group hover:border-primary/20 transition-colors">
              {user?.fullname || "Default Administrator"}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Assigned Offices</label>
            <div className="p-2 rounded-2xl bg-surface-low border border-on-surface/5 flex flex-wrap gap-2">
              {(user?.offices || ["Governor's Office", "HR Management", "Accounting"]).map((office: string) => (
                <span key={office} className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-primary shadow-sm border border-primary/5">
                  {office}
                </span>
              ))}
              {(!user?.offices || user.offices.length === 0) && (
                <span className="p-2 text-xs font-bold text-on-surface/20 italic">No specific offices assigned (Global Access)</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      <Card className="p-8 border-on-surface/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change Password
        </h3>
        
        <div className="max-w-md space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Current Password</label>
            <input 
              type="password" 
              className="w-full p-4 rounded-2xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-sans"
              placeholder="••••••••••••"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">New Password</label>
            <input 
              type="password" 
              className="w-full p-4 rounded-2xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-sans"
              placeholder="••••••••••••"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 ml-1">Confirm New Password</label>
            <input 
              type="password" 
              className="w-full p-4 rounded-2xl bg-surface-low border border-on-surface/5 focus:border-primary outline-none transition-all font-sans"
              placeholder="••••••••••••"
            />
          </div>

          <button className="px-8 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Update Password
          </button>
        </div>
      </Card>

      <Card className="p-8 border-on-surface/5 bg-on-surface/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-on-surface text-sm">Two-Factor Authentication</h4>
            <p className="text-xs text-on-surface/40 font-bold">Add an extra layer of security to your account.</p>
          </div>
          <button className="ml-auto px-4 py-2 rounded-xl border border-tertiary text-tertiary text-[10px] font-black uppercase tracking-widest hover:bg-tertiary hover:text-white transition-all">
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card 
        onClick={() => setTheme("dark")}
        className={clsx(
          "p-8 border-on-surface/5 flex flex-col items-center text-center space-y-4 transition-all cursor-pointer group",
          theme === "dark" ? "border-primary/20 bg-primary/5 shadow-lg shadow-primary/5" : "hover:border-primary/20"
        )}
      >
        <div className={clsx(
          "w-20 h-20 rounded-3xl flex items-center justify-center transition-all",
          theme === "dark" ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-surface-low text-on-surface/30 group-hover:text-primary"
        )}>
          <Moon className="w-10 h-10" />
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
          "p-8 border-on-surface/5 flex flex-col items-center text-center space-y-4 transition-all cursor-pointer group",
          theme === "light" ? "border-primary/20 bg-primary/5 shadow-lg shadow-primary/5" : "hover:border-primary/20"
        )}
      >
        <div className={clsx(
          "w-20 h-20 rounded-3xl flex items-center justify-center transition-all",
          theme === "light" ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-surface-low text-on-surface/30 group-hover:text-primary"
        )}>
          <Monitor className="w-10 h-10" />
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
