"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { ShieldAlert, Loader2, Lock } from "lucide-react";

interface ArchiveOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ArchiveOverrideModal({ isOpen, onClose, onSuccess }: ArchiveOverrideModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded for now as per research, 
  // In production this should be an environment variable or secret.
  const OVERRIDE_PASSWORD = "ADMIN-GS-2024";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API delay for polish
    await new Promise(resolve => setTimeout(resolve, 800));

    if (password === OVERRIDE_PASSWORD) {
      onSuccess();
      setPassword("");
      onClose();
    } else {
      setError("Incorrect override password. Access denied.");
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Archive Override Challenge">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-900 leading-none mb-1">High-Privilege Action</p>
            <p className="text-xs font-bold text-amber-700/60 leading-tight">
              You are attempting to modify an archived period. This bypasses data integrity guardrails. 
              Please enter the Archive Protection Password to continue.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 ml-1">
              Protection Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="pl-11 h-14 rounded-2xl bg-surface-lowest border-on-surface/5 focus:ring-amber-500/20 focus:border-amber-500"
                autoFocus
              />
            </div>
            {error && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 animate-bounce">{error}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 rounded-xl font-bold h-12"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !password}
            className="flex-1 rounded-xl font-bold h-12 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock Archive"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
