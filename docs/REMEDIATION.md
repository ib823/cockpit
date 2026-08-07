# Remediation plan

Every open item from the audit and the design-system migration, with the
recommended fix, the reasoning, and an honest cost. Measured against the repo
on 2026-08-07, not recalled.

Ordered by **risk × reachability**, not by effort. An item that is cheap but
harmless sits below one that is expensive and dangerous.

---

## Tier 1 — Do these first

### 1.1 Sentry is wired and inert

**State:** `NEXT_PUBLIC_SENTRY_DSN` is unset, so every Sentry entry point
no-ops. Production has no error reporting at all.

**Fix:** Set it in Vercel (Production, and Preview if wanted), then redeploy
**with the build cache disabled**. `NEXT_PUBLIC_*` is inlined at build time, so
a cached build reuses the bundle with no DSN in it — the usual reason "I added
it and nothing happened".

**Then:** add `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (scope
`project:releases`) so stack traces are readable rather than minified. These
must **not** be `NEXT_PUBLIC_` — they are build-time only and must never reach
the browser.

**Verify:** devtools → Network → filter `monitoring`. Reports tunnel through
the app's own origin so ad blockers cannot drop them.

**Cost:** 5 minutes. **Blocks:** knowing whether anything is broken in
production.

---

### 1.2 The accessibility suites are skipped

**State:** 201 skipped tests. Among them, by name:

```
architecture/v3/__tests__/focus-trap.test.tsx          27 tests
architecture/v3/__tests__/keyboard-navigation.test.tsx 31 tests
__tests__/aria-labels.test.tsx
__tests__/integration.test.tsx
```

These are the tests that would catch exactly the class of defect this audit
found — a dialog with no focus trap, a control with no accessible name.

**Why they were skipped is now known and fixed.** `tests/setup.ts` stubbed
`getComputedStyle` to report `display: 'none'` for every element, which made
`getByRole` unable to match anything repo-wide. That stub is gone.

**Fix:** un-skip them one file at a time, starting with `focus-trap` and
`keyboard-navigation`. Expect failures — they were written against a broken
environment and some will have been written to pass under it. **Treat each
failure as a finding, not as a test to delete.**

**Do not** un-skip all 201 in one commit. A large red suite gets skipped again.

**Cost:** ~1 session per file. **Value:** the highest of anything on this list —
it converts accessibility from a claim into a gate.

---

### 1.3 Playwright never runs in CI

**State:** `playwright.config.ts` has a `webServer` block and 4 spec files. The
CI workflow's steps are: lint, typecheck, test with coverage, build, budget
check. **No e2e step.**

**Fix:** add a job to `.github/workflows/`:

```yaml
e2e:
  needs: validate           # reuse the build, do not rebuild
  steps:
    - uses: actions/checkout@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm exec playwright install --with-deps chromium
    - run: pnpm exec playwright test
```

**Two things to get right:**

- **Pin the browser version** via the Playwright version in `package.json`.
  A floating browser makes failures unreproducible, which is how e2e suites
  become "flaky" and then ignored.
- **Upload the trace on failure** (`--trace on-first-retry`). An e2e failure
  with no trace costs more to diagnose than it saves.

**Also:** the number-input arrow-key behaviour deliberately left untested in
jsdom belongs here. It is browser behaviour and jsdom does not emulate it.

**Cost:** half a session. **Value:** the only tests that exercise the real
browser, and the only ones that would catch a CSP or hydration break.

---

## Tier 2 — Security and correctness

### 2.1 `unsafe-inline` in the production CSP

**State:** `next.config.js:58-59`

```js
`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
"style-src 'self' 'unsafe-inline'",
```

`script-src 'unsafe-inline'` defeats most of what CSP is for: it permits any
injected `<script>` to execute, which is the primary XSS mitigation.

**Fix, in order:**

1. **`script-src`** — replace with a nonce. Next.js supports this through
   middleware: generate a nonce per request, set it on the CSP header, and pass
   it to `<Script nonce>`. The inline scripts in `src/app/layout.tsx` (the
   theme initialiser and the loader) both need it.
