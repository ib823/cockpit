/**
 * ANALYTICS & TELEMETRY
 *
 * Type-safe PostHog wrapper for tracking user events.
 * Per spec: Measurement_and_Experiments.md
 *
 * Usage:
 *   import { track, identifyUser } from '@/lib/analytics';
 *   track('estimate_shown', { duration: 1500, totalMD: 180 });
 */

import posthog from "posthog-js";

// Initialize PostHog (only in browser)
if (typeof window !== "undefined") {
  const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      loaded: (posthog) => {
        // Opt-out in development
        if (process.env.NODE_ENV === "development") {
          posthog.opt_out_capturing();
        }
      },
      capture_pageview: false, // We'll handle this manually
      autocapture: false, // Disable automatic clicks
    });
  } else {
    console.warn("[Analytics] PostHog key not found. Telemetry disabled.");
  }
}

/**
 * Type-safe event definitions
 *
 * Add new events here to maintain type safety across the app.
 */
export type AnalyticsEvent =
  // Estimator events
  | {
      name: "estimate_shown";
      props: {
        duration: number; // ms from page load
        totalMD: number;
        confidence: number;
      };
    }
  | {
      name: "tier_transition";
      props: {
        from: 1 | 2 | 3;
        to: 1 | 2 | 3;
      };
    }
  // Project events
  | {
      name: "mode_transition";
      props: {
        from: "capture" | "decide" | "plan" | "present";
        to: "capture" | "decide" | "plan" | "present";
      };
    }
  | {
      name: "timeline_generated";
      props: {
        phaseCount: number;
        chipCount: number;
        totalEffort: number;
      };
    }
  | {
      name: "plan_entered";
      props: {
        completeness: number;
        chipCount: number;
      };
    }
  | {
      name: "phase_edited";
      props: {
        phaseId: string;
        field: "duration" | "effort" | "resources";
      };
    }
  | {
      name: "regenerate_preview_shown";
      props: {
        manualEditCount: number;
      };
    }
  // Presentation events
  | {
      name: "presentation_export_started";
      props: {
        slideCount: number;
      };
    }
  | {
      name: "presentation_export_complete";
      props: {
        slideCount: number;
      };
    }
  | {
      name: "presentation_export_failed";
      props: {
        error: string;
      };
    }
  | {
      name: "export_complete";
      props: {
        format: "pdf" | "pptx";
        slideCount: number;
        duration?: number;
      };
    }
  | {
      name: "export_failed";
      props: {
        format: "pdf" | "pptx";
        error: string;
      };
    }
  | {
      name: "slide_edited";
      props: {
        slideId: string;
        action: "reorder" | "hide" | "show";
      };
    }
  | {
      name: "notes_used";
      props: Record<string, never>; // No properties
    }
  // Onboarding events
  | {
      name: "gratitude_animation_complete";
      props: Record<string, never>;
    }
  | {
      name: "signup";
      props: {
        source: "estimator" | "landing" | "direct";
      };
    }
  // Error events
  | {
      name: "error_occurred";
      props: {
        context: string;
        message: string;
        stack?: string;
      };
    };

/**
 * Track an event with type safety
 */
export function track<E extends AnalyticsEvent>(name: E["name"], props: E["props"]): void {
  if (typeof window === "undefined") return;

  try {
    posthog.capture(name, props);
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Identify a user (call after login)
 */
export function identifyUser(
  userId: string,
  traits: {
    email?: string;
    name?: string;
    company?: string;
    role?: string;
  }
): void {
  if (typeof window === "undefined") return;

  try {
    posthog.identify(userId, traits);
  } catch (error) {
    console.error("[Analytics] Failed to identify user:", error);
  }
}

/**
 * Track page view manually
 */
export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;

  try {
    posthog.capture("$pageview", { $current_url: path });
  } catch (error) {
    console.error("[Analytics] Failed to track pageview:", error);
  }
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser(): void {
  if (typeof window === "undefined") return;

  try {
    posthog.reset();
  } catch (error) {
    console.error("[Analytics] Failed to reset user:", error);
  }
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return posthog.has_opted_in_capturing();
}

/**
 * Export raw posthog instance for advanced usage
 */
export { posthog };
