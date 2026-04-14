"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export interface Option {
  id: string | number;
  name: string;
  status?: string;
  fullName?: string;
  [key: string]: any;
}

interface MultiSelectPillsProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function MultiSelectPills({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Select options...",
  label,
  disabled = false,
}: MultiSelectPillsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      const isMatch = option.name.toLowerCase().includes(search.toLowerCase()) || 
                     (option.fullName && option.fullName.toLowerCase().includes(search.toLowerCase()));
      const isAlreadySelected = (selectedValues || []).includes(option.name);
      return isMatch && !isAlreadySelected;
    });
  }, [options, search, selectedValues]);

  const toggleOption = (optionName: string) => {
    const currentSelected = selectedValues || [];
    if (currentSelected.includes(optionName)) {
      onChange(currentSelected.filter((v) => v !== optionName));
    } else {
      onChange([...currentSelected, optionName]);
    }
    setSearch("");
  };

  const removeOption = (optionName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentSelected = selectedValues || [];
    onChange(currentSelected.filter((v) => v !== optionName));
  };

  return (
    <div className="w-full space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface/60 px-1">
          {label}
        </label>
      )}

      <div
        className={cn(
          "relative min-h-[52px] bg-[#e0e3e5] rounded-t-lg border-b-2 border-transparent transition-all duration-200 flex flex-wrap items-center gap-2 p-3 pr-10 cursor-text",
          isOpen && "border-primary bg-[#e8ebed]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {/* Selected Pills */}
        {(selectedValues || []).map((val) => (
          <div
            key={val}
            className="flex items-center gap-1.5 bg-primary text-white pl-3 pr-1.5 py-1.5 rounded-full text-[11px] font-black animate-in scale-in duration-200 shadow-md group/pill"
          >
            <span className="truncate max-w-[150px]">{val}</span>
            <button
              type="button"
              onClick={(e) => removeOption(val, e)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Search Input */}
        <input
          type="text"
          className="flex-1 min-w-[120px] bg-transparent outline-none text-on-surface text-sm font-medium placeholder:text-on-surface/40"
          placeholder={(selectedValues || []).length === 0 ? placeholder : ""}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
        />

        {/* Dropdown Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/30">
          <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isOpen && "rotate-180")} />
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-surface-low shadow-2xl rounded-2xl border border-on-surface/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-64 overflow-y-auto custom-scrollbar-reports py-2">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.name)}
                    className="w-full px-5 py-3 text-left hover:bg-primary/5 transition-all flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-black group-hover:text-primary transition-colors",
                          option.status === "disabled" ? "text-on-surface/30" : "text-on-surface"
                        )}>{option.name}</span>
                        {option.fullName && (
                          <span className="text-[9px] text-on-surface/40 uppercase font-bold tracking-tighter">
                            {option.fullName}
                          </span>
                        )}
                    </div>
                    {option.status === "disabled" && (
                        <span className="text-[8px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-black uppercase tracking-widest">Disabled</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-on-surface/20 italic text-sm font-medium">
                  {search ? "No matching offices found" : "All available offices selected"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
