/**
 * STEVE JOBS DESIGN SYSTEM
 *
 * "Design is not just what it looks like and feels like.
 *  Design is how it works." - Steve Jobs
 *
 * This design system ensures pixel-perfect consistency across the entire app.
 * Every spacing, color, typography, and animation follows a strict mathematical scale.
 */

// ============================================================================
// SPACING SYSTEM - 8px Grid
// ============================================================================
// Rule: All spacing must be a multiple of 8px (or 4px for micro-adjustments)

export const spacing = {
  // Micro spacing (use sparingly)
  px: "1px",
  "0.5": "0.125rem", // 2px
  "1": "0.25rem",    // 4px

  // Standard 8px grid
  "2": "0.5rem",     // 8px  - tight gaps
  "3": "0.75rem",    // 12px - comfortable gaps
  "4": "1rem",       // 16px - standard padding
  "6": "1.5rem",     // 24px - section padding
  "8": "2rem",       // 32px - large padding
  "12": "3rem",      // 48px - hero spacing
  "16": "4rem",      // 64px - extra large
  "24": "6rem",      // 96px - massive spacing
} as const;

// ============================================================================
// TYPOGRAPHY SCALE - Modular Scale (1.25 ratio)
// ============================================================================
// Based on 16px base, using perfect fifth (1.5x) for major jumps

export const typography = {
  // Display text (hero sections)
  display: {
    xl: "text-6xl font-light tracking-tight",      // 60px - Landing hero
    lg: "text-5xl font-light tracking-tight",      // 48px - Page hero
    md: "text-4xl font-light tracking-tight",      // 36px - Section hero
  },

  // Headings
  heading: {
    h1: "text-3xl font-semibold tracking-tight",   // 30px - Main headings
    h2: "text-2xl font-semibold tracking-tight",   // 24px - Sub headings
    h3: "text-xl font-semibold",                   // 20px - Card headings
    h4: "text-lg font-semibold",                   // 18px - Minor headings
  },

  // Body text
  body: {
    xl: "text-lg font-normal",                     // 18px - Large body
    lg: "text-base font-normal",                   // 16px - Standard body
    md: "text-sm font-normal",                     // 14px - Compact body
    sm: "text-xs font-normal",                     // 12px - Fine print
  },

  // Labels & UI text
  label: {
    lg: "text-sm font-medium",                     // 14px - Primary labels
    md: "text-xs font-medium",                     // 12px - Secondary labels
    sm: "text-xs font-medium uppercase tracking-wider", // 12px - Micro labels
  },

  // Code/Monospace
  code: {
    lg: "text-sm font-mono",                       // 14px
    md: "text-xs font-mono",                       // 12px
  },
} as const;

// ============================================================================
// COLOR PALETTE - Semantic & Consistent
// ============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    50: "bg-blue-50",
    100: "bg-blue-100",
    500: "bg-blue-500",
    600: "bg-blue-600",    // Primary action color
    700: "bg-blue-700",
    900: "bg-blue-900",
  },

  // Secondary/accent
  accent: {
    50: "bg-purple-50",
    100: "bg-purple-100",
    500: "bg-purple-500",
    600: "bg-purple-600",  // Secondary actions
    700: "bg-purple-700",
  },

  // Success states
  success: {
    50: "bg-green-50",
    100: "bg-green-100",
    500: "bg-green-500",
    600: "bg-green-600",
    700: "bg-green-700",
  },

  // Warning states
  warning: {
    50: "bg-yellow-50",
    100: "bg-yellow-100",
    500: "bg-yellow-500",
    600: "bg-yellow-600",
    700: "bg-yellow-700",
  },

  // Error states
  error: {
    50: "bg-red-50",
    100: "bg-red-100",
    500: "bg-red-500",
    600: "bg-red-600",
    700: "bg-red-700",
  },

  // Neutral grays
  gray: {
    50: "bg-gray-50",      // Backgrounds
    100: "bg-gray-100",    // Subtle backgrounds
    200: "bg-gray-200",    // Borders
    300: "bg-gray-300",    // Dividers
    500: "bg-gray-500",    // Secondary text
    600: "bg-gray-600",    // Primary text (light bg)
    700: "bg-gray-700",    // Headings
    900: "bg-gray-900",    // Dark mode primary
  },

  // Text colors (use these instead of raw colors)
  text: {
    primary: "text-gray-900",
    secondary: "text-gray-600",
    tertiary: "text-gray-500",
    inverse: "text-white",
    muted: "text-gray-400",
  },
} as const;

// ============================================================================
// ANIMATION SYSTEM - Consistent Timing
// ============================================================================

