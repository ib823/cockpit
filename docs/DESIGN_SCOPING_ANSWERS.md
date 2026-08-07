# Design tool — scoping answers

Answers to the design tool's scoping questions, with the reasoning behind each.
Grounded in findings from the codebase audit rather than preference.

---

## 1. Which layer next → **Layer 2, the primitive component kit (bottom-up)**

The single largest failure in the current codebase is that no primitive system
ever existed: five `Button` implementations across four parallel kits, 2,697
inline `style={{}}` blocks, 1,041 hardcoded hex values, three competing token
sources. Every surface invented its own primitives.

Building Layer 4 (Gantt) first would repeat exactly that: the most complex
surface would define its own buttons, inputs and menus, and everything after it
would either copy them or diverge from them.

Order: **2 → 3 → 4 → 5.** Primitives, then the shell and data table that frame
every screen, then the Gantt, then the remaining screens.

One caveat worth stating: do not let the primitives be designed in the abstract.
Each primitive must be validated against at least one real Gantt or costing use
before it is considered done, or the kit will be elegant and unusable for the
density this product needs.

## 2. Component kit fidelity → **Grid + a few live**

Static state grids are the right implementation reference for most components —
every state visible side by side and easy to diff.

But four components must be live, because their behaviour *is* their design and
a static grid cannot express it:

- **Modal** — focus entry, focus return, Escape, and stacking. The current
  implementation shipped 28 dialogs with `initialFocus: false`, meaning focus
  never entered the dialog at all. A grid would not have caught that.
- **Combobox with async search** — loading, no-results, and keyboard selection
  while results are still arriving.
- **Date picker** — the holiday/non-working-day treatment only makes sense in
  motion across months and regions.
- **Toast** — stacking, timing, and how an action inside a toast behaves.

## 3. Gantt as a working prototype → **Yes, interactive**

This is the highest-value answer in the whole set.

The Gantt is a bespoke interactive engine, not a page. Drag-move, drag-resize,
zoom transitions, expand/collapse and keyboard move mode cannot be judged from
static frames, and a pixel spec of eight rows will actively mislead — the
current implementation renders every row unwindowed and does six separate DOM
passes over ~1,100 day markers, which looked fine in an eight-row mock.

Two things the prototype must prove specifically:

1. **Keyboard move mode.** Drag-and-drop needs a keyboard equivalent for WCAG
   2.1.1, and it is the thing teams skip because it is invisible in a static
   spec. If it is not prototyped, it will not get built.
2. **Behaviour at the real ceiling** (see Q6) — not at demo size.

## 4. Deliverable split → **One file per layer + one per domain surface**

Five layer files, plus a dedicated file for each of: Gantt timeline, resource
allocation matrix, org chart, cost/financials incl. redaction, and the sync
state machine.

Those five surfaces are each substantial enough to be built by different people
at different times, and each carries rules that do not belong in a general
component doc. A single exhaustive document would be unnavigable at this scope;
splitting by screen group would separate screens from the system they depend on.

## 5. Real programme data

Use this instead of an invented plan. It matches the actual Prisma schema —
note `baseCurrency` defaults to **MYR** and intercompany markup defaults to
**15%**, so a design assuming USD/EUR-first will not match the data model.

**Methodology phases (SAP Activate):**
Prepare · Explore · Realize · Deploy · Run

**Workstreams that cut across phases:**
Finance (FI/CO) · Logistics (MM/SD/PP) · Human Capital (SuccessFactors) ·
Technical (Basis/ABAP) · Data Migration · Integration · Change Management ·
Testing · Cutover · PMO

**Roles / designations, with indicative day rates (MYR):**

| Role | Region | Day rate | Notes |
|---|---|---|---|
| Programme Director | MY | 4,000 | Part-allocated, often 20–30% |
| Solution Architect | MY | 3,200 | Peak in Explore |
| Delivery Manager | MY | 2,900 | |
| Integration Architect | SG | 3,800 | Cross-charged, intercompany markup applies |
| FI/CO Consultant | MY | 2,400 | |
| MM/SD Consultant | MY | 2,400 | |
| PP/QM Consultant | MY | 2,500 | |
| HCM Consultant | MY | 2,300 | |
| Basis Consultant | MY | 2,600 | |
| ABAP Developer | IN | 1,100 | Offshore, high utilisation |
| Data Migration Lead | MY | 2,700 | Peak in Realize/Deploy |
| Test Lead | MY | 2,200 | |
| Change Manager | MY | 2,100 | |
| Business Analyst | MY | 1,800 | |
| PMO Analyst | MY | 1,400 | |
| Security Consultant | VN | 1,300 | Subcontractor — flag distinctly |

