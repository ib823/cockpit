/**
 * Design System Tokens - TypeScript Definitions
 *
 * Type-safe access to design tokens with autocomplete support.
 * Mirrors the CSS custom properties in design-tokens.css
 *
 * Usage:
 * ```ts
 * import { SPACING, COLORS, Z_INDEX } from '@/lib/design-system/tokens';
 *
 * const style = {
 *   marginTop: SPACING[3],
 *   color: COLORS.status.success,
 *   zIndex: Z_INDEX.modal,
 * };
 * ```
 */

/* ================================
 * SPACING SYSTEM - 8pt Grid
 * ================================ */
export const SPACING = {
  0: '0',
  1: '8px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
  7: '56px',
  8: '64px',
  10: '80px',
  12: '96px',
  16: '128px',
  20: '160px',
} as const;

/* ================================
 * COLOR SYSTEM
 * ================================ */
export const COLORS = {
  // Primary
  blue: '#007AFF',
  blueLight: 'rgba(0, 122, 255, 0.1)',
  blueDark: '#0051D5',

  // Status
  status: {
    success: '#34C759',
    successLight: 'rgba(52, 199, 89, 0.1)',
    warning: '#FF9500',
    warningLight: 'rgba(255, 149, 0, 0.1)',
    error: '#FF3B30',
    errorLight: 'rgba(255, 59, 48, 0.1)',
    info: '#007AFF',
    infoLight: 'rgba(0, 122, 255, 0.1)',
  },

  // Neutrals
  gray: {
    1: '#1d1d1f',
    2: '#333333',
    3: '#666666',
    4: 'rgba(0, 0, 0, 0.08)',
    5: 'rgba(0, 0, 0, 0.04)',
    6: '#f5f5f7',
    7: '#fafafa',
  },

  // Semantic Text
  text: {
    primary: '#1d1d1f',
    secondary: '#666666',
    tertiary: '#767676',  // WCAG AA: 4.5:1 contrast (changed from #999999 which was 2.8:1)
    inverse: '#ffffff',
  },

  // Backgrounds
  bg: {
    primary: '#ffffff',
    secondary: '#f5f5f7',
    tertiary: '#fafafa',
  },

  // Borders
  border: {
    light: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.08)',
    strong: 'rgba(0, 0, 0, 0.12)',
  },

  // Overlays
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    strong: 'rgba(0, 0, 0, 0.7)',
  },

  // Gantt-specific
  gantt: {
    phase: '#007AFF',
    phaseLight: 'rgba(0, 122, 255, 0.2)',
    task: '#007AFF',
    taskHover: '#0051D5',
    critical: '#FF3B30',
    atRisk: '#FF9500',
    complete: '#34C759',
    notStarted: '#f5f5f7',
  },
} as const;

/* ================================
 * Z-INDEX LAYERS
 * ================================ */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

/* ================================
 * GANTT DIMENSIONS
 * ================================ */
export const GANTT_DIMENSIONS = {
  // Sidebar
  sidebarWidthDefault: 620,
  sidebarWidthMin: 300,
  sidebarWidthMax: 1000,

  // Row Heights (8pt grid compliant)
  taskBarHeight: 32,
  phaseRowHeight: 40,
  taskRowHeight: 40,
  timelineHeaderHeight: 64,

  // Column Widths (8pt grid compliant)
  taskNameWidth: 360,
  durationWidth: 96,
  resourcesWidth: 144,
} as const;

/* ================================
 * TOUCH TARGETS
 * ================================ */
export const TOUCH = {
  min: 44,         // Apple HIG minimum (44pt)
  comfortable: 48, // Comfortable touch target
} as const;

/* ================================
 * TYPOGRAPHY
 * ================================ */
export const TYPOGRAPHY = {
  fontFamily: {
    display: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    text: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Monaco', 'Consolas', monospace",
  },

  fontSize: {
    xs: '11px',   // Minimum readable
    sm: '13px',
    base: '15px',
    lg: '17px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '34px',
    '5xl': '48px',
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.025em',
  },
} as const;

/* ================================
 * BORDER RADIUS
 * ================================ */
export const RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

/* ================================
 * SHADOWS
 * ================================ */
export const SHADOWS = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  md: '0 2px 8px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 16px rgba(0, 0, 0, 0.12)',
  xl: '0 8px 32px rgba(0, 0, 0, 0.15)',
  '2xl': '0 16px 64px rgba(0, 0, 0, 0.2)',
} as const;

/* ================================
 * TRANSITIONS
 * ================================ */
export const TRANSITIONS = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },

  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Apple signature bounce
  },
} as const;

/* ================================
 * UTILITY FUNCTIONS
 * ================================ */

/**
 * Get CSS variable reference
 * @example getCSSVar('color-blue') => 'var(--color-blue)'
 */
export function getCSSVar(varName: string): string {
  return `var(--${varName})`;
}

/**
 * Create responsive spacing
 * @example spacing(3) => '24px' (mobile), '32px' (desktop)
 */
export function responsiveSpacing(baseUnit: keyof typeof SPACING, scaleUp: keyof typeof SPACING) {
  return {
    base: SPACING[baseUnit],
    md: SPACING[scaleUp],
  };
}

/**
 * Get z-index for layering
 * @example getZIndex('modal') => 1050
 */
export function getZIndex(layer: keyof typeof Z_INDEX): number {
  return Z_INDEX[layer];
}

/* ================================
 * TYPE EXPORTS
 * ================================ */
export type SpacingKey = keyof typeof SPACING;
export type ColorKey = keyof typeof COLORS;
export type ZIndexKey = keyof typeof Z_INDEX;
export type FontSizeKey = keyof typeof TYPOGRAPHY.fontSize;
export type FontWeightKey = keyof typeof TYPOGRAPHY.fontWeight;
