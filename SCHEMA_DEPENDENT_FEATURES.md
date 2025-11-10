# Schema-Dependent Features - Requirements & Implementation Guide

**Date:** November 9, 2025
**Status:** 📋 **SPECIFICATION DOCUMENT**
**Issues:** #12, #24, #25, #26, #27

---

## 🎯 OVERVIEW

This document specifies the requirements and implementation strategy for features that require database schema changes. These features cannot be implemented without modifying the Prisma schema and running database migrations.

**Deferred Issues:**

1. **Issue #12:** Dependency Arrows (Visual task dependencies)
2. **Issues #24-27:** Task Hierarchy System (Parent-child relationships)

---

## 📊 ISSUE #12: DEPENDENCY ARROWS

### Description

**Goal:** Visualize task dependencies with SVG arrows connecting related tasks.

**User Story:** As a project manager, I want to see visual connections between dependent tasks so I can understand the critical path and task relationships at a glance.

### Current State

**Database Schema (`prisma/schema.prisma`):**

```prisma
model GanttTask {
  id           String   @id @default(cuid())
  phaseId      String
  name         String
  startDate    DateTime @db.Date
  endDate      DateTime @db.Date
  progress     Int      @default(0)
  dependencies String[] // Array of GanttTask IDs

  // Relationships
  phase GanttPhase @relation(...)

  @@index([phaseId])
}
```

✅ **Schema is already ready!** The `dependencies` field exists.

### Implementation Requirements

#### 1. Algorithm Development

**Arrow Path Generation:**

- Calculate SVG path between source and target tasks
- Support different arrow styles (straight, curved, orthogonal)
- Handle vertical and horizontal offsets
- Account for zoom level and viewport position

**Example Algorithm:**

```typescript
function generateArrowPath(
  sourceTask: { x: number; y: number; width: number; height: number },
  targetTask: { x: number; y: number; width: number; height: number },
  style: "straight" | "curved" | "orthogonal" = "curved"
): string {
  // Start from right edge of source task
  const startX = sourceTask.x + sourceTask.width;
  const startY = sourceTask.y + sourceTask.height / 2;

  // End at left edge of target task
  const endX = targetTask.x;
  const endY = targetTask.y + targetTask.height / 2;

  if (style === "curved") {
    // Bezier curve for smooth connection
    const controlX = (startX + endX) / 2;
    return `M ${startX},${startY} C ${controlX},${startY} ${controlX},${endY} ${endX},${endY}`;
  }

  // ... other styles
}
```

#### 2. Collision Detection

**Challenge:** Arrows should avoid overlapping with tasks and other arrows.

**Strategy:**

- Calculate bounding boxes for all tasks
- Check if arrow path intersects any task
- Adjust path with offset if collision detected
- Use A\* or similar pathfinding for complex cases

#### 3. Interactive Editing

**Features:**

- Click source task → Select
- Click target task → Create dependency
- Click arrow → Delete dependency
- Hover arrow → Show dependency details (lag time, type)

**UI Components:**

```tsx
// Dependency creation mode
const [dependencyMode, setDependencyMode] = useState<{
  active: boolean;
  sourceTaskId: string | null;
}>({ active: false, sourceTaskId: null });

// Arrow rendering
function DependencyArrow({ sourceTask, targetTask, type }: DependencyArrowProps) {
  const path = generateArrowPath(sourceTask, targetTask);

  return (
    <g className="dependency-arrow group">
      {/* Main path */}
      <path
        d={path}
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        className="hover:stroke-blue-700 cursor-pointer"
      />

      {/* Arrowhead marker */}
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
        </marker>
      </defs>

      {/* Hover tooltip */}
      <title>
        {sourceTask.name} → {targetTask.name}
        {type === "FS" && " (Finish-to-Start)"}
      </title>
    </g>
  );
}
```

#### 4. Dependency Types

**Standard Project Management Types:**

- **FS (Finish-to-Start):** Default - Task B starts after Task A finishes
- **SS (Start-to-Start):** Task B starts when Task A starts
- **FF (Finish-to-Finish):** Task B finishes when Task A finishes
- **SF (Start-to-Finish):** Task B finishes when Task A starts (rare)

**Schema Extension Required:**

