# Accessibility Test Evidence Archive

Status: Active
Last Updated: 2026-02-20

## Automated Test Coverage

### axe-core CI Tests (`tests/a11y/axe-automated.test.ts`)

| Test | Pattern | WCAG Criteria | Status |
|---|---|---|---|
| Login form accessibility | Form with labeled inputs, submit button | 1.3.1, 4.1.2 | Pass |
| Admin data table structure | Table with caption, th scope, sortable headers | 1.3.1, 1.3.2 | Pass |
| Modal dialog pattern | Dialog role, aria-modal, aria-labelledby, close button | 4.1.2, 2.4.3 | Pass |
| Filter/search pattern | Search with label, filter controls | 1.3.1, 4.1.2 | Pass |
| Toggle button state | Button with aria-pressed, role=switch | 4.1.2 | Pass |
| Loading spinner | Role=status with screen reader text | 4.1.3 | Pass |
| Status message | Role=alert for error messages | 4.1.3 | Pass |
| Image with alt text | Meaningful alt text | 1.1.1 | Pass |
| Heading hierarchy | Sequential h1>h2>h3 without skips | 1.3.1 | Pass |
| Complex data table | Headers with id, td with headers attr | 1.3.1 | Pass |
| Decorative image | Empty alt, aria-hidden | 1.1.1 | Pass |
| Negative: missing label | axe detects missing form labels | — | Pass (catches violation) |
| Negative: missing alt | axe detects missing image alt | — | Pass (catches violation) |

**Total**: 13 tests, all passing in CI pipeline.

### Keyboard Navigation Tests (`src/app/architecture/v3/__tests__/`)

| Test Suite | Tests | Status |
|---|---|---|
| Focus trap tests | 27 tests | Skipped (requires browser env) |
| Keyboard navigation tests | 31 tests | Skipped (requires browser env) |

**Note**: These tests require a full browser environment and are excluded from CI JSDOM runs. They should be run during manual real-device validation sessions.

## Semantic/Landmark Fixes Applied

### D-01: Core A11y Violations Fixed

| Component | Fix | WCAG |
|---|---|---|
| Login page | Added `<main>` landmark | 1.3.1 |
| Login form | Added `label` + `htmlFor` associations | 1.3.1, 4.1.2 |
| Login form | Added `role="status"` for loading states | 4.1.3 |
| Login form | Added `role="alert"` for error messages | 4.1.3 |
| Admin tables | Added `<caption>` elements | 1.3.1 |
| Admin tables | Added `scope="col"` on `<th>` elements | 1.3.1 |
| Modal dialogs | Added `role="dialog"`, `aria-modal="true"` | 4.1.2 |
| Modal dialogs | Added `aria-labelledby` linking to title | 4.1.2 |

### D-03: Screen Reader Landmarks

| Page | Fix | Element |
|---|---|---|
| Root layout | Skip-to-content link | `<a href="#main-content" class="skip-to-content">` |
| Login | `id="main-content"` on `<main>` | Existing `<main>` |
| Dashboard | `id="main-content"` on `<main>` | Existing `<main>` in UnifiedDashboard |
| Gantt Tool | `<div>` → `<main id="main-content">` | Outer container |
| Admin (5 pages) | `<div>` → `<main id="main-content">` | Content containers |
| Architecture | `id="main-content"` on content area | Existing container |

**Skip navigation**: Uses existing `.skip-to-content` CSS class from `src/styles/accessibility.css` — visually hidden, visible on focus.

## Standards and Guidelines Referenced

| Standard | Scope | Reference |
|---|---|---|
| WCAG 2.2 AA | Target compliance level | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) |
| docs/KEYBOARD_A11Y_STANDARDS.md | Keyboard interaction patterns | Internal |
| docs/COMPONENT_STANDARDS.md | Ant Design a11y defaults | Internal |
| docs/TYPOGRAPHY_SPACING_MOTION.md | Focus indicators, touch targets | Internal |

## WCAG 2.2 AA Coverage Summary

| Principle | Criteria Covered | Status |
|---|---|---|
| **1. Perceivable** | 1.1.1 (Non-text), 1.3.1 (Info/Relationships), 1.3.2 (Sequence), 1.3.4 (Orientation), 1.4.3 (Contrast) | Partial — contrast not automated |
| **2. Operable** | 2.1.1 (Keyboard), 2.4.1 (Bypass Blocks), 2.4.3 (Focus Order), 2.4.7 (Focus Visible), 2.5.8 (Target Size) | Partial — focus order manual |
| **3. Understandable** | 3.1.1 (Language), 3.3.1 (Error Identification), 3.3.2 (Labels) | Covered |
| **4. Robust** | 4.1.2 (Name, Role, Value), 4.1.3 (Status Messages) | Covered |

## Known Gaps

1. **Color contrast**: Not automated in CI (axe-core in JSDOM has limited CSS support). Manual validation required.
2. **Focus order**: Logical focus order verified by landmark structure but not automated for complex flows (gantt tool drag/drop).
3. **Keyboard traps**: Architecture v3 focus trap tests skipped in CI. Covered by standards doc.
4. **ARIA live regions**: Some dynamic content updates (gantt tool sync status, dashboard refresh) may not announce to screen readers.
5. **Touch target size**: 44x44px minimum documented in standards but not automated. Manual real-device validation required.

## Validation Cadence

| Type | Frequency | Scope |
|---|---|---|
| Automated axe-core | Every CI run | 13 pattern tests |
| Manual screen reader | Monthly | Core journeys (VoiceOver + TalkBack) |
| Color contrast audit | Quarterly | All pages with browser DevTools |
| Full WCAG audit | Annually | Complete WCAG 2.2 AA checklist |
