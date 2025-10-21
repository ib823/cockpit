/**
 * Button Component - Ant Design wrapper
 */

import React from 'react';
import { Button as AntButton } from 'antd';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  htmlType?: 'button' | 'submit' | 'reset';
}

const variantMap = {
  default: 'primary' as const,
  outline: 'default' as const,
  ghost: 'text' as const,
  destructive: 'primary' as const,
};

const sizeMap = {
  sm: 'small' as const,
  md: 'middle' as const,
  lg: 'large' as const,
  icon: 'middle' as const,
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', className, htmlType = 'button', ...props }, ref) => {
    return (
      <AntButton
        ref={ref as any}
        type={variantMap[variant]}
        size={sizeMap[size]}
        danger={variant === 'destructive'}
        className={className}
        htmlType={htmlType}
        shape={size === 'icon' ? 'circle' : undefined}
        {...(props as any)}
      />
    );
  }
);

Button.displayName = 'Button';
