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

### 1.2 The accessibility suites are skipped — DONE

**Was:** 201 skipped tests, including the three architecture/v3 accessibility
suites (74 tests) that would catch exactly the class of defect this audit
found — a dialog with no focus trap, a control with no accessible name.

**Done.** All three are un-skipped and passing: `aria-labels` 16/16,
`focus-trap` 27/27, `keyboard-navigation` 31/31. Full suite 2069 passed, 0
failed. Working through them one file at a time, treating each failure as a
finding rather than a test to delete, turned up four defects in shipping code:

- Four v3 components had no default `React` import, so they could not render
  at all under a transform that does not inject one.
- `src/ui/components/Modal.tsx` passed `initialFocus: false` to focus-trap —
  opening a dialog left focus on the trigger behind it.
- The same Modal never referenced its own `<h2>`, so the dialog had no
  accessible name.
- Both modal foundations hardcoded the close button's name, so several open
  dialogs were indistinguishable to a screen reader. `closeLabel` now exists.

And one test-environment defect of the same family as the `getComputedStyle`
stub: jsdom reports zero client rects for everything, `tabbable` reads that as
"not tabbable", and focus-trap's `activate()` therefore threw for every modal
in the suite. `tests/setup.ts` now shims `getClientRects` while deferring the
visibility decision to computed style, so a genuinely hidden control still
reads as untabbable.

**Left open:** `architecture/v3/__tests__/integration.test.tsx` is partly
un-skipped — its keyboard and modal-focus scenarios run; its CRUD, auto-save
and persistence scenarios stay skipped with a stated reason, because they need
a store fixture the suite does not stand up. That is the next piece of this
item, and it is a store problem rather than an accessibility one.

---

### 1.3 Playwright never runs in CI — DONE, with the scope stated

**Was:** a `webServer` block, several spec files, and no e2e step in CI.

**Done.** `.github/workflows/ci.yml` has an `e2e` job: postgres service,
pinned browser install, `prisma migrate deploy`, production build, then
`tests/e2e/smoke.spec.ts` on `chromium-desktop`, with traces uploaded on
failure. `playwright.config.ts` now runs `pnpm start` under CI rather than
`pnpm dev`, so what is tested is what ships.

**But the gate is scoped, and that is the important part of this entry.**
Before wiring the job, the existing suite was run against a production build
for the first time. It does not work:

| spec | tests | state |
| --- | --- | --- |
| `smoke.spec.ts` (new) | 16 | passing, ~3s |
| `plan-timeline.spec.ts` | 15 | all `test.skip()` placeholders |
| `team-capacity-api.spec.ts` | 21 | gated on `RUN_DB_E2E`; needs a seeded DB and a session |
| `view-switching.spec.ts` | 23 | asserts a GlobalNav (`[href="/gantt-tool"]`) this app does not render |
| `visual-regression/p1`,`p2` | 20 | navigate to `/projects`, `/projects/new` — not routes in this app |
| `user-journeys/01`,`02` | 8 | same missing routes; the passes are lenient assertions, not evidence |

Whole-directory result: **9 passed, 51 failed, 39 skipped.** Three separate
defects were fixed on the way to that number and are worth recording, because
each one had been hiding the next:

- `login-flows.spec.ts` hardcoded `http://localhost:3000` in all 13 tests
  while the config serves 3002, so it had never once reached the app under
  test. `view-switching` and `plan-timeline` defaulted to the same wrong port.
- The same file constructed a `PrismaClient` at module scope and seeded users
  in `beforeAll`, with no database in CI. Now behind `RUN_DB_E2E`, lazily.
- The production server refuses to boot without `NEXTAUTH_SECRET` and
  `NEXTAUTH_URL`. The job sets both.

