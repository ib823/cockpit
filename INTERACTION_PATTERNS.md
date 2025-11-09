# Gantt Tool Interaction Patterns & Guidelines

**Date:** November 9, 2025
**Purpose:** Document all interaction patterns, tooltip positioning, and clickable areas

---

## Tooltip Positioning Standards (Issue #19)

### Rule: 8px Offset + Proper Z-Index

All tooltips follow consistent positioning:

```tsx
// Standard tooltip positioning
<div className="absolute left-1/2 -translate-x-1/2 top-full mt-2">
  {/* mt-2 = 8px offset from trigger element */}
</div>

// Bottom tooltip (appears above element)
<div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2">
  {/* mb-2 = 8px offset from trigger element */}
</div>

// Right tooltip
<div className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
  {/* ml-2 = 8px offset from trigger element */}
</div>
```

### Z-Index Hierarchy

```
z-[100]  - Top-level tooltips (warnings, critical info)
z-50     - Secondary tooltips (task/phase info)
z-30     - Date labels
z-20     - Milestones, interactive elements
z-10     - Phase bars, milestone lines
z-0      - Grid lines, background elements
```

### Visibility Control

```tsx
// Hover-triggered tooltip
className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"

// Click-triggered tooltip
className={isOpen ? 'opacity-100' : 'opacity-0'}
```

---

## Interaction Model (Issue #20)

### Clickable Areas

**Phase Bars:**
- **Action:** Click to select, double-click to focus (RTS)
- **Cursor:** `cursor-move`
- **Hover:** Lift effect (-translate-y-0.5) + shadow-2xl
- **Visual Feedback:** Ring on selection (ring-4 ring-blue-400)

**Task Bars:**
- **Action:** Click to select, drag to move
- **Cursor:** `cursor-move`
- **Hover:** Lift effect + shadow-2xl
- **Visual Feedback:** Ring on selection (ring-2 ring-blue-400)

**Resize Handles:**
- **Position:** Left and right edges of bars (w-2)
- **Cursor:** `cursor-ew-resize`
- **Hover:** `hover:bg-white/30`
- **Action:** Drag to resize duration

**Buttons:**
- **Small icons:** p-1 (4px padding) - compact controls
- **Standard buttons:** px-4 py-2 (16px × 8px)
- **Hover:** Background color change + cursor-pointer
- **Disabled:** opacity-50 cursor-not-allowed

**Milestones:**
- **Action:** Click to edit
- **Cursor:** `cursor-pointer`
- **Hover:** scale-125 transform
- **Visual Feedback:** Vertical line + flag icon

**Holidays:**
- **Action:** Hover for tooltip only
- **Cursor:** `cursor-help`
- **Visual Feedback:** Dot indicator (solid for weekdays, outlined for weekends)

### Drag-and-Drop Zones

**Phase Reordering:**
- **Trigger:** Drag phase bar
- **Target:** Drop on another phase
- **Feedback:** `ring-4 ring-purple-500 ring-offset-2 scale-105`

**Resource Assignment:**
- **Trigger:** Drag resource from panel
- **Target:** Drop on phase bar
- **Feedback:** `ring-4 ring-purple-500 ring-offset-2 scale-105`

**Task Reordering:**
- **Trigger:** Drag task bar
- **Target:** Drop on another task position
- **Feedback:** Ring highlight + scale effect

---

## Hover State Standards

### Phase/Task Bars

```tsx
// Standard hover effect
className="hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300"

// Combines:
// - Subtle lift (2px upward)
// - Enhanced shadow (depth perception)
// - Smooth 300ms transition
```

### Buttons & Icons

```tsx
// Small controls
className="hover:bg-gray-200 transition-colors"

// Primary actions
className="hover:bg-blue-700 hover:shadow-md transition-all"

// Icon-only buttons
className="hover:scale-110 transition-transform"
```

### Badge Hover

```tsx
// Resource badges
className="hover:bg-purple-800 transition-colors cursor-help"

// Warning badges
className="animate-pulse pointer-events-auto cursor-help"
```

