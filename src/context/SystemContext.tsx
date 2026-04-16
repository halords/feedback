"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SystemContextType {
  isOverrideActive: boolean;
  setOverrideActive: (active: boolean) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  useEffect(() => {
    // Check session storage for persistence within the session
    const active = sessionStorage.getItem("archive_override_active") === "true";
    setIsOverrideActive(active);
  }, []);

  const setOverrideActive = (active: boolean) => {
    setIsOverrideActive(active);
    sessionStorage.setItem("archive_override_active", String(active));
  };

  return (
    <SystemContext.Provider value={{ isOverrideActive, setOverrideActive }}>
      {children}
    </SystemContext.Provider>
  );
}

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error("useSystem must be used within SystemProvider");
  return context;
};
