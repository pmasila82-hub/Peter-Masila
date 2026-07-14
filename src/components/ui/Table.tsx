import React from "react";
import { ArrowUpDown, ChevronUp, ChevronDown, RotateCw } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = "No ledger entries or database logs found.",
}: TableProps<T>) {
  
  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  return (
    <div className="w-full border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40 shadow-sm relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/50">
            <tr>
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col)}
                    className={`
                      px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans
                      ${col.sortable ? "cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800/50" : ""}
                    `}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && onSort && (
                        <span className="text-slate-400 dark:text-slate-500 shrink-0">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5 text-sky-500" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-sky-500" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-60 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={`loader-row-${rIdx}`} className="animate-pulse bg-transparent">
                  {columns.map((col) => (
                    <td key={`loader-cell-${col.key}-${rIdx}`} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <span className="p-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <RotateCw className="h-5 w-5 text-slate-400 animate-spin-slow" />
                    </span>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No records available</h4>
                    <p className="text-xs">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rIdx) => (
                <tr
                  key={`row-${rIdx}`}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    group transition hover:bg-slate-50/70 dark:hover:bg-slate-800/20
                    ${rIdx % 2 === 1 ? "bg-slate-50/20 dark:bg-slate-900/10" : "bg-transparent"}
                    ${onRowClick ? "cursor-pointer" : ""}
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={`cell-${col.key}-${rIdx}`}
                      className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-mono tracking-tight"
                    >
                      {col.render ? col.render(row, rIdx) : (row as any)[col.key]?.toString() || "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
