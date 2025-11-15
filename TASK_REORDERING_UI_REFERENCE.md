# Task Reordering UI Reference

## Visual Design (Apple HIG)

### Normal State (Not Hovered)
```
┌─────────────────────────────────────────────────────┐
│  Phase Name                                         │
├─────────────────────────────────────────────────────┤
│    ├─ Task 1 Name                                   │  ← No arrows visible
│    ├─ Task 2 Name                                   │
│    └─ Task 3 Name                                   │
└─────────────────────────────────────────────────────┘
```

### Hovered State (Arrows Appear)
```
┌─────────────────────────────────────────────────────┐
│  Phase Name                                         │
├─────────────────────────────────────────────────────┤
│    ├─ Task 1 Name          [↑][↓][🗑]               │  ← First task: up disabled
│    ├─ Task 2 Name          [↑][↓][🗑]               │  ← Middle task: both enabled
│    └─ Task 3 Name          [↑][↓][🗑]               │  ← Last task: down disabled
└─────────────────────────────────────────────────────┘
```

## Icon Specifications

### Up Arrow (Enabled)
```
Style: ChevronUp from lucide-react
Size: 16x16px
Color: rgba(0, 0, 0, 0.5) → #000 on hover
Background: transparent → rgba(0, 0, 0, 0.06) on hover
Border Radius: 4px
Padding: 2px
```

### Up Arrow (Disabled - First Task)
```
Style: ChevronUp from lucide-react
Size: 16x16px
Color: rgba(0, 0, 0, 0.2)
Background: transparent
Cursor: not-allowed
```

### Down Arrow (Enabled)
```
Style: ChevronDown from lucide-react
Size: 16x16px
Color: rgba(0, 0, 0, 0.5) → #000 on hover
Background: transparent → rgba(0, 0, 0, 0.06) on hover
Border Radius: 4px
Padding: 2px
```

### Down Arrow (Disabled - Last Task)
```
Style: ChevronDown from lucide-react
Size: 16x16px
Color: rgba(0, 0, 0, 0.2)
Background: transparent
Cursor: not-allowed
```

## Layout Structure

### Task Row Layout (48px padding-left for indentation)
```
┌──────────────────────────────────────────────────────────────┐
│ [32px] │ [Task Name............] [↑][↓] [🗑] │ [Duration] ... │
│  gap   │        flex: 1          gap:4px 28px │               │
└──────────────────────────────────────────────────────────────┘
         │←─────── taskNameWidth ─────────→│
```

### Control Group Spacing
```
[Task Name Text]   [4px]   [↑]   [4px]   [↓]   [8px]   [🗑]
                            16px          16px           28px
```

## Interaction States

### 1. Default (No Hover)
- Arrows: `opacity: 0`
- Delete button: `opacity: 0`
- Transition: `opacity 0.15s ease`

### 2. Row Hover
- Arrows: `opacity: 1` (fade in)
- Delete button: `opacity: 1` (fade in)
- Row background: `rgba(0, 0, 0, 0.015)`

### 3. Arrow Hover (Enabled)
- Arrow color: `rgba(0, 0, 0, 0.5)` → `#000`
- Arrow background: `transparent` → `rgba(0, 0, 0, 0.06)`
- Transition: `all 0.15s ease`

### 4. Arrow Hover (Disabled)
- No visual change
- Tooltip: "Already first/last task"

### 5. Arrow Click
- Triggers: `reorderTask(taskId, phaseId, direction)`
- Animation: Smooth swap with Framer Motion layout
- Duration: ~200ms spring curve

## Animation Flow

### Reorder Animation Sequence
```
1. User clicks down arrow on Task 1
   │
   ├─> Store: Swap array positions [Task 1, Task 2] → [Task 2, Task 1]
   │
   ├─> Framer Motion: Detect layout change (layout prop)
   │
   ├─> Animation: Smooth position transition (200ms spring)
   │   ┌───────────────────────────────┐
   │   │ Task 1 ↓ (moving down)        │
   │   │ Task 2 ↑ (moving up)          │
   │   └───────────────────────────────┘
   │
   └─> Result:
       ✓ Task 2 now first
       ✓ Task 1 now second
       ✓ order field updated for both
       ✓ Auto-saved to database
```

## Keyboard Shortcuts

### Visual Feedback on Keyboard Use
```
User presses: ⌘↑ (with Task 2 selected)

Before:                    After:
┌──────────────┐          ┌──────────────┐
│ Task 1       │          │ Task 2 ✓     │  ← Moved up + selected
│ Task 2 ✓     │    →     │ Task 1       │
│ Task 3       │          │ Task 3       │
└──────────────┘          └──────────────┘

Animation: 200ms smooth swap
Selection: Stays with Task 2
```

## Tooltip Text

