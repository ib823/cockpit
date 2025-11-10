/**
 * Tooltip Component - Simple, accessible tooltip
 * Max width 280px, subtle shadow
 */

"use client";

import React, { useState } from "react";
import { clsx } from "clsx";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  delay = 300,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const placementClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-flex">
      {React.cloneElement(children, {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        "aria-describedby": isVisible ? "tooltip" : undefined,
      })}
      {isVisible && (
        <div
          id="tooltip"
          role="tooltip"
          className={clsx(
            "absolute z-[var(--z-tooltip)] px-3 py-2 max-w-[280px]",
            "text-xs text-[var(--ink)] bg-[var(--surface)] border border-[var(--line)]",
            "rounded-[var(--r-md)] shadow-[var(--shadow-md)]",
            "animate-fade-in pointer-events-none",
            placementClasses[placement],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
