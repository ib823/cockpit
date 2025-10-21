/**
 * useReducedMotion Hook
 * Detects user's motion preference for accessibility
 *
 * Usage:
 * const prefersReducedMotion = useReducedMotion();
 * const animation = prefersReducedMotion ? {} : { animate: ... };
 */

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * getAnimationConfig - Helper to conditionally apply animations
 *
 * @param prefersReducedMotion - Boolean from useReducedMotion hook
 * @param config - Framer Motion animation config
 * @returns Animation config or empty object if reduced motion preferred
 *
 * @example
 * const animation = getAnimationConfig(prefersReducedMotion, {
 *   initial: { opacity: 0, x: -20 },
 *   animate: { opacity: 1, x: 0 },
 *   exit: { opacity: 0, x: 20 }
 * });
 */
export function getAnimationConfig<T extends Record<string, any>>(
  prefersReducedMotion: boolean,
  config: T
): T | Record<string, never> {
  return prefersReducedMotion ? {} : config;
}
