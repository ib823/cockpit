/**
 * Centralized Animation Configuration
 *
 * Apple Human Interface Guidelines Compliant
 * Spring physics and easing curves following Apple's design language
 *
 * Philosophy:
 * - Spring physics over linear transitions (feels natural, not mechanical)
 * - Consistent timing across the app (muscle memory)
 * - GPU-accelerated properties (transform, opacity)
 * - Respect prefers-reduced-motion
 *
 * @version 1.0.0
 */

// ============================================================================
// SPRING PHYSICS (Apple Signature)
// ============================================================================

/**
 * Spring animation configurations
 * Based on Apple's spring physics (iOS/macOS feel)
 */
export const SPRING = {
  /**
   * Default spring - Balanced feel
   * Use for: Most UI interactions, modals, drawers
   */
  default: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  },

  /**
   * Gentle spring - Soft, flowing
   * Use for: Large content areas, page transitions
   */
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },

  /**
   * Snappy spring - Quick, responsive
   * Use for: Buttons, toggles, small UI elements
   */
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 35,
    mass: 1,
  },

  /**
   * Bouncy spring - Playful, attention-grabbing
   * Use for: Success animations, celebrations
   */
  bouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 1,
  },

  /**
   * Wobbly spring - Elastic, organic
   * Use for: Drag-drop, gestural interactions
   */
  wobbly: {
    type: "spring" as const,
    stiffness: 180,
    damping: 15,
    mass: 1,
  },
} as const;

// ============================================================================
// EASING CURVES (Bezier Functions)
// ============================================================================

/**
 * Cubic bezier easing curves
 * Apple's signature curves for different motion types
 */
export const EASING = {
  /**
   * Ease out quad - Smooth deceleration
   * Use for: Fading in, scaling up
   */
  easeOutQuad: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],

  /**
   * Ease out expo - Apple's signature curve
   * Use for: Dramatic reveals, hero animations
   */
  easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],

  /**
   * Ease in out quint - Balanced acceleration
   * Use for: Layout changes, reordering
   */
  easeInOutQuint: [0.83, 0, 0.17, 1] as [number, number, number, number],

  /**
   * Ease out cubic - Natural deceleration
   * Use for: Most transitions
   */
  easeOutCubic: [0.33, 1, 0.68, 1] as [number, number, number, number],

  /**
   * Ease in out cubic - Smooth both ways
   * Use for: Modal open/close
   */
  easeInOutCubic: [0.65, 0, 0.35, 1] as [number, number, number, number],

  /**
   * Linear - No easing (rarely used)
   * Use for: Loading spinners, continuous motion
   */
  linear: [0, 0, 1, 1] as [number, number, number, number],
} as const;

// ============================================================================
// DURATIONS (8pt Grid Aligned: 100ms = 1 unit)
// ============================================================================

/**
 * Animation durations in seconds
 * All values are multiples of 0.1s (100ms) for consistency
 */
export const DURATION = {
  /** 100ms - Instant feedback */
  instant: 0.1,

  /** 200ms - Fast transitions */
  fast: 0.2,

  /** 300ms - Normal transitions (default) */
  normal: 0.3,

  /** 400ms - Slow, deliberate */
  slow: 0.4,

  /** 500ms - Very slow, dramatic */
  slower: 0.5,

  /** 800ms - Extra slow, for large content */
  slowest: 0.8,
} as const;

// ============================================================================
// STAGGER DELAYS
// ============================================================================

/**
 * Delays between staggered children animations
 * Creates rhythm and guides the eye
 */
export const STAGGER = {
  /** 30ms - Quick succession */
  fast: 0.03,

  /** 50ms - Normal rhythm (default) */
  normal: 0.05,

  /** 100ms - Deliberate, noticeable */
  slow: 0.1,

  /** 150ms - Very deliberate */
  slower: 0.15,
} as const;

// ============================================================================
// FRAMER MOTION VARIANTS (Reusable)
// ============================================================================

/**
 * Pre-built animation variants for common patterns
 * Use with framer-motion's variants prop
 */
