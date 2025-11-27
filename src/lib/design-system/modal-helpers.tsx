/**
 * Modal Form Helpers - Reusable Components for BaseModal
 *
 * Consistent form field rendering across all modals following Apple HIG standards
 * Design Philosophy (Jobs/Ive):
 * - One way to do things (consistency)
 * - Beautiful by default (design tokens)
 * - Accessible by design (ARIA, keyboard nav)
 *
 * Created: 2025-11-16
 * Purpose: Global consistency across modal migrations
 */

"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "@/lib/design-system/tokens";

// ============================================================================
// FORM LABEL
// ============================================================================

interface FormLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FormLabel({ htmlFor, children, required = false }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontFamily: TYPOGRAPHY.fontFamily.text,
        fontSize: TYPOGRAPHY.fontSize.caption,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text.secondary,
        marginBottom: SPACING[2],
      }}
    >
      {children}
      {required && <span style={{ color: COLORS.red, marginLeft: SPACING[1] }}>*</span>}
    </label>
  );
}

// ============================================================================
// TEXT INPUT
// ============================================================================

interface TextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: "text" | "date" | "number" | "email" | "tel" | "url";
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoFocus?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  disabled = false,
  min,
  max,
  step,
  autoFocus = false,
  onBlur,
  onFocus,
}: TextInputProps) {
  return (
    <div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        autoFocus={autoFocus}
        style={{
          width: "100%",
          padding: `${SPACING[2]} ${SPACING[3]}`,
          fontFamily: TYPOGRAPHY.fontFamily.text,
          fontSize: TYPOGRAPHY.fontSize.body,
          color: disabled ? COLORS.text.disabled : COLORS.text.primary,
          backgroundColor: error ? "#FFF5F5" : COLORS.bg.primary,
          border: `1px solid ${error ? COLORS.red : COLORS.border.default}`,
          borderRadius: RADIUS.default,
          outline: "none",
          transition: "all 0.15s ease",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!error && !disabled) {
            e.target.style.borderColor = COLORS.blue;
            e.target.style.boxShadow = `0 0 0 3px ${COLORS.blueLight}`;
          }
          onFocus?.();
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? COLORS.red : COLORS.border.default;
          e.target.style.boxShadow = "none";
          onBlur?.();
        }}
      />
      {error && (
        <div
          style={{
            marginTop: SPACING[1],
            display: "flex",
            alignItems: "center",
            gap: SPACING[1],
            fontSize: TYPOGRAPHY.fontSize.caption,
            color: COLORS.red,
          }}
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEXTAREA
// ============================================================================

interface TextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

export function Textarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  helpText,
  error,
  disabled = false,
}: TextareaProps) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          width: "100%",
          padding: `${SPACING[2]} ${SPACING[3]}`,
          fontFamily: TYPOGRAPHY.fontFamily.text,
          fontSize: TYPOGRAPHY.fontSize.body,
          color: disabled ? COLORS.text.disabled : COLORS.text.primary,
          backgroundColor: error ? "#FFF5F5" : COLORS.bg.primary,
          border: `1px solid ${error ? COLORS.red : COLORS.border.default}`,
          borderRadius: RADIUS.default,
          outline: "none",
          resize: "vertical",
          transition: "all 0.15s ease",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!error && !disabled) {
            e.target.style.borderColor = COLORS.blue;
            e.target.style.boxShadow = `0 0 0 3px ${COLORS.blueLight}`;
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? COLORS.red : COLORS.border.default;
          e.target.style.boxShadow = "none";
        }}
      />
      {error && (
        <div
          style={{
            marginTop: SPACING[1],
            display: "flex",
            alignItems: "center",
            gap: SPACING[1],
            fontSize: TYPOGRAPHY.fontSize.caption,
            color: COLORS.red,
          }}
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {helpText && !error && (
        <div
          style={{
            marginTop: SPACING[1],
            fontSize: "12px",
            color: COLORS.text.tertiary,
          }}
        >
          {helpText}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SELECT DROPDOWN
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = "Select...",
  error,
  disabled = false,
}: SelectProps) {
  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: `${SPACING[2]} ${SPACING[3]}`,
          fontFamily: TYPOGRAPHY.fontFamily.text,
          fontSize: TYPOGRAPHY.fontSize.body,
          color: disabled ? COLORS.text.disabled : COLORS.text.primary,
          backgroundColor: error ? "#FFF5F5" : COLORS.bg.secondary,
          border: `1px solid ${error ? COLORS.red : COLORS.border.default}`,
          borderRadius: RADIUS.default,
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={(e) => {
          if (!error && !disabled) {
            e.target.style.backgroundColor = COLORS.bg.primary;
            e.target.style.borderColor = COLORS.blue;
            e.target.style.boxShadow = `0 0 0 3px ${COLORS.blueLight}`;
          }
        }}
        onBlur={(e) => {
          e.target.style.backgroundColor = error ? "#FFF5F5" : COLORS.bg.secondary;
          e.target.style.borderColor = error ? COLORS.red : COLORS.border.default;
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div
          style={{
            marginTop: SPACING[1],
            display: "flex",
            alignItems: "center",
            gap: SPACING[1],
            fontSize: TYPOGRAPHY.fontSize.caption,
            color: COLORS.red,
          }}
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CHECKBOX
// ============================================================================

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
}

export function Checkbox({ id, checked, onChange, label, disabled = false }: CheckboxProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{
          width: "18px",
          height: "18px",
          accentColor: COLORS.blue,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <label
        htmlFor={id}
        style={{
          fontFamily: TYPOGRAPHY.fontFamily.text,
          fontSize: TYPOGRAPHY.fontSize.body,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: disabled ? COLORS.text.disabled : COLORS.text.primary,
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
        }}
      >
        {label}
      </label>
    </div>
  );
}

// ============================================================================
// INFO BOX (for working days, warnings, etc.)
// ============================================================================

interface InfoBoxProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "info" | "warning" | "success" | "error";
}

export function InfoBox({ icon, children, variant = "info" }: InfoBoxProps) {
  const colors = {
    info: { bg: COLORS.blueLight, border: COLORS.blue, text: COLORS.text.primary },
    warning: { bg: "rgba(255, 149, 0, 0.1)", border: "#FF9500", text: COLORS.text.primary },
    success: { bg: "rgba(52, 199, 89, 0.1)", border: "#34C759", text: COLORS.text.primary },
    error: { bg: "rgba(255, 59, 48, 0.1)", border: COLORS.red, text: COLORS.text.primary },
  };

  const style = colors[variant];

  return (
    <div
      style={{
        padding: SPACING[4],
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: RADIUS.default,
        display: "flex",
        alignItems: "flex-start",
        gap: SPACING[2],
      }}
    >
      {icon && <div style={{ flexShrink: 0, color: style.border }}>{icon}</div>}
      <div
        style={{
          fontFamily: TYPOGRAPHY.fontFamily.text,
          fontSize: TYPOGRAPHY.fontSize.caption,
          color: style.text,
          lineHeight: TYPOGRAPHY.lineHeight.normal,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION (collapsible section with header)
// ============================================================================

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export function Section({
  title,
  icon,
  children,
  isCollapsible = false,
  defaultExpanded = true,
}: SectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div
      style={{
        padding: SPACING[4],
        backgroundColor: COLORS.bg.secondary,
        borderRadius: RADIUS.default,
        border: `1px solid ${COLORS.border.default}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING[2],
          marginBottom: isExpanded ? SPACING[4] : 0,
          cursor: isCollapsible ? "pointer" : "default",
        }}
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
      >
        {icon && <div style={{ color: COLORS.blue }}>{icon}</div>}
        <div
          style={{
            flex: 1,
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.body,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
          }}
        >
          {title}
        </div>
        {isCollapsible && (
          <div
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▼
          </div>
        )}
      </div>
      {isExpanded && <div>{children}</div>}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ModalFormHelpers = {
  Label: FormLabel,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  InfoBox,
  Section,
};
