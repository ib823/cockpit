/**
 * Button Component - Ant Design wrapper
 * Steve Jobs Design System compatibility layer
 */

import React from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

const variantMap = {
  primary: 'primary' as const,
  secondary: 'default' as const,
  ghost: 'text' as const,
  danger: 'primary' as const,
};

const sizeMap = {
  xs: 'small' as const,
  sm: 'small' as const,
  md: 'middle' as const,
  lg: 'large' as const,
};

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  htmlType?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className,
  leftIcon,
  rightIcon,
  onClick,
  htmlType = 'button',
  ...props
}: ButtonProps) {
  return (
    <AntButton
      type={variantMap[variant]}
      size={sizeMap[size]}
      loading={loading}
      disabled={disabled}
      danger={variant === 'danger'}
      icon={leftIcon}
      className={className}
      onClick={onClick as any}
      htmlType={htmlType}
      {...(props as any)}
    >
      {children}
      {!loading && rightIcon && <span style={{ marginLeft: 8 }}>{rightIcon}</span>}
    </AntButton>
  );
}

/**
 * Icon-only button
 */
export function IconButton({
  size = 'md',
  variant = 'ghost',
  icon,
  'aria-label': ariaLabel,
  ...props
}: Omit<ButtonProps, 'children'> & {
  icon: React.ReactNode;
  'aria-label': string;
}) {
  return (
    <AntButton
      type={variantMap[variant]}
      size={sizeMap[size]}
      icon={icon}
      shape="circle"
      aria-label={ariaLabel}
      danger={variant === 'danger'}
      disabled={props.disabled}
      loading={props.loading}
      className={props.className}
      onClick={props.onClick as any}
    />
  );
}

/**
 * Button with loading text change
 */
export function LoadingButton({
  loading,
  loadingText = 'Loading...',
  children,
  ...props
}: ButtonProps & { loadingText?: string }) {
  return (
    <Button loading={loading} {...props}>
      {loading ? loadingText : children}
    </Button>
  );
}
