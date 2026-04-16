import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface/60 mb-1 px-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full bg-on-surface/5 border-b-2 border-transparent px-4 py-3 rounded-t-lg font-sans text-on-surface",
          "placeholder:text-on-surface/40 outline-none transition-all duration-200",
          "focus:border-primary focus:bg-on-surface/10",
          className
        )}
        {...props}
      />
    </div>
  );
}
