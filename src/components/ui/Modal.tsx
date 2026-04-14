"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

import { Portal } from "./Portal";

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
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
        <div 
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300" 
          onClick={onClose} 
        />
        <div className={clsx(
          "bg-surface w-full rounded-3xl shadow-2xl relative z-[10000] flex flex-col max-h-[90vh] mx-4 sm:mx-6 overflow-hidden",
          maxWidth
        )}>
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-on-surface/5 flex-shrink-0">
            <h2 className="font-display text-2xl font-black text-primary tracking-tight">{title}</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-on-surface/5 rounded-xl transition-colors text-on-surface/40 hover:text-on-surface"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 md:p-10 custom-scrollbar-reports flex-grow">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
}
