/**
 * ResponsiveShell Component
 *
 * Enforces consistent responsive layout across all pages
 */

import React from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveShellProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  as?: "div" | "main" | "section" | "article";
}

export function ResponsiveShell({
  children,
  className,
  maxWidth = "xl",
  padding = "md",
  as: Component = "div",
}: ResponsiveShellProps) {
  const maxWidthClasses = {
    sm: "max-w-container-sm",
    md: "max-w-container-md",
    lg: "max-w-container-lg",
    xl: "max-w-container-xl",
    "2xl": "max-w-container-2xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    none: "",
    sm: "px-4 py-3 sm:px-6 sm:py-4",
    md: "px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
    lg: "px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10",
    xl: "px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12",
  };

  return (
    <Component
      className={cn(
        "w-full mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        "print:max-w-full print:px-0 print:py-0",
        className
      )}
    >
      {children}
    </Component>
  );
}

export interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

export function ResponsiveStack({ children, className, spacing = "md" }: ResponsiveStackProps) {
  const spacingClasses = {
    none: "space-y-0",
    xs: "space-y-1 sm:space-y-2",
    sm: "space-y-2 sm:space-y-4",
    md: "space-y-4 sm:space-y-4 lg:space-y-6",
    lg: "space-y-4 sm:space-y-6 lg:space-y-8",
    xl: "space-y-6 sm:space-y-8 lg:space-y-10",
    "2xl": "space-y-8 sm:space-y-10 lg:space-y-12",
  };

  return <div className={cn("flex flex-col", spacingClasses[spacing], className)}>{children}</div>;
}

export interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: boolean;
  border?: boolean;
}

export function ResponsiveCard({
  children,
  className,
  padding = "md",
  shadow = true,
  border = true,
}: ResponsiveCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={cn(
        "rounded-lg bg-card",
        paddingClasses[padding],
        shadow && "shadow-sm hover:shadow-md transition-shadow",
        border && "border border-border",
        "print:shadow-none print:border print:border-gray-300",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "none" | "xs" | "sm" | "md" | "lg";
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, md: 2, lg: 3 },
  gap = "md",
}: ResponsiveGridProps) {
  const colClasses = `grid-cols-${cols.default || 1} ${cols.sm ? `sm:grid-cols-${cols.sm}` : ""} ${cols.md ? `md:grid-cols-${cols.md}` : ""} ${cols.lg ? `lg:grid-cols-${cols.lg}` : ""} ${cols.xl ? `xl:grid-cols-${cols.xl}` : ""}`;

  const gapClasses = {
    none: "gap-0",
    xs: "gap-2",
    sm: "gap-4 sm:gap-4",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
  };

  return <div className={cn("grid", colClasses, gapClasses[gap], className)}>{children}</div>;
}
