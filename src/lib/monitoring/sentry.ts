/**
 * Shared Sentry configuration.
 *
 * One module holds the options used by the client, server and edge runtimes so
 * the three cannot drift apart — particularly the scrubbing rules, which are a
 * security control rather than a preference.
 *
 * Reporting is OPTIONAL by design: with no DSN configured every entry point
 * below is a no-op and the app runs exactly as before. That keeps local and CI
 * environments from needing a Sentry project.
 */

import type { ErrorEvent, EventHint } from "@sentry/nextjs";

/**
 * The DSN. `NEXT_PUBLIC_` is required because the browser SDK needs it inlined
 * at build time; the bare `SENTRY_DSN` is accepted as a server-side fallback
 * because `src/lib/env.ts` has always validated that name.
 */
export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "";

export const SENTRY_ENABLED = SENTRY_DSN.length > 0;

/**
 * Query parameters that carry a bearer credential in this app.
 *
 * These URLs are genuinely handed to users — the "This Wasn't Me" lockdown
 * link, the email-change revocation link, magic links, and the cron secret —
 * so any error captured on one of those routes would otherwise ship a live
 * credential to a third party inside the event URL and its breadcrumbs.
 */
const SENSITIVE_QUERY_KEYS = ["token", "key", "code", "secret", "invite"];

/** Replaces the value of any sensitive query parameter with `[redacted]`. */
export function scrubUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    // Relative URLs need a base to parse; the base is discarded afterwards.
    const isAbsolute = /^https?:\/\//i.test(rawUrl);
    const url = new URL(rawUrl, isAbsolute ? undefined : "http://scrub.local");
    let touched = false;
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, "[redacted]");
        touched = true;
      }
    }
    if (!touched) return rawUrl;
    return isAbsolute ? url.toString() : url.pathname + url.search + url.hash;
  } catch {
    // An unparseable URL is not worth reporting verbatim — it may be the very
    // malformed input that caused the error.
    return "[unparseable url]";
  }
}

/**
 * Strips credentials from an outgoing event.
 *
 * Applied to the event URL, every breadcrumb URL, and the request payload.
 * Cookies and headers are dropped wholesale rather than filtered: this app's
 * session cookie is a bearer token, and an allow-list would eventually be
 * out-paced by a new header.
 */
export function scrubEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent {
  if (event.request) {
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
    if (event.request.query_string) event.request.query_string = "[redacted]";
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      if (crumb.data && typeof crumb.data.url === "string") {
        return { ...crumb, data: { ...crumb.data, url: scrubUrl(crumb.data.url) } };
      }
      return crumb;
    });
  }

  return event;
}

/** Options shared by every runtime. */
export const sharedSentryOptions = {
  dsn: SENTRY_DSN,
  enabled: SENTRY_ENABLED,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  // Never attach IP addresses, cookies or user identifiers automatically. This
  // app holds rate cards, margins and audit trails; opting in to PII would have
  // to be a deliberate, separately reviewed decision.
  sendDefaultPii: false,

  // Tracing is tree-shaken out of the client bundle entirely (see next.config.js
  // treeshake.removeTracing), so this stays at 0 rather than pretending to
  // sample something that is not shipped.
  tracesSampleRate: 0,

  beforeSend: scrubEvent,
} as const;
