/**
 * Route smoke tests.
 *
 * This exists because the rest of `tests/e2e` could not be made into a CI
 * gate. Measured against a production build of this app, that suite is 9
 * passed / 51 failed / 39 skipped: `plan-timeline.spec.ts` is placeholders,
 * `team-capacity-api.spec.ts` needs a seeded database, and the visual and
 * user-journey specs navigate to `/projects` and `/projects/new`, which do
 * not exist here. They assert a UI this app does not have, so making them
 * required would mean either a permanently red build or 51 more skips.
 *
 * What this file asserts instead is small, true, and cheap enough that nobody
 * learns to ignore it — a slow or flaky required check is how an end-to-end
 * suite becomes decorative:
 *
 *  - Every route in the app answers, and answers the way the auth boundary
 *    says it should. This catches a build that compiles but 500s on load, a
 *    page that stops being protected, and a route deleted by accident.
 *  - The login page — the one screen an unauthenticated visitor can reach —
 *    renders a usable, named form.
 *
 * The table below is deliberately exhaustive rather than a sample: a new page
 * added without a line here is a page nobody checked. It was built by probing
 * a running production build, not from the middleware source, so it records
 * what the app does rather than what it intends.
 */

import { test, expect } from "@playwright/test";

/**
 * The middleware sends a relative Location ("/login?callbackUrl=%2Fdashboard"),
 * which URL cannot parse on its own. The origin here only exists to make it
 * parseable — nothing asserts against it.
 */
function redirectTarget(response: { headers(): Record<string, string> }): URL {
  const location = response.headers()["location"];
  expect(location, "response carried no Location header").toBeTruthy();
  return new URL(location, "http://redirect.invalid");
}

/** Reachable without a session. */
const PUBLIC_ROUTES = ["/login", "/register", "/design"];

/**
 * Redirected to /login when there is no session. `/` and `/admin` are absent
 * on purpose — they are covered separately below because they redirect
 * somewhere else first.
 */
const PROTECTED_ROUTES = [
  "/dashboard",
  "/account",
  "/admin/users",
  "/architecture",
  "/architecture/v3",
  "/gantt-tool",
  "/organization-chart",
  "/settings",
  "/settings/security",
];

/**
 * The route sweep uses the `request` fixture rather than page navigations.
 * That is not just a speed choice: the middleware rate-limits by IP at 60
 * requests a minute, and a browser navigation costs far more than one — the
 * document, the RSC payload, the session endpoint. Sweeping fourteen routes
 * in a browser tripped the limiter partway through, and a 429 looks exactly
 * like "the redirect stopped working". One request per route stays well
 * inside the budget and asserts the middleware contract directly.
 */
test.describe("Public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} is reachable without a session`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });

      expect(response.status(), `${route} should return 200`).toBe(200);
    });
  }
});

test.describe("Protected routes", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects an anonymous visitor to /login`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });

      // Guarded explicitly, because a 429 would otherwise read as "this route
      // stopped redirecting" and send someone hunting through the middleware.
      expect(response.status(), `${route} was rate limited, not routed`).not.toBe(429);
      expect(response.status(), `${route} should redirect`).toBe(307);

      const location = redirectTarget(response);
      expect(location.pathname).toBe("/login");
      // The callback is what returns the user to where they were going, so
      // losing it is a real regression even though the redirect still "works".
      expect(location.searchParams.get("callbackUrl")).toBe(route);
    });
  }

  test("/ redirects an anonymous visitor to /login", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    // No callbackUrl here: the root is where login sends people anyway.
    expect(redirectTarget(response).pathname).toBe("/login");
  });

  test("/admin never serves the admin page to an anonymous visitor", async ({
    request,
  }) => {
    // /admin is the one route that does not go straight to /login — the
    // middleware bounces it to /dashboard, which then redirects. Recorded as
    // it behaves rather than treated as a defect; what matters is that the
    // chain terminates at /login and never renders the admin page.
    const first = await request.get("/admin", { maxRedirects: 0 });
    expect(first.status()).toBe(307);
    expect(redirectTarget(first).pathname).toBe("/dashboard");

    const second = await request.get("/dashboard", { maxRedirects: 0 });
    expect(second.status()).toBe(307);
    expect(redirectTarget(second).pathname).toBe("/login");
  });
});

test.describe("Login page", () => {
  test("presents a named email field and a submit control", async ({ page }) => {
    await page.goto("/login");

    // By accessible name, not by selector: the point is that a screen reader
    // user can find the field, which a CSS selector would not prove.
    const email = page.getByRole("textbox", { name: /work email/i });
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("type", "email");

    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  test("is operable by keyboard alone", async ({ page }) => {
    await page.goto("/login");

    const email = page.getByRole("textbox", { name: /work email/i });
    await email.focus();
    await page.keyboard.type("someone@example.com");

    await expect(email).toHaveValue("someone@example.com");

    // Tab must reach the submit control from the field — if it does not, the
    // only way to sign in is with a mouse.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /continue/i })).toBeFocused();
  });
});
