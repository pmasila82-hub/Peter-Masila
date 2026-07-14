import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) {
  const startRecord = (currentPage - 1) * rowsPerPage + 1;
  const endRecord = Math.min(currentPage * rowsPerPage, totalRecords);

  return (
    <div className="w-full bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 px-4 py-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
      {/* Records Count Indicators */}
      <div className="text-xs text-slate-500 dark:text-slate-400 font-sans">
        Showing <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{totalRecords === 0 ? 0 : startRecord}</span> to{" "}
        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{endRecord}</span> of{" "}
        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{totalRecords}</span> entries
      </div>

      {/* Page Actions */}
      <div className="flex items-center gap-4">
        {onRowsPerPageChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans">
            <span>Rows:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
              className="bg-transparent border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 outline-none font-mono text-slate-700 dark:text-slate-300"
            >
              <option value="5" className="bg-white dark:bg-slate-900">5</option>
              <option value="10" className="bg-white dark:bg-slate-900">10</option>
              <option value="25" className="bg-white dark:bg-slate-900">25</option>
              <option value="50" className="bg-white dark:bg-slate-900">50</option>
            </select>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs text-slate-600 dark:text-slate-400 px-2 font-mono">
            Page <span className="font-bold text-slate-900 dark:text-slate-200">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-900 dark:text-slate-200">{totalPages || 1}</span>
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pagination;
