"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ShieldCheck,
  Zap,
  ZapOff,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { TopProgressBar } from "@/components/ui/TopProgressBar";
import { useSystem } from "@/context/SystemContext";
import { ArchiveOverrideModal } from "@/components/ui/ArchiveOverrideModal";
import { ShieldAlert } from "lucide-react";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Reports", href: "/analytics", icon: BarChart3 },
  { name: "Responses", href: "/responses", icon: MessageSquare },
];

const adminNav = [
  { name: "Physical Records", href: "/physical-reports", icon: BookOpen },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Offices", href: "/offices", icon: Building },
  { name: "Saving Measures", href: "/settings/saving-measures", icon: ShieldCheck },
];

const PAGE_META: Record<string, { title: string; desc: string }> = {
  "/dashboard": { 
    title: "Dashboard Overview", 
    desc: "Real-time feedback analytics and organization performance metrics." 
  },
  "/analytics": { 
    title: "Analytics & Reports", 
    desc: "Generate and visualize detailed satisfaction reports for organizational audits." 
  },
  "/responses": { 
    title: "Feedback Responses", 
    desc: "Browse, search, and classify individual citizen feedback entries." 
  },
  "/physical-reports": { 
    title: "Physical Records", 
    desc: "Manage and audit manually encoded physical feedback reports." 
  },
  "/users": { 
    title: "User Management", 
    desc: "Control access and permissions for administrative personnel." 
  },
  "/offices": { 
    title: "Office Directory", 
    desc: "Configure departments, satellite locations, and service offerings." 
  },
  "/settings/saving-measures": { 
    title: "Saving Measures", 
    desc: "Optimize Firestore read costs by managing monthly JSON archives." 
  },
  "/settings": { 
    title: "System Settings", 
    desc: "Global configuration and environment management." 
  }
};

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isOverrideActive, setOverrideActive } = useSystem();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isOptEnabled, setIsOptEnabled] = React.useState(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const currentMeta = PAGE_META[pathname] || { title: "Feedback Management", desc: "Provincial Government of La Union" };

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");

    const optVal = document.cookie.match(/read_opt_enabled=([^;]+)/)?.[1];
    if (optVal === 'false') setIsOptEnabled(false);
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const toggleOpt = () => {
    const next = !isOptEnabled;
    setIsOptEnabled(next);
    document.cookie = `read_opt_enabled=${next}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <TopProgressBar />
      
      {/* Sidebar */}
      <aside
        className={clsx(
          "bg-surface-low border-r border-border-strong/50 flex flex-col fixed h-full z-30 transition-all duration-300 ease-in-out group shadow-2xl shadow-on-surface/5 transform-gpu will-change-[width]",
          !isCollapsed ? "w-72" : "w-18"
        )}
      >
        {/* Logo Section */}
        <div className={clsx("flex items-center gap-4 border-b border-border-strong/50 transition-all duration-300 shrink-0 relative", !isCollapsed ? "p-8 mb-4 h-28" : "p-4 mb-2 justify-center h-20")}>
          <div className={clsx(
            "rounded-xl bg-surface-lowest flex-shrink-0 flex items-center justify-center shadow-lg shadow-on-surface/5 border border-on-surface/5 overflow-hidden transition-all duration-300",
            !isCollapsed ? "w-12 h-12" : "w-10 h-10"
          )}>
            <Image src="/logo.png" alt="PGLU Logo" width={48} height={48} className="object-contain" priority />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500 whitespace-nowrap">
              <h1 className="font-display font-black text-primary leading-tight text-xl tracking-tighter">PGLU</h1>
              <p className="text-[9px] uppercase font-black tracking-[0.2em] text-on-surface/30">Feedback v2</p>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="absolute top-10 -right-0 translate-x-1/2 w-6 h-6 bg-surface-lowest border border-on-surface/10 rounded-full flex items-center justify-center shadow-lg hover:text-primary transition-all z-40 group-hover:scale-110"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className={clsx("transition-all duration-300 flex-grow flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar", !isCollapsed ? "p-0" : "p-0")}>

          <nav className="space-y-1 flex flex-col items-stretch w-full">
            {mainNav.map((item) => {
              if (!mounted) return null;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    "flex items-center rounded-none transition-all duration-300 group/item font-sans text-sm font-semibold relative h-12 w-full border-l-4",
                    isCollapsed ? "justify-center border-none" : "px-8 gap-4",
                    isActive
                      ? "bg-primary/10 text-primary border-primary shadow-sm"
                      : "text-on-surface/50 hover:text-primary hover:bg-primary/5 border-transparent"
                  )}
                >
                  <item.icon className={clsx("w-5 h-5 flex-shrink-0 transition-colors duration-300", isActive ? "text-primary" : "text-on-surface/30 group-hover/item:text-primary")} />
                  {!isCollapsed && (
                    <span className="transition-all duration-500 whitespace-nowrap overflow-hidden">
                      {item.name}
                    </span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/item:opacity-100 transition-all duration-200 z-50 whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/item:translate-x-0">
                      {item.name}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                    </div>
                  )}
                </Link>
              );
            })}

            {mounted && user && (
              <Link
                href="/settings"
                className={clsx(
                  "flex items-center rounded-none transition-all duration-300 group/settings font-sans text-sm font-semibold relative h-12 w-full border-l-4",
                  isCollapsed ? "justify-center border-none" : "px-8 gap-4",
                  pathname === "/settings"
                    ? "bg-primary/10 text-primary border-primary shadow-sm"
                    : "text-on-surface/50 hover:text-primary hover:bg-primary/5 border-transparent"
                )}
              >
                <Settings className={clsx("w-5 h-5 flex-shrink-0 transition-colors duration-300", pathname === "/settings" ? "text-primary" : "text-on-surface/30 group-hover/settings:text-primary")} />
                {!isCollapsed && <span className="transition-all duration-500">Settings</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/settings:opacity-100 transition-all duration-200 z-50 whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/settings:translate-x-0">
                    Settings
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                  </div>
                )}
              </Link>
            )}

            {/* Admin Console Dropdown / Popover */}
            {mounted && user?.user_type?.toLowerCase() === "superadmin" && (() => {
              const isChildActive = adminNav.some(item => pathname === item.href);
              const isHighlighted = (isAdminOpen && !isCollapsed) || isChildActive;
              
              return (
                <div className="pt-2 group/admin-root">
                  {!isCollapsed && <div className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 px-8 mb-2">Management</div>}
                  
                  <button
                    onClick={() => !isCollapsed && setIsAdminOpen(!isAdminOpen)}
                    className={clsx(
                      "flex items-center w-full transition-all duration-300 group/admin-btn font-sans text-sm font-semibold relative h-12 border-l-4",
                      isCollapsed ? "justify-center border-none" : "px-8 gap-4",
                      isHighlighted ? "text-primary bg-primary/10 border-primary" : "text-on-surface/50 hover:bg-primary/5 hover:text-primary border-transparent"
                    )}
                  >
                    <ShieldCheck className={clsx("w-5 h-5 flex-shrink-0 transition-colors", isHighlighted ? "text-primary" : "text-on-surface/30 group-hover/admin-btn:text-primary")} />
                    
                    {!isCollapsed && (
                      <span className="flex-1 text-left">Console</span>
                    )}

                    {!isCollapsed && (
                      <ChevronDown className={clsx("w-4 h-4 transition-transform duration-300", isAdminOpen ? "rotate-180" : "rotate-0")} />
                    )}

                    {/* Popover Safe Area (Prevents flickering) */}
                    {isCollapsed && <div className="absolute left-full w-4 h-full top-0 pointer-events-auto" />}

                    {/* Collapsed State Hover Popover */}
                    {isCollapsed && (
                      <div className="absolute left-[calc(100%+12px)] top-0 py-2 px-1 bg-[#1a1c1e] text-white rounded-2xl opacity-0 pointer-events-none group-hover/admin-root:opacity-100 group-hover/admin-root:pointer-events-auto transition-all duration-300 z-50 whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/admin-root:translate-x-0 w-56">
                        <div className="px-4 py-2 mb-1 border-b border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Management Console</p>
                        </div>
                        <div className="space-y-0.5">
                          {adminNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                  "flex items-center gap-3 px-4 py-2.5 transition-all text-[13px] font-semibold",
                                  isActive ? "text-primary bg-white/5" : "text-white/60 hover:text-white hover:bg-white/10"
                                )}
                              >
                                <item.icon className={clsx("w-4 h-4", isActive ? "text-primary" : "text-white/20")} />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                        <div className="absolute top-5 -left-1 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                      </div>
                    )}
                  </button>

                  <div className={clsx(
                    "overflow-hidden transition-all duration-300 space-y-0 transform-gpu will-change-[max-height,opacity]",
                    isAdminOpen && !isCollapsed ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    {adminNav.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={clsx(
                            "flex items-center h-11 transition-all duration-300 font-sans text-[13px] font-medium pl-14 relative",
                            isActive
                              ? "bg-primary/20 text-primary border-r-4 border-primary"
                              : "text-on-surface/60 hover:text-primary hover:bg-primary/10"
                          )}
                        >
                          <item.icon className={clsx("w-4 h-4 mr-3 shrink-0", isActive ? "text-primary" : "text-on-surface/30")} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </nav>
        </div>

        <div className={clsx("mt-auto border-t border-on-surface/5 transition-all duration-300 shrink-0", !isCollapsed ? "p-4" : "p-0")}>
          {/* Bottom actions container */}
          <div className="flex flex-col items-stretch space-y-1">
            {mounted && user?.user_type?.toLowerCase() === 'superadmin' && (
              <>
                <button
                  onClick={toggleOpt}
                  className={clsx(
                    "flex items-center h-12 w-full transition-colors relative group/opt",
                    isCollapsed ? "justify-center" : "px-8 gap-4",
                    isOptEnabled ? "text-primary" : "text-amber-600"
                  )}
                >
                  {isOptEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                  {!isCollapsed && <span className="text-sm font-semibold">{isOptEnabled ? "Opt. Active" : "Opt. Bypassed"}</span>}
                </button>

                <button
                  onClick={() => setIsOverrideModalOpen(true)}
                  className={clsx(
                    "flex items-center h-12 w-full transition-colors relative group/override",
                    isCollapsed ? "justify-center" : "px-8 gap-4",
                    isOverrideActive ? "text-amber-600" : "text-on-surface/40 hover:text-amber-600"
                  )}
                >
                  <ShieldAlert className="w-5 h-5" />
                  {!isCollapsed && <span className="text-sm font-semibold">{isOverrideActive ? "Override Active" : "Archive Override"}</span>}
                </button>
              </>
            )}

            <button
              onClick={logout}
              className={clsx(
                "flex items-center h-12 w-full text-on-surface/60 hover:text-red-600 transition-colors font-sans text-sm font-semibold group/logout relative",
                isCollapsed ? "justify-center" : "px-8 gap-4"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={clsx("flex-grow transition-all duration-300 ease-in-out transform-gpu will-change-[padding]", !isCollapsed ? "pl-72" : "pl-18")}>
        <header className="h-20 border-b-2 border-border-strong px-10 flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-md z-10 transition-colors duration-300">
          <div>
            <h2 className="font-display font-black text-primary tracking-tight text-lg leading-tight">
              {currentMeta.title}
            </h2>
            <p className="text-[10px] uppercase font-black tracking-widest text-on-surface/30">
              {currentMeta.desc}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">{user?.full_name || "Admin User"}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">{user?.user_type || "Superadmin"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-surface-lowest shadow-sm ring-2 ring-primary/5">
                <span className="font-display font-bold text-primary text-xs">{(user?.full_name || "A")[0]}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8 pt-6 w-full animate-page-entry">
          {isOverrideActive && (
            <div className="mb-6 bg-amber-600 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-600/20">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Archive Override Active</span>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>

      <ArchiveOverrideModal 
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSuccess={() => setOverrideActive(true)}
      />
    </div>
  );
}
