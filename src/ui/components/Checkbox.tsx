import React from "react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "checked"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  "aria-describedby"?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled,
  className,
  ...rest
}) => (
  <label
    className={`inline-flex items-center gap-2 select-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${className || ""}`}
  >
    <input
      type="checkbox"
      className="sr-only"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      {...rest}
    />
    <span
      className={`grid place-items-center w-5 h-5 rounded-[8px] border transition ${
        checked
          ? "bg-[var(--accent)] border-transparent text-white"
          : "bg-[var(--surface)] border-[var(--line)] text-transparent"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24">
        <path
          d="M20 6L9 17l-5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    {label && <span className="text-sm text-[var(--ink)]">{label}</span>}
  </label>
);
