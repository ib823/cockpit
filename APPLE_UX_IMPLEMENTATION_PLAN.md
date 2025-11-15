# Apple UX Implementation Plan - Gantt Tool V3 Enhancements

**Date:** 2025-11-14
**Status:** Design & Implementation Phase
**Philosophy:** Steve Jobs & Jony Ive Design Excellence

---

## Design Philosophy

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs

> "Simplicity is not the absence of clutter... It's about bringing order to complexity." — Jony Ive

### Core Principles Applied

1. **Deep Simplicity** - Remove complexity, not features
2. **Pixel-Perfect Precision** - Every measurement justified, 8pt grid system
3. **God is in the Details** - Obsessive attention to micro-interactions
4. **Focus & Empathy** - Ruthlessly prioritize user needs
5. **Inevitable Design** - Solutions that feel obvious in hindsight

---

## Requirements Assessment

### Requirement 7: Peer Connection Lines in Org Chart

**Current State:**
- Peer nodes created via left/right + buttons
- No visual connection between peers
- Connection lines only show parent-child hierarchy

**Problem:**
Users cannot see peer relationships visually, making collaboration and reporting structures unclear.

**Apple Design Solution:**

**Visual Language:**
- **Parent-child lines:** Solid, 2px, black 15% opacity (hierarchical authority)
- **Peer lines:** Dotted, 1.5px, black 10% opacity (collaborative relationships)
- **Toggle control:** Subtle switch in toolbar - "Show peer connections"
- **Default state:** OFF (focus on hierarchy first, progressive disclosure)

**Implementation Approach:**

```typescript
// New function in spacing-algorithm.ts
export function calculatePeerConnectionPaths(
  positions: Map<string, NodePosition>,
  tree: LayoutNode[]
): Array<{ peer1Id: string; peer2Id: string; path: string }> {
  // Generate horizontal lines connecting siblings at same level
  // Use soft bezier curves, not straight lines
  // Apple aesthetic: 10% curve ratio for gentle organic feel
}
```

**UX Flow:**
1. User clicks "Peer Lines" toggle (off by default)
2. Smooth fade-in animation (300ms, ease-out)
3. Peer lines appear with subtle pulse (draw attention once)
4. Hover over peer line: highlights both connected nodes
5. State persists per user session (localStorage)

**Design Rationale:**
- **Optional visibility** - Reduces visual clutter for simple hierarchies
- **Differentiated styling** - Clear visual language (solid = authority, dotted = collaboration)
- **Gentle curves** - Apple's signature organic feel, not harsh straight lines
- **Smart defaults** - Off by default follows progressive disclosure principle

---

### Requirement 8: Resource Panel Count Sync

**Current State:**
- Resource panel shows category counts accurately
- Counts based on `currentProject.resources.length`
- No visual distinction between org chart resources vs unassigned resources

**Problem:**
Users cannot see which resources are in org chart vs just in resource pool. No indication of assignment status.

**Apple Design Solution:**

**Enhanced Resource Panel Display:**

```
┌─────────────────────────────────────┐
│  Resources (13 total)               │
│                                     │
│  ┌─ In Org Chart (8) ──────────┐  │
│  │  Leadership        2         │  │
│  │  Project Mgmt      3         │  │
│  │  Technical         2         │  │
│  │  Functional        1         │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ Resource Pool (5) ─────────┐  │
│  │  Unassigned resources        │  │
│  │  Ready to assign             │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─ In Tasks/Phases ───────────┐  │
│  │  Currently assigned: 11      │  │
│  │  Utilization: 87%            │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Implementation:**

```typescript
// Calculate three counts:
const orgChartResources = currentProject.resources.filter(r => r.managerResourceId !== undefined);
const poolResources = currentProject.resources.filter(r => !r.managerResourceId);
const assignedResources = new Set([
  ...phases.flatMap(p => p.resourceAssignments.map(a => a.resourceId)),
  ...tasks.flatMap(t => t.resourceAssignments.map(a => a.resourceId))
]);

