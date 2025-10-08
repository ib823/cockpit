/**
 * Input Component - Minimalist text input
 * Light borders, 12px radius, focus ring
 */

import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${React.useId()}`;

    return (
      <div className={clsx('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--ink)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={clsx(
              'w-full h-10 rounded-[var(--r-md)] border bg-[var(--surface)] text-[var(--ink)] text-sm',
              'transition-all duration-[var(--dur)] ease-[var(--ease)]',
              'placeholder:text-[var(--ink-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-0',
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                : 'border-[var(--line)] hover:border-[var(--ink-muted)] focus:border-[var(--focus)]',
              leftIcon ? 'pl-10' : 'pl-3',
              rightIcon ? 'pr-10' : 'pr-3',
              disabled && 'opacity-50 cursor-not-allowed bg-[var(--surface-sub)]'
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-[var(--ink-muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
