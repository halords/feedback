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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { TopProgressBar } from "@/components/ui/TopProgressBar";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Reports", href: "/analytics", icon: BarChart3 },
  { name: "Responses", href: "/responses", icon: MessageSquare },
  { name: "Users", href: "/users", icon: Users },
  { name: "Offices", href: "/offices", icon: Building },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Load preference from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <TopProgressBar />
      {/* Sidebar - Collapsible with Hover Expand */}
      <aside
        className={clsx(
          "bg-surface-low border-r border-on-surface/5 flex flex-col fixed h-full z-30 transition-all duration-300 ease-in-out group shadow-2xl shadow-on-surface/5",
          !isCollapsed ? "w-72" : "w-18"
        )}
      >
        <div className={clsx("transition-all duration-300 flex-grow", !isCollapsed ? "p-8 overflow-y-auto" : "p-4 overflow-visible")}>
          {/* Collapse Toggle Button */}
          <button 
            onClick={toggleSidebar}
            className="absolute top-6 -right-0 translate-x-1/2 w-6 h-6 bg-white border border-on-surface/5 rounded-full flex items-center justify-center shadow-lg hover:text-primary transition-all z-40 group-hover:scale-110"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-10 px-2">
            <div className={clsx(
              "rounded-xl bg-white flex-shrink-0 flex items-center justify-center shadow-lg shadow-on-surface/5 border border-on-surface/5 overflow-hidden transition-all duration-300",
              !isCollapsed ? "w-12 h-12" : "w-10 h-10"
            )}>
              <Image 
                src="/logo.png" 
                alt="PGLU Logo" 
                width={48} 
                height={48}
                className="object-contain"
                priority
                onError={(e) => {
                  // Fallback to internal icon if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Fallback Icon if image is missing */}
              <BarChart3 className="text-primary w-6 h-6 absolute pointer-events-none -z-10" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-500 whitespace-nowrap">
                <h1 className="font-display font-black text-primary leading-tight text-xl tracking-tighter">PGLU</h1>
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-on-surface/30">Feedback v2</p>
              </div>
            )}
          </div>

          <nav className="space-y-4">
            {navItems.map((item) => {
              const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
              if ((item.name === "Users" || item.name === "Offices") && !isSuperadmin) return null;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-200 group/item font-sans text-sm font-semibold relative",
                    isActive
                      ? "bg-white text-primary shadow-sm"
                      : "text-on-surface/60 hover:text-primary hover:bg-white/50"
                  )}
                >
                  <item.icon className={clsx("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-on-surface/30 group-hover/item:text-primary")} />
                  <span className={clsx("transition-all duration-300 whitespace-nowrap overflow-hidden", !isCollapsed ? "w-auto opacity-100" : "w-0 opacity-0")}>
                    {item.name}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1c1e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/item:opacity-100 transition-all duration-200 z-50 whitespace-nowrap shadow-2xl border border-white/5 translate-x-[-10px] group-hover/item:translate-x-0">
                      {item.name}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1c1e] rotate-45" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={clsx("mt-auto border-t border-on-surface/5 transition-all duration-300", !isCollapsed ? "p-8" : "p-4")}>
          <button
            onClick={logout}
            className="flex items-center gap-4 px-3.5 py-3 w-full text-on-surface/60 hover:text-red-600 transition-colors font-sans text-sm font-semibold group/logout relative"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover/logout:scale-110 transition-transform" />
            <span className={clsx("transition-all duration-300 whitespace-nowrap overflow-hidden", !isCollapsed ? "w-auto opacity-100" : "w-0 opacity-0")}>
              Sign Out
            </span>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/logout:opacity-100 transition-all duration-200 z-50 whitespace-nowrap shadow-2xl translate-x-[-10px] group-hover/logout:translate-x-0">
                Sign Out
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={clsx("flex-grow transition-all duration-300 ease-in-out", !isCollapsed ? "pl-72" : "pl-18")}>
        {/* Top Navbar */}
        <header className="h-20 border-b border-on-surface/5 px-10 flex items-center justify-end sticky top-0 bg-surface/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">{user?.full_name || "Admin User"}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">{user?.user_type || "Superadmin"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-primary/5">
                <span className="font-display font-bold text-primary text-xs">{(user?.full_name || "A")[0]}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-12 w-full animate-page-entry">
          {children}
        </div>
      </main>
    </div>
  );
}
