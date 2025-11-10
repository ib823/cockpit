/**
 * AnalyticsProvider
 * Initializes and manages analytics services
 */

"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { analytics, AnalyticsConfig } from "@/lib/analytics/analytics-service";
import { usePageTracking } from "@/lib/analytics/use-analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
  config?: AnalyticsConfig;
}

export function AnalyticsProvider({ children, config }: AnalyticsProviderProps) {
  const { data: session, status } = useSession();

  // Initialize analytics on mount
  useEffect(() => {
    const analyticsConfig: AnalyticsConfig = config || {
      // Default configuration
      // Set these via environment variables in production
      hotjar: process.env.NEXT_PUBLIC_HOTJAR_ID
        ? {
            id: process.env.NEXT_PUBLIC_HOTJAR_ID,
            version: parseInt(process.env.NEXT_PUBLIC_HOTJAR_VERSION || "6", 10),
          }
        : undefined,
      mixpanel: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
        ? {
            token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
            debug: process.env.NODE_ENV === "development",
          }
        : undefined,
      enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
      respectDoNotTrack: true,
    };

    analytics.init(analyticsConfig);
  }, [config]);

  // Identify user when session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      analytics.identifyUser(session.user.email || "unknown", {
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        role: session.user.role,
      });
    } else if (status === "unauthenticated") {
      analytics.resetUser();
    }
  }, [session, status]);

  // Track page views automatically
  usePageTracking();

  return <>{children}</>;
}

/**
 * Component to track specific events
 */
interface EventTrackerProps {
  event: string;
  properties?: Record<string, any>;
  children: ReactNode;
}

export function EventTracker({ event, properties, children }: EventTrackerProps) {
  const handleClick = () => {
    analytics.trackEvent(event, properties);
  };

  return <div onClick={handleClick}>{children}</div>;
}
