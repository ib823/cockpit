/**
 * Tooltip Component
 *
 * Simple tooltip using CSS-only approach for basic tooltips
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TooltipTrigger({ children, ...props }: any) {
  return React.cloneElement(children, props);
}

export function TooltipContent({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div
      className={cn(
        "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg",
        "dark:bg-gray-700 max-w-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SimpleTooltip({ children, content, side = "top", className }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg",
            "dark:bg-gray-700 whitespace-nowrap",
            positionClasses[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