// Utilization = (assigned / total) * 100
const utilization = (assignedResources.size / currentProject.resources.length) * 100;
```

**Visual Design:**
- **Three-tier hierarchy** - Clear categorization
- **Soft dividers** - 1px, black 8% opacity (Apple subtlety)
- **Progressive disclosure** - Click to expand and see individual names
- **Color coding** - Green for high utilization (>80%), yellow for medium (50-80%), gray for low (<50%)

**Sync Behavior:**
- Real-time updates when resources added/removed from org chart
- Real-time updates when resources assigned to tasks/phases
- Smooth count transitions (animated numbers, 200ms duration)

---

### Requirement 9: Full CRUD for Phases/Tasks with Impact Warnings

**Current State:**
✅ Create: Excellent modals with smart defaults
✅ Delete: Comprehensive impact analysis
❌ Edit: Basic inline modals, inconsistent with create flow
❌ Update: Missing advanced fields, no holiday-aware dates

**Problem:**
Edit experience inferior to create experience. Users lose functionality when editing (no descriptions, deliverables, AMS config, color picker).

**Apple Design Solution:**

**Create Dedicated Edit Modals:**

1. **EditPhaseModal.tsx** (mirrors AddPhaseModal)
   - Pre-populated with current values
   - Full feature parity: description, deliverables, color picker
   - HolidayAwareDatePicker (not basic HTML input)
   - Working days calculation
   - Validation: warn if shrinking phase with tasks outside new bounds
   - **Impact preview** - "3 tasks will be adjusted to fit new dates"

2. **EditTaskModal.tsx** (mirrors AddTaskModal)
   - Pre-populated with current values
   - Full feature parity: description, deliverables, AMS configuration
   - HolidayAwareDatePicker with phase boundary constraints
   - Validation: warn if task has resource assignments and dates changing
   - **Impact preview** - "5 resources (32 working days) will be affected"

**Enhanced Delete Flow:**

**Current:** Good impact analysis, but can be improved

**Improvements:**
- **Mitigation options** in deletion modal:
  - For phases: "Reassign tasks to another phase" (dropdown selector)
  - For tasks: "Reassign resources to another task" (dropdown selector)
  - Or: "Delete all" (red destructive action)
- **Undo capability** - Toast notification: "Phase deleted. Undo?" (5 second window)
- **Confirmation pattern** - Type phase/task name to confirm (prevents accidental deletion)

**Implementation Priority:**

```typescript
// Phase 1: Create edit modals with full feature parity
// Phase 2: Add impact previews to edit flow
// Phase 3: Enhance delete with mitigation options
// Phase 4: Implement undo system
```

**Design Rationale:**
- **Consistency** - Edit should feel like create, not a downgrade
- **Safety** - Multiple confirmation layers for destructive actions
- **Intelligence** - System suggests smart defaults for mitigation
- **Forgiveness** - Undo gives users confidence to make changes

---

### Requirement 10: Modal Layout Consistency

**Current State:**
- Create modals: Beautiful, Apple-like, consistent styling
- Edit modals: Basic, inconsistent, missing features
- Various modal sizes and layouts across the app

**Problem:**
Inconsistent modal experiences create cognitive load. Users must relearn patterns for each modal.

**Apple Design Solution:**

**Unified Modal Design System:**

**Modal Sizes (8pt grid compliant):**
```typescript
const MODAL_SIZES = {
  small: { width: 480, height: 'auto' },    // 60 × 8pt - Quick actions
  medium: { width: 640, height: 'auto' },   // 80 × 8pt - Standard forms (DEFAULT)
  large: { width: 880, height: 'auto' },    // 110 × 8pt - Complex forms
  xlarge: { width: 1120, height: 'auto' },  // 140 × 8pt - Multi-column layouts
  fullscreen: { width: '100vw', height: '100vh' } // Immersive experiences (org chart)
};
```

**Layout Anatomy (All modals):**

```
┌─────────────────────────────────────────┐
│  ┌─ Header (72px / 9×8pt) ────────────┐ │
│  │  [Icon] Title                    [×] │ │
│  │  Subtitle / context               │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─ Body (auto height) ──────────────┐ │
│  │  Content with 32px padding        │ │
│  │  (4×8pt) on all sides             │ │
│  │                                    │ │
│  │  Form fields, lists, etc.         │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─ Footer (80px / 10×8pt) ──────────┐ │
│  │  [Secondary] [Tertiary]  [Primary] │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Typography System:**

```typescript
const MODAL_TYPOGRAPHY = {
  title: { size: 20, weight: 600, lineHeight: 1.4 },      // SF Pro Display Semibold
  subtitle: { size: 14, weight: 400, lineHeight: 1.5 },   // SF Pro Text Regular
  label: { size: 13, weight: 500, lineHeight: 1.4 },      // SF Pro Text Medium
  input: { size: 15, weight: 400, lineHeight: 1.5 },      // SF Pro Text Regular
  helper: { size: 12, weight: 400, lineHeight: 1.4 },     // SF Pro Text Regular
  error: { size: 12, weight: 500, lineHeight: 1.4 },      // SF Pro Text Medium
};
```

**Color System (Apple HIG):**

```typescript
const MODAL_COLORS = {
  background: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  border: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(0, 0, 0, 0.08)',

  text: {
    primary: '#1D1D1F',
    secondary: '#86868B',
    tertiary: '#D1D1D6',
  },

  buttons: {
    primary: { bg: '#007AFF', text: '#FFFFFF' },          // Blue (affirmative)
    secondary: { bg: 'transparent', text: '#007AFF' },     // Ghost (neutral)
    destructive: { bg: '#FF3B30', text: '#FFFFFF' },       // Red (dangerous)
  },

  inputs: {
    border: '#D1D1D6',
    borderFocus: '#007AFF',
    background: '#F5F5F7',
    backgroundFocus: '#FFFFFF',
  },
};
```

**Animation Transitions:**

```typescript
const MODAL_ANIMATIONS = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },

  modal: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } // Apple spring curve
  }
};
```

**Form Field Spacing:**

```typescript
const FORM_SPACING = {
  fieldGap: 24,        // 3×8pt - Gap between form fields
  labelGap: 8,         // 1×8pt - Gap between label and input
  sectionGap: 32,      // 4×8pt - Gap between form sections
  helperTextGap: 6,    // ~1×8pt - Gap between input and helper text
};
```

**Calendar/Date Picker Standardization:**

**All date pickers MUST use HolidayAwareDatePicker:**
- Consistent holiday highlighting
- Weekend awareness
- "Next working day" suggestion
- Min/max constraints (phase boundaries for tasks)
- Keyboard navigation (Tab, Arrow keys, Enter)
- Accessibility (ARIA labels, screen reader support)

**Implementation:**

```typescript
// Create base modal component
// File: /src/components/ui/BaseModal.tsx

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen';
  children: React.ReactNode;
  footer?: React.ReactNode;
  preventClose?: boolean; // For unsaved changes warning
}

export function BaseModal({ ... }: BaseModalProps) {
  // Unified modal shell with:
  // - FocusTrap
  // - Framer Motion animations
  // - Keyboard shortcuts (Esc to close)
  // - Overlay click to close (unless preventClose)
  // - Consistent layout/styling
}
```

