# Gantt Tool Implementation Analysis

## Overview
The gantt tool is a comprehensive timeline visualization system with task/phase management, resource allocation, and budget tracking. There are two main canvas implementations:
- **GanttCanvas.tsx** - Original SVG-based interactive version
- **GanttCanvasV3.tsx** - Apple HIG specification version with left sidebar table + right timeline

---

## 1. DURATION CALCULATIONS AND DISPLAY

### Current Duration Types

#### Working Days (WD)
- **Calculation**: `calculateWorkingDaysInclusive()` in `/workspaces/cockpit/src/lib/gantt-tool/working-days.ts`
- **Formula**: Counts only Monday-Friday, excludes weekends and holidays
- **Display Format**: `formatWorkingDays()` returns "Xd" (e.g., "120d")
- **Used In**: 
  - Sidebar table "Duration" column (GanttCanvasV3 line 765)
  - Phase duration display (line 640)
  - Tooltips showing "Duration: 120 working days"

#### Calendar Days (CD)
- **Calculation**: `differenceInDays()` from date-fns
- **Formula**: Simple day count between start and end dates (inclusive +1)
- **Display Format**: `formatDuration()` intelligently switches between:
  - < 14 days: "X days"
  - 14-84 days: "X weeks"
  - > 84 days: "X months"
- **Used In**: Project metrics dashboard

### Key Functions

```typescript
// src/lib/gantt-tool/working-days.ts
calculateWorkingDaysInclusive(startDate, endDate, holidays) → number
// Loop through each day, counting only working days

// src/lib/gantt-tool/date-utils.ts
formatDuration(totalDays) → string
formatDurationCompact(totalDays) → string
formatWorkingDays(days) → string

// src/lib/gantt-tool/project-metrics.ts
calculateDuration(startDate, endDate, project) → {
  calendarDays: number,
  workingDays: number,
  durationDisplay: string
}
```

### Current Display Options

From `GanttViewSettings.barDurationDisplay`:
- **"wd"** - Working days only
- **"cd"** - Calendar days only
- **"resource"** - Resource allocation
- **"dates"** - Start and end dates
- **"all"** - All information (default)
- **"clean"** - No text on bars

---

## 2. TASK/PHASE DATA STRUCTURES

### Interfaces (from `/workspaces/cockpit/src/types/gantt-tool.ts`)

#### GanttProject
```typescript
{
  id: string
  name: string
  description?: string
  startDate: string // ISO 8601 format
  phases: GanttPhase[]
  milestones: GanttMilestone[]
  holidays: GanttHoliday[]
  resources: Resource[]
  viewSettings: GanttViewSettings
  createdAt: string
  updatedAt: string
  budget?: ProjectBudget
}
```

#### GanttPhase
```typescript
{
  id: string
  name: string
  description?: string
  color: string // Hex color
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  tasks: GanttTask[]
  collapsed: boolean
  dependencies: string[] // Phase IDs
  phaseResourceAssignments?: PhaseResourceAssignment[]
  order: number
}
```

#### GanttTask
```typescript
{
  id: string
  phaseId: string
  name: string
  description?: string
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  dependencies: string[] // Task IDs
  assignee?: string
  progress: number // 0-100
  resourceAssignments?: TaskResourceAssignment[]
  order: number
  
  // Hierarchy
  parentTaskId?: string | null
  level: number // 0 = top-level
  collapsed: boolean
  isParent: boolean
  childTasks?: GanttTask[]
}
```

#### Resource Assignment
```typescript
TaskResourceAssignment {
  id: string
  resourceId: string
  assignmentNotes: string
  allocationPercentage: number // 0-100
  assignedAt: string
}

PhaseResourceAssignment {
  id: string
  resourceId: string
  assignmentNotes: string
  allocationPercentage: number // 0-100
  assignedAt: string
}
```

---

## 3. TIMELINE/GRID COLUMN DEFINITIONS

### GanttCanvasV3 Sidebar Table Layout

Constants defined at lines 44-53:
```typescript
const DEFAULT_SIDEBAR_WIDTH = 620  // Total sidebar width
const TASK_NAME_WIDTH = 360        // Task/Phase name column
const DURATION_WIDTH = 100         // Duration column (WD)
const RESOURCES_WIDTH = 140        // Resources column
const TASK_ROW_HEIGHT = 40         // Row height per Apple HIG
const PHASE_ROW_HEIGHT = 40        // Phase row height
```

### Sidebar Header Structure (Line 511-534)

```
┌─────────────────────────────────────────────────┐
│ Task (360px) │ Duration (100px) │ Resources (140px) │
├──────────────┼──────────────────┼──────────────────┤
│ [Task Name]  │ [WD in days]     │ [Resource Icons] │
└─────────────────────────────────────────────────┘
```

### Timeline Header Structure (Lines 877-959)

**Two-tier header:**
1. **Primary row** (44px height):
   - Time markers with primary labels (e.g., "Jan", "Q1", "W1")
   - Secondary labels shown conditionally (e.g., "26" for year, "dd-MMM-yy" for week)
   - Alternating background colors for visual separation

2. **Secondary row** (20px height):
   - Holiday indicators
   - Colored dots for holidays (filled) and weekends (outline)

### Time Marker Formatting by Zoom Mode (Lines 309-338)

```typescript
Day:     primary: "dd", secondary: "MMM"
Week:    primary: "W{week}", secondary: "dd-MMM-yy"
Month:   primary: "MMM", secondary: "yy"
Quarter: primary: "Q{q}", secondary: "yy"
Year:    primary: "yyyy"
```

### Zoom Modes (Line 72)
```typescript
type ZoomMode = 'day' | 'week' | 'month' | 'quarter' | 'year'
```

