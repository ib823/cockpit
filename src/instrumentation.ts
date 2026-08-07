/**
 * Next.js instrumentation hook — server and edge runtimes.
 *
 * Also the natural home for boot-time environment validation. `src/lib/env.ts`
 * claims to "fail loudly at startup", but it only runs when a route imports it,
 * and only five routes do — so a misconfigured deploy used to boot clean and
 * fail later on one of those five. Importing it here makes the claim true.
 */

import type { Instrumentation } from "next";
import { sharedSentryOptions, SENTRY_ENABLED } from "@/lib/monitoring/sentry";

export async function register() {
  // Validate configuration once, at boot, for every runtime.
  await import("@/lib/env");

  if (!SENTRY_ENABLED) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init(sharedSentryOptions);
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init(sharedSentryOptions);
  }
}

/**
 * Reports errors thrown inside React Server Components, route handlers and
 * middleware — which do not surface through any client-side boundary.
 */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!SENTRY_ENABLED) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
