/**
 * Browser-side Sentry initialisation.
 *
 * Next.js loads this file automatically on the client. It is a no-op without a
 * DSN, so local development and CI carry no reporting and no extra work.
 */

import * as Sentry from "@sentry/nextjs";
import { sharedSentryOptions, SENTRY_ENABLED } from "@/lib/monitoring/sentry";

if (SENTRY_ENABLED) {
  Sentry.init({
    ...sharedSentryOptions,

    // Session Replay is deliberately NOT enabled. It records the DOM, and this
    // app renders rate cards, margins and client names — recording those to a
    // third party is a decision for the business, not a default.
    integrations: [],
  });
}

/** Reports client-side navigation timing; required by the Sentry Next.js SDK. */
export const onRouterTransitionStart = SENTRY_ENABLED
  ? Sentry.captureRouterTransitionStart
  : () => {};
