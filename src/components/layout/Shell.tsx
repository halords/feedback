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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Responses", href: "/responses", icon: MessageSquare },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar - Collapsible with Hover Expand */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={clsx(
          "bg-surface-low border-r border-on-surface/5 flex flex-col fixed h-full z-30 transition-all duration-300 ease-in-out group overflow-hidden shadow-2xl shadow-on-surface/5",
          isHovered ? "w-72" : "w-20"
        )}
      >
        <div className={clsx("transition-all duration-300", isHovered ? "p-8" : "p-5")}>
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <div className={clsx("transition-opacity duration-300 whitespace-nowrap", isHovered ? "opacity-100" : "opacity-0")}>
              <h1 className="font-display font-bold text-primary leading-tight">PGLU</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40">Feedback v2</p>
            </div>
          </div>

          <nav className="space-y-4">
            {navItems.map((item) => {
              const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
              if (item.name === "Users" && !isSuperadmin) return null;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-200 group/item font-sans text-sm font-semibold",
                    isActive 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-on-surface/60 hover:text-primary hover:bg-white/50"
                  )}
                >
                  <item.icon className={clsx("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-on-surface/30 group-hover/item:text-primary")} />
                  <span className={clsx("transition-opacity duration-300 whitespace-nowrap", isHovered ? "opacity-100" : "opacity-0")}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={clsx("mt-auto border-t border-on-surface/5 transition-all duration-300", isHovered ? "p-8" : "p-5")}>
          <button 
            onClick={logout}
            className="flex items-center gap-4 px-3.5 py-3 w-full text-on-surface/60 hover:text-red-600 transition-colors font-sans text-sm font-semibold group/logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover/logout:scale-110 transition-transform" />
            <span className={clsx("transition-opacity duration-300 whitespace-nowrap", isHovered ? "opacity-100" : "opacity-0")}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={clsx("flex-grow transition-all duration-300 ease-in-out", isHovered ? "pl-72" : "pl-20")}>
        {/* Top Navbar */}
        <header className="h-20 border-b border-on-surface/5 px-10 flex items-center justify-end sticky top-0 bg-surface/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">{user?.fullname || "Admin User"}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">{user?.user_type || "Superadmin"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-primary/5">
                <span className="font-display font-bold text-primary text-xs">{(user?.fullname || "A")[0]}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-12 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
