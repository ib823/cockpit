/**
 * Checkbox Component - Minimal checkbox with label
 */

'use client';

import { clsx } from 'clsx';
import React from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, className, disabled, id, ...props }, ref) => {
    //const checkboxId = id || `checkbox-${React.useId()}`;
    const generatedId = React.useId();
    const id = providedId || generatedId;
    return (
      <div className={clsx('flex flex-col gap-1', className)}>
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            className={clsx(
              'mt-0.5 w-4 h-4 rounded-[var(--r-sm)] border-[var(--line)]',
              'text-[var(--accent)] bg-[var(--surface)]',
              'focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-0',
              'transition-all duration-[var(--dur)] ease-[var(--ease)]',
              'cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className={clsx(
                'text-sm text-[var(--ink)] cursor-pointer select-none',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {helperText && (
          <p className="text-xs text-[var(--ink-muted)] ml-6">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
