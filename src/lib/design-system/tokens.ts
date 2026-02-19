/**
 * DESIGN TOKENS
 *
 * Steve Jobs: "Simplicity is the ultimate sophistication"
 * Jony Ive: "We try to develop products that seem somehow inevitable"
 *
 * This is not a theme. This is the only visual language.
 * Every choice here has been made. No more decisions needed.
 *
 * @version 2.0.0 - Jobs/Ive Discipline
 */

// ============================================================================
// COLOR SYSTEM - Black-based opacity + Two accent colors
// ============================================================================

/**
 * PRIMARY PALETTE
 * Black at varying opacity for all grays
 * This creates mathematical precision and visual harmony
 */
export const COLORS = {
  // BLACK OPACITY SCALE (The only grays you need)
  text: {
    primary: 'rgba(0, 0, 0, 1)',      // 100% - Headlines, primary content
    secondary: 'rgba(0, 0, 0, 0.6)',  // 60% - Body text, labels
    tertiary: 'rgba(0, 0, 0, 0.4)',   // 40% - Captions, disabled text
    disabled: 'rgba(0, 0, 0, 0.25)',  // 25% - Fully disabled
    inverse: 'rgba(255, 255, 255, 1)', // White text on dark backgrounds
  },

  // BACKGROUNDS (White + one subtle alternative)
  bg: {
    primary: '#FFFFFF',    // Pure white - main background
    elevated: '#FFFFFF',   // Cards, modals - same as primary (no elevation color)
    secondary: '#F5F5F7',  // Secondary background - form sections, grouped content
    subtle: '#FAFAFA',     // Only if absolutely necessary (avoid if possible)
  },

  // BORDERS & DIVIDERS (Black opacity only)
  border: {
    default: 'rgba(0, 0, 0, 0.08)',   // 8% - Standard borders
    strong: 'rgba(0, 0, 0, 0.12)',    // 12% - Emphasized borders
    light: 'rgba(0, 0, 0, 0.06)',     // 6% - Light borders
    subtle: 'rgba(0, 0, 0, 0.04)',    // 4% - Very subtle dividers
  },

  // INTERACTIVE STATES (Black opacity for hovers)
  interactive: {
    hover: 'rgba(0, 0, 0, 0.04)',     // 4% - Hover background
    pressed: 'rgba(0, 0, 0, 0.08)',   // 8% - Active/pressed background
    focus: 'rgba(0, 122, 255, 0.15)', // 15% blue - Focus state
  },

  // SYSTEM COLORS (Only two - use with extreme discipline)
  blue: '#007AFF',          // Primary action, selected state
  blueHover: '#0051D5',     // Blue hover state
  bluePressed: '#004BB8',   // Blue pressed state
  blueLight: 'rgba(0, 122, 255, 0.1)', // Blue subtle background

  red: '#FF3B30',           // Destructive action only
  redHover: '#D70015',      // Red hover state
  redPressed: '#C40010',    // Red pressed state
  redLight: 'rgba(255, 59, 48, 0.1)', // Red subtle background

  purple: '#AF52DE',        // Purple accent
  orange: '#FF9500',        // Orange accent
  greenLight: 'rgba(52, 199, 89, 0.1)', // Green subtle background

  // UTILITY COLORS
  shadow: 'rgba(0, 0, 0, 0.1)', // Default shadow color

  // OVERLAYS
  overlay: {
    light: 'rgba(0, 0, 0, 0.35)',  // Modal overlay - subtle, not oppressive
    medium: 'rgba(0, 0, 0, 0.5)',  // Stronger overlay if needed
  },

  // Legacy status colors (keep for compatibility, but use sparingly)
  status: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
  },

  // Legacy gray scale (for gradual migration)
  gray: {
    1: '#1d1d1f',
    2: '#333333',
    3: '#666666',
    4: 'rgba(0, 0, 0, 0.08)',
    5: 'rgba(0, 0, 0, 0.04)',
    6: '#f5f5f7',
    7: '#fafafa',
  },
} as const;

// ============================================================================
// TYPOGRAPHY SCALE - Mathematical precision
// ============================================================================

/**
 * FONT SIZES
 * Based on a proper scale, not arbitrary numbers
 * Removed: 11px, 14px, 17px, 18px, 24px, 48px
 * Keep: 12, 13, 15, 16, 20, 32px (clean scale)
 */
export const TYPOGRAPHY = {
  fontFamily: {
    display: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    text: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Monaco', 'Consolas', monospace",
  },

  fontSize: {
    label: '12px',      // Labels, small caps
    caption: '13px',    // Captions, secondary text
    body: '15px',       // Body text (primary size)
    subtitle: '16px',   // Subtitles
    heading: '17px',    // Section headings
    title: '20px',      // Titles, headings
    display: '32px',    // Display text, hero
  },

  fontWeight: {
    normal: 400,
    regular: 400,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,   // Display text
    compact: 1.3, // Titles
    normal: 1.4,  // Subtitles, captions
    relaxed: 1.5, // Body text
  },

  letterSpacing: {
    tight: '-0.02em',  // Large sizes (32px+)
    slightTight: '-0.01em', // Titles (20px)
    normal: '0',       // Most text
    wide: '0.01em',    // Small labels
  },
} as const;

// ============================================================================
// SPACING SCALE - True 8pt grid
// ============================================================================

/**
 * SPACING
 * Every space is a multiple of 4 or 8
 * No exceptions. No 6px, no 10px, no 14px.
 * Removed irregular values from old system
 */
