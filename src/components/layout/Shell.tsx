"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  MessageSquare,
  Inbox,
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
  Palette,
  Sun,
  Moon,
  Menu,
  X,
  Layout,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
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
  { name: "Responses", href: "/responses", icon: Inbox },
  { name: "Comments Management", href: "/comments", icon: MessageSquare, roleRequired: ['superadmin', 'analytics'] },
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
  },
  "/comments": {
    title: "Comments Management",
    desc: "Analyze and classify citizen feedback with AI-assisted insights."
  }
};

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isOverrideActive, setOverrideActive } = useSystem();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isOptEnabled, setIsOptEnabled] = React.useState(true);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - The aside container itself allows overflow to let tooltips out */}
      <aside
        className={clsx(
          "bg-surface-low border-r border-border-strong/50 flex flex-col fixed h-full z-40 transition-all duration-300 ease-in-out group/sidebar overflow-visible shadow-2xl shadow-on-surface/5 transform-gpu will-change-[width,transform]",
          !isCollapsed ? "w-72" : "w-18",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
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
            className="absolute top-10 -right-0 translate-x-1/2 w-6 h-6 bg-surface-lowest border border-on-surface/10 rounded-full items-center justify-center shadow-lg hover:text-primary transition-all z-50 group-hover:scale-110 hidden md:flex"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-on-surface/40 hover:text-primary md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 
          CRITICAL FIX FOR TOOLTIPS: 
          In CSS, you cannot have overflow-y: auto AND overflow-x: visible.
          Therefore, in COLLAPSED mode (where tooltips are used), we disable scrolling (overflow: visible).
          In EXPANDED mode (where scrolling might be needed), we enable scrolling (overflow-y: auto).
        */}
        <div 
          className={clsx(
            "transition-all duration-300 flex-grow flex flex-col custom-scrollbar",
            !isCollapsed ? "overflow-y-auto overflow-x-hidden p-0" : "overflow-visible p-0"
          )}
        >
          <nav className="space-y-1 flex flex-col items-stretch w-full">
            {mainNav.filter(item => {
              if (item.name === "Comments Management") {
                const isSuperadmin = user?.user_type?.toLowerCase() === 'superadmin';
                const isAnalytics = !!user?.is_analytics_enabled;
                return isSuperadmin || isAnalytics;
              }
              return true;
            }).map((item) => {
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
                    <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/item:opacity-100 transition-all duration-200 z-[100] whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/item:translate-x-0">
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
                  <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/settings:opacity-100 transition-all duration-200 z-[100] whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/settings:translate-x-0">
                    Settings
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                  </div>
                )}
              </Link>
            )}

            {mounted && user?.user_type?.toLowerCase() === "superadmin" && (() => {
              const isChildActive = adminNav.some(item => pathname === item.href);
              const isHighlighted = (isAdminOpen && !isCollapsed) || isChildActive;
              
              return (
                <div className="pt-2 group/admin-root">
                  {!isCollapsed && <div className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 px-8 mb-2">Management</div>}
                  
                  <div className="relative">
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

                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/admin-btn:opacity-100 transition-all duration-200 z-[100] whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/admin-btn:translate-x-0">
                          Management Console
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                        </div>
                      )}
                    </button>

                    {isCollapsed && (
                      <div className="absolute left-full top-0 pl-4 opacity-0 pointer-events-none group-hover/admin-root:opacity-100 group-hover/admin-root:pointer-events-auto transition-all duration-300 z-[100] translate-x-1 group-hover/admin-root:translate-x-0">
                        <div className="bg-[#1a1c1e] text-white rounded-2xl py-3 px-1 whitespace-nowrap shadow-2xl border border-white/5 w-56 relative">
                          <div className="px-4 py-2 mb-2 border-b border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Console Selection</p>
                          </div>
                          <div className="space-y-0.5">
                            {adminNav.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className={clsx(
                                    "flex items-center gap-3 px-4 py-2.5 transition-all text-sm font-semibold rounded-xl mx-1",
                                    isActive ? "text-primary bg-primary/10" : "text-white/60 hover:text-white hover:bg-white/10"
                                  )}
                                >
                                  <item.icon className={clsx("w-4 h-4", isActive ? "text-primary" : "text-white/20")} />
                                  {item.name}
                                </Link>
                              );
                            })}
                          </div>
                          <div className="absolute top-5 -left-1 w-2 h-2 bg-[#1a1c1e] rotate-45 border-l border-b border-white/10" />
                        </div>
                      </div>
                    )}
                  </div>

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
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/opt:opacity-100 transition-all duration-200 z-[100] whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/opt:translate-x-0">
                      {isOptEnabled ? "Optimization Active" : "Optimization Bypassed"}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => isOverrideActive ? setOverrideActive(false) : setIsOverrideModalOpen(true)}
                  className={clsx(
                    "flex items-center h-12 w-full transition-colors relative group/override",
                    isCollapsed ? "justify-center" : "px-8 gap-4",
                    isOverrideActive ? "text-amber-600" : "text-on-surface/40 hover:text-amber-600"
                  )}
                >
                  <ShieldAlert className="w-5 h-5" />
                  {!isCollapsed && <span className="text-sm font-semibold">{isOverrideActive ? "Override Active" : "Archive Override"}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/override:opacity-100 transition-all duration-200 z-[100] whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/override:translate-x-0">
                      {isOverrideActive ? "Override Active" : "Archive Override"}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                    </div>
                  )}
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
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/logout:opacity-100 transition-all duration-200 z-[100] whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/logout:translate-x-0">
                  Sign Out
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      <main className={clsx(
        "flex-grow transition-all duration-300 ease-in-out transform-gpu will-change-[padding]", 
        !isCollapsed ? "md:pl-72" : "md:pl-18",
        "pl-0"
      )}>
        <header className="h-20 border-b-2 border-border-strong px-4 md:px-10 flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-md z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-on-surface/60 hover:text-primary md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="font-display font-black text-primary tracking-tight text-lg leading-tight">
                {currentMeta.title}
              </h2>
              <p className="text-[10px] uppercase font-black tracking-widest text-on-surface/30">
                {currentMeta.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center bg-surface-low rounded-xl p-1 gap-1">
              <button
                onClick={() => setTheme("light")}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  theme === "light" ? "bg-surface-lowest text-primary shadow-sm" : "text-on-surface/40 hover:text-primary"
                )}
                title="Light Theme"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  theme === "dark" ? "bg-surface-lowest text-primary shadow-sm" : "text-on-surface/40 hover:text-primary"
                )}
                title="Dark Theme"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("red")}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  theme === "red" ? "bg-surface-lowest text-primary shadow-sm" : "text-on-surface/40 hover:text-primary"
                )}
                title="Red Theme"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("standard")}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  theme === "standard" ? "bg-surface-lowest text-primary shadow-sm" : "text-on-surface/40 hover:text-primary"
                )}
                title="Standard Theme"
              >
                <Layout className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
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
            <div className="mb-6 bg-amber-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-600/20 group animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Archive Override Active</p>
                  <p className="text-[8px] font-bold text-white/60">Data integrity guardrails are currently bypassed for archiving.</p>
                </div>
              </div>
              <button 
                onClick={() => setOverrideActive(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Deactivate
              </button>
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
