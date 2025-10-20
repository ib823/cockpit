/**
 * React Hook for CAPTCHA Integration
 *
 * Provides easy-to-use CAPTCHA functionality for React components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadCaptchaScript, executeCaptcha, CaptchaProvider } from '@/lib/security/captcha';

interface UseCaptchaOptions {
  provider?: CaptchaProvider;
  siteKey?: string;
  enabled?: boolean;
  action?: string; // For reCAPTCHA v3
}

interface UseCaptchaReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  execute: () => Promise<string>;
  reset: () => void;
}

/**
 * Hook for CAPTCHA integration
 *
 * @example
 * ```tsx
 * const { execute, isLoaded } = useCaptcha({
 *   provider: 'hcaptcha',
 *   siteKey: 'YOUR_SITE_KEY',
 * });
 *
 * const handleSubmit = async () => {
 *   try {
 *     const token = await execute();
 *     // Send token with request
 *     await fetch('/api/protected', {
 *       headers: { 'x-captcha-token': token }
 *     });
 *   } catch (error) {
 *     console.error('CAPTCHA failed:', error);
 *   }
 * };
 * ```
 */
export function useCaptcha(options: UseCaptchaOptions = {}): UseCaptchaReturn {
  const {
    provider = 'hcaptcha' as CaptchaProvider,
    siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || '',
    enabled = true,
    action = 'submit',
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load CAPTCHA script on mount
  useEffect(() => {
    if (!enabled || !siteKey) {
      setError('CAPTCHA not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    loadCaptchaScript(provider, siteKey)
      .then(() => {
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [enabled, provider, siteKey]);

  /**
   * Execute CAPTCHA challenge
   */
  const execute = useCallback(async (): Promise<string> => {
    if (!enabled) {
      throw new Error('CAPTCHA is not enabled');
    }

    if (!isLoaded) {
      throw new Error('CAPTCHA not loaded yet');
    }

    if (!siteKey) {
      throw new Error('CAPTCHA site key not configured');
    }

    try {
      setError(null);
      const token = await executeCaptcha(provider, siteKey, action);
      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'CAPTCHA execution failed';
      setError(errorMessage);
      throw err;
    }
  }, [enabled, isLoaded, provider, siteKey, action]);

  /**
   * Reset CAPTCHA state
   */
  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for honeypot field (simple bot detection)
 *
 * @example
 * ```tsx
 * const { honeypotField, isBot } = useHoneypot();
 *
 * return (
 *   <form>
 *     {honeypotField}
 *     <button disabled={isBot}>Submit</button>
 *   </form>
 * );
 * ```
 */
export function useHoneypot() {
  const [value, setValue] = useState('');

  return {
    honeypotValue: value,
    isBot: value !== '',
    renderHoneypot: () => {
      return (
        <input
          type="text"
          name="website"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
          }}
          aria-hidden="true"
        />
      );
    },
  };
}

/**
 * Hook for form timing check (detects instant submissions)
 *
 * @example
 * ```tsx
 * const { startTimer, getTiming, isTooFast } = useFormTiming(3); // 3 second minimum
 *
 * useEffect(() => {
 *   startTimer();
 * }, []);
 *
 * const handleSubmit = () => {
 *   if (isTooFast()) {
 *     alert('Please slow down!');
 *     return;
 *   }
 *   // Submit form
 * };
 * ```
 */
export function useFormTiming(minSeconds: number = 3) {
  const [startTime, setStartTime] = useState<number | null>(null);

  const startTimer = useCallback(() => {
    setStartTime(Date.now());
  }, []);

  const getTiming = useCallback((): number => {
    if (!startTime) return 0;
    return (Date.now() - startTime) / 1000;
  }, [startTime]);

  const isTooFast = useCallback((): boolean => {
    const elapsed = getTiming();
    return elapsed < minSeconds;
  }, [getTiming, minSeconds]);

  const reset = useCallback(() => {
    setStartTime(null);
  }, []);

  return {
    startTimer,
    getTiming,
    isTooFast,
    reset,
  };
}