**Migration Plan:**

1. Create BaseModal component
2. Create ModalHeader, ModalBody, ModalFooter subcomponents
3. Migrate AddPhaseModal to use BaseModal (verify no regressions)
4. Create EditPhaseModal using BaseModal
5. Create EditTaskModal using BaseModal
6. Migrate all other modals one by one
7. Deprecate old modal patterns

---

### Requirement 11: Task Reordering (Drag Up/Down)

**Current State:**
- Tasks display in creation order
- No way to reorder within phase
- Gantt timeline shows tasks sequentially

**Problem:**
Users cannot organize tasks logically. Critical tasks may be buried in the list.

**Apple Design Solution:**

**Drag Handle Pattern:**

```
┌─────────────────────────────────────┐
│  Phase 1 (5 tasks)              [˅] │
├─────────────────────────────────────┤
│  [⋮⋮] Task 1: Requirements          │ ← Drag handle (6 dots, vertical)
│  [⋮⋮] Task 2: Design                │
│  [⋮⋮] Task 3: Development           │
│  [⋮⋮] Task 4: Testing               │
│  [⋮⋮] Task 5: Deployment            │
└─────────────────────────────────────┘
```

**Interaction Design:**

1. **Hover state** - Drag handle appears on hover (progressive disclosure)
2. **Grab state** - Cursor changes to grabbing hand
3. **Drag state:**
   - Task lifts up (elevation shadow)
   - Other tasks shift to show drop zones
   - Visual indicator: blue line shows where task will drop
   - Smooth spring physics (framer-motion)
4. **Drop state:**
   - Task animates to new position
   - Other tasks reflow with stagger animation
   - Toast: "Task reordered" (subtle, 2 seconds)

**Implementation:**

```typescript
// Use @dnd-kit/sortable (already in package.json)
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';

// Store method
reorderTasksInPhase: (phaseId: string, oldIndex: number, newIndex: number) => {
  set((state) => {
    const phase = state.currentProject?.phases.find(p => p.id === phaseId);
    if (!phase) return;

    const [movedTask] = phase.tasks.splice(oldIndex, 1);
    phase.tasks.splice(newIndex, 0, movedTask);

    // Update displayOrder property
    phase.tasks.forEach((task, index) => {
      task.displayOrder = index;
    });
  });

  // Auto-save
  get().saveCurrentProjectToBackend();
},
```

**Task Model Update:**

```typescript
interface Task {
  // ... existing fields
  displayOrder: number; // NEW - explicit ordering (default: creation timestamp)
}
```

**Constraints:**

- Tasks can only be reordered within their phase
- Cannot drag task to different phase (use cut/paste for that)
- Gantt timeline respects displayOrder, not startDate
- If tasks have dependencies, show warning: "Task 3 depends on Task 5. Reordering may affect schedule."

**Keyboard Shortcuts:**

- `Cmd/Ctrl + ↑` - Move task up
- `Cmd/Ctrl + ↓` - Move task down
- `Cmd/Ctrl + Shift + ↑` - Move task to top
- `Cmd/Ctrl + Shift + ↓` - Move task to bottom

**Design Rationale:**

- **Familiar pattern** - Matches iOS Reminders, Notes app
- **Progressive disclosure** - Drag handle hidden until hover
- **Clear affordance** - 6-dot handle universally understood
- **Smooth physics** - Apple spring curve (not linear)
- **Safety** - Dependency warnings prevent logical errors

---

### Requirement 12: Pixar-Level Smooth Animations

**Current State:**
- Phase collapse: instant (no animation)
- Tasks appear/disappear abruptly
- CSS transitions only (limited)

**Problem:**
Jarring UX. No sense of spatial continuity. Feels mechanical, not organic.

**Apple Design Solution:**

**Animation Philosophy:**

> "Animation isn't just about making things move. It's about creating a sense of tactile reality." — Apple Human Interface Guidelines

**Spring Physics (Not Easing Curves):**

```typescript
// Apple's signature spring animation
const SPRING_CONFIG = {
  type: "spring",
  stiffness: 300,      // High stiffness = snappy
  damping: 30,         // Medium damping = slight bounce
  mass: 1,             // Natural weight
};

// For subtle animations (fade, scale)
const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94];

// For dramatic animations (slide in/out)
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]; // Apple's signature curve
```

**Phase Expand/Collapse Animation:**

```typescript
// Use framer-motion AnimatePresence
<AnimatePresence initial={false}>
  {!phase.collapsed && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: "auto",
        opacity: 1,
        transition: {
          height: { duration: 0.4, ease: EASE_OUT_EXPO },
          opacity: { duration: 0.3, delay: 0.1 }
        }
      }}
      exit={{
        height: 0,
        opacity: 0,
        transition: {
          height: { duration: 0.3, ease: [0.4, 0, 1, 1] },
          opacity: { duration: 0.2 }
        }
      }}
    >
      {/* Task list */}
      {phase.tasks.map((task, index) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: {
              delay: index * 0.05, // Stagger: 50ms per task
              duration: 0.3,
              ease: EASE_OUT_QUAD
            }
          }}
          exit={{
            opacity: 0,
            x: -20,
            transition: {
              duration: 0.2,
              ease: [0.4, 0, 1, 1]
            }
          }}
        >
          <TaskRow task={task} />
        </motion.div>
      ))}
    </motion.div>
  )}
</AnimatePresence>
```

**Chevron Rotation:**

