/**
 * Button Component - Minimalist, Apple-inspired
 * Zero inline styles. Size variants: sm (32px), md (40px), lg (48px)
 * Full WCAG 2.1 AA accessibility compliance with proper focus management
 */

import { clsx } from 'clsx';
import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className,
      disabled,
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseClasses = clsx(
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all duration-[var(--dur)] ease-[var(--ease)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      fullWidth && 'w-full'
    );

    const variantClasses = {
      primary: clsx(
        'bg-[var(--accent)] text-white',
        'hover:bg-[var(--accent-strong)] active:scale-[0.98]',
        'focus-visible:ring-[var(--accent)]',
        'shadow-sm hover:shadow-md active:shadow-sm'
      ),
      ghost: clsx(
        'bg-transparent text-[var(--ink)]',
        'hover:bg-[var(--surface-sub)] active:scale-[0.98]',
        'focus-visible:ring-[var(--ink-muted)]'
      ),
      subtle: clsx(
        'bg-[var(--surface-sub)] text-[var(--ink)] border border-[var(--line)]',
        'hover:border-[var(--ink-muted)] active:scale-[0.98]',
        'focus-visible:ring-[var(--ink-muted)]'
      ),
      danger: clsx(
        'bg-[var(--danger)] text-white',
        'hover:bg-[color-mix(in_srgb,var(--danger)_80%,black)] active:scale-[0.98]',
        'focus-visible:ring-[var(--danger)]',
        'shadow-sm hover:shadow-md active:shadow-sm'
      ),
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-[var(--r-sm)]',
      md: 'h-10 px-4 text-sm rounded-[var(--r-md)]',
      lg: 'h-12 px-5 text-base rounded-[var(--r-md)]',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-label={ariaLabel}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            role="status"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
            <span className="sr-only">Loading...</span>
          </svg>
        )}
        {!isLoading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';