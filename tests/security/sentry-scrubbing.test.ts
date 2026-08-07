/**
 * Sentry credential scrubbing.
 *
 * Several URLs in this app carry a live bearer credential in the query string —
 * the "This Wasn't Me" account-lockdown link (`/api/security/revoke?token=`),
 * the email-change revocation link, magic links, and the cron secret. An error
 * captured on any of those routes would otherwise ship a working credential to
 * a third-party service inside the event URL and its breadcrumbs.
 *
 * These tests pin the scrubbing so that cannot regress quietly.
 */

import { describe, test, expect } from "vitest";
import { scrubUrl, scrubEvent } from "@/lib/monitoring/sentry";
import type { ErrorEvent } from "@sentry/nextjs";

describe("scrubUrl", () => {
  test.each([
    ["token", "https://app.example.com/api/security/revoke?token=eyJhbGciOi.secret"],
    ["key", "https://app.example.com/api/cron/password-expiry-warnings?key=s3cr3t"],
    ["code", "https://app.example.com/register?code=123456"],
    ["secret", "https://app.example.com/x?secret=abc"],
    ["invite", "https://app.example.com/gantt-tool/invite?invite=abc123"],
  ])("redacts the %s parameter", (param, url) => {
    const scrubbed = scrubUrl(url);
    // The parameter NAME legitimately survives; only its value is redacted.
    expect(scrubbed).toContain(`${param}=%5Bredacted%5D`);
    expect(scrubbed).not.toMatch(/eyJhbGciOi|s3cr3t|123456|abc123|[?&]secret=abc/);
  });

  test("preserves non-sensitive parameters", () => {
    expect(scrubUrl("https://app.example.com/gantt-tool?projectId=p1&zoom=week")).toBe(
      "https://app.example.com/gantt-tool?projectId=p1&zoom=week"
    );
  });

  test("handles relative URLs without inventing an origin", () => {
    const out = scrubUrl("/api/security/revoke?token=abc");
    expect(out).toContain("token=%5Bredacted%5D");
    expect(out).not.toContain("scrub.local");
    expect(out.startsWith("/api/security/revoke")).toBe(true);
  });

  test("does not echo a genuinely unparseable URL back", () => {
    // Verified against Node's URL parser: these throw even with a base.
    for (const bad of ["http://%", "https://exa mple.com", "//", "http://["]) {
      expect(scrubUrl(bad)).toBe("[unparseable url]");
    }
  });

  test("passes an empty value through unchanged", () => {
    expect(scrubUrl("")).toBe("");
  });
});

describe("scrubEvent", () => {
  test("drops cookies, headers and body from the request", () => {
    const event = {
      request: {
        url: "https://app.example.com/api/security/revoke?token=live",
        query_string: "token=live",
        cookies: { "__Secure-session": "a-real-session" },
        headers: { authorization: "Bearer live-token" },
        data: { password: "hunter2" },
      },
    } as unknown as ErrorEvent;

    const out = scrubEvent(event);

    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.headers).toBeUndefined();
    expect(out.request?.data).toBeUndefined();
    expect(out.request?.query_string).toBe("[redacted]");
    expect(out.request?.url).toContain("token=%5Bredacted%5D");
    expect(JSON.stringify(out)).not.toMatch(/a-real-session|live-token|hunter2/);
  });

  test("scrubs breadcrumb URLs, which is where navigation history leaks", () => {
    const event = {
      breadcrumbs: [
        { data: { url: "/api/user/email/revoke?token=leaked" } },
        { data: { url: "/dashboard" } },
        { message: "no data key at all" },
      ],
    } as unknown as ErrorEvent;

    const out = scrubEvent(event);

    expect(out.breadcrumbs?.[0].data?.url).toContain("token=%5Bredacted%5D");
    expect(out.breadcrumbs?.[1].data?.url).toBe("/dashboard");
    expect(out.breadcrumbs?.[2]).toBeDefined();
    expect(JSON.stringify(out)).not.toContain("leaked");
  });

  test("tolerates an event with no request and no breadcrumbs", () => {
    expect(() => scrubEvent({} as ErrorEvent)).not.toThrow();
  });
});

describe("configuration posture", () => {
  test("is disabled when no DSN is configured", async () => {
    // The suite runs without a DSN, so reporting must be off — otherwise CI and
    // local runs would attempt network calls to Sentry.
    const { SENTRY_ENABLED } = await import("@/lib/monitoring/sentry");
    expect(SENTRY_ENABLED).toBe(false);
  });

  test("never opts in to PII by default", async () => {
    const { sharedSentryOptions } = await import("@/lib/monitoring/sentry");
    expect(sharedSentryOptions.sendDefaultPii).toBe(false);
  });
});
