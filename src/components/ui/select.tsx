/**
 * Select Component - Ant Design wrapper with compound component pattern
 */

'use client';

import React from 'react';
import { Select as AntSelect } from 'antd';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
}

export function Select({ value, onValueChange, children, disabled, placeholder }: SelectProps) {
  // Extract options from children
  const options: { value: string; label: React.ReactNode }[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectItem) {
      options.push({
        value: child.props.value,
        label: child.props.children,
      });
    }
  });

  return (
    <AntSelect
      value={value}
      onChange={onValueChange}
      disabled={disabled}
      placeholder={placeholder}
      style={{ width: '100%' }}
      options={options}
    />
  );
}

export function SelectTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // This is handled by Ant Select internally
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  // This is handled by Ant Select internally
  return null;
}

export function SelectContent({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is handled by Ant Select internally
  return <>{children}</>;
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}) {
  // This is used to extract options, not rendered directly
  return null;
}

// Native select fallback for forms
export function NativeSelect({
  value,
  onChange,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    >
      {children}
    </select>
  );
}
