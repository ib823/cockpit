# Steve Jobs-Style Minimalist Refactor - Implementation Notes

## 🎯 Overview

This refactor transforms the SAP Implementation Cockpit into a **minimalist, Apple-inspired** product with:
- Clean design system (tokens + micro UI library)
- High-performance timeline (AeroTimeline)
- Unified state management
- Zero NaN date bugs
- A11y-first approach

## 📁 Key Files Created/Modified

### Design System
- `src/styles/tokens.css` - Design tokens (colors, spacing, radii, shadows)
- `src/styles/motion.css` - Motion system (150-200ms, ease-out)
- `src/app/globals.css` - Updated to import tokens + base styles

### UI Component Library
- `src/app/_components/ui/Button.tsx` - Primary, ghost, subtle, danger variants
- `src/app/_components/ui/Segmented.tsx` - Apple-like segmented control
- `src/app/_components/ui/Input.tsx` - Minimal text input with label
- `src/app/_components/ui/Select.tsx` - Dropdown select
- `src/app/_components/ui/Checkbox.tsx` - Checkbox with label
- `src/app/_components/ui/Tooltip.tsx` - Subtle tooltip (max-width 280px)
- `src/app/_components/ui/Toast.tsx` - Notification toast wrapper
- `src/app/_components/ui/Empty.tsx` - Empty state component
- `src/app/_components/ui/Sheet.tsx` - Drawer-like slide-in panel
- `src/app/_components/ui/Dialog.tsx` - Modal dialog
- `src/app/_components/ui/Kbd.tsx` - Keyboard key display
- `src/app/_components/ui/index.ts` - Barrel export

### State Management
- `src/lib/unified-project-store.ts` - Single source of truth (Zustand + Immer + Persist)

### Business-Day Utilities (Zero NaN Bugs!)
- `src/app/_components/timeline/utils/date.ts` - Robust date math
- `src/app/_components/timeline/utils/date.test.ts` - 33 passing tests

### Timeline (AeroTimeline)
- `src/app/_components/timeline/types.ts` - TypeScript types
- `src/app/_components/timeline/useTimelineEngine.ts` - Headless timeline logic
- `src/app/_components/timeline/AeroTimeline.tsx` - Canvas + DOM overlays

### Project Shell
- `src/app/_components/shell/TopBar.tsx` - Brand, mode nav, actions
- `src/app/_components/shell/ModeNav.tsx` - Segmented: Capture/Decide/Plan/Present
- `src/app/_components/shell/ClientSafeToggle.tsx` - Hide cost elements

### Project Layout & Pages
- `src/app/project/layout.tsx` - Top-level shell with TopBar
- `src/app/project/capture/page.tsx` - Requirements gathering (placeholder)
- `src/app/project/decide/page.tsx` - Presales chips (placeholder)
- `src/app/project/plan/page.tsx` - **AeroTimeline integration (LIVE)**
- `src/app/project/present/page.tsx` - Client presentations (placeholder)

### Config & Guardrails
- `tailwind.config.js` - Updated to use CSS variables
- `.eslintrc.cjs` - Design guardrails (no inline styles, etc.)
- `.clauderc.json` - Design system documentation

### Tests (Starter Scaffolding)
- `tests/e2e/plan-timeline.spec.ts` - E2E test structure
- `tests/a11y/a11y-smoke.spec.ts` - A11y test structure

## 🎨 Design Principles