**Blended programme rate:** ~MYR 2,300/day.

**Currencies:** MYR (base), SGD, EUR, USD. Design must show a mixed-currency
programme, since offshore and cross-border resources are normal here.

**Regions:** MY, SG, IN, VN, DE — drives both rate lookup and public holidays.

**Milestones (real gate names):**
Project Charter Approved · Business Blueprint Sign-off · Realization Complete ·
Integration Test Complete · UAT Sign-off · Cutover Go/No-Go · **Go-Live** ·
Hypercare Exit

**Public holidays to show in the timeline** (these genuinely collide with SAP
cutovers in this market and must be visible):
Chinese New Year (2 days, MY/SG) · Hari Raya Aidilfitri (2 days, MY) ·
Deepavali (MY/SG/IN) · Merdeka Day (MY) · Diwali (IN) ·
Tết (VN — often a full week) · Christmas/New Year freeze (DE/EU)

**Financial metrics to display:** GSR (Gross Service Revenue) → RR (Realized
Revenue) → NSR (Net Service Revenue) → Margin %, with out-of-pocket expenses and
a 15% intercompany markup on cross-region resources.

**A realistic programme shape** to design against: 18-month S/4HANA
implementation, 5 phases, ~34 sub-phases, ~420 tasks, 28 named resources across
4 regions, 6 milestones, mixed MYR/SGD/INR costs.

## 6. Worst-case size → **80 phases / 1,200 tasks**

Design for the ceiling, not the median.

The current implementation demonstrably fails at scale — no virtualization
anywhere (`react-window` is installed and imported by nothing), the timeline
maps over every day marker six separate times, and `/gantt-tool` ships 642.9kB
of route JS. All of that looked acceptable at demo size.

Designing at 80/1,200 forces the design to answer, up front: what is windowed,
what collapses by default, whether a minimap is required, what the row height
must be to keep 1,200 rows navigable, and what happens to a bar narrower than
its own label.

Multi-project portfolio is a real need but belongs to `/dashboard` as a separate
view — it should not be folded into the Gantt's scale problem.

## 7. Artefacts that get the most depth

In priority order, chosen because each maps to a defect the audit actually
found:

1. **Contrast audit table** — the base palette failed WCAG AA before any
   component existed (primary blue was 4.02:1 on white, on the background of
   every primary button). Every pairing needs a stated, computed ratio. This is
   the one that must not be taken on trust.
2. **Sync state machine** — the product is local-first, and the current build
   suppressed every background-sync error from the console while showing the
   user only a transient toast. Users need a durable, discoverable answer to
   "is my work saved?" at all times. Cover: saved-locally, syncing, synced,
   offline-with-queue, conflict, permanent-error.
3. **Keyboard map** — expert tool, dense grids, drag-and-drop that currently has
   no keyboard equivalent.
4. **ARIA / role annotations** — 28 dialogs shipped with no `role="dialog"`,
   no `aria-modal` and no accessible name, while the docs recorded it as done.
5. **Redaction & permission rules** — `CostVisibilityLevel` is real in the
   schema. Redacted figures must look deliberate rather than broken, and must
   not be recoverable by subtracting visible rows from a visible total.

Microcopy, responsive behaviour and motion specs still get written — just less
depth than the five above.

## 8. Open questions to raise

1. **Does the Gantt need to export at screen fidelity?** There is a real PDF /
   PPTX / Excel export path, and a proposal is a client deliverable. A timeline
   designed only for an interactive viewport will not survive a fixed A3 page.
   Should the export be a distinct designed artefact rather than a screenshot?
2. **When a cost is redacted, does the row keep its structure?** If subtotals
   and totals remain visible while individual lines are hidden, a viewer can
   often recover the hidden figure by subtraction. Is that acceptable, or must
   redaction break the arithmetic?
3. **Is dark mode required for client-facing use, or internal only?** It changes
   how much investment it deserves. It must still be designed either way, but
   the answer decides whether it is a first-class review surface.
4. **Mixed-currency display:** does a project present one currency with
   conversion, or show native currencies side by side? The schema supports
   per-resource currency, so both are possible and they look very different.
5. **Is mobile genuinely needed, or is read-only acceptable?** Today's mobile
   view is read-only with several handlers wired to empty functions. A deliberate
   read-only design is defensible; an accidental one is not.
6. **Who is in the room when this is used?** If the Gantt is shown live to a
   client, the design has to be legible from across a table on a projector —
   which is a different constraint from a consultant working alone on a laptop.
