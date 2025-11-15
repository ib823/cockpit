# Deletion + Undo Integration Plan

**Date**: 2025-11-14
**Status**: 🔄 In Progress
**Target**: Complete Requirement 9 (Full CRUD with Impact Warnings & Undo)

---

## Overview

Integrate comprehensive deletion flow with impact analysis and 5-second undo window into GanttCanvasV3.

### Components Already Built
- ✅ PhaseDeletionImpactModal (455 lines) - Comprehensive impact analysis
- ✅ TaskDeletionImpactModal (408 lines) - Comprehensive impact analysis
- ✅ UndoToast (324 lines) - Apple HIG-compliant undo notification
- ✅ Store undo/redo methods - History-based undo system

### What Needs Integration

1. Import deletion functions into GanttCanvasV3
2. Add state management for modals and undo toast
3. Add Delete buttons to phase/task rows
4. Wire up deletion flow: Button → Impact Modal → Delete → Undo Toast
5. Handle undo action

---

## Implementation Steps

### Step 1: Add Imports to GanttCanvasV3.tsx

**Line 88-101**: Update store imports
```typescript
const {
  currentProject,
  getProjectDuration,
  togglePhaseCollapse,
  selectItem,
  selection,
  updateTaskResourceAssignment,
  unassignResourceFromTask,
  updatePhase,
  updateTask,
  deletePhase,        // ADD
  deleteTask,         // ADD
  undo,               // ADD
  canUndo,            // ADD
  addMilestone,
  updateMilestone,
  deleteMilestone,
} = useGanttToolStore();
```

**Line 40-43**: Add component imports
```typescript
import { EditPhaseModal } from "./EditPhaseModal";
import { EditTaskModal } from "./EditTaskModal";
import { PhaseDeletionImpactModal } from "./PhaseDeletionImpactModal";  // ADD
import { TaskDeletionImpactModal } from "./TaskDeletionImpactModal";    // ADD
import { UndoToast } from "@/components/ui/UndoToast";                   // ADD
```

### Step 2: Add State Management

**After line 107** (after existing state declarations):
```typescript
// Deletion modals state
const [deletingPhase, setDeletingPhase] = useState<{
  phase: GanttPhase;
  phaseId: string;
} | null>(null);

const [deletingTask, setDeletingTask] = useState<{
  task: GanttTask;
  taskId: string;
  phaseId: string;
} | null>(null);

// Undo toast state
const [undoToast, setUndoToast] = useState<{
  isOpen: boolean;
  message: string;
  action: () => void;
} | null>(null);
```

### Step 3: Add Delete Handlers

**Add these handler functions** (after state declarations):
```typescript
// Handle phase deletion flow
const handlePhaseDelete = (phase: GanttPhase) => {
  setDeletingPhase({ phase, phaseId: phase.id });
};

const confirmPhaseDelete = async () => {
  if (!deletingPhase) return;

  const phaseName = deletingPhase.phase.name;
  await deletePhase(deletingPhase.phaseId);

  setDeletingPhase(null);

  // Show undo toast
  setUndoToast({
    isOpen: true,
    message: `Deleted phase "${phaseName}"`,
    action: () => {
      undo();
      setUndoToast(null);
    },
  });
};

// Handle task deletion flow
const handleTaskDelete = (task: GanttTask, phaseId: string) => {
  setDeletingTask({ task, taskId: task.id, phaseId });
};

const confirmTaskDelete = async () => {
  if (!deletingTask) return;

  const taskName = deletingTask.task.name;
  await deleteTask(deletingTask.taskId, deletingTask.phaseId);

  setDeletingTask(null);

  // Show undo toast
  setUndoToast({
    isOpen: true,
    message: `Deleted task "${taskName}"`,
    action: () => {
      undo();
      setUndoToast(null);
    },
  });
};
```

### Step 4: Add Delete Buttons to UI

**Phase Row Delete Button**:
Add to phase row rendering (in the task name column, right-aligned):
```typescript
<button
  onClick={(e) => {
    e.stopPropagation();
    handlePhaseDelete(phase);
  }}
  className="opacity-0 group-hover:opacity-100 transition-opacity"
  style={{
    padding: "6px",
    borderRadius: "6px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#FF3B30",
  }}
  title="Delete phase"
  aria-label={`Delete phase ${phase.name}`}
>
  <Trash2 className="w-4 h-4" />
</button>
```

**Task Row Delete Button**:
Add to task row rendering (in the task name column, right-aligned):
```typescript
<button
  onClick={(e) => {
    e.stopPropagation();
    handleTaskDelete(task, phase.id);
  }}
  className="opacity-0 group-hover:opacity-100 transition-opacity"
  style={{
    padding: "6px",
    borderRadius: "6px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#FF3B30",
  }}
  title="Delete task"
  aria-label={`Delete task ${task.name}`}
>
  <Trash2 className="w-4 h-4" />
</button>
```

### Step 5: Add Modal Components to JSX