```prisma
model GanttTaskDependency {
  id           String   @id @default(cuid())
  sourceTaskId String
  targetTaskId String
  type         String   @default("FS") // FS, SS, FF, SF
  lag          Int      @default(0)    // Days (+/- offset)

  sourceTask GanttTask @relation("DependencySource", fields: [sourceTaskId], references: [id], onDelete: Cascade)
  targetTask GanttTask @relation("DependencyTarget", fields: [targetTaskId], references: [id], onDelete: Cascade)

  @@unique([sourceTaskId, targetTaskId])
  @@index([sourceTaskId])
  @@index([targetTaskId])
}
```

### Estimated Effort

- **Schema Migration:** 1 hour
- **Arrow Rendering Algorithm:** 4-6 hours
- **Collision Detection:** 2-3 hours
- **Interactive Editing:** 2-3 hours
- **Testing & Refinement:** 2-3 hours

**Total: 11-16 hours**

### Testing Checklist

- [ ] Arrows render correctly between tasks
- [ ] Arrows update when tasks are moved/resized
- [ ] No arrows overlap with tasks (collision detection)
- [ ] Dependency creation is intuitive
- [ ] Dependency deletion works
- [ ] All dependency types (FS, SS, FF, SF) render correctly
- [ ] Lag time is calculated and displayed
- [ ] Circular dependencies are detected and prevented
- [ ] Critical path is highlighted
- [ ] Performance remains good with 50+ dependencies

---

## 📊 ISSUES #24-27: TASK HIERARCHY SYSTEM

### Description

**Goal:** Support parent-child task relationships with visual indentation and tree controls.

**User Story:** As a project manager, I want to organize tasks hierarchically (work breakdown structure) so I can manage complex projects with subtasks and see the project structure clearly.

### Current State

**Database Schema (`prisma/schema.prisma`):**

```prisma
model GanttTask {
  id          String   @id @default(cuid())
  phaseId     String
  name        String
  description String?  @db.Text
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  progress    Int      @default(0)
  assignee    String?
  order       Int      @default(0)

  // NO parent-child support yet

  phase GanttPhase @relation(...)

  @@index([phaseId])
  @@index([order])
}
```

❌ **Schema changes required!**

### Required Schema Changes

```prisma
model GanttTask {
  id          String   @id @default(cuid())
  phaseId     String
  name        String
  description String?  @db.Text
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  progress    Int      @default(0)
  assignee    String?
  order       Int      @default(0)

  // NEW: Parent-child support
  parentTaskId String?              // ID of parent task (null for top-level)
  level        Int      @default(0) // Nesting level (0 = top-level)
  collapsed    Boolean  @default(false) // UI state for parent tasks
  isParent     Boolean  @default(false) // Has children?

  // NEW: Relationships
  parentTask   GanttTask?  @relation("TaskHierarchy", fields: [parentTaskId], references: [id], onDelete: Cascade)
  childTasks   GanttTask[] @relation("TaskHierarchy")

  // Existing relationships
  phase               GanttPhase                    @relation(...)
  resourceAssignments GanttTaskResourceAssignment[] @relation(...)

  @@index([phaseId])
  @@index([order])
  @@index([parentTaskId]) // NEW
  @@index([level])        // NEW
}
```

**Migration Script:**

```sql
-- Add new columns
ALTER TABLE "GanttTask"
ADD COLUMN "parentTaskId" TEXT,
ADD COLUMN "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "collapsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isParent" BOOLEAN NOT NULL DEFAULT false;

-- Add foreign key constraint
ALTER TABLE "GanttTask"
ADD CONSTRAINT "GanttTask_parentTaskId_fkey"
FOREIGN KEY ("parentTaskId")
REFERENCES "GanttTask"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "GanttTask_parentTaskId_idx" ON "GanttTask"("parentTaskId");
CREATE INDEX "GanttTask_level_idx" ON "GanttTask"("level");
```

### Implementation Requirements

#### Issue #24: Indentation System (24px per level)

**Visual Design:**

```
Phase 1
  ├─ Task 1.1 (level 0, indent: 0px)
  │  ├─ Subtask 1.1.1 (level 1, indent: 24px)
  │  └─ Subtask 1.1.2 (level 1, indent: 24px)
  │     └─ Sub-subtask 1.1.2.1 (level 2, indent: 48px)
  └─ Task 1.2 (level 0, indent: 0px)
```

**CSS Implementation:**

