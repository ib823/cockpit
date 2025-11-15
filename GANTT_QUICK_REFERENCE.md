# Gantt Tool Quick Reference Guide

## Key Files at a Glance

### Core Data Types
- **`/workspaces/cockpit/src/types/gantt-tool.ts`** (612 lines)
  - GanttProject, GanttPhase, GanttTask
  - GanttViewSettings (includes barDurationDisplay option)
  - TaskResourceAssignment, PhaseResourceAssignment

### Utility Functions
- **`/workspaces/cockpit/src/lib/gantt-tool/working-days.ts`** (187 lines)
  - `calculateWorkingDaysInclusive()` - Main calculation function
  - `isWeekend()`, `isHoliday()`, `isWorkingDay()`
  - `adjustDatesToWorkingDays()` - Auto-shift to working days

- **`/workspaces/cockpit/src/lib/gantt-tool/date-utils.ts`** (113 lines)
  - `formatDuration()` - Converts days to "X weeks", "X months", etc.
  - `formatWorkingDays()` - Returns "Xd" format
  - `formatDurationCompact()` - Short version for bars

- **`/workspaces/cockpit/src/lib/gantt-tool/project-metrics.ts`** (334 lines)
  - `calculateProjectMetrics()` - Comprehensive metrics
  - `calculateDuration()` - Calendar and working day totals
  - `getDurationTooltip()` - Helpful hover text

### Main Components
- **`/workspaces/cockpit/src/components/gantt-tool/GanttCanvasV3.tsx`** (2086 lines)
  - Apple HIG-compliant version
  - Two-pane layout: sidebar table + timeline
  - Primary implementation for new features

- **`/workspaces/cockpit/src/components/gantt-tool/GanttCanvas.tsx`**
  - Original SVG-based version
  - More feature-complete but less clean

### State Management
- **`/workspaces/cockpit/src/stores/gantt-tool-store-v2.ts`** (2000+ lines)
  - Zustand store with Immer middleware
  - `getProjectDuration()` - Returns start/end/duration
  - `getWorkingDays()` - Calculate WD between any two dates
  - Auto-save on mutations

---

## Common Calculations

### Calculate Working Days Between Two Dates
```typescript
import { calculateWorkingDaysInclusive } from '@/lib/gantt-tool/working-days';

const workingDays = calculateWorkingDaysInclusive(
  task.startDate,        // string: "2026-01-10"
  task.endDate,          // string: "2026-02-15"
  project.holidays || [] // GanttHoliday[]
);
// Result: number (e.g., 24 working days)
```

### Format Duration for Display
```typescript
import { formatWorkingDays, formatDuration } from '@/lib/gantt-tool/date-utils';

// Working days format
const wdDisplay = formatWorkingDays(24);        // "24d"

// Calendar days format
const calendarDays = differenceInDays(end, start) + 1;
const cdDisplay = formatDuration(calendarDays); // "3 weeks" or "1 month"
```

### Get Project Timeline Range
```typescript
const { currentProject } = useGanttToolStoreV2();
const duration = useGanttToolStoreV2().getProjectDuration();
// Result: { startDate: Date, endDate: Date, durationDays: number }
```

---

## Sidebar Column Layout (GanttCanvasV3)

```
┌──────────────────────────────────────────────────┐
│ 620px total sidebar width                        │
├────────────────┬──────────────┬──────────────────┤
│ Task (360px)   │ Duration (100px) │ Resources (140px) │
├────────────────┼──────────────┼──────────────────┤
│ "Phase Name"   │ "32d"        │ [👤👤]          │
│ └─ "Task 1"    │ "24d"        │ [👤]            │
│ └─ "Task 2"    │ "18d"        │                  │
└────────────────┴──────────────┴──────────────────┘

Constants in GanttCanvasV3.tsx (lines 44-53):
- TASK_NAME_WIDTH = 360
- DURATION_WIDTH = 100
- RESOURCES_WIDTH = 140
- TASK_ROW_HEIGHT = 40
- PHASE_ROW_HEIGHT = 40
```

---

## Timeline Zoom Modes

| Mode | Header Format | Used For |
|------|---------------|----------|
| day | "01 Jan" | Very tight timelines |
| week | "W01 02-Jan-26" | 2-4 month projects |
| month | "Jan 26" | 6-24 month projects (default) |
| quarter | "Q1 26" | 2+ year projects |
| year | "2026" | Multi-year programs |