---

## Tooltip Content Guidelines

### Minimum Information

**Phase Tooltips:**
- Phase name
- Date range
- Duration (working days + calendar days)
- Assigned resources (if any)

**Task Tooltips:**
- Task name
- Date range
- Duration
- Status (if exceeds phase boundary)

**Milestone Tooltips:**
- Milestone name
- Date + day of week
- Milestone type (from icon field)

**Holiday Tooltips:**
- Holiday name
- Date
- Weekend indicator (if applicable)

### Maximum Width

```tsx
// Standard constraint
className="max-w-xs"  // 320px max width

// For detailed warnings
className="max-w-md"  // 448px max width
```

### Typography in Tooltips

```tsx
// Title
className="font-semibold text-sm"

// Body text
className="text-xs opacity-90"

// Metadata
className="text-xs opacity-75"
```

---

## Focus States (Accessibility)

### Keyboard Navigation

```tsx
// Standard focus ring
className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"

// For dark backgrounds
className="focus:ring-white focus:ring-offset-blue-600"
```

### Tab Order Priority

1. Toolbar actions (Add Phase, Settings, etc.)
2. Phase controls (collapse/expand, edit, delete)
3. Task controls (reorder, align, edit)
4. Interactive timeline elements (milestones, warnings)

---

## Touch Targets (Mobile)

### Minimum Size: 44px × 44px (Apple HIG)

```tsx
// Small buttons adjusted for touch
className="p-2 min-w-[44px] min-h-[44px]"  // Ensures 44px minimum

// Icon sizing
className="w-5 h-5"  // 20px icons in 44px container = adequate padding
```

### Touch-Friendly Spacing

```tsx
// Between adjacent interactive elements
className="gap-2"  // 8px minimum gap
```

---

## Animation Timing

### Standard Durations

```typescript
// From design system
duration: {
  fast: 150,    // Hover, focus
  normal: 300,  // Transitions, reveals
  slow: 500     // Page transitions
}
```

### Easing Curves

```typescript
// Use for most interactions
transition: 'transition-all duration-300 ease-in-out'

// For entering elements
transition: 'transition-opacity duration-150 ease-out'

// For exiting elements
transition: 'transition-opacity duration-150 ease-in'
```

---

## Reduced Motion Support

### Accessibility Compliance

```tsx
// Detect user preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Conditional transitions
className={prefersReducedMotion ? 'transition-none' : 'transition-all duration-300'}
```

### Alternative Feedback

When motion is reduced:
- Use opacity changes instead of transforms
- Use color changes instead of animations
- Maintain visual feedback without movement

---

## Summary Table

| Element | Cursor | Hover Effect | Click Action | Tooltip |
|---------|--------|--------------|--------------|---------|
| Phase Bar | move | lift + shadow | Select | ✓ |
| Task Bar | move | lift + shadow | Select | ✓ |
| Resize Handle | ew-resize | bg-white/30 | Resize | ✗ |
| Milestone | pointer | scale-125 | Edit | ✓ |
| Holiday | help | - | None | ✓ |
| Button | pointer | bg-change | Execute | ✗ |
| Warning Badge | help | - | None | ✓ |
| Resource Badge | help | bg-change | None | ✓ |
| Date Label | default | - | None | ✗ |
| Grid Line | default | - | None | ✗ |

---

**Best Practices:**

1. ✅ Always provide visual feedback for interactive elements
2. ✅ Use consistent 8px offset for all tooltips
3. ✅ Maintain proper z-index hierarchy to prevent overlap
4. ✅ Ensure 44px minimum touch targets for mobile
5. ✅ Support reduced motion preferences
6. ✅ Provide keyboard navigation for all actions
7. ✅ Use semantic cursors (move, pointer, help, ew-resize)
8. ✅ Implement smooth transitions (300ms standard)

---

**Last Updated:** November 9, 2025
**Related:** `src/components/gantt-tool/GanttCanvas.tsx`, `src/lib/design-system.ts`
