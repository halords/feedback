import React from "react";
import { clsx } from "clsx";

interface Column {
  header: string;
  accessor: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
}

export function DataTable({ columns, data, isLoading }: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl bg-surface-low border border-on-surface/5">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-primary/5">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={clsx(
                  "p-4 text-[10px] font-bold uppercase tracking-widest text-on-surface/50 border-b border-on-surface/5",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((_, j) => (
                  <td key={j} className="p-4 border-b border-on-surface/5">
                    <div className="h-4 bg-on-surface/5 rounded w-full" />
                  </td>
                ))}
              </tr>
            ))
  ) : data.length === 0 ? (
    <tr>
      <td colSpan={columns.length} className="p-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-on-surface/5 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-on-surface/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-on-surface/30 font-sans italic text-sm">No records available for the selected period.</p>
        </div>
      </td>
    </tr>
          ) : (
            data.map((row, i) => (
              <tr 
                key={i} 
                className="hover:bg-on-surface/5 transition-colors duration-150 group"
              >
                {columns.map((col, j) => (
                  <td 
                    key={j} 
                    className={clsx(
                      "p-4 text-sm font-semibold text-on-surface/80 border-b border-on-surface/5",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