export const VARIANTS = {
  /**
   * Fade in from opacity 0 to 1
   */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  /**
   * Scale in from 95% to 100%
   * Apple's signature scale for modals
   */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  /**
   * Slide up from below
   */
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  /**
   * Slide down from above
   */
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  /**
   * Slide in from right
   */
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  /**
   * Slide in from left
   */
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  /**
   * Collapse/expand (height animation)
   * Use with AnimatePresence
   */
  collapse: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },

  /**
   * Staggered container
   * Children will animate in sequence
   */
  staggerContainer: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: STAGGER.normal,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: STAGGER.fast,
        staggerDirection: -1, // Reverse order on exit
      },
    },
  },

  /**
   * Staggered child item
   * Use inside staggerContainer
   */
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.normal,
        ease: EASING.easeOutQuad,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: {
        duration: DURATION.fast,
      },
    },
  },

  /**
   * Modal overlay (backdrop)
   */
  overlay: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: DURATION.fast,
        ease: EASING.easeOutCubic,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: DURATION.fast,
        ease: EASING.easeInOutCubic,
      },
    },
  },

  /**
   * Modal content (Apple signature)
   * Scale + fade + slide up
   */
  modal: {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: DURATION.normal,
        ease: EASING.easeOutExpo, // Apple's signature curve
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: DURATION.fast,
        ease: EASING.easeInOutCubic,
      },
    },
  },

  /**
   * Drawer (side panel)
   */
  drawer: {
    initial: { x: "100%" },
    animate: {
      x: 0,
      transition: {
        duration: DURATION.normal,
        ease: EASING.easeOutExpo,
      },
    },
    exit: {
      x: "100%",
      transition: {
        duration: DURATION.fast,
        ease: EASING.easeInOutCubic,
      },
    },
  },

  /**
   * Toast notification
   */
  toast: {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: DURATION.normal,
        ease: EASING.easeOutExpo,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: DURATION.fast,
      },
    },
  },
} as const;

// ============================================================================
// MICRO-INTERACTIONS
// ============================================================================

/**
 * Subtle animations for UI feedback
 */
export const MICRO = {
  /**
   * Button press (scale down)
   */
  buttonPress: {
    scale: 0.95,
    transition: { duration: 0.1, ease: EASING.easeOutQuad },
  },

  /**
   * Button release (spring back)
   */
  buttonRelease: {
    scale: 1,
    transition: SPRING.snappy,
  },

  /**
   * Hover lift (subtle elevation)
   */
  hoverLift: {
    y: -2,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    transition: { duration: 0.15, ease: EASING.easeOutQuad },
  },

  /**
   * Hover scale (slight growth)
   */
  hoverScale: {
    scale: 1.02,
    transition: { duration: 0.15, ease: EASING.easeOutQuad },
  },

  /**
   * Success bounce
   */
  successBounce: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.4,
      ease: EASING.easeOutQuad,
      times: [0, 0.5, 1],
    },
  },

  /**
   * Error shake (macOS login style)
   */
  errorShake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: EASING.linear,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
  },

  /**
   * Pulse (attention-grabbing)
   */
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      ease: EASING.easeInOutCubic,
      repeat: Infinity,
    },
  },

  /**
   * Spin (loading indicator)
   */
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: EASING.linear,
      repeat: Infinity,
    },
  },
} as const;

// ============================================================================
// ACCESSIBILITY
// ============================================================================

/**
 * Check if user prefers reduced motion
 * Respect accessibility preferences
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get animation config with reduced motion support
 * Returns instant transitions if user prefers reduced motion
 */
export const getAnimationConfig = <T extends object>(config: T): T | { duration: 0 } => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return config;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create custom spring config
 */
export const createSpring = (
  stiffness: number = 300,
  damping: number = 30,
  mass: number = 1
) => ({
  type: "spring" as const,
  stiffness,
  damping,
  mass,
});

/**
 * Create custom cubic bezier
 */
export const createEasing = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): [number, number, number, number] => {
  return [x1, y1, x2, y2];
};

/**
 * Create stagger transition
 */
export const createStagger = (
  staggerChildren: number = STAGGER.normal,
  delayChildren: number = 0
) => ({
  staggerChildren,
  delayChildren,
});

// ============================================================================
// EXPORTS
// ============================================================================

export const ANIMATIONS = {
  SPRING,
  EASING,
  DURATION,
  STAGGER,
  VARIANTS,
  MICRO,
  prefersReducedMotion,
  getAnimationConfig,
  createSpring,
  createEasing,
  createStagger,
} as const;

export default ANIMATIONS;
