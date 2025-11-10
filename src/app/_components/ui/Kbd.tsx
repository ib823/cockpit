/**
 * Kbd Component - Keyboard key display
 * For showing keyboard shortcuts
 */

import React from "react";
import { clsx } from "clsx";

export interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className }) => {
  return (
    <kbd
      className={clsx(
        "inline-flex items-center justify-center",
        "px-2 py-1 min-w-[1.75rem] h-6",
        "text-xs font-medium font-mono",
        "text-[var(--ink-dim)] bg-[var(--surface-sub)]",
        "border border-[var(--line)] rounded-[var(--r-sm)]",
        "shadow-[0_1px_0_var(--line)]",
        className
      )}
    >
      {children}
    </kbd>
  );
};
