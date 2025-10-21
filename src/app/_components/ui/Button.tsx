/**
 * Button Component - Ant Design wrapper
 * Apple-inspired minimalist design compatibility layer
 */

'use client';

import React from 'react';
import { Button as AntButton } from 'antd';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  htmlType?: 'button' | 'submit' | 'reset';
}

const variantMap = {
  primary: 'primary' as const,
  ghost: 'text' as const,
  subtle: 'default' as const,
  danger: 'primary' as const,
};

const sizeMap = {
  sm: 'small' as const,
  md: 'middle' as const,
  lg: 'large' as const,
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className,
      disabled,
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth,
      htmlType = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    return (
      <AntButton
        ref={ref as any}
        type={variantMap[variant]}
        size={sizeMap[size]}
        loading={isLoading}
        disabled={disabled}
        danger={variant === 'danger'}
        icon={leftIcon}
        block={fullWidth}
        className={className}
        htmlType={htmlType}
        aria-label={ariaLabel}
        {...(props as any)}
      >
        {children}
        {!isLoading && rightIcon && <span style={{ marginLeft: 8 }}>{rightIcon}</span>}
      </AntButton>
    );
  }
);

Button.displayName = 'Button';
