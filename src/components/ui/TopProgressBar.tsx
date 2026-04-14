"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * TopProgressBar Component
 * Provides a thin, animated line at the very top of the screen during page transitions.
 */
function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 600);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 overflow-hidden pointer-events-none">
      <div className="h-full bg-primary/80 animate-progress-slide shadow-[0_0_10px_rgba(36,56,156,0.5)]" />
    </div>
  );
}

export function TopProgressBar() {
    return (
        <Suspense fallback={null}>
            <ProgressBarInner />
        </Suspense>
    );
}
