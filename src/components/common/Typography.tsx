/**
 * TYPOGRAPHY COMPONENTS - Steve Jobs Design System
 *
 * "Typography is the craft of endowing human language with a durable visual form."
 *
 * A strict typographic scale based on modular typography (1.5x ratio).
 * All text in the app should use these components for consistency.
 */

import { cn } from "@/lib/utils";
import React from "react";

// ============================================================================
// TYPOGRAPHY SCALE (Modular Scale: 1.5x ratio)
// ============================================================================

const typographyStyles = {
  // Display text (hero sections, landing pages)
  display: {
    xl: "text-6xl font-light tracking-tight leading-none",   // 60px
    lg: "text-5xl font-light tracking-tight leading-tight",  // 48px
    md: "text-4xl font-light tracking-tight leading-tight",  // 36px
  },

  // Headings (page sections, cards)
  heading: {
    h1: "text-3xl font-semibold tracking-tight leading-tight",  // 30px
    h2: "text-2xl font-semibold tracking-tight leading-snug",   // 24px
    h3: "text-xl font-semibold leading-snug",                   // 20px
    h4: "text-lg font-semibold leading-normal",                 // 18px
  },

  // Body text (paragraphs, descriptions)
  body: {
    xl: "text-lg font-normal leading-relaxed",      // 18px
    lg: "text-base font-normal leading-relaxed",    // 16px
    md: "text-sm font-normal leading-normal",       // 14px
    sm: "text-xs font-normal leading-normal",       // 12px
  },

  // Labels (form labels, badges, metadata)
  label: {
    lg: "text-sm font-medium leading-tight",                    // 14px
    md: "text-xs font-medium leading-tight",                    // 12px
    sm: "text-xs font-medium uppercase tracking-wider leading-tight", // 12px
  },

  // Code/Monospace (technical info)
  code: {
    lg: "text-sm font-mono leading-relaxed",        // 14px
    md: "text-xs font-mono leading-relaxed",        // 12px
  },
} as const;

// ============================================================================
// COLOR VARIANTS
// ============================================================================

const textColors = {
  primary: "text-gray-900",
  secondary: "text-gray-600",
  tertiary: "text-gray-500",
  muted: "text-gray-400",
  inverse: "text-white",
  success: "text-success-600",
  warning: "text-warning-600",
  error: "text-error-600",
  info: "text-primary-600",
  accent: "text-accent-600",
} as const;

// ============================================================================
// BASE COMPONENT INTERFACE
// ============================================================================

interface BaseTypographyProps {
  children: React.ReactNode;
  className?: string;
  color?: keyof typeof textColors;
}

// ============================================================================
// DISPLAY COMPONENTS (Hero text)
// ============================================================================

export function DisplayXL({ children, className, color = "primary" }: BaseTypographyProps) {
  return (
    <h1 className={cn(typographyStyles.display.xl, textColors[color], className)}>
      {children}
    </h1>
  );
}

export function DisplayLG({ children, className, color = "primary" }: BaseTypographyProps) {
  return (
    <h1 className={cn(typographyStyles.display.lg, textColors[color], className)}>
      {children}
    </h1>
  );
}

export function DisplayMD({ children, className, color = "primary" }: BaseTypographyProps) {
  return (
    <h1 className={cn(typographyStyles.display.md, textColors[color], className)}>
      {children}
    </h1>
  );
}

// ============================================================================
// HEADING COMPONENTS
// ============================================================================

export function Heading1({ children, className, color = "primary", as = "h1" }: BaseTypographyProps & { as?: "h1" | "h2" | "h3" | "div" }) {
  const Component = as;
  return (
    <Component className={cn(typographyStyles.heading.h1, textColors[color], className)}>
      {children}
    </Component>
  );
}

export function Heading2({ children, className, color = "primary", as = "h2" }: BaseTypographyProps & { as?: "h1" | "h2" | "h3" | "div" }) {
  const Component = as;
  return (
    <Component className={cn(typographyStyles.heading.h2, textColors[color], className)}>
      {children}
    </Component>
  );
}

export function Heading3({ children, className, color = "primary", as = "h3" }: BaseTypographyProps & { as?: "h2" | "h3" | "h4" | "div" }) {
  const Component = as;
  return (
    <Component className={cn(typographyStyles.heading.h3, textColors[color], className)}>
      {children}
    </Component>
  );
}

export function Heading4({ children, className, color = "primary", as = "h4" }: BaseTypographyProps & { as?: "h3" | "h4" | "h5" | "div" }) {
  const Component = as;
  return (
    <Component className={cn(typographyStyles.heading.h4, textColors[color], className)}>
      {children}
    </Component>
  );
}

// ============================================================================
// BODY TEXT COMPONENTS
// ============================================================================

export function BodyXL({ children, className, color = "secondary" }: BaseTypographyProps) {
  return (
    <p className={cn(typographyStyles.body.xl, textColors[color], className)}>
      {children}
    </p>
  );
}

export function BodyLG({ children, className, color = "secondary" }: BaseTypographyProps) {
  return (
    <p className={cn(typographyStyles.body.lg, textColors[color], className)}>
      {children}
    </p>
  );
}

export function BodyMD({ children, className, color = "secondary" }: BaseTypographyProps) {
  return (
    <p className={cn(typographyStyles.body.md, textColors[color], className)}>
      {children}
    </p>
  );
}

export function BodySM({ children, className, color = "tertiary" }: BaseTypographyProps) {
  return (
    <p className={cn(typographyStyles.body.sm, textColors[color], className)}>
      {children}
    </p>
  );
}

// ============================================================================
// LABEL COMPONENTS
// ============================================================================

export function LabelLG({ children, className, color = "primary" }: BaseTypographyProps) {
  return (
    <span className={cn(typographyStyles.label.lg, textColors[color], className)}>
      {children}
    </span>
  );
}

export function LabelMD({ children, className, color = "secondary" }: BaseTypographyProps) {
  return (
    <span className={cn(typographyStyles.label.md, textColors[color], className)}>
      {children}
    </span>
  );
}

export function LabelSM({ children, className, color = "tertiary" }: BaseTypographyProps) {
  return (
    <span className={cn(typographyStyles.label.sm, textColors[color], className)}>
      {children}
    </span>
  );
}

// ============================================================================
// CODE COMPONENTS
// ============================================================================

export function CodeLG({ children, className }: BaseTypographyProps) {
  return (
    <code className={cn(typographyStyles.code.lg, "bg-gray-100 px-2 py-0.5 rounded", className)}>
      {children}
    </code>
  );
}

export function CodeMD({ children, className }: BaseTypographyProps) {
  return (
    <code className={cn(typographyStyles.code.md, "bg-gray-100 px-1.5 py-0.5 rounded", className)}>
      {children}
    </code>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Muted text (fine print, metadata)
 */
export function Muted({ children, className }: BaseTypographyProps) {
  return (
    <p className={cn(typographyStyles.body.sm, textColors.muted, className)}>
      {children}
    </p>
  );
}

/**
 * Link component with proper styling
 */
export function Link({
  children,
  href,
  className,
  external = false,
}: BaseTypographyProps & { href: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline transition-colors",
        className
      )}
    >
      {children}
    </a>
  );
}

// ============================================================================
// EXPORT ALL STYLES (for use in cn() utility)
// ============================================================================

export { typographyStyles, textColors };
