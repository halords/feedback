"use client";

import React, { createContext, useContext, useEffect } from "react";
import useSWR from "swr";

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  user_type: string;
  full_name: string;
  offices: string[];
  requiresPasswordChange?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (userData: UserProfile) => void;
  logout: () => Promise<void>;
  mutate: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetcher = (url: string) => fetch(url).then((res) => {
  if (res.status === 401) return null;
  return res.json().then(data => data.user);
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use SWR to manage session state synced with the server-side cookie
  const { data: user, mutate, isLoading } = useSWR<UserProfile | null>("/api/auth/me", fetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
    dedupingInterval: 10000, // Dedup requests within 10s
  });

  useEffect(() => {
    if (user?.requiresPasswordChange && typeof window !== "undefined") {
      if (window.location.pathname !== "/settings") {
        window.location.href = "/settings";
      }
    }
  }, [user]);

  const login = (userData: UserProfile) => {
    // The cookie is already set by the /api/login endpoint.
    // We just manually update the cache for immediate UI feedback.
    mutate(userData, false);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      mutate(null, false);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // fallback redirect
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: user ?? null, 
      isLoading, 
      login, 
      logout,
      mutate
    }}>
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
