import { useEffect, useRef } from 'react';
import { setFaviconStatus, startAnimatedFavicon, type FaviconStatus } from '@/lib/dynamic-favicon';

/**
 * React hook to manage favicon status
 *
 * @example
 * ```tsx
 * // Simple usage
 * useFaviconStatus('success');
 *
 * // Dynamic based on state
 * const { error, isAuthenticated } = useAuth();
 * useFaviconStatus(error ? 'error' : !isAuthenticated ? 'not-logged-in' : 'ready');
 * ```
 */
export function useFaviconStatus(status: FaviconStatus, animated?: boolean) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up any previous animation
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (animated) {
      // Start animated favicon with the specified status
      cleanupRef.current = startAnimatedFavicon(status);
    } else {
      // Set static favicon
      setFaviconStatus(status);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [status, animated]);
}

/**
 * Hook for monitoring auth status and automatically updating favicon
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const { isAuthenticated } = useAuth();
 *   useFaviconAuthMonitor(isAuthenticated);
 *
 *   return ...
 * }
 * ```
 */
export function useFaviconAuthMonitor(isAuthenticated: boolean) {
  useFaviconStatus(isAuthenticated ? 'ready' : 'not-logged-in');
}

/**
 * Hook for monitoring errors and automatically updating favicon
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [errors, setErrors] = useState<Error[]>([]);
 *   useFaviconErrorMonitor(errors.length > 0);
 *
 *   return ...
 * }
 * ```
 */
export function useFaviconErrorMonitor(hasError: boolean) {
  useFaviconStatus(hasError ? 'error' : 'ready');
}
