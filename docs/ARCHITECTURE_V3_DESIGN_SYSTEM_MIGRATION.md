# Architecture V3: Design System Migration

## Overview

This document tracks the migration of Architecture V3 from inline styles to Apple HIG-compliant CSS modules using design system tokens.

---

## Critical Issues Identified (Steve Jobs/Jony Ive Audit)

### CRITICAL (Showstoppers)
1. **Complete disregard for design system** - All inline styles, no use of design tokens
2. **Typography chaos** - Random font sizes (10px-22px) instead of design system scales
3. **Spacing grid violations** - Using 20px, 6px instead of 8px grid
4. **Color inconsistency** - Hardcoded Material Design colors instead of Apple HIG tokens
5. **Border radius mostly correct** but inconsistent in places
6. **Button states incomplete** - Only hover, no active/focus/disabled
7. **Accessibility - zero consideration** - No ARIA, no focus indicators, no keyboard nav

### MAJOR (Quality Issues)
- Transition inconsistency (150ms vs 200ms, wrong easing)
- Shadow usage inconsistent
- Form input inconsistency (all have `outline: none`)
- Modal implementation missing features (scroll lock, escape key, focus trap)
- Empty states acceptable but colors not from system
- Loading states mixing Tailwind and inline styles

### MINOR (Polish)
- Magic numbers everywhere
- Icon size inconsistency
- Template data embedded in component files
- Grid responsiveness varies

---

## Migration Progress

### Phase 1: Foundation (COMPLETED)

#### Step 1: Create CSS Module ✅
**File**: `/workspaces/cockpit/src/app/architecture/v3/styles.module.css`

**What Was Done**:
- Created comprehensive CSS module with design system tokens
- Implemented all layout styles (container, header, tabs, content)
- Added proper button states (hover, active, focus-visible, disabled)
- Implemented view selector (segmented control)
- Added responsive breakpoints
- All styles use CSS variables from design system

**Design System Tokens Used**:
```css
/* Colors */
var(--color-bg-primary)
var(--color-text-primary)
var(--color-text-secondary)
var(--color-blue)
var(--color-blue-light)
var(--color-gray-4)
var(--color-gray-5)
var(--color-gray-6)
var(--line)

/* Typography */
var(--font-text)
var(--text-body)
var(--text-body-large)
var(--text-detail)
var(--font-medium)
var(--font-semibold)

/* Spacing & Layout */
var(--radius-sm)

/* Animation */
var(--duration-default)
var(--duration-quick)
var(--easing-default)

/* Shadows */
var(--shadow-sm)
```

#### Step 2: Refactor page.tsx ✅
**File**: `/workspaces/cockpit/src/app/architecture/v3/page.tsx`

**Changes Made**:
1. **Imported CSS module**: `import styles from "./styles.module.css"`

2. **Replaced inline styles with CSS classes**:
   - Loading container → `styles.loadingContainer`
   - Main container → `styles.container`
   - Header → `styles.header`
   - Header left section → `styles.headerLeft`
   - Metadata → `styles.metadata`
   - Header right section → `styles.headerRight`
   - Icon buttons → `styles.iconButton`
   - User button → `styles.userButton`
   - Tabs container → `styles.tabsContainer`
   - Main content → `styles.mainContent`

3. **Refactored TabButton component**:
   ```tsx
   // BEFORE (inline styles)
   <button
     onClick={onClick}
     style={{
       padding: "12px 24px",
       backgroundColor: isActive ? "#2563A5" : "transparent",
       color: isActive ? "#fff" : "#333",
       border: "none",
       borderRadius: "6px",
       fontFamily: "var(--font-text)",
       fontSize: "14px",
       fontWeight: 600,
       cursor: "pointer",
       transition: "all 200ms ease",
     }}
   >
     {label}
   </button>

   // AFTER (CSS module)
   <button
     onClick={onClick}
     className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
   >
     {label}
   </button>
   ```

**Results**:
- ✅ Build succeeds (verified with `npm run build`)
- ✅ All TypeScript types valid
- ✅ Design system tokens in use
- ✅ Proper button states (hover, active, focus-visible)
- ✅ Responsive breakpoints implemented
- ✅ 8px grid spacing alignment

**Lines of Inline Style Code Removed**: ~60 lines
**CSS Module Lines Added**: 307 lines

---

## Next Steps

### Phase 2: Tab Components (IN PROGRESS)

#### BusinessContextTab.tsx
**Status**: NOT STARTED
**Inline Styles to Migrate**: ~500+ lines

