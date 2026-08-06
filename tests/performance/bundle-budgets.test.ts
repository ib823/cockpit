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
const PAGE_BUDGETS: Record<string, number> = {
  "/login": 28,
  "/dashboard": 110,
  "/gantt-tool": 700,
  "/admin": 290,
  "/admin/users": 620,
  "/account": 58,
  "/account/add-passkey": 15,
  "/settings": 6,
  "/settings/security": 18,
  "/register": 17,
};

// Aspirational targets. Deliberately NOT asserted — an unmet assertion either
// sits red forever or gets quietly neutered, which is how the previous version
// of this file ended up proving nothing. Tracked in docs/HANDOFF.md instead.
const PAGE_TARGETS: Record<string, number> = {
  "/login": 30,
  "/dashboard": 30,
  "/gantt-tool": 100,
  "/admin": 30,
  "/admin/users": 30,
};

// Ceiling for everything a route loads, shared chunks included. The shared
// baseline alone is ~343kB across 4 chunks, so no route can currently come in
// under the 300kB figure the docs quote.
const FIRST_LOAD_BUDGET_KB = 1050;

const NEXT_DIR = join(process.cwd(), ".next");
const APP_MANIFEST = join(NEXT_DIR, "app-build-manifest.json");
const buildExists = existsSync(APP_MANIFEST);

/** Chunks every route loads — the shared runtime/framework baseline. */
function sharedChunks(pages: Record<string, string[]>): Set<string> {
  const routes = Object.values(pages);
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

    const routeOnly = files.filter((f) => !shared.has(f));
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
