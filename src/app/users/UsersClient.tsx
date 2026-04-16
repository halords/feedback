"use client";

import React, { useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function UsersClient({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
    // Basic Session Protection
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user && !isSuperadmin) {
      // Strict Superadmin-only check (Update from Phase 5 requirements)
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const isSuperadmin = user?.user_type?.toLowerCase() === "superadmin";
  if (isLoading || !user || !isSuperadmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl animate-bounce" />
          <div className="h-4 w-32 bg-on-surface/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Shell>
      {children}
    </Shell>
  );
}
