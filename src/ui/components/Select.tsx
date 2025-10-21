/**
 * Select Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Select as AntSelect } from 'antd';
import type { SelectProps as AntSelectProps } from 'antd';

type Option = { value: string; label: string; disabled?: boolean };

export type SelectProps = {
  options: Option[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

const sizeMap = {
  sm: 'small' as const,
  md: 'middle' as const,
  lg: 'large' as const,
};

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  size = 'md',
  disabled,
  searchable = false,
  className,
  ...rest
}) => {
  return (
    <AntSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size={sizeMap[size]}
      disabled={disabled}
      showSearch={searchable}
      className={className}
      style={{ minWidth: 200, width: '100%' }}
      options={options}
      filterOption={
        searchable
          ? (input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          : undefined
      }
      {...rest}
    />
  );
};
