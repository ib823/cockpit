# Baseline: PlanMode Component State

**Date**: 2025-11-09
**Branch**: fix/mobile-responsive-p0
**File**: src/components/project-v2/modes/PlanMode.tsx

---

## Current State (BEFORE Fix)

### Line 311: Fixed Width Panel
```tsx
className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col"
```

### Problem
- Panel is **480px wide** (fixed)
- iPhone SE: **375px wide** → Panel is 105px wider than screen!
- iPhone 12: **390px wide** → Panel is 90px wider than screen!
- Result: **Panel overflows screen, impossible to close on mobile**

### Expected Behavior (AFTER Fix)
- Mobile (< 640px): Panel should be **full width** (w-full)
- Small tablet (640-768px): Panel should be **max 384px** (sm:max-w-sm)
- Medium tablet (768-1024px): Panel should be **max 448px** (md:max-w-md)
- Desktop (1024px+): Panel should be **480px** (lg:w-[480px])

### How Panel Works
1. User clicks on a phase in the timeline
2. `setSelectedPhase(phase)` is called
3. AnimatePresence shows the panel sliding in from right
4. Panel displays phase details (name, days, resources)
5. User clicks X button or backdrop to close
6. `setSelectedPhase(null)` hides panel

### Critical Functionality to Test
- ✓ Panel opens when phase clicked
- ✓ Panel displays phase information correctly
- ✓ Close button (X) works
- ✓ Clicking backdrop closes panel
- ✓ Panel content is scrollable
- ✓ Panel doesn't cause horizontal scroll
- ✓ Animation is smooth (slide in/out)

---

## Fix to Apply

### Change Line 311

**BEFORE**:
```tsx
className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col"
```

**AFTER**:
```tsx
className="fixed right-0 top-0 bottom-0 w-full sm:max-w-sm md:max-w-md lg:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
```

### Explanation
- `w-full`: Default (mobile) - takes full width
- `sm:max-w-sm`: At 640px+ - maximum 384px wide (Tailwind's sm container)
- `md:max-w-md`: At 768px+ - maximum 448px wide
- `lg:w-[480px]`: At 1024px+ - exactly 480px (original behavior)

---

## Test Plan

### Visual Test (Chrome DevTools)
1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:3000/project/plan
3. Click on any phase in timeline
4. Check panel at these viewports:
   - 375px (iPhone SE): Should be full width (375px)
   - 390px (iPhone 12): Should be full width (390px)
   - 768px (iPad): Should be max 448px
   - 1280px (Desktop): Should be 480px

### Functional Test
1. Panel opens ✓
2. Close button works ✓
3. Backdrop closes panel ✓
4. No horizontal scroll ✓
5. Content scrollable ✓
6. Animation smooth ✓

### Expected Results
- ✅ Panel fits screen at all sizes
- ✅ No overflow on mobile
- ✅ Desktop behavior unchanged (still 480px)
- ✅ All interactions still work
- ✅ No console errors
- ✅ No visual glitches

---

**Created**: 2025-11-09
**Next Step**: Apply fix and test
