/**
 * Segmented Control - Apple-like pill segmented control
 * Equal width segments, subtle active state with inner shadow
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface SegmentedOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Segmented: React.FC<SegmentedProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center p-1 rounded-[var(--r-full)] border border-[color-mix(in_oklab,var(--ink)_10%,transparent)] bg-[var(--surface-sub)]',
        fullWidth && 'flex w-full',
        className
      )}
      role="tablist"
      aria-label="Segmented control"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const isDisabled = option.disabled;

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            className={clsx(
              'flex-1 inline-flex items-center justify-center gap-2 font-medium rounded-[var(--r-full)] transition-all duration-[var(--dur)] ease-[var(--ease)]',
              sizeClasses[size],
              'px-4 min-w-[80px]',
              isActive &&
                'bg-[var(--surface)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] text-[var(--ink)]',
              !isActive && 'text-[var(--ink-dim)] hover:text-[var(--ink)]',
              isDisabled && 'opacity-50 cursor-not-allowed',
              !isDisabled && 'cursor-pointer'
            )}
            onClick={() => !isDisabled && onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                !isDisabled && onChange(option.value);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const currentIndex = options.findIndex((o) => o.value === value);
                const nextIndex = (currentIndex + 1) % options.length;
                const nextOption = options[nextIndex];
                if (!nextOption.disabled) {
                  onChange(nextOption.value);
                }
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentIndex = options.findIndex((o) => o.value === value);
                const prevIndex = (currentIndex - 1 + options.length) % options.length;
                const prevOption = options[prevIndex];
                if (!prevOption.disabled) {
                  onChange(prevOption.value);
                }
              }
            }}
          >
            {option.icon && <span aria-hidden="true">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