```tsx
interface TaskRowProps {
  task: GanttTask;
  level: number;
}

function TaskRow({ task, level }: TaskRowProps) {
  const indentPx = level * 24; // 24px per level

  return (
    <div className="task-row flex items-center" style={{ paddingLeft: `${indentPx}px` }}>
      {/* Tree line connector */}
      {level > 0 && (
        <div className="tree-line w-4 h-full border-l-2 border-b-2 border-gray-300 rounded-bl" />
      )}

      {/* Collapse/expand button (if parent) */}
      {task.isParent && (
        <button onClick={() => toggleCollapse(task.id)}>
          {task.collapsed ? <ChevronRight /> : <ChevronDown />}
        </button>
      )}

      {/* Task content */}
      <div className="flex-1">{task.name}</div>
    </div>
  );
}
```

#### Issue #25: Parent-Child Visual Connections (Tree Lines)

**ASCII Example:**

```
├─ Parent Task 1
│  ├─ Child Task 1.1
│  └─ Child Task 1.2
└─ Parent Task 2
   ├─ Child Task 2.1
   │  └─ Grandchild Task 2.1.1
   └─ Child Task 2.2
```

**SVG Tree Lines:**

```tsx
function TreeLines({ tasks, level }: TreeLinesProps) {
  return (
    <svg className="absolute left-0 top-0 w-full h-full pointer-events-none">
      {tasks.map((task, index) => {
        const isLast = index === tasks.length - 1;
        const y = task.yPosition;
        const x = level * 24;

        return (
          <g key={task.id}>
            {/* Vertical line from parent */}
            <line x1={x} y1={0} x2={x} y2={y} stroke="#D1D5DB" strokeWidth="2" />

            {/* Horizontal line to task */}
            <line x1={x} y1={y} x2={x + 16} y2={y} stroke="#D1D5DB" strokeWidth="2" />

            {/* Vertical line to next sibling (if not last) */}
            {!isLast && (
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={tasks[index + 1].yPosition}
                stroke="#D1D5DB"
                strokeWidth="2"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

#### Issue #26: Parent/Child Styling Differentiation

**Parent Tasks:**

- Bold font weight (font-bold)
- Larger text size (text-base vs text-sm)
- Different background color (bg-blue-50)
- Collapse/expand icon

**Child Tasks:**

- Normal font weight (font-normal)
- Smaller text size (text-sm)
- Standard background (bg-white)
- No collapse icon

**Implementation:**

```tsx
function TaskRow({ task }: TaskRowProps) {
  return (
    <div
      className={`
        task-row p-2 rounded
        ${task.isParent ? "font-bold text-base bg-blue-50" : "font-normal text-sm bg-white"}
        ${task.level > 0 ? "ml-6" : ""}
      `}
    >
      {task.name}
    </div>
  );
}
```

#### Issue #27: Expand/Collapse Controls

**Functionality:**

- Click chevron to collapse/expand parent task
- Collapsed parent hides all children and descendants
- Keyboard shortcut: Left arrow (collapse), Right arrow (expand)
- Double-click parent task to toggle

**State Management:**

```tsx
// Store collapsed state in database
const toggleTaskCollapse = async (taskId: string) => {
  const task = await prisma.ganttTask.findUnique({
    where: { id: taskId },
  });

  if (!task || !task.isParent) return;

  await prisma.ganttTask.update({
    where: { id: taskId },
    data: { collapsed: !task.collapsed },
  });
};

