import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-surface-lowest rounded-2xl shadow-[0_12px_40px_-12px_rgba(25,28,30,0.08)] p-6 md:p-8",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
