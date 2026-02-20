# Keyboard Navigation & Focus Management Standards (D-02)

Status: Active
Version: 1.0.0
Last Updated (UTC): 2026-02-20

## 1. Scope

This document defines keyboard navigation and focus management standards for all interactive surfaces. Compliance is required for Phase 2 gate (P2) and WCAG 2.2 AA targets.

## 2. Core Principles

1. **Every interactive element must be keyboard-accessible.** If it responds to click, it must respond to Enter/Space.
2. **Focus must be visible.** All focusable elements must show a clear focus indicator (minimum 2px ring, `focus:ring-2 focus:ring-[var(--color-blue)]`).
3. **Focus order must be logical.** Tab order follows visual reading order (left-to-right, top-to-bottom).
4. **Modals must trap focus.** When a modal/drawer/overlay is open, Tab must cycle within it. Escape must close it.
5. **Focus must be restored.** When a modal closes, focus returns to the element that opened it.

## 3. Infrastructure Inventory

### Global Keyboard Shortcut System

**File:** `src/hooks/useKeyboardShortcuts.ts`

Provides a global shortcut registry with context-scoped binding. Shortcuts skip events from INPUT/TEXTAREA/SELECT/contentEditable except Cmd+K.

**Defined shortcut sets:**

| Context | Shortcuts | Status |
|---------|-----------|--------|
| Global | Cmd+K (command palette), Cmd+/ (shortcuts help), Escape (close) | Defined, NOT wired |
| Estimator | Cmd+S (save), Cmd+Shift+G (generate), Cmd+A (toggle advanced) | Defined, NOT wired |
| Gantt | Cmd+S (save), Cmd+=/- (zoom), Cmd+W (toggle weekends) | Defined, NOT wired |
| Dashboard | Cmd+N (new estimate), Cmd+P (new project), Cmd+E (customize) | Defined, NOT wired |

**Required action:** Wire shortcut sets into their respective page components by calling `useKeyboardShortcuts()` with the appropriate context.

### Feature-Specific Navigation

| Feature | Hook | File | Keys | Status |
|---------|------|------|------|--------|
| Architecture tabs | `useTabKeyboardNavigation` | `src/app/architecture/v3/hooks/useKeyboardNavigation.ts` | Arrow keys, Home, End, Enter, Space | Active |
| Gantt canvas | `useKeyboardNavigation` | `src/components/gantt-tool/useKeyboardNavigation.ts` | Arrows, Enter, Space, Delete, Escape, f/n/t/m | Active |
| Org chart | Inline handler | `src/components/gantt-tool/OrgChartPro.tsx` | Arrows, Enter, Escape | Active |

### Focus Trapping

| Mechanism | Location | Status |
|-----------|----------|--------|
| `focus-trap-react` | `src/components/ui/BaseModal.tsx`, `src/ui/components/Modal.tsx` | Active, production use |
| `useFocusTrap` hook | `src/app/architecture/v3/hooks/useFocusTrap.ts` | Dead code — not imported by any component |
| `OverlaySafety` | `src/components/OverlaySafety.tsx` | Active — cleans up orphaned overlays and stale focus traps on route change |

### Accessibility Utilities

**File:** `src/app/architecture/v3/utils/accessibility.ts`

Provides: `announceToScreenReader()`, `getFocusableElements()`, `focusFirstElement()`, `trapFocus()`, `isActivationKey()`, `getMinimumTouchTargetSize()` (44px touch / 40px pointer per Apple HIG).

**Status:** Fully implemented but NOT imported by any production component. Available for adoption.

### Screen Reader Live Regions

| Mechanism | Location | Status |
|-----------|----------|--------|
| `AriaLive` component | `src/components/shared/AriaLive.tsx` | Implemented, 0 consumers |
| `announceToScreenReader()` | `src/app/architecture/v3/utils/accessibility.ts` | Implemented, 0 consumers |

## 4. Standards for New Components

### Keyboard Interaction Patterns

