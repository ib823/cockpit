/**
 * Professional Button Component
 *
 * Consistent button styling across the app with micro-interactions
 * Built on design system with proper shadows, hover states, and accessibility
 */

"use client";

import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";
/** Apple HIG-aligned button colors and utilities */
function coloredShadow(hex: string, intensity: "sm" | "md" | "lg"): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const sizes = { sm: "0 2px 8px", md: "0 4px 16px", lg: "0 8px 24px" };
  return `${sizes[intensity]} rgba(${r}, ${g}, ${b}, 0.25)`;
}

const BTN_SPACING = { 3: "0.75rem", 4: "1rem", 6: "1.5rem" } as const;
import { HexLoader } from "@/components/ui/HexLoader";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      disabled,
      children,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        height: "32px",
        padding: `0 ${BTN_SPACING[3]}`,
        className: "text-sm",
        iconSize: "w-3.5 h-3.5",
        fontSize: "14px",
      },
      md: {
        height: "40px",
        padding: `0 ${BTN_SPACING[4]}`,
        className: "text-sm",
        iconSize: "w-4 h-4",
        fontSize: "14px",
      },
      lg: {
        height: "48px",
        padding: `0 ${BTN_SPACING[6]}`,
        className: "text-base",
        iconSize: "w-5 h-5",
        fontSize: "16px",
      },
    };

    const config = sizeConfig[size];

    // Variant configurations (Apple HIG)
    const variantConfig = {
      primary: {
        bg: "#007AFF",
        hover: "#0056B3",
        text: "#ffffff",
        shadow: coloredShadow("#007AFF", "md"),
        hoverShadow: coloredShadow("#007AFF", "lg"),
      },
      secondary: {
        bg: "#AF52DE",
        hover: "#7D3ACF",
        text: "#ffffff",
        shadow: coloredShadow("#AF52DE", "md"),
        hoverShadow: coloredShadow("#AF52DE", "lg"),
      },
      ghost: {
        bg: "transparent",
        hover: "#F2F2F7",
        text: "#48484A",
        shadow: "none",
        hoverShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      },
      danger: {
        bg: "#FF3B30",
        hover: "#D70015",
        text: "#ffffff",
        shadow: coloredShadow("#FF3B30", "md"),
        hoverShadow: coloredShadow("#FF3B30", "lg"),
      },
      success: {
        bg: "#248A3D",
        hover: "#1B6E32",
        text: "#ffffff",
        shadow: coloredShadow("#248A3D", "md"),
        hoverShadow: coloredShadow("#248A3D", "lg"),
      },
    };

    const colors = variantConfig[variant];

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95 cursor-pointer"}
          ${fullWidth ? "w-full" : ""}
          ${variant === "primary" ? "focus:ring-blue-500" : ""}
          ${variant === "danger" ? "focus:ring-red-500" : ""}
          ${className}
        `}
        style={{
          height: config.height,
          padding: config.padding,
          fontSize: config.fontSize,
          backgroundColor: colors.bg,
          color: colors.text,
          border: variant === "ghost" ? "1px solid #C7C7CC" : "none",
          boxShadow: isDisabled ? "none" : colors.shadow,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled && variant !== "ghost") {
            e.currentTarget.style.boxShadow = colors.hoverShadow;
            e.currentTarget.style.backgroundColor = colors.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.boxShadow = colors.shadow;
            e.currentTarget.style.backgroundColor = colors.bg;
          }
        }}
        {...props}
      >
        {loading && <HexLoader size="sm" />}
        {!loading && icon && iconPosition === "left" && (
          <span className={config.iconSize}>{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === "right" && (
          <span className={config.iconSize}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

/**
 * IconButton - Square button for icons only
 */
export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  ...props
}: Omit<ButtonProps, "children"> & { icon: ReactNode }) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      className={`${sizeMap[size]} !p-0`}
      {...props}
    />
  );
}