export const animation = {
  // Duration (use only these 3 values)
  duration: {
    fast: 0.15,      // Micro-interactions (hover, focus)
    normal: 0.3,     // Standard transitions
    slow: 0.5,       // Page transitions, reveals
  },

  // Easing curves
  easing: {
    // Use for most interactions
    standard: "easeInOut",

    // Use for entering elements
    enter: "easeOut",

    // Use for exiting elements
    exit: "easeIn",

    // Use for spring animations
    spring: { type: "spring" as const, stiffness: 300, damping: 30 },
  },

  // Reduced motion support (accessibility)
  reducedMotion: {
    duration: 0.01,  // Near-instant (user preference)
    transition: "transition-none",
  },

  // Common animation variants
  variants: {
    // Fade in
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },

    // Slide up
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },

    // Scale
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  },
} as const;

// ============================================================================
// BUTTON SYSTEM - 3 Variants, 4 Sizes
// ============================================================================

export const buttonStyles = {
  // Variants
  variant: {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md transition-all",
    secondary: "bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-all",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md transition-all",
  },

  // Sizes (consistent with 8px grid)
  size: {
    xs: "px-3 py-1.5 text-xs rounded-lg",           // 24px height
    sm: "px-4 py-2 text-sm rounded-lg",             // 32px height
    md: "px-6 py-3 text-base rounded-xl",           // 48px height
    lg: "px-8 py-4 text-lg rounded-xl",             // 56px height
  },

  // States
  state: {
    disabled: "opacity-50 cursor-not-allowed pointer-events-none",
    loading: "opacity-75 cursor-wait",
  },
} as const;

// ============================================================================
// CARD/CONTAINER SYSTEM
// ============================================================================

export const containerStyles = {
  card: {
    default: "bg-white rounded-2xl border border-gray-200 shadow-sm",
    elevated: "bg-white rounded-2xl border border-gray-200 shadow-lg",
    interactive: "bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer",
  },

  padding: {
    sm: "p-4",     // 16px
    md: "p-6",     // 24px
    lg: "p-8",     // 32px
  },

  gap: {
    sm: "gap-2",   // 8px
    md: "gap-4",   // 16px
    lg: "gap-6",   // 24px
  },
} as const;

// ============================================================================
// SHADOW SYSTEM - Elevation
// ============================================================================

export const shadows = {
  sm: "shadow-sm",           // Subtle cards
  md: "shadow-md",           // Elevated cards
  lg: "shadow-lg",           // Modals, dropdowns
  xl: "shadow-xl",           // Floating action buttons
  "2xl": "shadow-2xl",       // Hero elements
  none: "shadow-none",
} as const;

// ============================================================================
// BORDER RADIUS SYSTEM
// ============================================================================

export const radius = {
  none: "rounded-none",
  sm: "rounded-lg",          // 8px - buttons, inputs
  md: "rounded-xl",          // 12px - cards
  lg: "rounded-2xl",         // 16px - containers
  full: "rounded-full",      // Pills, avatars
} as const;

// ============================================================================
// FOCUS STATES - Accessibility
// ============================================================================

export const focusStyles = {
  default: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  input: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  button: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
} as const;

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const layout = {
  // Max widths for content
  maxWidth: {
    xs: "max-w-xs",    // 320px
    sm: "max-w-sm",    // 384px
    md: "max-w-md",    // 448px
    lg: "max-w-lg",    // 512px
    xl: "max-w-xl",    // 576px
    "2xl": "max-w-2xl", // 672px
    "4xl": "max-w-4xl", // 896px
    "7xl": "max-w-7xl", // 1280px
  },

  // Container padding
  container: "px-6 md:px-8 lg:px-12",

  // Section spacing
  section: "py-12 md:py-16 lg:py-24",
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Combines button styles based on variant and size
 */
export function getButtonClass(variant: keyof typeof buttonStyles.variant, size: keyof typeof buttonStyles.size, disabled = false) {
  const base = "font-medium transition-all duration-150 inline-flex items-center justify-center gap-2";
  const variantClass = buttonStyles.variant[variant];
  const sizeClass = buttonStyles.size[size];
  const stateClass = disabled ? buttonStyles.state.disabled : "";

  return `${base} ${variantClass} ${sizeClass} ${stateClass}`;
}

/**
 * Combines card styles
 */
export function getCardClass(variant: keyof typeof containerStyles.card, padding: keyof typeof containerStyles.padding) {
  return `${containerStyles.card[variant]} ${containerStyles.padding[padding]}`;
}

/**
 * Get animation config for Framer Motion
 */
export function getAnimationConfig(type: keyof typeof animation.variants, speed: keyof typeof animation.duration = 'normal') {
  const duration = prefersReducedMotion() ? animation.reducedMotion.duration : animation.duration[speed];

  return {
    ...animation.variants[type],
    transition: {
      duration,
      ease: animation.easing.standard,
    },
  };
}

/**
 * Check if user prefers reduced motion (accessibility)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration respecting user preferences
 */
export function getAnimationDuration(speed: keyof typeof animation.duration = 'normal'): number {
  return prefersReducedMotion() ? animation.reducedMotion.duration : animation.duration[speed];
}
