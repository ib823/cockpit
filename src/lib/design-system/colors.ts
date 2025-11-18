/**
 * Centralized Color System
 *
 * Single source of truth for all color values in the application.
 * Follows Apple Human Interface Guidelines.
 *
 * Usage:
 * - Import { COLORS } from '@/lib/design-system/colors'
 * - Use COLORS.primary.blue instead of hardcoded #007AFF
 * - Enforces consistency across the entire codebase
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/color
 */

/**
 * Apple System Colors
 * Exact values from iOS/macOS design system
 */
export const COLORS = {
  // Primary Brand Colors
  primary: {
    blue: '#007AFF',
    blueLight: 'rgba(0, 122, 255, 0.1)',
    blueDark: '#0051D5',
  },

  // Status Colors
  status: {
    success: '#34C759',
    successLight: 'rgba(52, 199, 89, 0.1)',
    successDark: '#248A3D',

    warning: '#FF9500',
    warningLight: 'rgba(255, 149, 0, 0.1)',
    warningDark: '#C93400',

    error: '#FF3B30',
    errorLight: 'rgba(255, 59, 48, 0.1)',
    errorDark: '#D70015',

    info: '#5856D6',
    infoLight: 'rgba(88, 86, 214, 0.1)',
    infoDark: '#3634A3',
  },

  // Severity Colors (for deletion impact modals)
  severity: {
    low: {
      primary: '#059669',
      background: '#F0FDF4',
      border: '#BBF7D0',
      text: '#065F46',
    },
    medium: {
      primary: '#D97706',
      background: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
    },
    high: {
      primary: '#EA580C',
      background: '#FFF7ED',
      border: '#FED7AA',
      text: '#9A3412',
    },
    critical: {
      primary: '#DC2626',
      background: '#FEF2F2',
      border: '#FECACA',
      text: '#991B1B',
    },
  },

  // Neutral Colors (Grays)
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },

  // Apple Specific Grays (for UI elements)
  apple: {
    systemGray: '#8E8E93',
    systemGray2: '#AEAEB2',
    systemGray3: '#C7C7CC',
    systemGray4: '#D1D1D6',
    systemGray5: '#E5E5EA',
    systemGray6: '#F2F2F7',
  },

  // Semantic Text Colors
  text: {
    primary: '#1D1D1F',
    secondary: '#86868B',
    tertiary: '#C7C7CC',
    inverse: '#FFFFFF',
  },

  // Semantic Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F7',
    tertiary: '#F2F2F7',
    elevated: '#FFFFFF',
  },

  // Border Colors
  border: {
    light: '#E5E5EA',
    medium: '#D1D1D6',
    strong: '#C7C7CC',
  },

  // Overlay Colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    strong: 'rgba(0, 0, 0, 0.7)',
  },

  // Interactive States
  interactive: {
    hover: 'rgba(0, 0, 0, 0.05)',
    active: 'rgba(0, 0, 0, 0.1)',
    disabled: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

/**
 * CSS Variable Names
 * Map to CSS custom properties in design-tokens.css
 */
export const CSS_VARS = {
  // Primary
  blue: 'var(--color-blue)',
  blueLight: 'var(--color-blue-light)',
  blueDark: 'var(--color-blue-dark)',

  // Status
  success: 'var(--color-status-success)',
  warning: 'var(--color-status-warning)',
  error: 'var(--color-status-error)',
  info: 'var(--color-status-info)',

  // Text
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',

  // Background
  bgPrimary: 'var(--color-background-primary)',
  bgSecondary: 'var(--color-background-secondary)',
  bgTertiary: 'var(--color-background-tertiary)',

  // Border
  borderLight: 'var(--color-border-light)',
  borderMedium: 'var(--color-border-medium)',
  borderStrong: 'var(--color-border-strong)',
} as const;

/**
 * Utility Functions
 */

/**
 * Get color with opacity
 * @param color - Hex color string
 * @param opacity - Opacity value (0-1)
 */
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get severity color by level
 */
export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): {
  primary: string;
  background: string;
  border: string;
  text: string;
} {
  return COLORS.severity[severity];
}

/**
 * Type exports
 */
export type ColorKey = keyof typeof COLORS;
export type PrimaryColor = keyof typeof COLORS.primary;
export type StatusColor = keyof typeof COLORS.status;
export type SeverityLevel = keyof typeof COLORS.severity;
export type NeutralColor = keyof typeof COLORS.neutral;

/**
 * Default exports
 */
export default COLORS;
