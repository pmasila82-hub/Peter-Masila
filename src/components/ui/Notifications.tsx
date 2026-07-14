import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface NotificationContextType {
  toasts: Toast[];
  showNotification: (title: string, message: string, type: ToastType) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((title: string, message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto close in 4 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ toasts, showNotification, removeNotification }}>
      {children}
      
      {/* Visual Toast Stack container */}
      <div className="fixed bottom-6 right-6 z-150 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
              error: <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />,
              info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
              warning: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
            };

            const borderClasses = {
              success: "border-emerald-500/20 dark:border-emerald-500/10 bg-white dark:bg-emerald-950/20",
              error: "border-red-500/20 dark:border-red-500/10 bg-white dark:bg-red-950/20",
              info: "border-sky-500/20 dark:border-sky-500/10 bg-white dark:bg-sky-950/20",
              warning: "border-amber-500/20 dark:border-amber-500/10 bg-white dark:bg-amber-950/20",
            };

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                className={`
                  flex items-start gap-3.5 p-4 rounded-xl border shadow-xl
                  ${borderClasses[toast.type]}
                `}
              >
                {icons[toast.type]}
                
                <div className="flex-1 flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 font-sans">
                    {toast.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    {toast.message}
                  </p>
                </div>

                <button
                  onClick={() => removeNotification(toast.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
