import React from "react";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans py-1 overflow-x-auto whitespace-nowrap">
      <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
        <Home className="h-3.5 w-3.5" />
        ERP Core
      </span>
      
      {items.map((item, index) => (
        <React.Fragment key={`breadcrumb-${index}`}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-sky-500 font-medium text-slate-600 dark:text-slate-300 transition"
              onClick={(e) => {
                // Prevent real reloading in iframe SPA representation
                e.preventDefault();
              }}
            >
              {item.label}
            </a>
          ) : (
            <span className="font-bold text-slate-900 dark:text-slate-100 font-sans shrink-0">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