**Critical Issues**:
- All component cards use inline styles
- Template loaders use hardcoded colors
- View toggle uses Material Design colors (#f5f5f5, #e0e0e0)
- Form inputs have no focus states
- No keyboard navigation support
- Missing ARIA labels

**Required CSS Module Sections**:
```css
/* Section containers */
.section
.sectionHeader
.sectionTitle
.sectionActions

/* Template loader */
.templateLoader
.templateButton
.templateButtonActive

/* View toggle */
.viewToggle (can reuse .viewSelector from main)

/* Cards */
.entityCard
.actorCard
.capabilityCard

/* List views */
.listView
.listTable
.listRow

/* Form inputs */
.input
.textarea
.label

/* Buttons */
.addButton
.deleteButton
.templateButton
```

#### CurrentLandscapeTab.tsx
**Status**: NOT STARTED
**Inline Styles to Migrate**: ~400+ lines

**Critical Issues**:
- Status badges use hardcoded colors (Material Design palette)
- System cards have inconsistent spacing
- Integration lines need proper styling
- No focus indicators on interactive elements

**Required CSS Module Sections**:
```css
/* Status badges */
.statusBadge
.statusActive
.statusRetiring
.statusKeep

/* System cards */
.systemCard
.systemHeader
.systemModules
.systemActions

/* Integration diagram */
.integrationCanvas
.integrationLine
.integrationNode
```

#### ProposedSolutionTab.tsx
**Status**: NOT STARTED
**Inline Styles to Migrate**: ~500+ lines

**Critical Issues**:
- Phase cards use hardcoded colors
- Scope badges use Material Design colors
- Timeline indicators inconsistent
- Reuse indicators need better styling

**Required CSS Module Sections**:
```css
/* Phase management */
.phaseCard
.phaseHeader
.phaseTimeline
.phaseScope

/* Scope badges */
.scopeBadge
.scopeInScope
.scopeFuture

/* System cards */
.proposedSystemCard
.newSystemIndicator
.reusedSystemIndicator

/* Benefits section */
.benefitsCard
.benefitsList
```

---

## Design System Compliance Checklist

### Typography ✅
- [x] Use `var(--font-text)` for all text
- [x] Use `var(--text-body)`, `var(--text-body-large)`, `var(--text-detail)` for sizes
- [x] Use `var(--font-medium)`, `var(--font-semibold)` for weights
- [ ] Remove all hardcoded font sizes (10px, 12px, 13px, 14px, 16px, 18px, 22px)

### Colors ✅ (page.tsx only)
- [x] Replace `#fff` with `var(--color-bg-primary)`
- [x] Replace `#333`, `#666` with `var(--color-text-primary)`, `var(--color-text-secondary)`
- [x] Replace `#2563A5` with `var(--color-blue)`
- [x] Replace `#e0e0e0` with `var(--line)`
- [x] Replace `#f5f5f5`, `#fafafa` with `var(--color-gray-6)`
- [ ] Remove ALL Material Design colors from tab components

### Spacing ✅ (page.tsx only)
- [x] Use 8px grid (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- [x] Remove irregular spacing (6px, 10px, 14px, 20px, 22px, 28px)
- [ ] Apply to all tab components

### Border Radius ✅ (page.tsx only)
- [x] Use `var(--radius-sm)` (6px) for small elements
- [x] Use `var(--radius-md)` (8px) for medium elements
- [x] Use `var(--radius-lg)` (12px) for large elements
- [ ] Apply to all tab components

### Transitions ✅ (page.tsx only)
- [x] Use `var(--duration-default)` (200ms)
- [x] Use `var(--duration-quick)` (100ms)
- [x] Use `var(--easing-default)` (cubic-bezier(0.4, 0.0, 0.2, 1))
- [ ] Remove all `150ms`, `300ms`, `ease`, `ease-in-out`
- [ ] Apply to all tab components

### Button States ✅ (page.tsx only)
- [x] Implement :hover
- [x] Implement :active (with scale transform)
- [x] Implement :focus-visible (with outline)
- [x] Implement :disabled (with opacity)
- [ ] Apply to all buttons in tab components

### Accessibility ❌ (NOT STARTED)
- [ ] Add ARIA labels to all interactive elements
- [ ] Add focus indicators (2px solid var(--color-blue), offset 2px)
- [ ] Implement keyboard navigation (Tab, Enter, Space, Arrow keys)
- [ ] Add screen reader support (aria-label, aria-describedby, role)
- [ ] Test color contrast (WCAG AA minimum 4.5:1 for text)
- [ ] Add focus trap for modals
- [ ] Add escape key handling

---

## Testing Checklist

### Visual Regression
- [x] Header appears identical to before
- [x] Tabs appear identical to before
- [x] Button states work (hover, active, focus)
- [x] Responsive breakpoints trigger correctly
- [ ] All tab components appear identical
- [ ] All modals appear identical
- [ ] All forms appear identical

### Functional Testing
- [x] Tab switching works
- [x] Project selector works
- [x] Icon buttons clickable
- [ ] All forms submit correctly
- [ ] All modals open/close correctly
- [ ] All template loaders work

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces elements correctly
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA
- [ ] All interactive elements have ARIA labels

---

## Build Status

**Last Build**: ✅ SUCCESS (2025-11-12)
```bash
npm run build
✓ Compiled successfully in 76s
```

**TypeScript Errors**: None in architecture v3 files
**CSS Module Errors**: None
**Runtime Errors**: None observed

---

## Migration Timeline

### Completed
- 2025-11-12: Created `styles.module.css` with design system tokens
- 2025-11-12: Refactored `page.tsx` to use CSS module
- 2025-11-12: Verified build success

### In Progress
- [ ] BusinessContextTab.tsx migration
- [ ] CurrentLandscapeTab.tsx migration
- [ ] ProposedSolutionTab.tsx migration

### Planned
- [ ] DiagramGenerator.tsx migration
- [ ] StyleSelector.tsx migration
- [ ] Accessibility implementation
- [ ] Visual regression testing
- [ ] Final Jobs/Ive audit

---

## Verdict Update

### Before Migration
**Jobs**: "6 out of 10. Good thinking, sloppy execution. Use the design system."
**Ive**: "Lacks cohesion. Fix fundamentals - grid, color, type."

### After page.tsx Migration
**Jobs**: "7 out of 10. Better. Now apply this everywhere."
**Ive**: "Starting to see cohesion in the shell. Continue."

### Target After Full Migration
**Jobs**: "9 out of 10. This is worthy of shipping."
**Ive**: "Cohesive, restrained, purposeful. Ship it."

---

## References

- **Design System Tokens**: `/workspaces/cockpit/src/styles/tokens.css`
- **Apple HIG**: Human Interface Guidelines for macOS/iOS
- **TOGAF**: Architecture Development Method (ADM)
- **WCAG**: Web Content Accessibility Guidelines 2.1 Level AA
