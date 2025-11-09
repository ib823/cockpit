# Task Hierarchy UI Implementation Guide

**Status:** Ready for Implementation
**Estimated Time:** 1-2 hours
**Complexity:** Medium

---

## ✅ COMPLETED

### 1. Database Schema
- ✅ Added `parentTaskId`, `level`, `collapsed`, `isParent` fields to GanttTask model
- ✅ Applied migration with `npx prisma db push`
- ✅ Prisma Client regenerated

### 2. TypeScript Types
- ✅ Updated `src/types/gantt-tool.ts` with hierarchy fields
- ✅ Added optional `childTasks` array

### 3. Store Functions
- ✅ `toggleTaskCollapse(taskId, phaseId)` - Toggle parent task expansion
- ✅ `makeTaskChild(taskId, parentTaskId, phaseId)` - Make task a child of another
- ✅ `promoteTask(taskId, phaseId)` - Remove parent relationship
- ✅ `getTaskWithChildren(taskId, phaseId)` - Get task with full child tree
- ✅ Updated `addTask` to set hierarchy fields

### 4. Utility Functions
- ✅ Created `src/lib/gantt-tool/task-hierarchy.ts` with helpers:
  - `getVisibleTasksInOrder()` - Flatten hierarchy respecting collapsed state
  - `hasChildren()` - Check if task has children
  - `getDescendants()` - Get all descendants recursively
  - `isLastSibling()` - For tree line rendering
  - `getAncestors()` - Get parent chain

---

## 🚧 REMAINING IMPLEMENTATION

### Phase 1: GanttCanvas Rendering (45 minutes)

#### Step 1: Import Utilities

**File:** `src/components/gantt-tool/GanttCanvas.tsx`

**Add imports at top:**
```tsx
import { getVisibleTasksInOrder, isLastSibling } from '@/lib/gantt-tool/task-hierarchy';
```

#### Step 2: Replace Task Mapping

**Find (around line 1472):**
```tsx
{phase.tasks.map((task, taskIdx) => {
  // ... task rendering ...
})}
```

**Replace with:**
```tsx
{getVisibleTasksInOrder(phase.tasks).map((task) => {
  const taskIdx = task.renderIndex; // Use renderIndex instead of array index
  const isLast = isLastSibling(task, phase.tasks);

  // ... task rendering (keep existing code) ...
})}
```

#### Step 3: Add Indentation to Task Row

**Find the task row div (around line 1504):**
```tsx
<div key={task.id} className="flex items-start group/task relative">
```

**Modify to add indentation:**
```tsx
<div
  key={task.id}
  className="flex items-start group/task relative"
  style={{ paddingLeft: `${task.level * 24}px` }} // 24px per level
>
```

#### Step 4: Add Collapse/Expand Button

**After the task control column, before the task bar area:**
```tsx
{/* Task Control Column */}
<div className="w-14 flex flex-col items-center gap-2 pt-1 flex-shrink-0">
  {/* Existing auto-align button... */}
</div>

{/* NEW: Hierarchy collapse/expand button */}
{task.isParent && (
  <div className="w-8 flex items-center justify-center flex-shrink-0 pt-6">
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleTaskCollapse(task.id, phase.id);
      }}
      className="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
      title={task.collapsed ? "Expand subtasks" : "Collapse subtasks"}
    >
      {task.collapsed ? (
        <ChevronRight className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  </div>
)}

{/* Spacer for non-parent tasks to maintain alignment */}
{!task.isParent && task.level > 0 && (
  <div className="w-8 flex-shrink-0" />
)}

{/* Task timeline area... */}
```

#### Step 5: Update Task Bar Styling for Parent vs Child

