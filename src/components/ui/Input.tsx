import React from "react";

interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

// -------------------------------------------------------------
// TEXT/NUMBER INPUT
// -------------------------------------------------------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FormFieldProps {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, description, error, required, type = "text", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={props.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-950
            border ${error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-800/80 focus:border-sky-500 focus:ring-sky-500/20"}
            text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
            shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-0 transition duration-150
            disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:opacity-75 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {description && !error && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
        )}
        {error && (
          <p className="text-[10px] text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// -------------------------------------------------------------
// SELECT DROPDOWN
// -------------------------------------------------------------
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FormFieldProps {
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, description, error, required, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={props.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-950
            border ${error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-800/80 focus:border-sky-500 focus:ring-sky-500/20"}
            text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition duration-150
            disabled:opacity-75 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-950">
              {opt.label}
            </option>
          ))}
        </select>
        {description && !error && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
        )}
        {error && (
          <p className="text-[10px] text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// -------------------------------------------------------------
// TEXTAREA
// -------------------------------------------------------------
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FormFieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, description, error, required, rows = 3, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={props.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`
            w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-950
            border ${error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-800/80 focus:border-sky-500 focus:ring-sky-500/20"}
            text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
            shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-0 transition duration-150
            disabled:opacity-75 disabled:cursor-not-allowed resize-y
            ${className}
          `}
          {...props}
        />
        {description && !error && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
        )}
        {error && (
          <p className="text-[10px] text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// -------------------------------------------------------------
// CHECKBOX
// -------------------------------------------------------------
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, description, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            ref={ref}
            className={`
              h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-sky-600 focus:ring-sky-500/30 
              cursor-pointer accent-sky-500 mt-0.5 transition duration-150
              ${className}
            `}
            {...props}
          />
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              {label}
            </label>
            {description && !error && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </div>
        {error && (
          <p className="text-[10px] text-red-500 font-medium ml-6">{error}</p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
