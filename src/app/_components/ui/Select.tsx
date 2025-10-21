/**
 * Select Component - Ant Design wrapper with label support
 */

'use client';

import React from 'react';
import { Select as AntSelect, Space, Typography, theme } from 'antd';

const { Text } = Typography;
const { useToken } = theme;

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<any, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      className,
      disabled,
      id,
      value,
      onChange,
      placeholder,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const { token } = useToken();

    const selectComponent = (
      <AntSelect
        ref={ref}
        id={selectId}
        disabled={disabled}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        status={error ? 'error' : undefined}
        style={{ width: '100%' }}
        options={options}
        {...props}
      />
    );

    if (!label && !error && !helperText) {
      return selectComponent;
    }

    return (
      <Space direction="vertical" size={6} className={className} style={{ width: '100%' }}>
        {label && (
          <label htmlFor={selectId}>
            <Text style={{ fontSize: 14, fontWeight: 500 }}>{label}</Text>
          </label>
        )}
        {selectComponent}
        {error && (
          <Text type="danger" style={{ fontSize: token.fontSizeSM }}>
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {helperText}
          </Text>
        )}
      </Space>
    );
  }
);

Select.displayName = 'Select';
