import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = <FolderOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-8 py-14 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
      <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
        {icon}
      </div>
      
      <div className="max-w-xs flex flex-col gap-1.5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button variant="subtle" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