```typescript
<motion.div
  animate={{ rotate: phase.collapsed ? 0 : 90 }}
  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
>
  <ChevronRight />
</motion.div>
```

**Performance Optimizations:**

```typescript
// Use layout animations only when necessary
// Prefer opacity/transform (GPU-accelerated)

<motion.div
  layout // Enable layout animations
  transition={{
    layout: { duration: 0.3, ease: EASE_OUT_EXPO }
  }}
>
```

**Micro-interactions:**

1. **Hover states** - 150ms fade-in, smooth color transitions
2. **Button clicks** - Scale down to 0.95 on mouseDown, spring back on mouseUp
3. **Focus states** - Glowing ring fades in (200ms)
4. **Loading states** - Skeleton shimmer (Apple Pay card style)
5. **Success states** - Checkmark scale-in with bounce (spring physics)
6. **Error states** - Shake animation (like macOS login error)

**Stagger Animations:**

```typescript
// When multiple items appear
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms delay between children
      delayChildren: 0.1,    // 100ms before starting
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT_QUAD }
  }
};

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

**Loading Skeleton:**

```typescript
// Apple Pay card shimmer effect
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}
```

**Centralized Animation Config:**

```typescript
// File: /src/lib/design-system/animations.ts

export const ANIMATIONS = {
  // Spring physics
  spring: {
    default: { type: "spring", stiffness: 300, damping: 30 },
    gentle: { type: "spring", stiffness: 200, damping: 25 },
    snappy: { type: "spring", stiffness: 400, damping: 35 },
    bouncy: { type: "spring", stiffness: 300, damping: 20 },
  },

  // Easing curves
  easing: {
    easeOutQuad: [0.25, 0.46, 0.45, 0.94],
    easeOutExpo: [0.16, 1, 0.3, 1], // Apple signature
    easeInOutQuint: [0.83, 0, 0.17, 1],
  },

  // Durations (8pt grid: 100ms = base unit)
  duration: {
    instant: 0.1,   // 100ms
    fast: 0.2,      // 200ms
    normal: 0.3,    // 300ms
    slow: 0.4,      // 400ms
    slower: 0.5,    // 500ms
  },

  // Stagger delays
  stagger: {
    fast: 0.03,     // 30ms
    normal: 0.05,   // 50ms
    slow: 0.1,      // 100ms
  },
};
```

**Design Rationale:**

- **Spring physics** - Feels natural, not mechanical
- **Stagger animations** - Creates rhythm, guides eye
- **GPU acceleration** - Use transform/opacity for 60fps
- **Progressive enhancement** - Animations optional (respect prefers-reduced-motion)
- **Meaningful motion** - Every animation communicates state change

---

### Requirement 13: Collapsed Phase Task Overview

**Current State:**
- Collapsed phase shows nothing
- User has no idea what's inside
- Must expand to see any information

**Problem:**
Lack of context. Users forced to expand every phase to understand contents.

**Apple Design Solution:**

**Collapsed Phase Anatomy:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [▶] Phase 1: Requirements Gathering                        [⋯] │
│      May 1 - May 31, 2025  •  8 tasks  •  5 resources  •  23 days│
│      ┌─────────────────────────────────────────────────────────┐ │
│      │ ▪️ Setup & Kick-off     ▪️ Stakeholder Interviews      │ │
│      │ ▪️ Requirements Doc      ▪️ Solution Architecture      │ │
│      │ +4 more tasks                                          │ │
│      └─────────────────────────────────────────────────────────┘ │
│      Progress: ▓▓▓▓▓░░░░░ 60%  •  On Track                      │
└─────────────────────────────────────────────────────────────────┘
```

**Information Hierarchy:**

**Line 1: Phase Header**
- Chevron (collapsed state)
- Phase name
- Phase actions menu (⋯)

**Line 2: Phase Metadata** (gray, 13px)
- Date range
- Task count
- Resource count
- Working days

**Line 3: Task Preview** (light gray box, 8px padding)
- First 4 task names (bullet points)
- "+N more tasks" if > 4 tasks
- Truncate long names (max 30 chars)

**Line 4: Progress Bar**
- Visual progress bar (based on completed tasks or date progress)
- Percentage
- Status indicator (On Track / At Risk / Delayed)

**Visual Design:**

```typescript
const COLLAPSED_PHASE_STYLES = {
  container: {
    padding: '16px',
    marginBottom: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
  },

  metadata: {
    fontSize: '13px',
    color: '#86868B',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },

  taskPreview: {
    backgroundColor: '#F5F5F7',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '8px',
    fontSize: '13px',
    color: '#1D1D1F',
  },

  progressBar: {
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#E5E5EA',
    marginTop: '12px',
    position: 'relative',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF', // Blue for on track
    borderRadius: '3px',
    transition: 'width 0.5s ease-out',
  },
};
```

**Status Color Coding:**

```typescript
const STATUS_COLORS = {
  onTrack: '#34C759',    // Green
  atRisk: '#FF9500',     // Orange
  delayed: '#FF3B30',    // Red
  notStarted: '#8E8E93', // Gray
};

// Calculate status
function getPhaseStatus(phase: Phase): 'onTrack' | 'atRisk' | 'delayed' | 'notStarted' {
  const today = new Date();
  const start = new Date(phase.startDate);
  const end = new Date(phase.endDate);

  if (today < start) return 'notStarted';

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  const timeProgress = (elapsed / totalDuration) * 100;

  const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;
  const taskProgress = (completedTasks / phase.tasks.length) * 100;

  if (taskProgress >= timeProgress - 10) return 'onTrack';
  if (taskProgress >= timeProgress - 25) return 'atRisk';
  return 'delayed';
}
```

