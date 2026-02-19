/**
 * Segmented Control Component
 *
 * Apple HIG Specification - EXACT implementation from UI_suggestion.md
 * Used for view toggles (Quarter/Month/Week, Matrix/Timeline/Hybrid, etc.)
 *
 * Spec Requirements:
 * - Auto-size based on content + 24px padding each
 * - Selected state: White background, 1px border, subtle shadow
 * - Unselected state: Transparent, opacity: 0.6
 * - Typography: SF Pro Text 13pt Regular
 * - Smooth transitions
 */

"use client";

import React from "react";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps) {
  return (
    <div
      className={`inline-flex items-center gap-0 bg-[var(--color-gray-6)] rounded-[var(--radius-md)] p-[var(--space-4)] ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative flex items-center gap-2 cursor-pointer
              font-[var(--font-text)] text-[var(--text-body)] font-normal
              py-[var(--space-8)] px-[var(--space-24)]
              rounded-[var(--radius-sm)]
              text-[var(--ink)]
              transition-all duration-[var(--duration-default)] ease-[var(--easing-default)]
              ${isSelected
                ? "bg-[var(--color-bg-primary)] border border-[var(--color-gray-4)] shadow-[var(--shadow-sm)] opacity-100"
                : "bg-transparent border border-transparent opacity-60 hover:opacity-80"
              }
            `}
          >
            {option.icon && (
              <span className="flex items-center">
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
