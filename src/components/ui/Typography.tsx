/**
 * Typography Component
 *
 * Consistent, accessible, responsive typography system
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface HeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export function Heading({
  children,
  as: Component = 'h2',
  size,
  weight = 'bold',
  className,
}: HeadingProps) {
  // Default sizes based on heading level
  const defaultSizes: Record<string, string> = {
    h1: 'text-4xl sm:text-5xl',
    h2: 'text-3xl sm:text-4xl',
    h3: 'text-2xl sm:text-3xl',
    h4: 'text-xl sm:text-2xl',
    h5: 'text-lg sm:text-xl',
    h6: 'text-base sm:text-lg',
  };

  const sizeClasses = size
    ? `text-${size}`
    : defaultSizes[Component];

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <Component
      className={cn(
        'text-foreground tracking-tight',
        sizeClasses,
        weightClasses[weight],
        'print:text-black',
        className
      )}
    >
      {children}
    </Component>
  );
}

export interface TextProps {
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'primary' | 'destructive';
  className?: string;
}

export function Text({
  children,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  color = 'default',
  className,
}: TextProps) {
  const colorClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-primary-600',
    destructive: 'text-error-600',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <Component
      className={cn(
        `text-${size}`,
        colorClasses[color],
        weightClasses[weight],
        'print:text-black',
        className
      )}
    >
      {children}
    </Component>
  );
}