Each zoom level uses different `date-fns` interval functions:
- `eachDayOfInterval()` for day view
- `eachWeekOfInterval()` for week view (weeks start Monday)
- `eachMonthOfInterval()` for month view
- `eachQuarterOfInterval()` for quarter view
- `eachYearOfInterval()` for year view

---

## 4. DATE HANDLING AND WORKING DAY CALCULATIONS

### Working Days Calculation Logic

Source: `/workspaces/cockpit/src/lib/gantt-tool/working-days.ts`

#### Key Functions

**isWeekend(date: Date) → boolean**
- Returns true for Saturday (6) or Sunday (0)

**isHoliday(date: Date, holidays: GanttHoliday[]) → boolean**
- Compares ISO date string format "yyyy-MM-dd"
- Returns true if date matches any holiday in list

**isWorkingDay(date: Date, holidays: GanttHoliday[]) → boolean**
- Returns `!isWeekend(date) && !isHoliday(date, holidays)`

**calculateWorkingDays(startDate, endDate, holidays) → number**
- **Exclusive**: Does NOT include end date
- Loop: `while (current < end)` incrementing day by day
- Count only working days

**calculateWorkingDaysInclusive(startDate, endDate, holidays) → number**
- **Inclusive**: INCLUDES both start and end dates
- Loop: `while (current <= end)`
- Used in GanttCanvasV3 for displaying task durations

**adjustDatesToWorkingDays(startDate, endDate, holidays)**
- Shifts start date to next working day if on weekend/holiday
- Shifts end date to previous working day if on weekend/holiday
- If adjusted end < adjusted start, both become the adjusted start date

### Holiday Data Source

`src/data/holidays.ts` provides:
```typescript
getHolidaysInRange(startDate, endDate, regionCode) → GanttHoliday[]
```

Used in GanttCanvasV3 (line 345):
```typescript
const holidays = getHolidaysInRange(startDate, endDate, "ABMY");
```

### Store Integration

From `/workspaces/cockpit/src/stores/gantt-tool-store-v2.ts`:

**getProjectDuration()** (lines 2025-2039):
```typescript
// Returns min/max dates from all phases
{
  startDate: Date,    // Earliest phase start
  endDate: Date,      // Latest phase end
  durationDays: number // differenceInDays(endDate, startDate)
}
```

**getWorkingDays(startDate, endDate)** (lines 2041-2046):
```typescript
// Returns working days inclusive between two dates
calculateWorkingDaysInclusive(startDate, endDate, currentProject.holidays)
```

### Date Format Standards

All dates in the system use:
- **Storage**: ISO 8601 format "YYYY-MM-DD" (string)
- **Display**: Multiple formats depending on context
  - Compact: "dd-MMM-yy" (e.g., "02-Feb-26")
  - Full: "MMM d, yyyy" (e.g., "Feb 2, 2026")
  - Long: "MMM d, yyyy (EEE)" (e.g., "Feb 2, 2026 (Mon)")

---

## 5. METRICS AND CALCULATIONS REFERENCE

### Project Duration Calculation

From `/workspaces/cockpit/src/lib/gantt-tool/project-metrics.ts`:

```typescript
// Phase 1: Date Range
startDate = MIN(all phase.startDate)
endDate = MAX(all phase.endDate)

// Phase 2: Duration
calendarDays = differenceInDays(endDate, startDate) + 1  // Inclusive
workingDays = calculateWorkingDaysInclusive(startDate, endDate, holidays)

// Phase 3: Display
months = calendarDays / 30
if months >= 1:
  durationDisplay = "${roundedMonths} month(s)"
else:
  durationDisplay = "${calendarDays} days"
```

### Task/Phase Duration Display

In sidebar (GanttCanvasV3):
```typescript
// For each phase
const phaseWorkingDays = calculateWorkingDaysInclusive(
  phase.startDate,
  phase.endDate,
  currentProject.holidays || []
);
// Display: "{phaseWorkingDays}d"

// For each task
const workingDays = calculateWorkingDaysInclusive(
  task.startDate,
  task.endDate,
  currentProject.holidays || []
);
// Display: "{workingDays}d"
```

---

## IMPLEMENTATION LOCATIONS SUMMARY

| Feature | Location | Key Code |
|---------|----------|----------|
| Duration Calculation | `src/lib/gantt-tool/working-days.ts` | `calculateWorkingDaysInclusive()` |
| Duration Display | `src/lib/gantt-tool/date-utils.ts` | `formatDuration()`, `formatWorkingDays()` |
| Date Adjustment | `src/lib/gantt-tool/working-days.ts` | `adjustDatesToWorkingDays()` |
| Sidebar Table Columns | `src/components/gantt-tool/GanttCanvasV3.tsx` lines 48-53 | Constants & header rendering |
| Timeline Headers | `src/components/gantt-tool/GanttCanvasV3.tsx` lines 309-338 | `formatTimeMarker()` |
| Zoom Levels | `src/components/gantt-tool/GanttCanvasV3.tsx` lines 282-306 | `timeMarkers` calculation |
| Holiday Display | `src/components/gantt-tool/GanttCanvasV3.tsx` lines 341-360 | Holiday positioning |
| Data Types | `src/types/gantt-tool.ts` | `GanttPhase`, `GanttTask`, `GanttViewSettings` |
| Store/Getters | `src/stores/gantt-tool-store-v2.ts` lines 2025-2046 | `getProjectDuration()`, `getWorkingDays()` |
| Metrics | `src/lib/gantt-tool/project-metrics.ts` | `calculateProjectMetrics()`, `calculateDuration()` |

