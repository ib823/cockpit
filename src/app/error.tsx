/**
 * Route-segment error boundary.
 *
 * Without this file an unhandled render error anywhere under `src/app` is an
 * unstyled white screen with nothing logged. The App Router mounts this
 * component in place of the failing segment, keeping the shell and offering a
 * recovery path.
 *
 * `global-error.tsx` covers failures in the root layout itself, which this
 * boundary cannot catch.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { SENTRY_ENABLED } from "@/lib/monitoring/sentry";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // `digest` is the server-side correlation id Next assigns to the thrown
    // error; it is the only handle on the original stack once it is redacted
    // in production, so it must be logged.
    logger.error("Unhandled route error", { error, digest: error.digest });

    // Report off-box, tagged with the same digest so a Sentry issue can be
    // matched to the server log line that recorded it.
    if (SENTRY_ENABLED) {
      void import("@sentry/nextjs").then((Sentry) =>
        Sentry.captureException(error, { tags: { digest: error.digest ?? "none" } })
      );
    }
  }, [error]);

  return (
    <main
      role="alert"
      aria-labelledby="error-heading"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 id="error-heading" className="text-2xl font-semibold text-[var(--color-text-primary)]">
        Something went wrong
      </h1>
      <p className="max-w-md text-[var(--color-text-secondary)]">
        This page could not be displayed. Your work is saved locally and will sync once the
        problem clears.
      </p>
      {error.digest ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[var(--color-blue)] px-4 py-2 font-medium text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[var(--color-border-default)] px-4 py-2 font-medium text-[var(--color-text-primary)]"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
