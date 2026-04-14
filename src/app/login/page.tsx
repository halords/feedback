"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { BarChart2, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.user);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 bg-surface overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-tertiary/5" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-[0_12px_40px_-12px_rgba(25,28,30,0.08)]">
              <BarChart2 className="text-white w-6 h-6" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary">
            Customer Feedback System
          </h1>
          <p className="text-on-surface/60 font-medium mt-2 uppercase text-[10px] tracking-[0.1em]">
            Provincial Government of La Union
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/85 backdrop-blur-2xl border border-white/40">
          <div className="mb-8 text-center">
            <h2 className="font-display text-xl font-bold text-on-surface mb-1">
              Welcome back
            </h2>
            <p className="text-on-surface/60 text-sm">
              Please enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Input
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User className="absolute right-4 top-[38px] w-5 h-5 text-on-surface/30 group-focus-within:text-primary transition-colors" />
            </div>

            <div className="relative group">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[0.6875rem] font-bold text-on-surface/60 tracking-[0.05em] uppercase px-1">
                  Password
                </label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="absolute right-4 top-[32px] w-5 h-5 text-on-surface/30 group-focus-within:text-primary transition-colors" />
            </div>

            {error && (
              <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4"
            >
              <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
