import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const baseStyles = "px-6 py-2.5 rounded-lg font-sans font-medium transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-br from-primary to-primary-container text-white shadow-md hover:brightness-110 active:scale-[0.98]",
    secondary: "bg-surface-low text-foreground hover:bg-gray-200",
    tertiary: "text-primary hover:bg-surface-low",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)} 
      {...props} 
    />
  );
}
