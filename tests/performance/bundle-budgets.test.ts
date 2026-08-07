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
// /login and /register were re-baselined 2026-08-07 when they became the first
// routes migrated to the design system. This is a REAL regression, recorded
// rather than hidden: route JS went 28 -> 51kB and 17 -> 44kB.
//
// The migration was measured, not guessed, and three genuine causes were fixed
// before accepting the remainder:
//
//   121.1kB  first measurement, importing from the `@/components/ds` barrel
//    84.8kB  after importing components from their own modules -- the barrel
//            re-exports Modal, which pulls focus-trap-react into any page that
//            touches it
//    75.1kB  after splitting AuthShell out of AppShell, which was dragging in
//            next/link, the nav state machine and the whole Display module
//    50.9kB  after replacing `cn` with a local `cx` across the design system.
//            `cn` wraps clsx in tailwind-merge, whose only job is resolving
//            conflicts between Tailwind utility classes -- it has nothing to do
//            for CSS Module hashes, and cost ~24kB on every route that imported
//            a component.
//
// Field.tsx was subsequently split per component on the theory that it was the
// remaining weight. It was measured afterwards and gained ~0.1kB -- the theory
// was wrong, and is corrected in docs/HANDOFF.md rather than left standing.
//
// A SECOND prediction was made and also proved wrong. It said shared code would
// amortise so per-route JS would stay flat as more routes migrated. Then three
// admin routes migrated -- touching /login not at all -- and /login went
// 50.8 -> 57.1kB.
//
// Its OWN chunk measured 21.4kB before and 21.4kB after: byte identical. The
// whole delta is shared code being re-attributed, because webpack re-split the
// chunks once five routes used the design system and this metric sums every
// chunk a route loads.
//
// So the important property of this metric: a route's measured size changes
// when UNRELATED routes change. An exact-fit budget therefore goes red on a
// commit that never touched the route. These two now carry ~20% headroom
// rather than the ~8% they had, which is what the file's own header always
// said budgets are for -- "measured values with headroom, not targets".
//
// -----------------------------------------------------------------------
// MIGRATION-WIDE EFFECT (2026-08-07). Read this before raising another number.
//
// Every route migrated to the design system crosses its old budget, and the
// reason is the same each time rather than a new problem each time. Measured
// per route, own page code versus shared design-system chunks:
//
//     /settings              own  4.3kB   (old budget 6kB,  measured 16.4kB)
//     /account/add-passkey   own  4.9kB   (old budget 15kB, measured 59.7kB)
//     /admin                 own 10.6kB   (old budget 290kB, measured 306.4kB)
//
// The own-code figures are SMALL -- /settings' page code is smaller than its
// entire old budget. The overage is shared chunks, which this metric bills to
// every route that touches them even though the user downloads them once and
// caches them across the whole app. The first-load budgets, which are the
// figure a user actually waits for, all still pass at their existing values.
//
// These are therefore re-baselined as one migration-wide effect, not three
// separate regressions. THE ACTION THIS CREATES: once every route is migrated,
// the shared chunks move into the common baseline and these numbers should
// FALL. Re-measure all per-route budgets downward at that point -- leaving
// these inflated values in place afterwards would turn the guard back into
// something that cannot fail, which is the exact defect this file was
// rewritten to remove.
//
// The distinction that matters, same as the coverage floors: re-baselining
// after a deliberate composition change is legitimate; raising a budget to make
// a red build pass is not. These pages genuinely changed composition -- from
// hand-rolled markup with nothing reusable to a shared design system whose cost
// every subsequent route amortises. The tailwind-merge fix above already
// benefits every route that will follow.
const PAGE_BUDGETS: Record<string, number> = {
  "/login": 70,
  "/dashboard": 110,
  "/gantt-tool": 700,
  "/admin": 340,
  "/admin/users": 620,
  "/account": 58,
  "/account/add-passkey": 70,
  "/settings": 22,
  "/settings/security": 18,
  "/register": 62,
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
