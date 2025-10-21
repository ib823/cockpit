/**
 * Input Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';

const { TextArea: AntTextArea } = AntInput;

export interface InputProps extends Omit<AntInputProps, 'size' | 'status'> {
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'error' | 'success';
}

const sizeMap = {
  sm: 'small' as const,
  md: 'middle' as const,
  lg: 'large' as const,
};

export const Input = React.forwardRef<any, InputProps>(function Input(
  {
    size = 'md',
    state = 'default',
    className,
    ...props
  },
  ref
) {
  const status = state === 'error' ? 'error' : state === 'success' ? 'warning' : undefined;

  return (
    <AntInput
      ref={ref}
      size={sizeMap[size]}
      status={status}
      className={className}
      {...props}
    />
  );
});

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  state?: 'default' | 'error' | 'success';
  rows?: number;
}

export const TextArea = React.forwardRef<any, TextAreaProps>(function TextArea(
  {
    state = 'default',
    className,
    rows = 4,
    ...props
  },
  ref
) {
  const status = state === 'error' ? 'error' : state === 'success' ? 'warning' : undefined;

  return (
    <AntTextArea
      ref={ref}
      status={status}
      rows={rows}
      className={className}
      {...(props as any)}
    />
  );
});
