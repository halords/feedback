"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-6xl" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className={clsx(
        "bg-surface w-full rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300",
        maxWidth
      )}>
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-on-surface/5">
          <h2 className="font-display text-2xl font-black text-primary tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-on-surface/5 rounded-xl transition-colors text-on-surface/40 hover:text-on-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 md:p-10 custom-scrollbar-reports">
          {children}
        </div>
      </div>
    </div>
  );
}
