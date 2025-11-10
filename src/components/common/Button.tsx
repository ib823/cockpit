/**
 * BUTTON COMPONENT - Steve Jobs Design System
 *
 * A single, perfect button component that handles all use cases.
 * "Simplicity is the ultimate sophistication." - Leonardo da Vinci (Jobs' favorite quote)
 *
 * Usage:
 *   <Button variant="primary" size="md" onClick={handleClick}>Click me</Button>
 *   <Button variant="secondary" size="sm" disabled>Disabled</Button>
 *   <Button variant="ghost" size="lg" loading>Loading...</Button>
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

const buttonVariants = {
  // Primary - Main actions (CTAs) - Uses brand primary color
  primary: `
    bg-primary-600 text-white
    hover:bg-primary-700 active:bg-primary-800
    shadow-sm hover:shadow-md
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  `,

  // Secondary - Alternative actions
  secondary: `
    bg-white text-gray-700
    border-2 border-gray-300
    hover:border-gray-400 hover:bg-gray-50
    active:bg-gray-100
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
  `,

  // Ghost - Subtle actions
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100 hover:text-gray-900
    active:bg-gray-200
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
  `,

  // Danger - Destructive actions - Uses brand error color
  danger: `
    bg-error-600 text-white
    hover:bg-error-700 active:bg-error-800
    shadow-sm hover:shadow-md
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2
  `,
} as const;

// ============================================================================
// BUTTON SIZES (8px grid system)
// ============================================================================

const buttonSizes = {
  xs: "px-3 py-1.5 text-xs rounded-lg", // 24px height - Compact UI
  sm: "px-4 py-2 text-sm rounded-lg", // 36px height - Secondary actions
  md: "px-6 py-3 text-base rounded-xl", // 48px height - Primary actions
  lg: "px-8 py-4 text-lg rounded-xl", // 56px height - Hero CTAs
} as const;

// ============================================================================
// SPINNER SIZES (matches button sizes)
// ============================================================================

const spinnerSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
} as const;

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default "primary"
   */
  variant?: keyof typeof buttonVariants;

  /**
   * Button size (follows 8px grid)
   * @default "md"
   */
  size?: keyof typeof buttonSizes;

  /**
   * Show loading spinner
   * @default false
   */
  loading?: boolean;

  /**
   * Disabled state (also disabled when loading)
   * @default false
   */
  disabled?: boolean;

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Icon on the left (optional)
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon on the right (optional)
   */
  rightIcon?: React.ReactNode;
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  className,
  leftIcon,
  rightIcon,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        // Base styles
        "font-medium inline-flex items-center justify-center gap-2",

        // Variant styles
        buttonVariants[variant],

        // Size styles
        buttonSizes[size],

        // Disabled state
        isDisabled && "opacity-50 cursor-not-allowed ",

        // Custom classes
        className
      )}
      {...props}
    >
      {/* Left icon or spinner */}
      {loading ? (
        <Loader2 className={cn(spinnerSizes[size], "animate-spin")} />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}

      {/* Button text */}
      <span>{children}</span>

      {/* Right icon (hidden when loading) */}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}

// ============================================================================
// SPECIALIZED BUTTON VARIANTS (for common use cases)
// ============================================================================

/**
 * Icon-only button (square shape)
 */
export function IconButton({
  size = "md",
  variant = "ghost",
  icon,
  "aria-label": ariaLabel,
  ...props
}: Omit<ButtonProps, "children"> & {
  icon: React.ReactNode;
  "aria-label": string;
}) {
  const sizeClass = {
    xs: "w-6 h-6 p-1",
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2",
    lg: "w-12 h-12 p-2.5",
  }[size];

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-150",
        buttonVariants[variant],
        sizeClass,
        props.disabled && "opacity-50 cursor-not-allowed",
        props.className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}

/**
 * Button with loading text change
 */
export function LoadingButton({
  loading,
  loadingText = "Loading...",
  children,
  ...props
}: ButtonProps & { loadingText?: string }) {
  return (
    <Button loading={loading} {...props}>
      {loading ? loadingText : children}
    </Button>
  );
}