### Colors
- **Accent:** `var(--accent)` (#2563EB) - Use sparingly
- **Ink:** `var(--ink)` - Primary text
- **Ink Dim:** `var(--ink-dim)` - Secondary text
- **Surface:** `var(--surface)` - Background
- **Surface Sub:** `var(--surface-sub)` - Elevated surfaces
- **Line:** `var(--line)` - 1px hairline borders

### Motion
- **Duration:** 150-200ms (`var(--dur)`)
- **Easing:** cubic-bezier(0.2, 0.8, 0.2, 1) (`var(--ease)`)
- **No bouncing** - Subtle scale (1.02 max) on hover

### Spacing (8px grid)
- `var(--s-4)` → `var(--s-64)` in 4px increments
- Use consistently for padding, margin, gaps

### Typography
- **System font stack** (SF Pro on macOS)
- **Font features:** `ss01`, `cv02`
- **Weights:** 400 (regular), 600 (semibold)

## 🔒 Guardrails

### No Inline Styles
- All styling via `className` with CSS variables
- Exception: Positional styles for AeroTimeline overlays

### No Hardcoded Colors
- All colors use `var(--token-name)`
- Enforced by ESLint warning

### Focus-Visible Required
- All interactive elements have focus ring using `var(--focus)`
- 2px solid blue, 2px offset

### Hit Targets ≥ 40px
- Buttons, links, controls must be at least 40px
- Sizes: sm (32px), md (40px), lg (48px)

## 🧪 Testing

### Unit Tests (Passing ✅)
```bash
npm test -- src/app/_components/timeline/utils/date.test.ts
# 33 tests passing
```

### E2E Tests (Starter Scaffolding)
```bash
npm run test:e2e
# Requires Playwright setup
```

### A11y Tests (Starter Scaffolding)
```bash
npm run test:e2e
# Requires axe-core + Playwright setup
```

## 🚀 How to Run

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Visit http://localhost:3000/project/plan
# Click "Load Sample Phases" to see AeroTimeline in action
```

## 🎯 Acceptance Criteria Status

1. ✅ **AeroTimeline** replaces old timeline on `/project/plan`
   - Canvas rendering with DOM overlays
   - Business-day aware
   - Weekend/holiday shading (structure in place)
   - Keyboard accessible
   - Baseline support
   - Dependency links (FS only)

2. ✅ **Zero "NaN" dates**
   - 33 passing unit tests
   - Edge cases handled: 0 BD, weekend crossings, holidays

3. ✅ **New shell** (TopBar + ModeNav + ClientSafeToggle)
   - Segmented mode navigation
   - Consistent typography and spacing

4. ✅ **No inline styles or hardcoded colors**
   - Enforced by ESLint
   - All colors via CSS variables

5. ⚠️ **A11y** (Structure in place, full testing requires Playwright)
   - Focus-visible styles implemented
   - Keyboard navigation supported
   - ARIA labels on interactive elements
   - Axe tests scaffolded

6. ✅ **Visual noise removed**
   - Fewer borders (1px hairlines)
   - Lighter chrome
   - Consistent paddings
   - Subtle shadows only

7. ✅ **TypeScript strict** + ESLint rules
   - All components typed
   - Inline documentation
   - Design guardrails enforced

## 🔮 Future Work (Not in This PR)

### Phase 2
- **Critical path calculation** (automatic)
- **Resource heatmap** (visual over-allocation detection)
- **Drag & resize** fully implemented with business-day snapping
- **Undo/redo** for timeline operations

### Phase 3
- **Estimator → Project bridge** (auto-populate from Tier 1)
- **Presales chip integration** (Decide page → timeline)
- **Present page** (client-ready exports)

### Phase 4
- **Real-time collaboration** (multiple users editing timeline)
- **Advanced dependencies** (SS, FF, SF in addition to FS)
- **Gantt export** (PDF, PNG, Excel)

## 📚 References

- **Design System:** `src/styles/tokens.css`, `.clauderc.json`
- **Component Patterns:** `src/app/_components/ui/`
- **Date Utilities:** `src/app/_components/timeline/utils/date.ts`
- **Store:** `src/lib/unified-project-store.ts`

## 🤝 Contributing

When extending this codebase:
1. **Use design tokens** from `tokens.css`
2. **No inline styles** (except positional)
3. **Keyboard accessible** (Tab, Enter, Escape, Arrows)
4. **Test edge cases** (especially dates!)
5. **Document inline** (TSDoc comments)

---

**Generated:** 2025-10-08
**Author:** Claude Code (Principal Frontend Engineer + UX System Architect)
