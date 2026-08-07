/**
 * Bundle Performance Budgets
 *
 * Enforces per-route JavaScript budgets against REAL build output.
 *
 * History: this suite previously declared `manifestPath` and `appPathsPath`,
 * never read either, and asserted hardcoded constants against themselves —
 * e.g. `expect(FIRST_LOAD_BUDGET_KB).toBeGreaterThan(100)`. It could not fail
 * for any bundle size, however large, so the "performance budget check" step in
 * CI proved nothing. It now sums the actual chunk bytes each route loads,
 * taken from `.next/app-build-manifest.json`, and compares them to the budgets.
 *
 * Requires a production build (`pnpm build`). Without one the size assertions
 * skip rather than silently pass — see the guard below, which is reported.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";

// Per-route budgets for route-specific JS, in kB.
//
// These are REGRESSION FLOORS derived from measured build output (2026-08-06),
// with ~10% headroom — not targets. They exist so a bundle cannot grow further
// unnoticed. See TARGETS below for where these should eventually land, and
// docs/HANDOFF.md for why the two differ so widely.
//
// ---------------------------------------------------------------------------
// THE BUDGETS WERE MEASURING THE WRONG THING (found and fixed 2026-08-07)
//
// These numbers were raised five times during the design-system migration,
// each time with a plausible-sounding explanation, and each explanation was
// wrong. The actual cause was in this file:
//
//   1. `sharedChunks` intersected across EVERY manifest entry, including API
//      routes, `/layout` and `/error`. Those carry no stylesheet, so CSS could
//      never qualify as shared — and the app's entire global stylesheet, 66.2kB
//      of it, was billed to every single route.
//
//   2. `routeKb` counted `.css` files as "route JS".
//
// Together those meant every CSS module added anywhere inflated EVERY route's
// number by the same amount, on commits that touched neither the route nor its
// JavaScript. That is why /settings — a redirect page whose own code is 4.3kB —
// measured 70.4kB against a 6kB budget.
//
// Fixed by intersecting across pages only and measuring JavaScript, which is
// what the budget is named for. Every budget is now re-baselined DOWNWARD to
// its real measurement plus ~15%, which is what the handoff said had to happen
// once the migration settled:
//
//     /settings             70.4 -> 4.3kB    budget 5
//     /login                96.5 -> 30.3kB   budget 35
//     /register             89.4 -> 23.2kB   budget 27
//     /account             142.8 -> 75.6kB   budget 87
//     /account/add-passkey  88.3 -> 22.1kB   budget 26
//
// Several are now TIGHTER than the values this file shipped with, because the
// old numbers were inflated by the same bug.
//
// CSS is no longer measured here at all. It should be, separately — a
// stylesheet measured as script is neither honest nor actionable, since the two
// have different costs, different caching and different fixes. Recorded in
// docs/HANDOFF.md.
const PAGE_BUDGETS: Record<string, number> = {
  "/login": 35,
  "/dashboard": 73,
  "/gantt-tool": 699,
  "/admin": 312,
  "/admin/users": 666,
  "/account": 87,
  "/account/add-passkey": 26,
  "/settings": 5,
  "/settings/security": 42,
  "/register": 27,
};

// Aspirational targets. Deliberately NOT asserted — an unmet assertion either
// sits red forever or gets quietly neutered, which is how the previous version
// of this file ended up proving nothing. Tracked in docs/HANDOFF.md instead.
const PAGE_TARGETS: Record<string, number> = {
  // Reachable once Field.tsx is split per component.
  "/login": 30,
  "/dashboard": 30,
  "/gantt-tool": 100,
  "/admin": 30,
  "/admin/users": 30,
};

// Ceiling for everything a route loads, shared chunks included.
//
// Re-baselined 2026-08-07 when Sentry was wired in. The error-reporting SDK
// costs ~186kB on the shared baseline (343kB -> 529kB), so it is paid by every
// route. Tracing is already tree-shaken out (next.config.js
// treeshake.removeTracing), which recovered ~82kB of that.
//
// This is a deliberate trade: the audit's top production blocker was that the
// app had no error visibility at all — a crash was an unstyled white screen
// nobody was told about. Per-route budgets were unaffected and are unchanged;
// only this ceiling moved.
const FIRST_LOAD_BUDGET_KB = 1300;

const NEXT_DIR = join(process.cwd(), ".next");
const APP_MANIFEST = join(NEXT_DIR, "app-build-manifest.json");
const buildExists = existsSync(APP_MANIFEST);

/** Chunks every route loads — the shared runtime/framework baseline. */
/**
 * Chunks every PAGE loads.
 *
 * Restricted to pages on purpose. The manifest also lists API routes,
 * `/layout`, `/error` and friends, and those carry no stylesheet at all — so
 * intersecting across everything meant CSS could never qualify as shared, and
 * the app's entire global stylesheet was billed to every single route.
 *
 * That was worth 66.2kB per route, identically, and it grew every time a CSS
 * module was added. It is the reason these budgets appeared to regress on
 * commits that touched neither the route nor its JavaScript.
 */