// UI component
function CollapseButton({ task }: { task: GanttTask }) {
  if (!task.isParent) return null;

  return (
    <button
      onClick={() => toggleTaskCollapse(task.id)}
      className="p-1 hover:bg-gray-200 rounded"
      title={task.collapsed ? "Expand" : "Collapse"}
    >
      {task.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );
}
```

### Calculated Fields

**Parent Task Dates:**
When a parent task has children, its dates should be automatically calculated:

- `startDate` = earliest child start date
- `endDate` = latest child end date

**Parent Task Progress:**
Aggregate progress from children:

- `progress` = average of all children progress (weighted by duration)

**Implementation:**

```typescript
async function updateParentTask(taskId: string) {
  const children = await prisma.ganttTask.findMany({
    where: { parentTaskId: taskId },
  });

  if (children.length === 0) return;

  // Calculate dates
  const startDates = children.map((c) => new Date(c.startDate));
  const endDates = children.map((c) => new Date(c.endDate));

  const earliestStart = new Date(Math.min(...startDates.map((d) => d.getTime())));
  const latestEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

  // Calculate weighted progress
  const totalDuration = children.reduce((sum, c) => {
    const duration = differenceInDays(new Date(c.endDate), new Date(c.startDate));
    return sum + duration;
  }, 0);

  const weightedProgress = children.reduce((sum, c) => {
    const duration = differenceInDays(new Date(c.endDate), new Date(c.startDate));
    const weight = duration / totalDuration;
    return sum + c.progress * weight;
  }, 0);

  // Update parent
  await prisma.ganttTask.update({
    where: { id: taskId },
    data: {
      startDate: earliestStart,
      endDate: latestEnd,
      progress: Math.round(weightedProgress),
      isParent: true,
    },
  });
}
```

### Estimated Effort

- **Schema Migration:** 2 hours (including testing)
- **Backend Updates:** 3-4 hours (CRUD operations, calculated fields)
- **Indentation System (#24):** 2-3 hours
- **Tree Lines (#25):** 3-4 hours (SVG rendering)
- **Styling (#26):** 1-2 hours
- **Collapse/Expand (#27):** 2-3 hours
- **Testing & Refinement:** 3-4 hours

**Total: 16-22 hours**

### Testing Checklist

- [ ] Schema migration runs successfully
- [ ] Parent-child relationships persist correctly
- [ ] Task indentation displays correctly (24px per level)
- [ ] Tree lines render properly
- [ ] Parent tasks have distinct styling
- [ ] Collapse/expand works smoothly
- [ ] Collapsed parents hide all descendants
- [ ] Parent dates auto-calculate from children
- [ ] Parent progress aggregates from children
- [ ] Drag-and-drop respects hierarchy
- [ ] Reordering tasks updates order field
- [ ] Deleting parent deletes all children (cascade)
- [ ] Maximum nesting depth enforced (5 levels recommended)
- [ ] Performance remains good with 100+ tasks
- [ ] Keyboard navigation works with hierarchy

---

## 🚀 IMPLEMENTATION SEQUENCE

### Recommended Order

1. **Dependency Arrows (#12)** - Easier, no schema changes needed
   - Implement arrow rendering
   - Add collision detection
   - Create dependency editing UI
   - Test thoroughly

2. **Task Hierarchy (#24-27)** - More complex, requires schema changes
   - Plan migration carefully
   - Run schema migration in development
   - Implement backend API updates
   - Build frontend hierarchy UI
   - Add expand/collapse functionality
   - Test extensively before production

### Prerequisites

**Before Starting:**

- ✅ Backup production database
- ✅ Test migrations in development environment
- ✅ Write comprehensive tests for new features
- ✅ Update API documentation
- ✅ Plan rollback strategy

### Data Migration Considerations

**For Task Hierarchy:**

- All existing tasks will be top-level (level = 0, parentTaskId = null)
- No data loss - purely additive schema changes
- Consider adding migration to auto-detect potential parent-child relationships based on naming conventions (e.g., "Task 1.1" → child of "Task 1")

---

## 📝 API ENDPOINTS (New/Modified)

### Dependency Arrows

```typescript
// Create dependency
POST /api/gantt-tool/tasks/{taskId}/dependencies
Body: { targetTaskId: string, type: 'FS' | 'SS' | 'FF' | 'SF', lag: number }

// Delete dependency
DELETE /api/gantt-tool/tasks/{taskId}/dependencies/{dependencyId}

// Get task dependencies
GET /api/gantt-tool/tasks/{taskId}/dependencies
Response: { incoming: Dependency[], outgoing: Dependency[] }
```

### Task Hierarchy

```typescript
// Create child task
POST /api/gantt-tool/tasks
Body: { ..., parentTaskId?: string, level: number }

// Move task to different parent
PATCH /api/gantt-tool/tasks/{taskId}/move
Body: { newParentId: string | null, newOrder: number }

// Toggle collapse
PATCH /api/gantt-tool/tasks/{taskId}/collapse
Body: { collapsed: boolean }

// Get task tree
GET /api/gantt-tool/projects/{projectId}/task-tree
Response: Task[] (with nested children)
```

---

## 🙏 CONCLUSION

Both dependency arrows and task hierarchy are valuable features that will significantly enhance the Gantt tool's project management capabilities. While they require careful planning and implementation, the database schema is well-structured to support these additions.

**Recommendations:**

1. Start with **Dependency Arrows (#12)** - Lower risk, immediate value
2. Thoroughly test in development before production
3. Consider feature flags for gradual rollout
4. Gather user feedback before investing in Task Hierarchy
5. Plan for iterative improvements based on usage patterns

**Status:** **READY FOR IMPLEMENTATION** when resources are available

---

**Last Updated:** November 9, 2025
**Document Type:** Technical Specification
**Approval Status:** Pending Product Review
