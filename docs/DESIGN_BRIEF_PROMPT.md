# Claude Design Tool — Master Prompt (Cockpit UI, clean slate)

Paste everything below the line into Claude's design tool as a single brief.
Nothing in it references the existing UI, by instruction: the current design was
not produced against any professional benchmark and is being replaced entirely.

---

## ROLE

You are designing the complete user interface and design system for **Cockpit**,
an enterprise SaaS application used by SAP delivery consultants to plan, staff,
cost and pitch large ERP implementation programmes.

This is a **clean-slate redesign**. Do not attempt to preserve, reference, or
reverse-engineer any existing look. Design as if this product has no UI yet.

Deliver a **complete, exhaustive design system plus every screen** — not a
sample, not a moodboard, not "representative examples." Every screen, state,
and component listed below must be designed.

## THE PRODUCT — WHAT USERS ACTUALLY DO

Cockpit's users are consultants and delivery leads at an IT services firm. They
are expert users doing dense, high-stakes planning work — often in front of a
client. The end-to-end job:

1. **Authenticate** — passkey-first (WebAuthn), with magic-link and one-time-code
   fallbacks. Admin-issued access codes for onboarding.
2. **Pick or create a project** — an SAP implementation programme.
3. **Build a timeline** — phases → tasks (hierarchical, with dependencies) →
   milestones → public-holiday awareness across regions.
4. **Staff it** — assign named resources to phases and tasks with allocation
   percentages; detect over-allocation conflicts; build an org chart of the
   delivery team; maintain a RACI matrix.
5. **Cost it** — rate cards per role/region, subcontractor rates, intercompany
   markup, out-of-pocket expenses; derive GSR / RR / NSR and margin; control who
   can see which cost layer (cost visibility levels).
6. **Analyse it** — critical path, resource heatmaps, baseline-vs-current
   comparison, project health and insights.
7. **Pitch it** — generate a client-ready proposal; export to PDF / PPTX / Excel.
8. **Collaborate** — share a project, invite collaborators as EDITOR or VIEWER,
   see presence.
9. **Administer** — user provisioning, access approvals, account recovery
   requests, and a security dashboard.

Two things about the working context that must shape the design:

- **Work is often unsaved-in-transit.** The app is local-first: edits persist
  locally and sync in the background. Sync state (saved locally / syncing /
  synced / conflict / offline) is **first-class information the user must always
  be able to find**, never a hidden detail.
- **Screens are dense by necessity.** A programme has dozens of phases, hundreds
  of tasks, and dozens of resources. Do not solve density by hiding information
  behind progressive disclosure everywhere — expert users need scanability and
  simultaneous visibility. Solve it with typographic hierarchy, alignment,
  restraint in colour, and disciplined use of space.

## NON-NEGOTIABLE CONSTRAINTS

These are hard requirements. A design that violates any of them is not
acceptable, however attractive.

### Accessibility — WCAG 2.2 Level AA, verified not assumed

- **Every** text/background pair ≥ 4.5:1 (≥ 3:1 for text ≥ 24px or ≥ 19px bold).
- **Every** meaningful UI boundary, icon, focus ring and control edge ≥ 3:1.
- State the computed contrast ratio next to every colour pairing you define.
  Do not assert "AA compliant" without the number.
- Colour is never the sole carrier of meaning — pair with icon, text, or shape.
  This matters most for status (on-track/at-risk/late) and allocation heatmaps.
- Every interactive element has a visible, non-colour-only focus indicator with
  ≥ 3:1 contrast against both the control and the surrounding surface.
- Minimum touch target 44×44px; minimum pointer target 24×24px with spacing.
- Design must work at 200% zoom and at 320px viewport width with no loss of
  function and no two-dimensional scrolling.
- Respect `prefers-reduced-motion`: define a reduced variant for every motion.

### Light and dark mode are both first-class

Design and contrast-verify **both** themes for every screen and component. Dark
mode is not an inversion — define its own surface elevation and its own accent
values. State contrast ratios for both.

### Design tokens — the deliverable is a system, not pictures

Every value must come from a named token. No loose hex values anywhere. Define:

- **Colour**: semantic roles, not colour names. `surface/{base,raised,sunken,overlay}`,
  `content/{primary,secondary,tertiary,disabled,inverse}`,
  `border/{subtle,default,strong,focus}`,
  `accent/{default,hover,active,subtle,onAccent}`,
  `status/{success,warning,danger,info}` each with `{default,subtle,onColor,border}`.
  Every role defined for light AND dark, each with its contrast ratio.
  **A "carries text" accent must be verified at 4.5:1 against white — a mid-blue
  around #007AFF is 4.02:1 and fails; this is the single most common mistake.**
- **Typography**: one scale, ≤ 8 steps, each with size / line-height / weight /
  letter-spacing / intended use. Include a dedicated tabular-numeral treatment —
  this product is full of dates, percentages, rates and currency that must align
  in columns.
- **Spacing**: one base unit (4px or 8px), a fixed ramp, no arbitrary values.
- **Radius, elevation/shadow, border width**: fixed ramps, dark-mode variants.
- **Motion**: duration and easing tokens with stated intent, plus reduced-motion
  equivalents. Nothing over 300ms for routine feedback.
- **Z-index**: a named scale covering base → dropdown → sticky → overlay →
  modal → toast → tooltip. Modals stack in this product — define the rule.

Deliver tokens as a **structured table AND as CSS custom properties**, ready to
paste. Name them so they read as roles, never as appearances (`content/secondary`,
never `gray-600`).

### Component kit — exhaustive, with every state

For each component define: anatomy, sizes, all variants, and **all** states —
default, hover, focus-visible, active, disabled, loading, error, read-only,
and empty where applicable.

**Primitives**: Button (primary/secondary/tertiary/ghost/danger × sm/md/lg, icon-only,
with-icon, loading, full-width) · Icon Button · Link · Input · Textarea · Select ·
Multi-select · Combobox with async search · Checkbox · Radio · Toggle · Slider ·
Date picker (**must express non-working days and public holidays**) · Date-range
picker · Number/currency input · File upload with drag-drop · Search field ·
Segmented control · Tag/Chip (removable) · Avatar + Avatar group · Badge/Status pill ·
Tooltip · Progress bar · Progress ring · Skeleton loaders (per layout shape) ·
Spinner · Divider · Kbd.

**Composites**: App shell (top bar, primary nav, contextual sub-nav, content) ·
Data table (sortable, filterable, resizable columns, row selection, bulk-action
bar, sticky header, pagination AND virtualized-scroll variants, per-cell edit,
column show/hide, saved views) · Card · Panel/Drawer (right and bottom) · Modal
(sm/md/lg/fullscreen, stacked, destructive-confirm variant) · Tabs · Accordion ·
Breadcrumb · Pagination · Toast/Notification (info/success/warning/error, with
action, stacked) · Inline alert/banner · Empty state (first-run vs no-results vs
error vs no-permission — these are four different designs) · Error state ·
Loading state · Command palette (⌘K) · Global search with grouped results ·
Filter bar with active-filter chips · Stepper/Wizard · Split pane with drag
handle · Context menu · Dropdown menu · Popover · Form layout patterns
(field, group, section, inline validation, error summary) · Keyboard-shortcut
help sheet · Onboarding/coach-mark pattern.

**Domain-specific — design these carefully, they are the product:**

- **Gantt timeline.** Left: hierarchical phase/task tree with expand-collapse,
  inline edit, drag-reorder. Right: time canvas with selectable zoom
  (day / week / month / quarter). Must express: phase bars, nested task bars,
  progress within a bar, dependency arrows (finish-to-start and others),
  milestone markers (diamond), today marker, weekend and public-holiday shading,
  critical-path emphasis, baseline-vs-current overlay, resource-allocation
  heat on the bar, drag-to-move, drag-to-resize, and multi-select. Define the
  row height, the minimum readable bar, and behaviour when a bar is narrower
  than its label. Define the horizontal-scroll + sticky-left-column behaviour.
  **Also design its collapsed/summary and mobile-read-only forms.**
- **Resource allocation matrix** — resources × time, with per-cell allocation %,
  over-allocation clearly expressed **without relying on colour alone**.
- **Org chart** — hierarchical node tree, pan/zoom, node card with avatar/role/
  rate, drag-to-reparent, collapse subtree, and a print/export layout.
- **RACI matrix.**
- **Cost/financial dashboard** — rate cards, margin waterfall, cost breakdown,
  and an explicit treatment for **redacted values** when the viewer's cost
  visibility level forbids a figure. "Hidden" must look deliberate, not broken.
