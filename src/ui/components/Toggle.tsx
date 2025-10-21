/**
 * Toggle Component - Ant Design Switch wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Switch } from 'antd';

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
  className,
}) => {
  if (!label) {
    return (
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      className={className}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </label>
  );
};