**Find the task bar rendering section and add conditional styling:**
```tsx
<div
  className={`
    absolute rounded transition-all duration-200
    ${isTaskSelected ? 'ring-4 ring-blue-400 z-30' : 'ring-2 ring-white/30 z-20'}
    ${isTaskDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab hover:shadow-lg hover:z-40'}

    // NEW: Parent task styling
    ${task.isParent && !task.collapsed
      ? 'border-2 border-white/40 shadow-md'
      : ''}
  `}
  style={{
    left: `${taskLeft}%`,
    width: `${taskWidth}%`,
    top: 0,
    height: task.isParent ? '40px' : '32px', // Taller for parent tasks
    background: /* existing gradient */,
  }}
>
```

#### Step 6: Add Tree Lines (SVG)

**Before the task rendering section, add tree line SVG:**
```tsx
{/* Tree Lines - SVG connections showing hierarchy */}
{getVisibleTasksInOrder(phase.tasks)
  .filter((task) => task.level > 0)
  .map((task, idx) => {
    const isLast = isLastSibling(task, phase.tasks);
    const yPosition = 100 + (task.renderIndex * 70); // Approximate Y position

    return (
      <svg
        key={`tree-${task.id}`}
        className="absolute pointer-events-none"
        style={{
          left: `${(task.level - 1) * 24 + 8}px`,
          top: `${yPosition}px`,
          width: '24px',
          height: '70px',
          zIndex: 1,
        }}
      >
        {/* Vertical line from parent */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={isLast ? "35" : "70"}
          stroke="#D1D5DB"
          strokeWidth="1.5"
        />

        {/* Horizontal line to task */}
        <line
          x1="0"
          y1="35"
          x2="16"
          y2="35"
          stroke="#D1D5DB"
          strokeWidth="1.5"
        />
      </svg>
    );
  })}

{/* Existing task rendering... */}
```

---

### Phase 2: Side Panel Integration (30 minutes)

#### File: `src/components/gantt-tool/GanttSidePanel.tsx`

**Add Parent Task Selector to Task Form:**

```tsx
{/* Parent Task Selector (for creating subtasks) */}
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Parent Task (Optional)
  </label>
  <select
    value={formData.parentTaskId || ''}
    onChange={(e) =>
      setFormData({ ...formData, parentTaskId: e.target.value || null })
    }
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  >
    <option value="">None (Top-level task)</option>
    {phase.tasks
      .filter((t) => t.id !== taskId) // Don't allow selecting self
      .map((t) => (
        <option key={t.id} value={t.id}>
          {'  '.repeat(t.level)}
          {t.name}
        </option>
      ))}
  </select>
  <p className="text-xs text-gray-500">
    Select a parent task to create a subtask
  </p>
</div>
```

---

### Phase 3: Keyboard Shortcuts Integration (15 minutes)

**File:** `src/components/gantt-tool/useKeyboardNavigation.ts`

**Add hierarchy shortcuts to handleKeyDown:**
```typescript
// Collapse selected parent task
if (key === 'ArrowLeft' && selection.selectedItemType === 'task') {
  event.preventDefault();
  const task = /* find task by ID */;
  if (task?.isParent && !task.collapsed) {
    toggleTaskCollapse(task.id, task.phaseId);
  }
}

// Expand selected parent task
if (key === 'ArrowRight' && selection.selectedItemType === 'task') {
  event.preventDefault();
  const task = /* find task by ID */;
  if (task?.isParent && task.collapsed) {
    toggleTaskCollapse(task.id, task.phaseId);
  }
}
```

---

## 🎨 VISUAL DESIGN SPECIFICATIONS

### Indentation
- **24px per level** (Jobs/Ive principle: Clear, consistent spacing)
- Level 0 (top-level): 0px
- Level 1 (first child): 24px
- Level 2 (grandchild): 48px
- Maximum recommended: 5 levels (120px)

### Tree Lines
- Color: `#D1D5DB` (gray-300)
- Width: `1.5px`
- Style: Solid
- Connections:
  - Vertical line from parent
  - Horizontal line to task (16px)
  - Last sibling: vertical line stops at task level

### Parent Task Styling
- Height: `40px` (vs 32px for child tasks)
- Border: `2px border-white/40`
- Shadow: `shadow-md`
- Font weight: Keep consistent (already bold in name)

### Collapse/Expand Button
- Size: `32px × 32px` (w-8 h-8)
- Icon: ChevronRight (collapsed) / ChevronDown (expanded)
- Hover: `bg-gray-200`
- Position: Between control column and task bar

---

## 🧪 TESTING CHECKLIST

### Manual Testing

- [ ] Create a task → works as top-level task
- [ ] Edit task → select parent → becomes child task
- [ ] Child task indented by 24px
- [ ] Tree lines connect child to parent
- [ ] Click collapse on parent → children disappear
- [ ] Click expand on parent → children reappear
- [ ] Keyboard: Left arrow → collapses parent
- [ ] Keyboard: Right arrow → expands parent
- [ ] Create grandchild (3 levels deep) → 48px indent
- [ ] Edit child → remove parent → becomes top-level
- [ ] Delete parent with children → children also deleted (cascade)
- [ ] Last sibling → tree line stops at task (not below)
- [ ] Parent task is taller (40px vs 32px)
- [ ] Collapsed parent shows count: "3 subtasks"
- [ ] Data persistence → reload → hierarchy maintained

### Edge Cases

- [ ] Task cannot be its own parent
- [ ] Circular hierarchy prevented (A→B→C→A)
- [ ] Maximum depth: 10 levels (graceful degradation)
- [ ] Empty phase (no tasks)
- [ ] Phase with only top-level tasks
- [ ] Phase with only one parent + children
- [ ] Deeply nested structure (5+ levels)
- [ ] Move task between phases → hierarchy reset

---

## 📊 IMPLEMENTATION STATUS

### Store Functions
| Function | Status | Location |
|----------|--------|----------|
| toggleTaskCollapse | ✅ Complete | gantt-tool-store-v2.ts:1373 |
| makeTaskChild | ✅ Complete | gantt-tool-store-v2.ts:1390 |
| promoteTask | ✅ Complete | gantt-tool-store-v2.ts:1418 |
| getTaskWithChildren | ✅ Complete | gantt-tool-store-v2.ts:1448 |

### Utility Functions
| Function | Status | Location |
|----------|--------|----------|
| getVisibleTasksInOrder | ✅ Complete | task-hierarchy.ts:16 |
| hasChildren | ✅ Complete | task-hierarchy.ts:48 |
| getDescendants | ✅ Complete | task-hierarchy.ts:59 |
| isLastSibling | ✅ Complete | task-hierarchy.ts:79 |
| getAncestors | ✅ Complete | task-hierarchy.ts:98 |

### UI Components
| Component | Status | Est. Time |
|-----------|--------|-----------|
| GanttCanvas (indentation) | ⏸️ Pending | 15 min |
| GanttCanvas (tree lines) | ⏸️ Pending | 20 min |
| GanttCanvas (collapse button) | ⏸️ Pending | 10 min |
| GanttSidePanel (parent selector) | ⏸️ Pending | 20 min |
| Keyboard shortcuts | ⏸️ Pending | 15 min |

### Total Remaining: ~80 minutes

---

## 🎯 QUICK START GUIDE

### Minimal Implementation (30 minutes)

**Goal:** Get basic hierarchy working with minimum code changes

1. **Update GanttCanvas task mapping:**
   ```tsx
   import { getVisibleTasksInOrder } from '@/lib/gantt-tool/task-hierarchy';

   // Replace:
   {phase.tasks.map((task, taskIdx) => { ... })}

   // With:
   {getVisibleTasksInOrder(phase.tasks).map((task) => {
     const taskIdx = task.renderIndex;
     ... (keep existing rendering code)
   })}
   ```

2. **Add indentation:**
   ```tsx
   <div style={{ paddingLeft: `${task.level * 24}px` }}>
   ```

3. **Add collapse button:**
   ```tsx
   {task.isParent && (
     <button onClick={() => toggleTaskCollapse(task.id, phase.id)}>
       {task.collapsed ? <ChevronRight /> : <ChevronDown />}
     </button>
   )}
   ```

**That's it!** The hierarchy will work. Tree lines and advanced styling are optional enhancements.

---

## 🔧 TROUBLESHOOTING

### Issue: Tasks not indenting
- **Check:** `task.level` is set correctly in store
- **Fix:** Verify `addTask` sets level based on parent
- **Debug:** `console.log(task.level, task.parentTaskId)`

### Issue: Children not hiding when collapsed
- **Check:** `getVisibleTasksInOrder` respects collapsed state
- **Fix:** Verify parent's `collapsed` flag is set
- **Debug:** `console.log(parent.collapsed, children.length)`

### Issue: Circular hierarchy detected
- **Check:** `makeTaskChild` prevents circular refs
- **Fix:** Add validation before setting parentTaskId
- **Debug:** `console.log(getAncestors(task))`

### Issue: Tree lines misaligned
- **Check:** Y position calculation matches task row height
- **Fix:** Adjust `yPosition` formula to match actual rendering
- **Debug:** Compare SVG coordinates with task positions

---

## 📚 REFERENCE

### Related Files
- Store: `src/stores/gantt-tool-store-v2.ts`
- Types: `src/types/gantt-tool.ts`
- Utils: `src/lib/gantt-tool/task-hierarchy.ts`
- Canvas: `src/components/gantt-tool/GanttCanvas.tsx`
- Panel: `src/components/gantt-tool/GanttSidePanel.tsx`
- Keyboard: `src/components/gantt-tool/useKeyboardNavigation.ts`

### Key Concepts
- **Level:** Nesting depth (0 = top-level, 1+ = child)
- **isParent:** Flag indicating task has children
- **collapsed:** UI state for hiding children
- **parentTaskId:** ID of parent task (null for top-level)
- **renderIndex:** Sequential index for visible tasks

### Design Principles
- **24px indentation** - Clear visual hierarchy
- **Subtle tree lines** - Guide the eye without cluttering
- **Collapse by default** - Large projects start collapsed
- **Keyboard accessible** - Left/Right arrows for collapse/expand
- **Touch-friendly** - 44px minimum touch targets

---

**Last Updated:** November 9, 2025
**Author:** AI Implementation Guide
**Next Step:** Implement Phase 1 (GanttCanvas rendering)
