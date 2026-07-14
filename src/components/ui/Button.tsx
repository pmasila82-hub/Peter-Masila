import React from "react";
import { RefreshCw } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Shared classes
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    // Variant classes
    const variantClasses = {
      primary:
        "bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 border border-transparent shadow-sm",
      secondary:
        "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 dark:border-slate-700 shadow-sm",
      outline:
        "bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/60",
      ghost:
        "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60",
      destructive:
        "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 border border-transparent shadow-sm",
      subtle:
        "bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-950/60 border border-sky-200/50 dark:border-sky-950",
    };

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-5 py-2.5 text-base gap-2.5",
      icon: "p-2 h-9 w-9",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading && <RefreshCw className="h-4 w-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {size !== "icon" && children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
