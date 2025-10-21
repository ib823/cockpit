/**
 * Input Component - Ant Design wrapper
 */

import React from 'react';
import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';

export interface InputProps extends AntInputProps {
  className?: string;
}

export const Input = React.forwardRef<any, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <AntInput
        ref={ref}
        type={type}
        className={className}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
