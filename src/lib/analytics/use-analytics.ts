/**
 * React Hook for Analytics
 * Provides analytics tracking functionality in React components
 */

'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { analytics, EventProperties, UserProperties } from './analytics-service';

/**
 * Hook to track page views automatically
 */
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      const pageName = pathname.replace('/', '') || 'home';
      analytics.trackPageView(pageName, {
        path: pathname,
      });
    }
  }, [pathname]);
}

/**
 * Hook to provide analytics tracking functions
 */
export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, properties?: EventProperties) => {
    analytics.trackEvent(eventName, properties);
  }, []);

  const trackPageView = useCallback((pageName: string, properties?: EventProperties) => {
    analytics.trackPageView(pageName, properties);
  }, []);

  const identifyUser = useCallback((userId: string, properties?: UserProperties) => {
    analytics.identifyUser(userId, properties);
  }, []);

  const resetUser = useCallback(() => {
    analytics.resetUser();
  }, []);

  const setUserProperties = useCallback((properties: UserProperties) => {
    analytics.setUserProperties(properties);
  }, []);

  const trackConversion = useCallback((goalName: string, value?: number, properties?: EventProperties) => {
    analytics.trackConversion(goalName, value, properties);
  }, []);

  const trackTiming = useCallback((category: string, variable: string, timeMs: number, properties?: EventProperties) => {
    analytics.trackTiming(category, variable, timeMs, properties);
  }, []);

  return {
    trackEvent,
    trackPageView,
    identifyUser,
    resetUser,
    setUserProperties,
    trackConversion,
    trackTiming,
    isEnabled: analytics.isEnabled(),
  };
}

/**
 * Hook to track component mount/unmount
 */
export function useComponentTracking(componentName: string, properties?: EventProperties) {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent(`${componentName}_mounted`, properties);

    return () => {
      trackEvent(`${componentName}_unmounted`, properties);
    };
  }, [componentName, trackEvent, properties]);
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const { trackEvent } = useAnalytics();

  const trackClick = useCallback((elementName: string, properties?: EventProperties) => {
    trackEvent('click', {
      element: elementName,
      ...properties,
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string, properties?: EventProperties) => {
    trackEvent('form_submit', {
      form: formName,
      ...properties,
    });
  }, [trackEvent]);

  const trackInputChange = useCallback((fieldName: string, properties?: EventProperties) => {
    trackEvent('input_change', {
      field: fieldName,
      ...properties,
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, properties?: EventProperties) => {
    trackEvent('search', {
      query,
      ...properties,
    });
  }, [trackEvent]);

  return {
    trackClick,
    trackFormSubmit,
    trackInputChange,
    trackSearch,
  };
}