2. **`style-src`** — harder, and lower risk. React inline styles and CSS-in-JS
   need it. This codebase now uses CSS Modules almost everywhere, so it may be
   removable; the remaining `style={{...}}` props are the blocker.

**Verify in a real browser, not a test.** A CSP that breaks the app is worse
than a permissive one, and the failure mode is a blank page. Ship it to Preview
first and click through every route.

**Cost:** one session for `script-src`. **Value:** high — it is the difference
between "we have a CSP" and "we have a CSP that does something".

---

### 2.2 No optimistic locking on the delta route

**State:** the delta route authorises every id and writes. Two clients editing
the same task both succeed; the second silently overwrites the first.

In a local-first app where clients queue changes offline, this is not a rare
race — it is the normal case after two people work on a plane.

**Fix:** add a version column and check it in the same transaction:

```prisma
model GanttTask {
  version Int @default(0)
}
```

```ts
const { count } = await tx.ganttTask.updateMany({
  where: { id, phase: { projectId }, version: clientVersion },
  data: { ...fields, version: { increment: 1 } },
});
if (count === 0) conflicts.push(id);   // do not throw — report
```

**Return conflicts rather than failing the request.** A 409 for the whole batch
discards good changes alongside the conflicting one. The client should be told
*which* entities conflicted so it can present a merge.

**Cost:** one session including a migration and the conflict UI contract.
**Value:** high — this is silent data loss, and silent is the worst kind.

---

### 2.3 Background sync re-fetches the whole project every 5 seconds

**State:** to compute a delta, the client fetches the full project, diffs it
locally, and sends the difference.

At 80 phases and 1,200 tasks that is a large payload every 5s per open tab.

**Fix, cheapest first:**

1. **Send `If-None-Match`** and return `304` when unchanged. One header, and it
   removes the payload for the common case where nothing changed.
2. **Back off when idle.** 5s while the user is typing, 30s after a minute of
   no input, pause when the tab is hidden (`visibilitychange`).
3. **Only then** consider server-sent deltas. It is the right end state, but it
   is a much larger change and the first two recover most of the cost.

**Cost:** half a session for (1) and (2). **Value:** moderate — it is a cost
problem and a battery problem, not a correctness one.

---

## Tier 3 — The migration's remaining tail

### 3.1 `/gantt-tool` and `/architecture/v3`

**State:** 17 of 19 routes migrated. These two are not, deliberately.
`GanttCanvasV3` is 4,078 lines handling pointer drag, resize, dependency
editing, resource capacity, milestones and cost gating. `GanttCanvas` is ~400
lines covering rows, windowing, bars, keyboard move and announcements.

**Do not swap them.** That deletes working functionality.

**Recommended approach — strangler, not rewrite:**

1. Put the new canvas behind a flag on `/gantt-tool`, defaulting off.
2. Port one capability at a time, in this order — each is independently
   shippable and each is a real user-facing gain on its own:
   - pointer drag / resize / reorder (the keyboard equivalents already exist
     and share the grain and snapping rules, so this is mostly event plumbing)
   - dependency editing
   - resource capacity panel
   - milestone modal
   - cost gating and financial-access rules
3. Run both against the same store and diff the rendered output in a test.
4. Flip the flag only when parity is demonstrated, then delete the old one.

**Cost:** several sessions. **Value:** visual consistency plus a keyboard-
operable timeline, which the current one is not.

**The alternative is defensible:** the current Gantt works. One legacy screen
may be a fair price against a multi-session port with regression risk. This is
a product call, not an engineering one.

---

### 3.2 17 files still import the legacy design system, 5 still use Ant Design

**Fix:** these are now only reachable from the two unmigrated routes and their
component trees. They will fall out naturally as 3.1 proceeds.

**Do not delete them speculatively.** The last dead-code sweep deleted
`next-auth.d.ts` because ambient declarations are never imported and no import
graph sees them. Run the graph, then check the residue by hand.

---

## Tier 4 — Measurement integrity