**Hover Behavior:**

- Entire collapsed phase lifts slightly (box-shadow elevation)
- Background lightens to #FAFAFA
- Cursor: pointer
- Transition: 150ms ease-out

**Click Behavior:**

- Click anywhere on collapsed phase → expand
- Click chevron → expand
- Click actions menu → show phase options (don't expand)

**Implementation:**

```typescript
<motion.div
  className="collapsed-phase"
  whileHover={{
    scale: 1.01,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  }}
  transition={{ duration: 0.15, ease: 'easeOut' }}
  onClick={() => togglePhaseCollapse(phase.id)}
>
  {/* Header */}
  <div className="phase-header">
    <ChevronRight /> {/* Animated rotation on expand */}
    <h3>{phase.name}</h3>
    <button onClick={(e) => { e.stopPropagation(); openPhaseMenu(); }}>⋯</button>
  </div>

  {/* Metadata */}
  <div className="phase-metadata">
    <span>{formatDateRange(phase.startDate, phase.endDate)}</span>
    <span>•</span>
    <span>{phase.tasks.length} tasks</span>
    <span>•</span>
    <span>{getUniqueResourceCount(phase)} resources</span>
    <span>•</span>
    <span>{calculateWorkingDays(phase.startDate, phase.endDate)} days</span>
  </div>

  {/* Task preview */}
  <div className="task-preview">
    {phase.tasks.slice(0, 4).map(task => (
      <div key={task.id}>▪️ {truncate(task.name, 30)}</div>
    ))}
    {phase.tasks.length > 4 && (
      <div>+{phase.tasks.length - 4} more tasks</div>
    )}
  </div>

  {/* Progress */}
  <div className="progress-section">
    <div className="progress-bar">
      <motion.div
        className="progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${calculateProgress(phase)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ backgroundColor: STATUS_COLORS[getPhaseStatus(phase)] }}
      />
    </div>
    <span>{calculateProgress(phase)}% • {getPhaseStatus(phase)}</span>
  </div>
</motion.div>
```

**Design Rationale:**

- **Information scent** - Users can decide whether to expand
- **Spatial efficiency** - Show more phases on screen
- **Progressive disclosure** - Key info visible, details on expand
- **Visual hierarchy** - Clear levels of importance
- **Actionable** - Click anywhere to expand (large touch target)

---

### Requirement 14: RACI Matrix Integration

**Current State:**
- No RACI functionality exists
- Org chart shows hierarchy only
- Tasks have resource assignments but no role definition

**Problem:**
Users cannot define responsibilities (Responsible, Accountable, Consulted, Informed) for tasks/deliverables.

**Apple Design Solution:**

This is the most complex requirement. Let me design this carefully.

**RACI Matrix Concept:**

```
┌────────────────────────────────────────────────────────────────┐
│  RACI Matrix: Phase 1 - Requirements Gathering            [✕]  │
├────────────────────────────────────────────────────────────────┤
│  Deliverable / Task       │ John │ Mary │ Bob │ Alice │ Tom    │
│                           │ PM   │ BA   │ Dev │ QA    │ Client │
├───────────────────────────┼──────┼──────┼─────┼───────┼────────┤
│  Requirements Document    │  A   │  R   │  C  │   I   │   C    │
│  Solution Architecture    │  A   │  C   │  R  │   C   │   I    │
│  Stakeholder Interviews   │  R   │  R   │  I  │   -   │   C    │
│  Kick-off Meeting         │  A   │  C   │  I  │   I   │   C    │
└────────────────────────────────────────────────────────────────┘

Legend:
  R - Responsible (does the work)
  A - Accountable (final authority)
  C - Consulted (provides input)
  I - Informed (kept in the loop)
  - - Not involved
```

**Entry Point:**

1. **From Org Chart Builder:**
   - After building org chart, button appears: "Define RACI Matrix"
   - Opens full-screen RACI editor

2. **From Phase/Task:**
   - Right-click task → "Manage RACI"
   - Opens focused RACI view for that task

**RACI Editor Design:**

**Full-Screen Modal (1200px wide):**

```typescript
// Left sidebar: Deliverables/Tasks (300px)
// Right area: RACI grid (900px)

┌─────────────────────────────────────────────────────────────────────┐
│  ┌─ Deliverables ─────┐  ┌─ RACI Assignments ─────────────────────┐ │
│  │                     │  │                                         │ │
│  │ [+] Add Deliverable │  │  Select a deliverable to assign roles  │ │
│  │                     │  │                                         │ │
│  │ Phase 1             │  │  Or click "+ Add Deliverable" to start │ │
│  │  ☐ Req. Document    │  │                                         │ │
│  │  ☐ Architecture     │  │                                         │ │
│  │  ☐ User Stories     │  │                                         │ │
│  │                     │  │                                         │ │
│  │ Phase 2             │  │                                         │ │
│  │  ☐ Database Schema  │  │                                         │ │
│  │  ☐ API Endpoints    │  │                                         │ │
│  │                     │  │                                         │ │
│  └─────────────────────┘  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**When deliverable selected:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RACI: Requirements Document                                    [Save]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Resources from Org Chart:                                              │
│                                                                         │
│  ┌─ John Smith (Project Manager) ─────────────────────────────────┐   │
│  │  Role: [•] Accountable  [ ] Responsible  [ ] Consulted  [ ] Informed│
│  │  Notes: Final approval on requirements                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Mary Johnson (Business Analyst) ───────────────────────────────┐   │
│  │  Role: [ ] Accountable  [•] Responsible  [ ] Consulted  [ ] Informed│
│  │  Notes: Writes and maintains the document                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Bob Lee (Senior Developer) ─────────────────────────────────────┐  │
│  │  Role: [ ] Accountable  [ ] Responsible  [•] Consulted  [ ] Informed│
│  │  Notes: Technical feasibility review                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [+ Add Resource]                                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data Model:**

```typescript
interface RACIMatrix {
  id: string;
  projectId: string;
  deliverables: RACIDeliverable[];
  createdAt: string;
  updatedAt: string;
}

interface RACIDeliverable {
  id: string;
  name: string;
  description?: string;
  phaseId?: string;  // Link to phase
  taskId?: string;   // Link to task
  assignments: RACIAssignment[];
}

interface RACIAssignment {
  id: string;
  resourceId: string; // References resource from org chart
  role: 'responsible' | 'accountable' | 'consulted' | 'informed';
  notes?: string;
}

// Validation rules:
// 1. Each deliverable must have exactly ONE Accountable
// 2. Each deliverable should have at least ONE Responsible
// 3. One person can have multiple roles (e.g., Responsible AND Consulted)
// 4. System warns if no Accountable or no Responsible
```

**Store Integration:**

```typescript
// Add to gantt-tool-store-v2.ts

interface GanttProject {
  // ... existing fields
  raciMatrix?: RACIMatrix;
}

// Methods:
createRACIDeliverable(name: string, phaseId?: string, taskId?: string): string;
updateRACIDeliverable(deliverableId: string, updates: Partial<RACIDeliverable>): void;
deleteRACIDeliverable(deliverableId: string): void;

assignRACIRole(deliverableId: string, resourceId: string, role: RACIRole, notes?: string): void;
updateRACIAssignment(deliverableId: string, assignmentId: string, role: RACIRole, notes?: string): void;
removeRACIAssignment(deliverableId: string, assignmentId: string): void;

validateRACIMatrix(): { valid: boolean; errors: string[] };
```

**Smart Suggestions:**

```typescript
// When user creates a deliverable, suggest RACI roles based on org chart hierarchy:

function suggestRACIRoles(deliverable: RACIDeliverable, resources: Resource[]): RACIAssignment[] {
  const suggestions: RACIAssignment[] = [];

  // Find project manager → suggest Accountable
  const pm = resources.find(r => r.category === 'pm' && r.designation === 'manager');
  if (pm) {
    suggestions.push({
      id: generateId(),
      resourceId: pm.id,
      role: 'accountable',
      notes: 'Suggested: Project Manager is typically Accountable'
    });
  }

  // Find resources assigned to related task → suggest Responsible
  if (deliverable.taskId) {
    const task = getTaskById(deliverable.taskId);
    const assignedResources = task.resourceAssignments.map(a => a.resourceId);
    assignedResources.forEach(rid => {
      suggestions.push({
        id: generateId(),
        resourceId: rid,
        role: 'responsible',
        notes: 'Suggested: Already assigned to related task'
      });
    });
  }

  return suggestions;
}
```

**RACI Visualization Options:**

**1. Grid View (default):**
- Spreadsheet-like table
- Rows = deliverables
- Columns = resources
- Cells = R/A/C/I dropdown

**2. Swimlane View:**
- Vertical lanes for each resource
- Deliverables as cards
- Color-coded by role (R=blue, A=green, C=yellow, I=gray)

**3. Export Options:**
- Export to Excel (formatted RACI matrix)
- Export to PDF (professional document)
- Export to PowerPoint (presentation slide)

**Integration Points:**

```typescript
// Link RACI to existing ecosystem:

// 1. From Phase
interface Phase {
  // ... existing
  raciDeliverables?: string[]; // IDs of RACI deliverables linked to this phase
}

// 2. From Task
interface Task {
  // ... existing
  raciDeliverableId?: string; // Link task to RACI deliverable
}

// 3. From Resource
// When resource assigned to task, suggest adding to RACI:
// "Bob Lee is assigned to this task. Would you like to add him to the RACI matrix?"

// 4. Org Chart Integration
// RACI matrix uses org chart hierarchy to show reporting structure
// When viewing RACI, can click resource → see their org chart position
```

**Validation & Warnings:**

```typescript
// Real-time validation in RACI editor:

function validateRACIDeliverable(deliverable: RACIDeliverable): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical: Must have exactly one Accountable
  const accountables = deliverable.assignments.filter(a => a.role === 'accountable');
  if (accountables.length === 0) {
    errors.push('Missing Accountable. Each deliverable must have someone accountable.');
  } else if (accountables.length > 1) {
    errors.push('Multiple Accountables. Each deliverable should have exactly one person accountable.');
  }

  // Warning: Should have at least one Responsible
  const responsibles = deliverable.assignments.filter(a => a.role === 'responsible');
  if (responsibles.length === 0) {
    warnings.push('No Responsible assigned. Who will do the work?');
  }

  // Info: Too many Consulted
  const consulted = deliverable.assignments.filter(a => a.role === 'consulted');
  if (consulted.length > 5) {
    warnings.push('Many people marked as Consulted. This may slow decision-making.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

**Apple Design Touches:**

1. **Empty State:**
   - Beautiful illustration (Lottie animation)
   - "Define Who Does What"
   - Subtitle: "Create a RACI matrix to clarify roles and responsibilities"
   - CTA: "Get Started"

2. **Onboarding:**
   - First-time users see tooltip: "R = Does the work, A = Final decision"
   - Interactive tutorial (optional)
   - Sample RACI matrix pre-filled for reference

3. **Quick Actions:**
   - Right-click deliverable → "Duplicate", "Move to phase", "Export"
   - Keyboard shortcuts: Cmd+D duplicate, Cmd+E edit, Delete to remove

4. **Smart Filters:**
   - Filter by phase
   - Filter by resource
   - Filter by role (show only Accountable items)
   - Search deliverables

5. **Conflict Detection:**
   - Warn if person is Accountable for too many items (>5)
   - Warn if person has no assignments (not utilized)
   - Suggest rebalancing workload

**Design Rationale:**

- **Clarity** - RACI eliminates ambiguity (Apple values clarity)
- **Integration** - Links org chart, tasks, deliverables (ecosystem thinking)
- **Validation** - Prevents common mistakes (quality assurance)
- **Flexibility** - Multiple views, export options (power user features)
- **Simplicity** - Complex concept made simple (deep simplicity)

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Priority: P0 (Must Have)**

1. **Create Unified Modal System**
   - BaseModal component
   - ModalHeader, ModalBody, ModalFooter subcomponents
   - Centralized animation config file
   - Migrate AddPhaseModal (test baseline)

2. **Implement EditPhaseModal & EditTaskModal**
   - Full feature parity with create modals
   - HolidayAwareDatePicker integration
   - Impact preview on save
   - Keyboard shortcuts

3. **Enhance Deletion Flow**
   - Add mitigation options (reassign resources/tasks)
   - Implement confirmation pattern (type name)
   - Add undo capability (5-second window)

**Testing:**
- Unit tests for modal components
- Integration tests for edit flow
- Accessibility tests (keyboard navigation, screen readers)
- Visual regression tests (Chromatic)

### Phase 2: Animations (Week 2)

**Priority: P0 (Must Have)**

1. **Framer Motion Integration**
   - Install and configure framer-motion
   - Create animation config library
   - Implement spring physics constants

2. **Phase Expand/Collapse Animation**
   - AnimatePresence wrapper
   - Height animation with spring physics
   - Task stagger animation (50ms delay)
   - Chevron rotation animation

3. **Micro-interactions**
   - Button hover/click animations
   - Modal enter/exit animations
   - Loading skeletons
   - Success/error animations

**Testing:**
- Visual testing (verify smoothness)
- Performance testing (60fps maintained)
- Reduced motion accessibility

### Phase 3: Task Management (Week 3)

**Priority: P0 (Must Have)**

1. **Task Reordering**
   - Implement @dnd-kit/sortable
   - Drag handle UI
   - Visual drop indicators
   - Update displayOrder in store

2. **Collapsed Phase Overview**
   - Task preview component
   - Progress calculation
   - Status indicators
   - Hover effects

3. **Keyboard Shortcuts**
   - Task reordering (Cmd+Arrow)
   - Quick edit (Enter key)
   - Quick delete (Delete key)

**Testing:**
- Drag-drop testing (manual + Playwright)
- Keyboard navigation testing
- Edge cases (empty phases, single task)

### Phase 4: Org Chart Enhancements (Week 4)

**Priority: P1 (Should Have)**

1. **Peer Connection Lines**
   - calculatePeerConnectionPaths function
   - Toggle control in toolbar
   - Fade-in animation
   - Hover highlighting

2. **Resource Panel Sync**
   - Three-tier resource categorization
   - Real-time count updates
   - Utilization calculation
   - Animated number transitions

**Testing:**
- Org chart visual regression
- Connection line rendering (various tree shapes)
- Resource count accuracy

### Phase 5: RACI Matrix (Week 5-6)

**Priority: P2 (Nice to Have)**

1. **Data Model & Store**
   - RACI types and interfaces
   - Store methods (CRUD operations)
   - Validation logic
   - Smart suggestions

2. **RACI Editor UI**
   - Full-screen modal
   - Deliverable list (left sidebar)
   - Assignment grid (right panel)
   - Save/cancel flow

3. **Integration**
   - Link to phases/tasks
   - Link to org chart resources
   - Export to Excel/PDF
   - Validation warnings

**Testing:**
- RACI validation logic
- Integration with tasks/phases
- Export functionality
- Edge cases (no resources, no deliverables)

---

## Quality Assurance Strategy

### Test Pyramid

```
           /\
          /  \
         / E2E \              ~50 tests
        /______\
       /        \
      / Integration\          ~200 tests
     /_____________\
    /              \
   /  Unit Tests    \         ~500 tests
  /__________________\
```

### Test Scenarios

**Unit Tests (500+ tests):**

1. **Modal Components** (50 tests)
   - BaseModal render
   - Keyboard shortcuts
   - Close handlers
   - Animation transitions
   - Accessibility (ARIA, focus trap)

2. **Animation Config** (30 tests)
   - Spring physics values
   - Easing curves
   - Duration constants
   - Stagger delays

3. **RACI Logic** (100 tests)
   - CRUD operations
   - Validation rules
   - Suggestions algorithm
   - Conflict detection

4. **Spacing Algorithm** (62 tests - already exists)
   - Peer connection paths
   - Node positioning
   - Bounds calculation

5. **Store Methods** (200 tests)
   - reorderTasksInPhase
   - togglePhaseCollapse (with animation)
   - RACI methods
   - Resource sync

6. **Utility Functions** (58 tests)
   - Date calculations
   - Working days
   - Progress calculations
   - Status determination

**Integration Tests (200+ tests):**

1. **Edit Flow** (40 tests)
   - Open edit modal from timeline
   - Edit with validation
   - Save and verify updates
   - Cancel without changes
   - Impact preview accuracy

2. **Delete Flow** (40 tests)
   - Delete with impact analysis
   - Mitigation options
   - Undo functionality
   - Cascading deletes
   - Resource reassignment

3. **Task Reordering** (30 tests)
   - Drag and drop
   - Keyboard shortcuts
   - Boundary conditions (first/last)
   - Dependency warnings

4. **Phase Collapse** (30 tests)
   - Expand/collapse animation
   - Task preview rendering
   - Progress calculation
   - Status updates

5. **Resource Sync** (30 tests)
   - Org chart → Resource panel
   - Task assignment → Count update
   - Phase assignment → Count update
   - Utilization calculation

6. **RACI Integration** (30 tests)
   - Create from task
   - Link to deliverable
   - Resource assignment
   - Validation enforcement

**E2E Tests (50+ tests):**

1. **Complete Workflows** (20 tests)
   - Create project → Build org chart → Create phases → Assign resources → Create RACI
   - Edit phase → Adjust dates → Reassign tasks → Update RACI
   - Delete phase → Mitigate impact → Undo → Verify restoration

2. **Cross-Browser** (15 tests)
   - Chrome, Firefox, Safari, Edge
   - Mobile Safari, Mobile Chrome

3. **Performance** (10 tests)
   - Large projects (100+ tasks)
   - Complex org charts (50+ nodes)
   - RACI matrices (30+ deliverables)
   - Animation frame rates

4. **Accessibility** (5 tests)
   - Keyboard-only navigation
   - Screen reader compatibility
   - Color contrast
   - Focus management

### Permutation Testing

**Combinatorial Test Coverage:**

**Modal Combinations:**
- 2 modal types (create/edit) × 2 entities (phase/task) × 5 field types × 3 validation states = **60 combinations**

**Animation States:**
- 3 collapse states (collapsed/expanding/expanded) × 4 task counts (0/1/5/20) × 2 devices (mobile/desktop) = **24 combinations**

**Drag-Drop:**
- 5 drag positions (first/middle/last/before/after) × 3 phase states × 2 dependency states = **30 combinations**

**RACI Validation:**
- 4 roles × 8 resource counts × 5 deliverable counts × 3 validation states = **480 combinations**

**Resource Sync:**
- 3 resource sources (org chart/pool/assigned) × 8 categories × 4 actions (add/remove/update/assign) = **96 combinations**

**Total Permutations:** 690+ scenarios

**Coverage Target:** 95% code coverage, 100% critical path coverage

### Regression Testing

**Baseline Establishment:**
1. Capture screenshots of all modals (Chromatic)
2. Record animation timelines (video snapshots)
3. Measure performance metrics (Lighthouse)
4. Document expected behaviors

**Automated Regression:**
- Visual regression (Chromatic): 100 screens
- Performance regression (Lighthouse): 20 pages
- Functional regression (Playwright): 200 tests

**Manual Regression:**
- Critical user flows (20 scenarios)
- Edge cases (30 scenarios)
- Accessibility (10 scenarios)

### Performance Benchmarks

**Targets (Apple-level):**

- **Page load:** <2s (First Contentful Paint)
- **Animation frame rate:** 60fps (16.67ms per frame)
- **Layout calculation:** <10ms (Reingold-Tilford)
- **Modal open:** <300ms (perceived instant)
- **Drag-drop:** <100ms latency
- **RACI matrix render:** <500ms (for 50 deliverables × 20 resources)

**Monitoring:**
- Chrome DevTools Performance tab
- React DevTools Profiler
- Lighthouse CI (on every commit)

---

## Success Metrics

**Quantitative:**

- ✅ **Zero TypeScript errors** (strict mode)
- ✅ **95%+ code coverage** (unit + integration tests)
- ✅ **60fps animations** (all devices)
- ✅ **<2s page load** (initial render)
- ✅ **100% accessibility score** (Lighthouse)
- ✅ **Zero console errors** (production build)

**Qualitative:**

- ✅ **Feels like Apple software** (polish, attention to detail)
- ✅ **Intuitive** (no user manual needed)
- ✅ **Delightful** (users smile when using it)
- ✅ **Consistent** (predictable patterns throughout)
- ✅ **Fast** (feels instant, even when not)

---

## Deployment Strategy

**Pre-Deployment Checklist:**

- [ ] All 690+ test permutations passing
- [ ] Visual regression approved (no unexpected changes)
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Documentation updated
- [ ] Rollback plan prepared

**Phased Rollout:**

1. **Internal Testing** (Week 7)
   - Development team testing
   - QA team verification
   - Stakeholder demo

2. **Beta Release** (Week 8)
   - 10% of users (feature flag)
   - Monitoring dashboards active
   - Collect feedback

3. **General Availability** (Week 9)
   - 100% rollout
   - Support documentation published
   - Training videos released

**Rollback Triggers:**

- >5% increase in error rate
- >10% decrease in performance
- Critical bug discovered
- User feedback overwhelmingly negative

---

## Conclusion

> "We don't ship junk." — Steve Jobs

This implementation plan embodies Apple's design philosophy:

- **Deep Simplicity** - Complex features made intuitive
- **Pixel-Perfect** - Every detail justified and measured
- **Delight** - Users will smile when using this
- **Quality** - 690+ test scenarios, kiasu-level thoroughness
- **Excellence** - Not good enough until it's insanely great

**Next Step:** Begin Phase 1 implementation.

**Timeline:** 9 weeks to production-ready software that would make Steve and Jony proud.

---

**Document Version:** 1.0
**Status:** Ready for Implementation
**Approval:** Pending user review
