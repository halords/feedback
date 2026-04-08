"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";

interface UserProfile {
  fullname: string;
  username: string;
  user_type: string;
  offices: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (userData: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use SWR to manage session state with a consistent key
  // We use null as initial value for the fetcher because we handle hydration manually
  const { data: user, mutate, isLoading } = useSWR<UserProfile | null>("auth-session", null, {
    fallbackData: null,
    revalidateOnFocus: false,
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("loggedInUser");
    if (savedUser) {
      try {
        mutate(JSON.parse(savedUser), false);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setIsHydrated(true);
  }, [mutate]);

  const login = (userData: UserProfile) => {
    localStorage.setItem("loggedInUser", JSON.stringify(userData));
    mutate(userData, false);
  };

  const logout = () => {
    localStorage.removeItem("loggedInUser");
    mutate(null, false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading: !isHydrated || isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
