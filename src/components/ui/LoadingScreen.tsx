import React from "react";
import { Cpu, Loader2 } from "lucide-react";

export interface LoadingScreenProps {
  type?: "full" | "inline" | "skeleton";
  rows?: number;
}

export function LoadingScreen({ type = "inline", rows = 3 }: LoadingScreenProps) {
  if (type === "full") {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 z-200">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
          <Cpu className="h-5 w-5 text-white absolute" />
        </div>
        <div className="text-center flex flex-col gap-1">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase font-mono">CELCOM ERP PRO</h3>
          <p className="text-xs text-slate-400 font-sans">Connecting to Nairobi headend & relational SQL clusters...</p>
        </div>
      </div>
    );
  }

  if (type === "skeleton") {
    return (
      <div className="w-full flex flex-col gap-4 p-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={`skeleton-row-${idx}`} className="h-12 bg-slate-100 dark:bg-slate-900/60 rounded w-full border border-slate-200/50 dark:border-slate-800/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
      <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">Loading data structures...</span>
    </div>
  );
}

export default LoadingScreen;