---

## Holiday Calculation

### Get Holidays in Range
```typescript
import { getHolidaysInRange } from '@/data/holidays';

const holidays = getHolidaysInRange(startDate, endDate, "ABMY");
// Returns: GanttHoliday[] with matching holidays for region
```

### Check if Date is Holiday
```typescript
import { isHoliday } from '@/lib/gantt-tool/working-days';

const isHolidayDate = isHoliday(new Date("2026-01-01"), holidays);
// Result: boolean
```

---

## Date Format Standards

| Usage | Format | Example |
|-------|--------|---------|
| Storage | ISO 8601 | "2026-01-10" |
| Sidebar hover | dd-MMM-yy | "10-Jan-26" |
| Edit modal input | Native HTML | Browser-specific |
| Timeline header | Zoom-dependent | "Jan" or "W01" |
| Export | MMM d, yyyy | "Jan 10, 2026" |

---

## Duration Display Options (barDurationDisplay)

From `GanttViewSettings`:
- **"wd"** - Working days only (e.g., "45d")
- **"cd"** - Calendar days only (e.g., "64d")
- **"resource"** - Resource allocation
- **"dates"** - Start/end dates
- **"all"** - All information (default)
- **"clean"** - No text on bars

Currently V3 uses working days ("wd") by default in sidebar.

---

## Performance Tips

### For Large Projects (1000+ tasks)
1. Collapse phases by default
2. Use month/quarter zoom level
3. Consider pagination for sidebar
4. Memoize duration calculations:
```typescript
const workingDays = useMemo(
  () => calculateWorkingDaysInclusive(start, end, holidays),
  [start, end, holidays]
);
```

### Avoid Common Mistakes
- Don't call `calculateWorkingDaysInclusive()` in render without memoization
- Don't loop through all tasks to calculate totals (use store getter)
- Don't fetch holidays on every component mount

---

## Common Tasks

### Add a Calendar Days Column to Sidebar
1. Add constant: `const CALENDAR_DAYS_WIDTH = 100;`
2. Update header to include new column
3. Calculate for each phase/task: `differenceInDays(end, start) + 1`
4. Display format: Same as working days ("64d")

### Display Start/End Dates
**Option A (Recommended)**: Add title attribute to task name
```typescript
<span title={`${format(start, "yyyy-MM-dd")} - ${format(end, "yyyy-MM-dd")}`}>
  {taskName}
</span>
```

**Option B**: Add two new columns after task name
- Requires updating column widths
- Total sidebar width increases by ~200px

### Add Gridlines to Timeline
```typescript
// In timeline bars section
{timeMarkers.map((date, idx) => (
  <div style={{
    position: 'absolute',
    left: `${getPositionPercent(date)}%`,
    width: '1px',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)'
  }} />
))}
```

---

## Debugging Tips

### Console Logging
```typescript
// Log project duration
console.log("Project duration:", getProjectDuration());

// Log working days calculation
const wd = calculateWorkingDaysInclusive(start, end, holidays);
console.log("Working days:", wd);

// Log holidays in range
const h = getHolidaysInRange(start, end, "ABMY");
console.log("Holidays:", h);
```

### Check Date Format Issues
- All stored dates should be "yyyy-MM-dd"
- Use `parseISO()` to convert strings to Date objects
- Use `format()` from date-fns for display
- Never use `new Date(string)` - behavior varies by browser

### Verify Duration Calculations
1. Count days manually (use online day counter)
2. Subtract weekends (should be about 40% of calendar days)
3. Subtract holidays
4. Should equal working days count

---

## Type Safety Checklist

When adding new duration/date features:
- [ ] All date strings are ISO 8601 format "yyyy-MM-dd"
- [ ] All duration numbers are integers (no decimals)
- [ ] Calculations use `differenceInDays()` not custom math
- [ ] Holiday array is never null/undefined (use `[] as default)
- [ ] Format functions return strings, not numbers
- [ ] Task/phase IDs are unique (check with nanoid)

---

## Related Documentation

- Full Analysis: `/workspaces/cockpit/GANTT_IMPLEMENTATION_ANALYSIS.md`
- Architecture: `/workspaces/cockpit/GANTT_ARCHITECTURE_VISUAL.md`
- Recommendations: `/workspaces/cockpit/GANTT_IMPLEMENTATION_RECOMMENDATIONS.md`