function sharedChunks(pages: Record<string, string[]>): Set<string> {
  const routes = Object.entries(pages)
    .filter(([key]) => key.endsWith("/page"))
    .map(([, files]) => files);

  if (routes.length === 0) return new Set();
  return routes.reduce<Set<string>>(
    (shared, files) => new Set(files.filter((f) => shared.has(f))),
    new Set(routes[0])
  );
}

function bytesOf(file: string): number {
  const path = join(NEXT_DIR, file);
  return existsSync(path) ? statSync(path).size : 0;
}

function kb(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}

interface RouteSizes {
  routeKb: number;
  firstLoadKb: number;
}

/** Measures route-specific and total first-load JS for each budgeted route. */
function measure(): Map<string, RouteSizes> {
  const manifest = JSON.parse(readFileSync(APP_MANIFEST, "utf-8")) as {
    pages: Record<string, string[]>;
  };
  const pages = manifest.pages ?? {};
  const shared = sharedChunks(pages);

  const results = new Map<string, RouteSizes>();
  for (const route of Object.keys(PAGE_BUDGETS)) {
    // Manifest keys are page paths: "/gantt-tool" -> "/gantt-tool/page".
    const key = route === "/" ? "/page" : `${route}/page`;
    const files = pages[key];
    if (!files) continue;

    // JavaScript only. The budget is named "route JS", and a stylesheet
    // measured as script is neither honest nor actionable — CSS and JS have
    // different costs, different caching and different fixes.
    const routeOnly = files.filter((f) => !shared.has(f) && f.endsWith(".js"));
    results.set(route, {
      routeKb: kb(routeOnly.reduce((sum, f) => sum + bytesOf(f), 0)),
      firstLoadKb: kb(files.reduce((sum, f) => sum + bytesOf(f), 0)),
    });
  }
  return results;
}

describe("Bundle budget definitions", () => {
  it("defines a budget for every critical route", () => {
    for (const route of ["/login", "/dashboard", "/gantt-tool", "/admin", "/admin/users"]) {
      expect(PAGE_BUDGETS[route], `Missing budget for ${route}`).toBeDefined();
    }
  });

  it("records a target for every high-traffic page", () => {
    // Asserts the targets are documented, not that they are met. Meeting them
    // is tracked as open work — see docs/HANDOFF.md.
    for (const route of ["/login", "/dashboard", "/gantt-tool", "/admin", "/admin/users"]) {
      expect(PAGE_TARGETS[route], `Missing target for ${route}`).toBeGreaterThan(0);
    }
  });
});

describe.skipIf(!buildExists)("Bundle budgets vs. real build output", () => {
  const sizes = buildExists ? measure() : new Map<string, RouteSizes>();

  it("resolves at least one budgeted route in the build manifest", () => {
    // Guards against a manifest key-shape change silently emptying this suite,
    // which would turn every assertion below into a no-op.
    expect(sizes.size).toBeGreaterThan(0);
  });

  for (const [route, budgetKb] of Object.entries(PAGE_BUDGETS)) {
    it(`${route} route JS is within ${budgetKb}kB`, ({ skip }) => {
      const measured = sizes.get(route);
      if (!measured) {
        skip(`${route} not present in build manifest`);
        return;
      }
      expect(
        measured.routeKb,
        `${route} route JS is ${measured.routeKb}kB, over its ${budgetKb}kB budget`
      ).toBeLessThanOrEqual(budgetKb);
    });
  }

  for (const route of Object.keys(PAGE_BUDGETS)) {
    it(`${route} first-load JS is within ${FIRST_LOAD_BUDGET_KB}kB`, ({ skip }) => {
      const measured = sizes.get(route);
      if (!measured) {
        skip(`${route} not present in build manifest`);
        return;
      }
      expect(
        measured.firstLoadKb,
        `${route} first-load JS is ${measured.firstLoadKb}kB, over the ${FIRST_LOAD_BUDGET_KB}kB ceiling`
      ).toBeLessThanOrEqual(FIRST_LOAD_BUDGET_KB);
    });
  }
});