| Button | State | Tooltip Text |
|--------|-------|--------------|
| ↑ | Enabled | "Move task up (⌘↑)" |
| ↑ | Disabled | "Already first task" |
| ↓ | Enabled | "Move task down (⌘↓)" |
| ↓ | Disabled | "Already last task" |

## ARIA Labels

| Button | State | ARIA Label |
|--------|-------|------------|
| ↑ | Enabled | "Move task {taskName} up" |
| ↑ | Disabled | "Move task {taskName} up" |
| ↓ | Enabled | "Move task {taskName} down" |
| ↓ | Disabled | "Move task {taskName} down" |

## Color Palette

### Light Mode (Current Implementation)
```css
/* Default state */
--arrow-color-default: rgba(0, 0, 0, 0.5);
--arrow-bg-default: transparent;

/* Hover state */
--arrow-color-hover: #000;
--arrow-bg-hover: rgba(0, 0, 0, 0.06);

/* Disabled state */
--arrow-color-disabled: rgba(0, 0, 0, 0.2);
--arrow-bg-disabled: transparent;

/* Row background */
--row-bg-default: transparent;
--row-bg-hover: rgba(0, 0, 0, 0.015);
--row-bg-selected: rgba(0, 122, 255, 0.05);
```

## Responsive Behavior

### Desktop (≥768px)
- Full controls visible on hover
- Keyboard shortcuts enabled
- 16x16px icons

### Tablet (640px - 767px)
- Controls visible on hover
- Touch-friendly (larger hit targets)
- 16x16px icons

### Mobile (<640px)
- Controls always visible (no hover)
- Touch-optimized spacing
- 16x16px icons (minimum)

## Accessibility

### Screen Reader Announcements
```
When task is reordered:
"Task 'Setup Infrastructure' moved up. Now position 1 of 5."
"Task 'Deploy Application' moved down. Now position 3 of 5."
```

### Keyboard Focus Indicators
- Focus ring: 2px solid rgba(0, 122, 255, 0.5)
- Focus offset: 2px
- Focus visible: Always visible when using keyboard navigation

### High Contrast Mode
- Arrows maintain 4.5:1 contrast ratio
- Disabled state: 3:1 minimum contrast
- Borders: 1px solid for clear boundaries

## Implementation Notes

### Why 16x16px Icons?
- Apple HIG standard for toolbar buttons
- Maintains visual hierarchy (smaller than primary actions)
- Easily clickable without being intrusive

### Why Appear on Hover?
- Reduces visual clutter (Jobs/Ive principle)
- Progressive disclosure (show controls when needed)
- Focuses attention on task content by default

### Why Gray → Black on Hover?
- Subtle cue that controls are interactive
- Consistent with macOS/iOS system behavior
- High contrast on action (black = active state)

### Why 4px Gap Between Arrows?
- 8px grid system (Apple HIG)
- Prevents accidental clicks
- Visual breathing room

### Why 200ms Animation?
- Apple's standard spring duration
- Feels responsive but not jarring
- Matches existing design system

---

## Code Example

### Complete Button Implementation
```tsx
{/* Move Up Button */}
<button
  onClick={(e) => {
    e.stopPropagation();
    reorderTask(task.id, phase.id, "up");
  }}
  disabled={isFirstTask}
  title={isFirstTask ? "Already first task" : "Move task up (⌘↑)"}
  aria-label={`Move task ${task.name} up`}
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    padding: "2px",
    borderRadius: "4px",
    backgroundColor: "transparent",
    border: "none",
    cursor: isFirstTask ? "not-allowed" : "pointer",
    color: isFirstTask ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.5)",
    transition: "all 0.15s ease",
    flexShrink: 0,
  }}
  onMouseEnter={(e) => {
    if (!isFirstTask) {
      e.currentTarget.style.color = "#000";
      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.06)";
    }
  }}
  onMouseLeave={(e) => {
    if (!isFirstTask) {
      e.currentTarget.style.color = "rgba(0, 0, 0, 0.5)";
      e.currentTarget.style.backgroundColor = "transparent";
    }
  }}
>
  <ChevronUp className="w-4 h-4" />
</button>
```

---

## Design Rationale

### Minimalism
"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry

The reorder controls follow this principle:
- Only appear when needed (hover)
- Smallest functional size (16x16px)
- Subtle colors (gray, not bright blue)
- No text labels (icons are self-explanatory)
- No borders/decorations (clean buttons)

### Consistency
All design decisions align with existing GanttCanvasV3 patterns:
- Same hover transition duration (0.15s)
- Same color system (system grays)
- Same animation curves (SPRING.gentle)
- Same spacing (8px grid)

### Feedback
Every interaction provides clear feedback:
- Hover: Color + background change
- Disabled: Grayed out icon
- Click: Smooth animation
- Complete: New order persisted

This creates a satisfying, predictable user experience.
