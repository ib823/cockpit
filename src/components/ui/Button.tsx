/**
 * Button Component - Apple HIG Compliant
 *
 * A comprehensive button system following Apple Human Interface Guidelines:
 * - Minimum 44pt touch targets
 * - Consistent visual feedback
 * - Accessible by default (ARIA, keyboard navigation)
 * - Support for icons and loading states
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/buttons
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ================================
 * BUTTON VARIANTS
 * ================================ */

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;

  /** Size preset (all meet 44px min touch target) */
  size?: ButtonSize;

  /** Icon to display before text */
  icon?: ReactNode;

  /** Icon to display after text */
  iconAfter?: ReactNode;

  /** Show loading spinner and disable button */
  isLoading?: boolean;

  /** Full width button */
  fullWidth?: boolean;

  /** Children content */
  children?: ReactNode;

  /** Required for icon-only buttons (accessibility) */
  'aria-label'?: string;
}

/**
 * Button component with Apple HIG compliance
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 *
 * // With icon
 * <Button variant="secondary" icon={<Plus />}>
 *   Add Item
 * </Button>
 *
 * // Icon-only (requires aria-label)
 * <Button variant="ghost" icon={<X />} aria-label="Close dialog" />
 *
 * // Loading state
 * <Button variant="primary" isLoading>
 *   Saving...
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconAfter,
      isLoading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Icon-only validation
    const isIconOnly = !children && (icon || iconAfter);
    if (isIconOnly && !props['aria-label']) {
      console.warn(
        'Button: Icon-only buttons require an aria-label for accessibility'
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'rounded-lg font-semibold',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Variant styles
          {
            // Primary - Blue background
            'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800':
              variant === 'primary',

            // Secondary - White background with border
            'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100':
              variant === 'secondary',

            // Tertiary - Transparent with blue text
            'text-blue-600 hover:bg-blue-50 active:bg-blue-100':
              variant === 'tertiary',

            // Destructive - Red for dangerous actions
            'bg-red-600 text-white hover:bg-red-700 active:bg-red-800':
              variant === 'destructive',

            // Ghost - Minimal, subtle hover
            'text-gray-700 hover:bg-gray-100 active:bg-gray-200':
              variant === 'ghost',
          },

          // Size styles (all meet 44px minimum touch target)
          {
            // Small - 44px height
            'h-11 min-h-[44px] px-4 text-sm': size === 'sm',

            // Medium - 44px height
            'h-11 min-h-[44px] px-6 text-base': size === 'md',

            // Large - 48px height (comfortable)
            'h-12 min-h-[48px] px-8 text-lg': size === 'lg',
          },

          // Icon-only styles
          {
            'px-0 aspect-square': isIconOnly,
          },

          // Full width
          {
            'w-full': fullWidth,
          },

          // Custom className override
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />
        )}

        {/* Leading icon */}
        {!isLoading && icon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Button text */}
        {children && <span className="truncate">{children}</span>}

        {/* Trailing icon */}
        {!isLoading && iconAfter && (
          <span className="flex-shrink-0" aria-hidden="true">
            {iconAfter}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/* ================================
 * BUTTON GROUP
 * ================================ */

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Button Group for related actions
 *
 * @example
 * ```tsx
 * <ButtonGroup>
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </ButtonGroup>
 * ```
 */
export function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        {
          'flex-row gap-2': orientation === 'horizontal',
          'flex-col gap-2': orientation === 'vertical',
        },
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}
