# Design system — specification

These 14 documents are the design specification for the UI rebuild. They are
**specification, not application code**: each one renders a layer of the system
so it can be reviewed, and nothing in `src/` imports them.

Open any of them directly in a browser.

## Why they are in the repository

They were produced outside this codebase and existed only as downloads. A
specification that lives beside the code it governs can be diffed, reviewed and
blamed; one that lives in someone's Downloads folder cannot. When an
implementation and its spec disagree, this directory is the record of what was
intended.

## Layers

| Layer | Documents | Implemented in `src/` |
|---|---|---|
| 1 — Foundations | `foundations.html` | ✅ `src/styles/foundations.css` |
| 2 — Primitives | `primitives.html` | ⬜ not started |
| 3 — Composites | `composites.html`, `composites2.html` | ⬜ not started |
| 4 — Domain surfaces | `gantt.html`, `gantt2.html`, `gantt3.html`, `allocation-matrix.html`, `org-chart.html`, `cost.html`, `sync.html` | ⬜ not started |
| 5 — Screens | `screens-auth.html`, `screens-core.html`, `screens-admin.html` | ⬜ not started |

The app currently ships **19 pages, 3 layouts and 58 components** on the legacy
UI. None of them have been migrated. Layer 1 is additive and changes nothing
visible — it is the substrate the later layers are built from.

## Deliberate divergences from the spec

Two, both recorded in full at the head and foot of `src/styles/foundations.css`.

**1. Every token is prefixed `--ds-`.** The spec ships a "paste-ready" block
using bare names. Pasting it would have been silently destructive, because this
codebase already owns those names with different meanings:

| Name | Existing meaning | Spec meaning |
|---|---|---|
| `--space-4` | `0.25rem` (4px) — keyed by pixel value | `16px` — keyed by step index |
| `--space-16` | `1rem` (16px) | `64px` |
| `--radius-md` | `8px` | `6px` |
| `--z-modal` | `1050` | `400` |

`--space-4` alone would have jumped 4× across every existing component, and
modals would have fallen behind current overlays. The legacy UI is the live
product until migration finishes, so the two systems must not touch. The prefix
is what makes that true.

**2. `content/tertiary` is `#5F6B7F`, not the spec's `#667085`.** Every ratio
in the spec was computed against `surface/base` alone. These tokens also land on
`surface/sunken` and, in dark, on `surface/raised`, where every ratio is lower.
Recomputing each pair against the worst surface it can legitimately appear on
found one genuine failure:

```
content/tertiary #667085 on surface/sunken #F1F3F7 = 4.48:1   (floor 4.5)
```

The spec assigns `content/tertiary` to "metadata, timestamps, placeholder" and
`surface/sunken` to "table headers, inset wells, disabled fields" — a
placeholder in an inset well is exactly that pairing, so it is reachable rather
than theoretical. `#5F6B7F` keeps the hue (220.6°) and measures 4.85:1 on the
worst light surface.

Nothing else failed. The status-pill pairs reproduce the spec's stated ratios
exactly.

## The floors are enforced

`src/styles/__tests__/foundations-contrast.test.ts` parses the real stylesheet
and recomputes every ratio against every surface the token can appear on. It
does not restate the palette — a test that did would pass while the shipped CSS
drifted.

It was verified to **fail** when `#667085` is reintroduced:

```
--ds-content-tertiary (#667085) on --ds-surface-sunken (#f1f3f7) = 4.48:1
```

This matters because the previous design system shipped `#007AFF` at 4.02:1 on
the background of every primary button while `A11Y_EVIDENCE.md` claimed it
passed, and two visual tests asserted the failing value as correct. That is what
undetected drift looks like.

## Using the tokens

Wrap a new-system subtree in `.ds`, which sets the base font, colour and
background, and scopes the focus-ring and reduced-motion rules so they cannot
reach the legacy UI:

```tsx
<div className="ds">
  <NewThing />
</div>
```

Once every route has migrated, `.ds` moves to `<body>` and the legacy token
files are deleted.
