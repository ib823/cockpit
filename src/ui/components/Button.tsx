import React from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean; // full width
  icon?: React.ReactNode; // leading icon
}

const base =
  "inline-flex items-center justify-center select-none align-middle rounded-[var(--r-md)] font-medium transition-all duration-[var(--dur)] ease-[var(--ease)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-xs gap-1",
  sm: "h-9 px-3 text-sm gap-2",
  md: "h-12 px-4 text-base gap-2",
  lg: "h-14 px-5 text-base gap-2",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] active:translate-y-0",
  secondary:
    "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--accent-soft)]",
  danger: "bg-[var(--error)] text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading,
  block,
  icon,
  children,
  className,
  disabled,
  ...props
}) => (
  <button
    className={clsx(base, sizes[size], variants[variant], block && "w-full", className)}
    aria-busy={loading}
    disabled={disabled || loading}
    {...props}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span className={clsx("inline-flex items-center", loading && "opacity-70")}>{children}</span>
    {loading && (
      <svg className="ml-2 animate-spin" width="16" height="16" viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" opacity=".2" />
          <path d="M21 12a9 9 0 0 0-9-9" />
        </g>
      </svg>
    )}
  </button>
);
