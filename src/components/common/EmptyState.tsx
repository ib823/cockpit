/**
 * EmptyState - Apple HIG compliant empty state component
 * Section 8: Interaction Patterns - Empty States
 *
 * Structure (per Apple HIG):
 * 1. Illustration/Icon (SF Symbol in circular gray background)
 * 2. Heading (20pt semibold, Display Small)
 * 3. Description (13pt body text, 60% opacity)
 * 4. Primary Action (optional, 44px height)
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { SFSymbol, SFSymbolName } from "./SFSymbol";
import { Button } from "antd";

interface EmptyStateProps {
  /** Lucide icon (legacy support) */
  icon?: LucideIcon;
  /** SF Symbol name (preferred) */
  sfIcon?: SFSymbolName;
  /** Main heading text */
  title: string;
  /** Descriptive text explaining the empty state */
  description?: string;
  /** Optional primary action */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState component - Apple HIG compliant
 * Displays when content is unavailable or no items match filters
 */
export function EmptyState({
  icon: Icon,
  sfIcon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "var(--space-3xl)",
        minHeight: "320px",
        backgroundColor: "var(--color-bg-secondary)",
        borderRadius: "var(--radius-lg)",
      }}
      role="status"
      aria-live="polite"
    >
      {/* Icon/Illustration - 64x64px circle with gray background */}
      {(Icon || sfIcon) && (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--color-gray-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--space-lg)",
          }}
        >
          {sfIcon ? (
            <SFSymbol name={sfIcon} size={32} opacity={0.4} />
          ) : Icon ? (
            <Icon size={32} style={{ opacity: 0.4, color: "var(--ink)" }} />
          ) : null}
        </div>
      )}

      {/* Heading - Display Small (20pt) semibold */}
      <h3
        style={{
          fontSize: "var(--text-display-small)",
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: "var(--space-sm)",
        }}
      >
        {title}
      </h3>

      {/* Description - Body (13pt) with 60% opacity */}
      {description && (
        <p
          style={{
            fontSize: "var(--text-body)",
            color: "var(--ink)",
            opacity: 0.6,
            maxWidth: "420px",
            marginBottom: "var(--space-lg)",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-md)",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {action && (
            <Button
              type={action.variant === "primary" ? "primary" : "default"}
              size="large"
              onClick={action.onClick}
              style={{
                height: "var(--button-height-lg)",
                ...(action.variant === "primary" && {
                  backgroundColor: "var(--color-blue)",
                  borderColor: "var(--color-blue)",
                }),
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
              }}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="large"
              onClick={secondaryAction.onClick}
              style={{
                height: "var(--button-height-lg)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