### 4.1 CSS is not measured by anything

**State:** the bundle budget now correctly measures JavaScript only. The global
stylesheet is **153.3 kB** across all CSS chunks and **every route loads all of
it**.

That is not small, and nothing currently guards it.

**Fix:** add a CSS budget to `tests/performance/bundle-budgets.test.ts`,
measured the same way — intersect across pages, then sum `.css`.

**Then reduce it.** The likely wins, in order:
- The legacy token files (`apple-design-system.css`, `styles/tokens.css`,
  `app/tokens.css`) are still imported globally and will be dead once 3.1
  completes.
- CSS Modules are already per-route-chunkable; check whether Next is actually
  splitting them or concatenating into one file.

**Cost:** an hour for the budget, more for the reduction.

---

### 4.2 Coverage floors are very low

**State:** `statements: 15, branches: 73, functions: 52, lines: 15`.

Statements at 15% is a floor that almost nothing can trip. It was set honestly
— it is just below measured — but measured is low because a large share of
`src/` is unreachable from any route.

**Fix — do not simply raise the number.** That produces tests written to hit
lines. Instead:

1. **Scope coverage to what ships.** Exclude `src/**/__tests__`, scripts, and
   anything the import-graph sweep marks unreachable. The percentage becomes
   meaningful because the denominator is code that runs.
2. **Set per-directory floors** where they matter — `src/app/api/**` and
   `src/lib/auth/**` should be much higher than the global figure. A single
   global number lets high-risk code hide behind well-tested utilities.
3. **Ratchet, do not target.** Raise the floor to measured after each PR that
   improves it. Never lower it to make a build pass.

**Cost:** half a session. **Value:** turns coverage from a number into a signal.

---

### 4.3 The a11y suite still asserts HTML strings

**State:** unblocked by the `getComputedStyle` fix but not yet migrated. It
asserts against hand-written markup, so it cannot fail for the defects it
exists to catch.

**Fix:** rewrite each assertion to render the real component and query it by
role, as `src/components/ds/__tests__/*` now do. Where a test asserts a string,
ask what user-facing behaviour it was standing in for and assert that instead.

**Combine with 1.2** — same files, same session.

---

## Tier 5 — Worth doing, low urgency

| Item | Recommendation |
|---|---|
| Dark-mode blue fails on `--color-bg-tertiary` | Legacy token. Dies with 3.1. Verify after, do not patch now. |
| `docs/` has ~26 files with overlapping scope | Consolidate once the migration settles; several describe superseded state. |
| `E-02` bundle claim unreproducible | Recorded as unverified. Re-measure once 3.1 lands and either substantiate or delete the claim. |
| `next lint` deprecation | Migrate to the ESLint CLI before Next 16. Mechanical: `npx @next/codemod@canary next-lint-to-eslint-cli .` |

---

## Practices worth keeping

Not tasks — the working rules this codebase has now demonstrated the value of,
usually by their absence.

**Verify a test fails against the broken code.** Every regression test added in
this migration was checked this way, and it caught four tests that passed on
broken input — including one of mine that compared a config block with itself.

**Measure before asserting.** Four hypotheses were offered for the bundle
numbers; three were wrong, and two of those were written into commit messages
and docs as fact before being measured. The tell for the real cause — eight
unrelated routes moving by an identical amount — was visible from the first
occurrence. *Identical deltas across unrelated things indict the measurement,
not the thing measured.*

**Re-baselining after a deliberate composition change is legitimate; raising a
threshold to make a red build pass is not.** Written into both the coverage
config and the budget test. It is the distinction that keeps a gate a gate.

**A redacted value must never reach the DOM.** Hiding it with CSS leaves it in
devtools and in the accessibility tree. Asserted in `AllocationCell`'s tests
against exactly that mistake.

**When a rule fails silently, encode it in the component.** A sub-4px bar still
renders; a label crossing the progress boundary still appears; a window-relative
`aria-rowindex` still reads out a plausible number. None of these throw, so none
of them get noticed without an assertion.
