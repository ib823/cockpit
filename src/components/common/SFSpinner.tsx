/**
 * SFSpinner - iOS-style Activity Indicator
 * Apple Human Interface Guidelines compliant loading component
 *
 * Features:
 * - Circular spinner with smooth rotation
 * - Multiple size variants (sm, md, lg)
 * - System Blue default color
 * - Optional label text
 * - Respects prefers-reduced-motion
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SFSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Color of the spinner (defaults to System Blue) */
  color?: string;
  /** Optional label text displayed below spinner */
  label?: string;
  /** Additional CSS class */
  className?: string;
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 32,
} as const;

/**
 * SFSpinner component - iOS-style activity indicator
 *
 * @example
 * ```tsx
 * <SFSpinner size="md" label="Loading..." />
 * ```
 */
export const SFSpinner: React.FC<SFSpinnerProps> = ({
  size = 'md',
  color = 'var(--color-blue)',
  label,
  className = '',
}) => {
  const spinnerSize = SIZE_MAP[size];

  return (
    <div
      className={`sf-spinner ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-sm)',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        size={spinnerSize}
        color={color}
        style={{
          animation: 'sf-spin 1s linear infinite',
        }}
        aria-hidden="true"
      />

      {label && (
        <span
          className="sf-spinner-label"
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--ink)',
            opacity: 0.6,
          }}
        >
          {label}
        </span>
      )}

      {/* Screen reader text */}
      <span className="sr-only">
        {label || 'Loading'}
      </span>
    </div>
  );
};

/**
 * SFSpinnerOverlay - Full-screen loading overlay
 * Use for page-level loading states
 *
 * @example
 * ```tsx
 * <SFSpinnerOverlay label="Loading project..." />
 * ```
 */
export const SFSpinnerOverlay: React.FC<SFSpinnerProps> = (props) => {
  return (
    <div
      className="sf-spinner-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 'var(--z-modal)',
      }}
    >
      <SFSpinner {...props} size={props.size || 'lg'} />
    </div>
  );
};

/**
 * SFSpinnerInline - Inline loading indicator
 * Use for button loading states or inline content
 *
 * @example
 * ```tsx
 * <button>
 *   <SFSpinnerInline size="sm" /> Loading...
 * </button>
 * ```
 */
export const SFSpinnerInline: React.FC<Omit<SFSpinnerProps, 'label'>> = ({
  size = 'sm',
  color = 'currentColor',
  className = '',
}) => {
  const spinnerSize = SIZE_MAP[size];

  return (
    <Loader2
      size={spinnerSize}
      color={color}
      className={className}
      style={{
        animation: 'sf-spin 1s linear infinite',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      aria-hidden="true"
    />
  );
};

// Add spinner animation styles to design-system.css if not already present
// @keyframes sf-spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
