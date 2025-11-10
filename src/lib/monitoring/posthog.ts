/**
 * PostHog Analytics Integration
 *
 * Product analytics and feature flags for the Keystone application
 */

import posthog from "posthog-js";

// Initialize PostHog (client-side only)
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        posthog.debug();
      }
    },
    capture_pageview: false, // We'll capture manually
    capture_pageleave: true,
    autocapture: false, // Explicit tracking only
  });
}

/**
 * Track custom events
 */
export const trackEvent = {
  // Estimator Events
  estimatorCalculated: (data: {
    totalMD: number;
    durationMonths: number;
    l3Count: number;
    complexity: number;
  }) => {
    if (typeof window === "undefined") return;
    posthog.capture("estimator_calculated", data);
  },

  estimatorL3Selected: (data: { l3Code: string; l3Name: string; tier: string }) => {
    if (typeof window === "undefined") return;
    posthog.capture("estimator_l3_selected", data);
  },

  // Scenario Events
  scenarioSaved: (data: {
    scenarioId: string;
    name: string;
    totalMD: number;
    durationMonths: number;
  }) => {
    if (typeof window === "undefined") return;
    posthog.capture("scenario_saved", data);
  },

  scenarioLoaded: (data: { scenarioId: string; name: string }) => {
    if (typeof window === "undefined") return;
    posthog.capture("scenario_loaded", data);
  },

  // Timeline Events
  timelineGenerated: (data: {
    phaseCount: number;
    resourceCount: number;
    durationMonths: number;
  }) => {
    if (typeof window === "undefined") return;
    posthog.capture("timeline_generated", data);
  },

  timelineEdited: (data: { editType: "phase" | "resource" | "milestone"; changeCount: number }) => {
    if (typeof window === "undefined") return;
    posthog.capture("timeline_edited", data);
  },

  // Export Events
  exportGenerated: (data: { format: "pdf" | "powerpoint" | "csv"; scenarioId?: string }) => {
    if (typeof window === "undefined") return;
    posthog.capture("export_generated", data);
  },

  // Decision Support Events
  uncertaintyAnalysisViewed: (data: {
    confidenceLevel: "low" | "medium" | "high";
    expectedMonths: number;
  }) => {
    if (typeof window === "undefined") return;
    posthog.capture("uncertainty_analysis_viewed", data);
  },

  sensitivityAnalysisViewed: (data: { topVariable: string; impactRange: number }) => {
    if (typeof window === "undefined") return;
    posthog.capture("sensitivity_analysis_viewed", data);
  },

  optimizationSuggestionApplied: (data: {
    scenario: string;
    feasibility: string;
    riskScore: number;
  }) => {
    if (typeof window === "undefined") return;
    posthog.capture("optimization_suggestion_applied", data);
  },

  // User Events
  userLoggedIn: (data: { userId: string; method: "passkey" | "magic-link" | "admin" }) => {
    if (typeof window === "undefined") return;
    posthog.capture("user_logged_in", data);
  },

  userLoggedOut: () => {
    if (typeof window === "undefined") return;
    posthog.capture("user_logged_out");
  },

  // Feature Usage
  featureUsed: (featureName: string, metadata?: Record<string, any>) => {
    if (typeof window === "undefined") return;
    posthog.capture("feature_used", { feature: featureName, ...metadata });
  },

  // Error Tracking
  errorOccurred: (data: { errorType: string; errorMessage: string; context?: string }) => {
    if (typeof window === "undefined") return;
    posthog.capture("error_occurred", data);
  },
};

/**
 * Identify user for analytics
 */
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, traits);
}

/**
 * Reset user identity (on logout)
 */
export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagName: string): boolean {
  if (typeof window === "undefined") return false;
  return posthog.isFeatureEnabled(flagName) || false;
}

/**
 * Get feature flag variant
 */
export function getFeatureFlagVariant(flagName: string): string | boolean {
  if (typeof window === "undefined") return false;
  return posthog.getFeatureFlag(flagName) || false;
}

export default posthog;
