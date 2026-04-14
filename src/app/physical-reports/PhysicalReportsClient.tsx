"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { PhysicalReportsEditor } from "@/components/physical-reports/PhysicalReportsEditor";

export default function PhysicalReportsClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.user_type?.toLowerCase() !== "superadmin") {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.user_type?.toLowerCase() !== "superadmin") {
    return <div className="animate-pulse bg-surface h-screen" />;
  }

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-extrabold text-primary tracking-tight">Physical Reports Editor</h1>
        <p className="text-on-surface/50 font-medium mt-1">Safely edit raw physical report data from the firestore collection.</p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PhysicalReportsEditor />
      </div>
    </Shell>
  );
}