- **Critical path panel**, **baseline comparison panel**, **project insights**.
- **Sync status indicator** — the full state machine: saved-locally, syncing,
  synced, offline-with-queue, conflict-needs-resolution, permanent-error.
- **Conflict resolution** — two versions side by side, field-level choose.
- **Proposal/export configuration** and its generation progress + result.

### Screens — design every one, in light and dark

Authentication: `/login` (passkey primary; magic-link and OTP fallbacks; error
states for expired/used/invalid links; rate-limited state), `/register`
(access-code entry, then passkey enrolment), `/gantt-tool/invite/[token]`
(accept a collaboration invite, incl. expired/already-used).

Core: `/` (post-auth routing/splash), `/dashboard` (portfolio overview across
projects), `/gantt-tool` (**the primary workspace** — the app's centre of
gravity; design its full-screen desktop layout, its panels, and every modal it
hosts), `/organization-chart`, `/architecture` and `/architecture/v3` (solution
architecture diagramming: canvas, palette, properties panel, export).

Account: `/account`, `/account/add-passkey`, `/settings`, `/settings/security`
(active sessions, trusted devices, passkey management, recovery codes, and the
account-lockdown confirmation).

Admin: `/admin` (console home), `/admin/users`, `/admin/approvals`,
`/admin/email-approvals`, `/admin/recovery-requests`, `/admin/security`
(security event dashboard, blocked IPs, geo analysis).

System: 404, 500/unexpected-error, offline, session-expired, and
insufficient-permission screens.

For **every** screen also design: the loading state, the empty state, the error
state, and the mobile/tablet adaptation.

### Responsive

Breakpoints for 320 / 768 / 1024 / 1440 / 1920+. State clearly what each screen
does at each. The Gantt workspace is desktop-first — define honestly and
specifically what its tablet and mobile experience is, rather than shrinking it.

### Interaction and keyboard

This is a power-user tool. Define: a complete keyboard map (navigation,
selection, create/edit/delete, undo/redo, save, zoom, ⌘K), focus order per
screen, focus management on modal open/close and on drawer open/close, roving
tabindex for grids/trees/tab-lists, screen-reader announcements for
asynchronous events (**save, sync state change, undo, conflict, import result** —
these are currently silent and must not be), and drag-and-drop that has a
keyboard-only equivalent.

### Content and tone

Write real microcopy — never lorem ipsum. Voice: precise, calm, professional;
never cute. Error messages state what happened, why, and the next action.
Empty states teach the first step. Destructive confirmations name the object and
the consequence exactly ("Delete phase 'Realization'? Its 24 tasks and their
resource assignments will be removed."). Define number, currency, date and
duration formatting rules, including multi-currency and locale handling.

## WHAT TO DELIVER

1. **Design principles** — 4–6 principles specific to this product, each with a
   concrete implication. Generic principles are not useful.
2. **Complete token set** — tables + paste-ready CSS custom properties, light and
   dark, every colour pairing annotated with its computed contrast ratio.
3. **Full component library** — every component above, every variant, every
   state, both themes, with anatomy and spacing annotations.
4. **Every screen listed above** — desktop, tablet, mobile; plus loading, empty,
   and error states for each.
5. **Interaction specifications** — keyboard map, focus behaviour, motion specs,
   drag-and-drop rules, and their reduced-motion and keyboard-only equivalents.
6. **Accessibility annotations** — semantic role, accessible name, and ARIA
   relationships for every non-trivial component; a contrast audit table.
7. **Implementation notes** — component hierarchy, naming, and which pieces are
   composed from which primitives.

## HOW TO JUDGE YOUR OWN OUTPUT

Before returning, check each of these and fix what fails:

- Could an engineer build this without inventing a single value?
- Does every colour pairing have a stated contrast ratio that meets its target?
- Is every state of every component present, including error and loading?
- Does the Gantt design actually handle 40 phases and 400 tasks, or only the
  8-row illustration you drew?
- Is dark mode designed, or merely inverted?
- Is there any lorem ipsum, any unnamed hex value, any "etc."? Remove it.
- Does anything rely on colour alone to convey status or allocation?
- Have you designed the unglamorous screens — admin tables, recovery requests,
  session lists — to the same standard as the hero screens?

Exhaustive and specific beats elegant and partial. If you must trade off, keep
completeness.
