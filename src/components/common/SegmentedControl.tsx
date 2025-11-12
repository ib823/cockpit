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
      className={`inline-flex items-center gap-0 bg-gray-100 rounded-lg p-1 ${className}`}
      style={{
        backgroundColor: "var(--color-gray-6)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-xs)",
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="relative px-6 py-2 rounded-md transition-all duration-200 flex items-center gap-2"
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "var(--text-body)",
              fontWeight: "var(--weight-regular)",
              padding: "var(--space-sm) var(--space-lg)",
              borderRadius: "var(--radius-sm)",
              backgroundColor: isSelected ? "var(--color-bg-primary)" : "transparent",
              border: isSelected ? "1px solid var(--color-gray-4)" : "1px solid transparent",
              boxShadow: isSelected ? "var(--shadow-sm)" : "none",
              opacity: isSelected ? 1 : 0.6,
              color: "var(--ink)",
              cursor: "pointer",
              transition: "all var(--duration-default) var(--easing-default)",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.opacity = "0.8";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.opacity = "0.6";
              }
            }}
          >
            {option.icon && (
              <span style={{ display: "flex", alignItems: "center" }}>
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
