/**
 * Analytics Service
 * Unified interface for multiple analytics providers (Hotjar, Mixpanel, etc.)
 */

/** Type-safe window extensions for analytics providers */
interface HotjarQueue {
  (...args: unknown[]): void;
  q?: unknown[];
}

interface AnalyticsWindow extends Window {
  hj?: HotjarQueue;
  _hjSettings?: { hjid: string; hjsv: number };
  mixpanel?: {
    init: (token: string, config: Record<string, unknown>) => void;
    track: (event: string, props?: Record<string, unknown>) => void;
    identify: (userId: string) => void;
    reset: () => void;
    people: {
      set: (props: Record<string, unknown>) => void;
    };
  };
  doNotTrack?: string;
  navigator: Navigator & { msDoNotTrack?: string };
}

export type AnalyticsProvider = "hotjar" | "mixpanel" | "custom";

export interface AnalyticsConfig {
  hotjar?: {
    id: string;
    version: number;
  };
  mixpanel?: {
    token: string;
    debug?: boolean;
  };
  enabled: boolean;
  respectDoNotTrack: boolean;
}

export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface UserProperties {
  email?: string;
  name?: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

import { logger } from "@/lib/logger";

class AnalyticsService {
  private config: AnalyticsConfig = {
    enabled: false,
    respectDoNotTrack: true,
  };

  private initialized = false;
  private hotjarLoaded = false;
  private mixpanelLoaded = false;

  /**
   * Initialize analytics service with configuration
   */
  init(config: AnalyticsConfig) {
    this.config = config;

    // Check Do Not Track
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      logger.info("[Analytics] Do Not Track enabled, skipping initialization");
      return;
    }

    if (!this.config.enabled) {
      logger.info("[Analytics] Analytics disabled in config");
      return;
    }

    // Initialize providers
    if (this.config.hotjar) {
      this.initHotjar(this.config.hotjar.id, this.config.hotjar.version);
    }

    if (this.config.mixpanel) {
      this.initMixpanel(this.config.mixpanel.token, this.config.mixpanel.debug);
    }

    this.initialized = true;
    logger.info("[Analytics] Service initialized");
  }

  /**
   * Check if Do Not Track is enabled
   */
  private isDoNotTrackEnabled(): boolean {
    if (typeof window === "undefined") return false;

    const w = window as unknown as AnalyticsWindow;
    const dnt =
      window.navigator.doNotTrack ||
      w.navigator.msDoNotTrack ||
      w.doNotTrack;

    return dnt === "1" || dnt === "yes";
  }

  /**
   * Initialize Hotjar
   */
  private initHotjar(id: string, version: number) {
    if (typeof window === "undefined") return;

    try {
      // Hotjar initialization script
      const w = window as unknown as AnalyticsWindow;
      w.hj = w.hj || function (...args: unknown[]) {
        (w.hj!.q = w.hj!.q || []).push(args);
      };
      w._hjSettings = { hjid: id, hjsv: version };
      const head = document.getElementsByTagName("head")[0];
      const hjScript = document.createElement("script");
      hjScript.async = true;
      hjScript.src = `https://static.hotjar.com/c/hotjar-${id}.js?sv=${version}`;
      head.appendChild(hjScript);

      this.hotjarLoaded = true;
      logger.info("[Analytics] Hotjar initialized");
    } catch (error) {
      logger.error("[Analytics] Failed to initialize Hotjar", { error });
    }
  }

  /**
   * Initialize Mixpanel
   */
  private initMixpanel(token: string, debug = false) {
    if (typeof window === "undefined") return;

    try {
      // Mixpanel initialization script (simplified)
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";

      script.onload = () => {
        if ((window as unknown as AnalyticsWindow).mixpanel) {
          (window as unknown as AnalyticsWindow).mixpanel.init(token, {
            debug,
            track_pageview: true,
            persistence: "localStorage",
          });
          this.mixpanelLoaded = true;
          logger.info("[Analytics] Mixpanel initialized");
        }
      };

      document.head.appendChild(script);
    } catch (error) {
      logger.error("[Analytics] Failed to initialize Mixpanel", { error });
    }
  }

  /**
   * Track a page view
   */
  trackPageView(pageName: string, properties?: EventProperties) {
    if (!this.initialized || !this.config.enabled) return;

    const props = {
      page: pageName,
      url: typeof window !== "undefined" ? window.location.href : "",
      timestamp: new Date().toISOString(),
      ...properties,
    };

    // Mixpanel
    if (this.mixpanelLoaded && (window as unknown as AnalyticsWindow).mixpanel) {
      (window as unknown as AnalyticsWindow).mixpanel.track("Page View", props);
    }

    // Hotjar tracks page views automatically
    logger.info("[Analytics] Page view tracked", { pageName, props });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: EventProperties) {
    if (!this.initialized || !this.config.enabled) return;

    const props = {
      timestamp: new Date().toISOString(),
      ...properties,
    };

    // Mixpanel
    if (this.mixpanelLoaded && (window as unknown as AnalyticsWindow).mixpanel) {
      (window as unknown as AnalyticsWindow).mixpanel.track(eventName, props);
    }

    // Hotjar (via custom events)
    if (this.hotjarLoaded && (window as unknown as AnalyticsWindow).hj) {
      (window as unknown as AnalyticsWindow).hj("event", eventName);
    }

    logger.info("[Analytics] Event tracked", { eventName, props });
  }

  /**
   * Identify a user
   */
  identifyUser(userId: string, properties?: UserProperties) {
    if (!this.initialized || !this.config.enabled) return;

    // Mixpanel
    if (this.mixpanelLoaded && (window as unknown as AnalyticsWindow).mixpanel) {
      (window as unknown as AnalyticsWindow).mixpanel.identify(userId);
      if (properties) {
        (window as unknown as AnalyticsWindow).mixpanel.people.set(properties);
      }
    }

    // Hotjar (via user attributes)
    if (this.hotjarLoaded && (window as unknown as AnalyticsWindow).hj) {
      (window as unknown as AnalyticsWindow).hj("identify", userId, properties);
    }

    logger.info("[Analytics] User identified", { userId, properties });
  }

  /**
   * Reset user identity (on logout)
   */
  resetUser() {
    if (!this.initialized || !this.config.enabled) return;

    // Mixpanel
    if (this.mixpanelLoaded && (window as unknown as AnalyticsWindow).mixpanel) {
      (window as unknown as AnalyticsWindow).mixpanel.reset();
    }

    logger.info("[Analytics] User identity reset");
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties) {
    if (!this.initialized || !this.config.enabled) return;

    // Mixpanel
    if (this.mixpanelLoaded && (window as unknown as AnalyticsWindow).mixpanel) {
      (window as unknown as AnalyticsWindow).mixpanel.people.set(properties);
    }

    logger.info("[Analytics] User properties set", { properties });
  }

  /**
   * Track a conversion/goal
   */
  trackConversion(goalName: string, value?: number, properties?: EventProperties) {
    if (!this.initialized || !this.config.enabled) return;

    const props = {
      value,
      timestamp: new Date().toISOString(),
      ...properties,
    };

    this.trackEvent(`conversion_${goalName}`, props);
  }

  /**
   * Track timing (e.g., page load time)
   */
  trackTiming(category: string, variable: string, timeMs: number, properties?: EventProperties) {
    if (!this.initialized || !this.config.enabled) return;

    const props = {
      category,
      variable,
      time_ms: timeMs,
      time_seconds: (timeMs / 1000).toFixed(2),
      ...properties,
    };

    this.trackEvent("timing", props);
  }

  /**
   * Check if analytics is enabled and initialized
   */
  isEnabled(): boolean {
    return this.initialized && this.config.enabled;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export convenience functions
export const trackPageView = (pageName: string, properties?: EventProperties) =>
  analytics.trackPageView(pageName, properties);

export const trackEvent = (eventName: string, properties?: EventProperties) =>
  analytics.trackEvent(eventName, properties);

export const identifyUser = (userId: string, properties?: UserProperties) =>
  analytics.identifyUser(userId, properties);

export const resetUser = () => analytics.resetUser();

export const setUserProperties = (properties: UserProperties) =>
  analytics.setUserProperties(properties);

export const trackConversion = (goalName: string, value?: number, properties?: EventProperties) =>
  analytics.trackConversion(goalName, value, properties);

export const trackTiming = (
  category: string,
  variable: string,
  timeMs: number,
  properties?: EventProperties
) => analytics.trackTiming(category, variable, timeMs, properties);
