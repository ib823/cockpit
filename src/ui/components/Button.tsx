/**
 * Button Component - Ant Design wrapper
 * Maintains API compatibility with previous custom implementation
 */

import React from 'react';
import { Button as AntButton, theme } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

const { useToken } = theme;

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  htmlType?: 'button' | 'submit' | 'reset';
}

const variantMap: Record<ButtonVariant, AntButtonProps['type']> = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'text',
  danger: 'primary',
};

const sizeMap: Record<ButtonSize, AntButtonProps['size']> = {
  xs: 'small',
  sm: 'small',
  md: 'middle',
  lg: 'large',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  block,
  icon,
  children,
  className,
  disabled,
  htmlType = 'button',
  ...props
}) => {
  const { token } = useToken();

  return (
    <AntButton
      type={variantMap[variant]}
      size={sizeMap[size]}
      loading={loading}
      block={block}
      icon={icon}
      disabled={disabled}
      danger={variant === 'danger'}
      className={className}
      htmlType={htmlType}
      style={
        size === 'xs'
          ? {
              height: token.controlHeightSM - 8,
              padding: `0 ${token.paddingXS}px`,
              fontSize: token.fontSizeSM,
            }
          : undefined
      }
      {...(props as any)}
    >
      {children}
    </AntButton>
  );
};