| Pattern | When to Use | Implementation |
|---------|-------------|----------------|
| **Button** | Any clickable action | `<button>` or Ant Design `<Button>`. Must respond to Enter and Space. |
| **Link** | Navigation to new URL/route | `<a href>` or Next.js `<Link>`. Must respond to Enter. |
| **Tab panel** | Switching between views | Use `useTabKeyboardNavigation` from arch v3. ArrowLeft/Right to switch, Enter to activate. |
| **List navigation** | Scrollable item lists | Use `useListKeyboardNavigation` from arch v3. ArrowUp/Down to navigate, Enter to select. |
| **Modal/Dialog** | Overlay content | Wrap in `focus-trap-react`. Escape to close. Auto-focus first interactive element. Restore focus on close. |
| **Menu/Dropdown** | Action menus | ArrowUp/Down to navigate, Enter to select, Escape to close. |
| **Grid** | 2D navigation (tables, grids) | Use `useKeyboardNavigation` with `type: 'grid'` and `columns` set. |

### Required ARIA Attributes

| Element | Required Attributes |
|---------|--------------------|
| Interactive div/span | `role="button"`, `tabIndex={0}`, `onKeyDown` handling Enter/Space |
| Tab list | `role="tablist"` on container, `role="tab"` on tabs, `aria-selected` on active tab |
| Tab panel | `role="tabpanel"`, `aria-labelledby` pointing to tab |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for title |
| Live updates | `aria-live="polite"` for non-urgent, `aria-live="assertive"` for critical |
| Loading states | `aria-busy="true"` on container, screen reader announcement |

### Focus Indicator Specification

All focusable elements MUST have a visible focus ring:
```
focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:ring-offset-2
```

For dark backgrounds, use:
```
focus:ring-white focus:ring-offset-0
```

Minimum contrast ratio for focus indicator: 3:1 against adjacent colors (WCAG 2.2 AA).

### Touch Target Sizes (Apple HIG)

- Minimum touch target: **44x44px** (touch devices)
- Minimum pointer target: **40x40px** (mouse/trackpad)
- Use `getMinimumTouchTargetSize()` from accessibility utils for responsive sizing

## 5. Skip Navigation (Required)

A skip navigation link MUST be added to the root layout:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 ...">
  Skip to main content
</a>
<main id="main-content">...</main>
```

**Status:** Not yet implemented. Required for Phase 3 gate (D-01).

## 6. Gaps and Remediation Plan

| Gap | Severity | Remediation | Phase |
|-----|----------|-------------|-------|
| Global shortcuts not wired | Medium | Call `useKeyboardShortcuts(GLOBAL_SHORTCUTS)` in root layout | P2 |
| Context shortcuts not wired | Medium | Wire estimator/gantt/dashboard shortcuts in their page components | P3 |
| `useFocusTrap` hook is dead code | Low | Remove or replace with `focus-trap-react` usage | P3 |
| `AriaLive` has 0 consumers | Medium | Wire into root layout for route-change and action announcements | P3 |
| No skip navigation | High | Add to root layout `src/app/layout.tsx` | P3 |
| 3 independent keyboard nav implementations | Low | Consider consolidating into shared hook in P5 | P5 |
| All keyboard/focus tests are skipped | High | Unskip and fix tests as components are brought into compliance | P3 |

## 7. Testing Requirements

Keyboard navigation MUST be tested:
1. **Unit tests:** Use `fireEvent.keyDown()` to verify arrow key, Enter, Space, and Escape behavior.
2. **Integration tests:** Verify focus trap cycling in modals and drawers.
3. **Manual tests:** Tab through each critical user journey and verify logical focus order.

Existing test suites (currently skipped):
- `src/app/architecture/v3/__tests__/keyboard-navigation.test.tsx` — 31 tests
- `src/app/architecture/v3/__tests__/focus-trap.test.tsx` — 27 tests
- `src/app/architecture/v3/__tests__/aria-labels.test.tsx` — 16 tests

These MUST be unskipped and passing by Phase 3 gate.
