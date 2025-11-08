import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
  className
}) => (
  <label className={`inline-flex items-center gap-3 select-none ${className || ''}`}>
    {label && <span className="text-sm text-[var(--ink)]">{label}</span>}
    <span
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => !disabled && ((e.key === ' ' || e.key === 'Enter') && onChange(!checked))}
      className={`relative w-11 h-6 rounded-full border transition ${
        checked
          ? 'bg-[var(--accent)] border-transparent'
          : 'bg-[var(--canvas)] border-[var(--line)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-[var(--shadow-sm)] transition ${
          checked ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
        }`}
      />
    </span>
  </label>
);
