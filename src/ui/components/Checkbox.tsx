/**
 * Checkbox Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Checkbox as AntCheckbox } from 'antd';
import type { CheckboxProps as AntCheckboxProps } from 'antd';

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'onChange' | 'checked'
  > {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  'aria-describedby'?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled,
  className,
  ...rest
}) => {
  return (
    <AntCheckbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={className}
      {...(rest as any)}
    >
      {label}
    </AntCheckbox>
  );
};
