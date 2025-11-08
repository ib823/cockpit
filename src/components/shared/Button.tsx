/**
 * Professional Button Component
 *
 * Consistent button styling across the app with micro-interactions
 * Built on design system with proper shadows, hover states, and accessibility
 */

'use client';

import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { colorValues, getColoredShadow, withOpacity, spacing } from '@/lib/design-system';
import { HexLoader } from '@/components/ui/HexLoader';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        height: '32px',
        padding: `0 ${spacing[3]}`,
        fontSize: '14px',
        iconSize: 'w-3.5 h-3.5',
      },
      md: {
        height: '40px',
        padding: `0 ${spacing[4]}`,
        fontSize: '14px',
        iconSize: 'w-4 h-4',
      },
      lg: {
        height: '48px',
        padding: `0 ${spacing[6]}`,
        fontSize: '16px',
        iconSize: 'w-5 h-5',
      },
    };

    const config = sizeConfig[size];

    // Variant configurations
    const variantConfig = {
      primary: {
        bg: colorValues.primary[600],
        hover: colorValues.primary[700],
        text: '#ffffff',
        shadow: getColoredShadow(colorValues.primary[600], 'md'),
        hoverShadow: getColoredShadow(colorValues.primary[600], 'lg'),
      },
      secondary: {
        bg: colorValues.accent[600],
        hover: colorValues.accent[700],
        text: '#ffffff',
        shadow: getColoredShadow(colorValues.accent[600], 'md'),
        hoverShadow: getColoredShadow(colorValues.accent[600], 'lg'),
      },
      ghost: {
        bg: 'transparent',
        hover: colorValues.gray[100],
        text: colorValues.gray[700],
        shadow: 'none',
        hoverShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      danger: {
        bg: colorValues.error[600],
        hover: colorValues.error[700],
        text: '#ffffff',
        shadow: getColoredShadow(colorValues.error[600], 'md'),
        hoverShadow: getColoredShadow(colorValues.error[600], 'lg'),
      },
      success: {
        bg: colorValues.success[600],
        hover: colorValues.success[700],
        text: '#ffffff',
        shadow: getColoredShadow(colorValues.success[600], 'md'),
        hoverShadow: getColoredShadow(colorValues.success[600], 'lg'),
      },
    };

    const colors = variantConfig[variant];

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
          ${fullWidth ? 'w-full' : ''}
          ${variant === 'primary' ? 'focus:ring-blue-500' : ''}
          ${variant === 'danger' ? 'focus:ring-red-500' : ''}
          ${className}
        `}
        style={{
          height: config.height,
          padding: config.padding,
          fontSize: config.fontSize,
          backgroundColor: colors.bg,
          color: colors.text,
          border: variant === 'ghost' ? `1px solid ${colorValues.gray[300]}` : 'none',
          boxShadow: isDisabled ? 'none' : colors.shadow,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled && variant !== 'ghost') {
            e.currentTarget.style.boxShadow = colors.hoverShadow;
            e.currentTarget.style.backgroundColor = colors.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.boxShadow = colors.shadow;
            e.currentTarget.style.backgroundColor = colors.bg;
          }
        }}
        {...props}
      >
        {loading && <HexLoader size="sm" />}
        {!loading && icon && iconPosition === 'left' && (
          <span className={config.iconSize}>{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className={config.iconSize}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

/**
 * IconButton - Square button for icons only
 */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  ...props
}: Omit<ButtonProps, 'children'> & { icon: ReactNode }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      className={`${sizeMap[size]} !p-0`}
      {...props}
    />
  );
}