export const SPACING = {
  0: '0',
  1: '4px',      // 0.5 × base (micro spacing)
  2: '8px',      // 1 × base (small)
  3: '12px',     // 1.5 × base (compact)
  4: '16px',     // 2 × base (default)
  5: '24px',     // 3 × base (comfortable)
  6: '32px',     // 4 × base (large)
  7: '40px',     // 5 × base (medium-large)
  8: '48px',     // 6 × base (xlarge)
  10: '64px',    // 8 × base (xxlarge)
  12: '80px',    // 10 × base
  16: '96px',    // 12 × base
  20: '128px',   // 16 × base
} as const;

// ============================================================================
// RADIUS - Consistent roundness
// ============================================================================

/**
 * BORDER RADIUS
 * Simplified: Only 3 values needed
 */
export const RADIUS = {
  sm: '4px',      // Extra small elements (badges, chips)
  small: '6px',   // Small elements (tags, indicators)
  default: '8px', // Everything else (buttons, inputs, modals, cards)
  large: '12px',  // Only for very large containers if needed
  full: '9999px', // Pills, circular elements
} as const;

// ============================================================================
// SHADOWS - Subtle depth
// ============================================================================

/**
 * SHADOWS
 * Elevation should whisper, not shout
 */
export const SHADOWS = {
  none: 'none',
  small: '0 2px 8px rgba(0, 0, 0, 0.08)',     // Cards, dropdowns
  medium: '0 8px 24px rgba(0, 0, 0, 0.12)',   // Modals, popovers
  large: '0 16px 48px rgba(0, 0, 0, 0.16)',   // Key elevated elements
} as const;

// ============================================================================
// TRANSITIONS - Smooth, purposeful
// ============================================================================

/**
 * ANIMATION TIMING
 * Fast enough to feel responsive, slow enough to be perceived
 */
export const TRANSITIONS = {
  duration: {
    fast: '100ms',      // Micro-interactions (hover states)
    normal: '150ms',    // Standard transitions (button clicks)
    slow: '200ms',      // Larger movements (panel opens)
    slower: '300ms',    // Complex animations (modal transitions)
  },

  easing: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',     // Deceleration
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',        // Acceleration
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',    // Standard ease
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // Apple signature bounce
  },
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

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

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const MODAL = {
  // Sizes (8pt grid aligned)
  sizes: {
    small: { width: 480, height: 'auto' },    // 60 × 8pt
    medium: { width: 640, height: 'auto' },   // 80 × 8pt
    large: { width: 880, height: 'auto' },    // 110 × 8pt
    xlarge: { width: 1120, height: 'auto' },  // 140 × 8pt
    fullscreen: { width: '100vw', height: '100vh' },
  },

  // Overlay
  overlay: COLORS.overlay.light,

  // Spacing
  padding: SPACING[6],      // 32px content padding
  headerPadding: SPACING[5], // 24px header padding
  gap: SPACING[4],           // 16px gap between elements
} as const;

export const BUTTON = {
  // Heights (8pt aligned)
  height: {
    small: '32px',   // 4 × 8pt
    medium: '40px',  // 5 × 8pt
    large: '48px',   // 6 × 8pt
  },

  // Padding (8pt aligned)
  padding: {
    small: `0 ${SPACING[4]}`,   // 0 16px
    medium: `0 ${SPACING[5]}`,  // 0 24px
    large: `0 ${SPACING[6]}`,   // 0 32px
  },

  // Minimum width to prevent cramped buttons
  minWidth: '88px', // 11 × 8pt
} as const;

export const INPUT = {
  // Heights (8pt aligned)
  height: {
    small: '32px',   // 4 × 8pt
    medium: '40px',  // 5 × 8pt
    large: '48px',   // 6 × 8pt
  },

  // Padding
  padding: {
    horizontal: SPACING[3], // 12px
    vertical: SPACING[2],   // 8px
  },
} as const;

export const TOUCH = {
  min: 44,         // Apple HIG minimum (44pt)
  comfortable: 48, // Comfortable touch target
} as const;

// Gantt-specific (legacy, keep for compatibility)
export const GANTT_DIMENSIONS = {
  sidebarWidthDefault: 620,
  sidebarWidthMin: 300,
  sidebarWidthMax: 1000,
  taskBarHeight: 32,
  phaseRowHeight: 40,
  taskRowHeight: 40,
  timelineHeaderHeight: 64,
  taskNameWidth: 360,
  durationWidth: 96,
  resourcesWidth: 144,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get text color with opacity
 * Usage: getTextColor('primary') => 'rgba(0, 0, 0, 1)'
 */
export function getTextColor(level: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse'): string {
  return COLORS.text[level];
}

/**
 * Get spacing value
 * Usage: getSpacing(4) => '16px'
 */
export function getSpacing(size: keyof typeof SPACING): string {
  return SPACING[size];
}

/**
 * Get transition string
 * Usage: getTransition('background', 'fast') => 'background 100ms cubic-bezier(...)'
 */
export function getTransition(property: string, speed: keyof typeof TRANSITIONS.duration = 'normal'): string {
  const duration = TRANSITIONS.duration[speed];
  return `${property} ${duration} ${TRANSITIONS.easing.easeOut}`;
}

/**
 * Get CSS variable reference
 * @example getCSSVar('color-blue') => 'var(--color-blue)'
 */
export function getCSSVar(varName: string): string {
  return `var(--${varName})`;
}

/**
 * Get z-index for layering
 * @example getZIndex('modal') => 1050
 */
export function getZIndex(layer: keyof typeof Z_INDEX): number {
  return Z_INDEX[layer];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type SpacingKey = keyof typeof SPACING;
export type ColorKey = keyof typeof COLORS;
export type ZIndexKey = keyof typeof Z_INDEX;
export type FontSizeKey = keyof typeof TYPOGRAPHY.fontSize;
export type FontWeightKey = keyof typeof TYPOGRAPHY.fontWeight;
