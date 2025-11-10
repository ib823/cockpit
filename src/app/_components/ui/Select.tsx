/**
 * Select Component - Minimal select dropdown
 */

import { clsx } from "clsx";
import React from "react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    return (
      <div className={clsx("flex flex-col gap-1.5", className)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--ink)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={clsx(
            "w-full h-10 rounded-[var(--r-md)] border bg-[var(--surface)] text-[var(--ink)] text-sm",
            "px-3 pr-8",
            "transition-all duration-[var(--dur)] ease-[var(--ease)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-0",
            "appearance-none bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat",
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)]"
              : "border-[var(--line)] hover:border-[var(--ink-muted)] focus:border-[var(--focus)]",
            disabled && "opacity-50 cursor-not-allowed bg-[var(--surface-sub)]"
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[var(--ink-muted)]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