**Add at the end of the component** (before closing return statement):
```typescript
{/* Phase Deletion Impact Modal */}
{deletingPhase && (
  <PhaseDeletionImpactModal
    phase={deletingPhase.phase}
    allPhases={currentProject.phases}
    allResources={currentProject.resources || []}
    onConfirm={confirmPhaseDelete}
    onCancel={() => setDeletingPhase(null)}
    region={currentProject.orgChartPro?.location || "ABMY"}
  />
)}

{/* Task Deletion Impact Modal */}
{deletingTask && (() => {
  const phase = currentProject.phases.find(p => p.id === deletingTask.phaseId);
  const allTasks = currentProject.phases.flatMap(p => p.tasks || []);

  return (
    <TaskDeletionImpactModal
      task={deletingTask.task}
      phase={phase!}
      allTasks={allTasks}
      allResources={currentProject.resources || []}
      onConfirm={confirmTaskDelete}
      onCancel={() => setDeletingTask(null)}
      region={currentProject.orgChartPro?.location || "ABMY"}
    />
  );
})()}

{/* Undo Toast */}
{undoToast && (
  <UndoToast
    isOpen={undoToast.isOpen}
    message={undoToast.message}
    onUndo={undoToast.action}
    onClose={() => setUndoToast(null)}
    duration={5000}
    variant="destructive"
  />
)}
```

### Step 6: Add Trash2 Icon Import

**Line 33**: Update Lucide imports
```typescript
import {
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Edit2,
  Calendar,
  Clock,
  GripVertical,
  Flag,
  Trash2  // ADD
} from "lucide-react";
```

---

## User Flow

### Delete Phase Flow
1. User hovers over phase row → Delete button appears (fade in)
2. User clicks Delete → PhaseDeletionImpactModal opens
3. Modal shows comprehensive impact analysis:
   - Tasks that will be deleted
   - Resource assignments affected
   - Budget impact
   - Dependencies broken
   - Severity assessment (low/medium/high/critical)
4. User clicks "Confirm Delete" → Phase deleted
5. UndoToast appears at bottom center for 5 seconds
6. User can click "Undo" within 5 seconds → Restores phase
7. If no action, toast auto-closes after 5 seconds

### Delete Task Flow
1. User hovers over task row → Delete button appears (fade in)
2. User clicks Delete → TaskDeletionImpactModal opens
3. Modal shows comprehensive impact analysis:
   - Resource assignments affected
   - Budget impact
   - Child tasks that will be orphaned
   - Dependencies broken
   - Severity assessment
4. User clicks "Confirm Delete" → Task deleted
5. UndoToast appears at bottom center for 5 seconds
6. User can click "Undo" within 5 seconds → Restores task
7. If no action, toast auto-closes after 5 seconds

---

## Apple Design Principles Applied

### Clarity
- Impact modals show exact consequences before deletion
- Severity levels clearly communicated (color-coded)
- Undo toast shows item name and countdown

### Feedback
- Delete button appears on hover (progressive disclosure)
- Modal provides detailed impact analysis
- Undo toast confirms deletion and offers recovery

### Forgiveness
- 5-second undo window for accidental deletions
- Impact modal prevents unintended consequences
- Undo restores complete state (via history system)

### Safety
- Destructive actions require confirmation
- High-impact deletions clearly marked
- "Type name to confirm" for critical deletions (future enhancement)

---

## Testing Checklist

### Phase Deletion
- [ ] Delete button appears on hover
- [ ] Delete button has proper hover state
- [ ] Impact modal opens on click
- [ ] Impact modal shows correct data
- [ ] Severity level calculated correctly
- [ ] Confirm button deletes phase
- [ ] Cancel button closes modal without deletion
- [ ] Undo toast appears after deletion
- [ ] Undo button restores phase
- [ ] Toast auto-closes after 5 seconds
- [ ] Manual close button works

### Task Deletion
- [ ] Delete button appears on hover
- [ ] Delete button has proper hover state
- [ ] Impact modal opens on click
- [ ] Impact modal shows correct data
- [ ] Severity level calculated correctly
- [ ] Confirm button deletes task
- [ ] Cancel button closes modal without deletion
- [ ] Undo toast appears after deletion
- [ ] Undo button restores task
- [ ] Toast auto-closes after 5 seconds
- [ ] Manual close button works

### Edge Cases
- [ ] Delete phase with 0 tasks
- [ ] Delete phase with 100+ tasks
- [ ] Delete task with no resources
- [ ] Delete task with many resources
- [ ] Rapid delete + undo cycles
- [ ] Delete while another modal is open
- [ ] Undo after server sync
- [ ] Multiple deletions in sequence

---

## File Locations

- **GanttCanvasV3**: `/workspaces/cockpit/src/components/gantt-tool/GanttCanvasV3.tsx`
- **PhaseDeletionImpactModal**: `/workspaces/cockpit/src/components/gantt-tool/PhaseDeletionImpactModal.tsx`
- **TaskDeletionImpactModal**: `/workspaces/cockpit/src/components/gantt-tool/TaskDeletionImpactModal.tsx`
- **UndoToast**: `/workspaces/cockpit/src/components/ui/UndoToast.tsx`
- **Store**: `/workspaces/cockpit/src/stores/gantt-tool-store-v2.ts`

---

## Implementation Status

- [x] PhaseDeletionImpactModal built
- [x] TaskDeletionImpactModal built
- [x] UndoToast built
- [x] Store undo methods exist
- [ ] Import additions
- [ ] State management additions
- [ ] Delete handlers
- [ ] Delete buttons in UI
- [ ] Modal components in JSX
- [ ] Testing

---

## Next Steps

1. Implement all changes in GanttCanvasV3.tsx
2. Test deletion flow end-to-end
3. Test undo mechanism
4. Run kiasu-level edge case testing
5. Move to Requirement 11 (task reordering)
