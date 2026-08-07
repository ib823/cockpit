/**
 * Root error boundary.
 *
 * Catches failures in the root layout itself, which `error.tsx` cannot — at
 * that point no layout has rendered, so this component must supply its own
 * <html>/<body>. Styles are inline for the same reason: the stylesheet chain
 * may be exactly what failed.
 */

"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled root layout error", { error, digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#1D1D1F",
          backgroundColor: "#FFFFFF",
        }}
      >
        <main role="alert" aria-labelledby="global-error-heading">
          <h1 id="global-error-heading" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ maxWidth: "28rem", color: "#666666" }}>
            The application failed to load. Please try again.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.875rem", color: "#666666" }}>
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "0.5rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "#0B57D0",
              color: "#FFFFFF",
              padding: "0.5rem 1rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