**The new smoke spec** sweeps every route in the app against the auth
boundary — 3 public, 11 protected, plus `/admin`'s two-hop redirect — and
checks that the login page presents a named, keyboard-operable form. It uses
the `request` fixture rather than page navigations: the middleware rate-limits
by IP at 60/min, a browser navigation costs several requests, and a 429 reads
exactly like "the redirect stopped working". The 9-project device matrix was
tried and rejected for the same reason — 108 of 144 passed, the rest were
rate-limited.

**Next, in order:** delete or rewrite the visual-regression and user-journey
specs against routes that exist; give `plan-timeline.spec.ts` real bodies once
the Gantt strangler port lands; provide a seeded-DB job for
`team-capacity-api.spec.ts`. Widening the device matrix needs the rate limiter
keyed on something other than IP in test environments.

**Also still open:** the number-input arrow-key behaviour deliberately left
untested in jsdom belongs in the browser suite.

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

### 2.2 No optimistic locking on the delta route — DONE

**Was:** the delta route authorised every id and wrote. Two clients editing the
same task both succeeded; the second silently overwrote the first. In a
local-first app where clients queue changes offline, that is not a rare race —
it is the normal case after two people work on a plane.

**Done.** `GanttPhase` and `GanttTask` carry `version Int @default(0)`
(migration `20260807140000_add_optimistic_lock_versions`), and the route
applies each write conditionally on the client's version, incrementing it.
Covered by `tests/integration/delta-optimistic-lock.int.test.ts` (6 tests)
against real PostgreSQL.

Two decisions are worth knowing before changing this code:

- **An absent version writes unconditionally.** Existing clients do not send
  one, and rejecting them would have been a breaking change shipped as a bug
  fix. New clients opt in by sending it.
- **A conflict is collected, not thrown.** Throwing rolls back the whole
  batch, and a local-first client batches an entire offline session — one
  stale task would discard everything else the user did. The response carries
  a `conflicts` array, always present and possibly empty.

**Left open:** the client does not yet send `version`, so the mechanism is
available but not yet in force end to end. That is the next step, and it
belongs with the Gantt strangler port rather than ahead of it.

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

**State:** 17 of 19 routes migrated. `/gantt-tool` is mid-strangler (PR #116):
the replacement canvas renders behind `?canvas=next` with Move, milestones,
axis + shading, AMS chevrons, tree columns and the capacity panel ported —
each slice verified against the legacy formats.

**The original "do not swap, that deletes working functionality" warning was
substantially wrong**, and the port has been correcting it slice by slice.
Checked against the code and, where it mattered, the full git history:

- Pointer drag/resize of bars: **never existed.** No gesture changes a date.
- Dependency editing: **never existed.** Zero references in the canvas;
  dependencies are stored and read only by the two deletion-impact modals.
- Resource drag-assignment: **never existed, in any of the repo's 122
  commits.** There is no drag source — nothing ever calls
  `setData("resourceId")` and nothing is `draggable` — so all four drop
  handlers in GanttCanvasV3, including the one that writes, are and always
  were unreachable. The `div[draggable="true"]` CSS in the page styles a
  feature that was never built.

**Deeper finding, logged 2026-08-08 — the task-assignment write path is
dead end to end:**

- `TaskResourceModal.onSave` is a literal `// TODO: Implement resource
  assignment persistence`; it closes and discards the input.
- The one assignment path that persists is `ResourceAllocationModal` →
  `handleApplyBulkAllocation` → the team-capacity allocations API. That
  writes **weekly allocation overrides**, a different data model from
  `task.resourceAssignments`.
- `task.resourceAssignments` — the field the capacity calculator reads for
  its per-task breakdown — has **no working UI write path at all**. It is
  populated only by imports and direct API use.

Consequence: "port resource assignment" is not a porting task. Making
task-level assignment real is a product decision (which of the two data
models is canonical?) and belongs after the flip, as its own feature. The
dead drop handlers and ghost CSS in the legacy canvas are safe to delete in
a cleanup commit whenever convenient — they are unreachable, so removal
changes nothing observable.

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
