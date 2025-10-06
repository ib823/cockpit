/**
 * Select Component
 *
 * Simple select/dropdown component
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onValueChange,
            disabled,
          });
        }
        return child;
      })}
    </div>
  );
}

export function SelectTrigger({
  children,
  className,
  id,
  value,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input',
        'bg-background px-3 py-2 text-sm ring-offset-background',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-muted-foreground">{placeholder}</span>;
}

export function SelectContent({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  // Simple implementation - in production, use Radix UI Select
  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onValueChange,
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function SelectItem({
  value,
  children,
  onValueChange,
}: {
  value: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm',
        'outline-none hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground'
      )}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  );
}

// Native select fallback for forms
export function NativeSelect({
  value,
  onChange,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
