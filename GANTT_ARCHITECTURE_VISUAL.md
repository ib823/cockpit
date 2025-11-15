# Gantt Tool Architecture Overview

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GANTT TOOL DATA FLOW                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ GanttCanvasV3.tsx (Main Component)                               │
│  ├─ Uses useGanttToolStoreV2 (Zustand Store)                    │
│  ├─ currentProject: GanttProject (full data)                    │
│  ├─ getProjectDuration(): Returns duration metrics              │
│  └─ getWorkingDays(start, end): Calculate WD between dates      │
└──────────────────────────────────────────────────────────────────┘
           │
           ├──────────────────────────────────┬──────────────────────┐
           │                                  │                      │
           v                                  v                      v
    ┌─────────────┐                  ┌─────────────┐        ┌──────────────┐
    │  Sidebar    │                  │  Timeline   │        │  Date Utils  │
    │  Table      │                  │  Headers    │        │              │
    └─────────────┘                  └─────────────┘        └──────────────┘
           │                                  │                      │
           │ Display format:                 │                      │
           │ Phase/Task name,                │ Zoom modes:         │
           │ Working days (d),               │ Day/Week/Month/     │
           │ Resource icons                  │ Quarter/Year        │
           │                                 │                      │
           │                                 v                      │
           │                      ┌──────────────────┐              │
           │                      │ formatTimeMarker │              │
           │                      │ (Line 309-338)   │              │
           │                      └──────────────────┘              │
           │                                                         │
           └────────────┬────────────────────────────────────────────┘
                        │
                        v
            ┌────────────────────────────────┐
            │  Working Days Calculation      │
            │  (working-days.ts)             │
            │                                │
            │ calculateWorkingDaysInclusive │
            │  ├─ Check each day            │
            │  ├─ Exclude weekends (Sat/Sun)│
            │  ├─ Exclude holidays          │
            │  └─ Return count              │
            └────────────────────────────────┘
                        │
                        v
            ┌────────────────────────────────┐
            │  Display Formatting            │
            │  (date-utils.ts)               │
            │                                │
            │ formatDuration(totalDays)     │
            │  ├─ <14d: "X days"            │
            │  ├─ 14-84d: "X weeks"         │
            │  └─ >84d: "X months"          │
            │                                │
            │ formatWorkingDays(wd)         │
            │  └─ Returns "Xd" format       │
            └────────────────────────────────┘
```

## Component Hierarchy

```
GanttCanvasV3 (Main)
│
├── Toolbar (Add milestone, zoom controls)
│   └── Milestone Modal
│
├── Main Layout (Flex container)
│   │
│   ├── Left Sidebar (Resizable)
│   │   │
│   │   ├── Sidebar Header
│   │   │   ├─ Task (360px)
│   │   │   ├─ Duration (100px)  ← Working Days display
│   │   │   └─ Resources (140px)
│   │   │
│   │   └── Content (For each phase/task)
│   │       ├── Phase Row
│   │       │   ├─ Phase name + collapse toggle
│   │       │   ├─ Working days count
│   │       │   └─ Edit button
│   │       │
│   │       └── Task Row (if phase expanded)
│   │           ├─ Task name + edit button
│   │           ├─ Working days (e.g., "45d")
│   │           └─ Resource icons + manager button
│   │
│   ├── Resizable Divider (4px)
│   │
│   └── Right Timeline (Scrollable)
│       │
│       ├── Timeline Header (sticky)
│       │   ├── Time Markers Row (44px)
│       │   │   └── Formatted by zoom mode
│       │   │       ├─ Day: "01 Jan"
│       │   │       ├─ Week: "W01 02-Jan-26"
│       │   │       ├─ Month: "Jan 26"
│       │   │       ├─ Quarter: "Q1 26"
│       │   │       └─ Year: "2026"
│       │   │
│       │   └── Holiday Indicators Row (20px)
│       │       └── Colored dots for holidays/weekends
│       │
│       └── Timeline Bars
│           ├── Phase Bars (opacity 0.2, height 24px)
│           │   └── Hover tooltip with dates + WD count
│           │
│           └── Task Bars (opacity varies, height 32px)
│               ├── Color-coded by task index
│               ├── Border if selected
│               ├── Shadow on hover/drag
│               └── Hover tooltip with dates + WD count
│
├── Inline Bar Editor Popover (for date editing)
├── Phase Edit Modal
├── Task Edit Modal
├── Milestone Modal
└── Task Resource Modal
```

## Data Structure Hierarchy

```
GanttProject (Root)
│
├── id: string
├── name: string
├── startDate: string (ISO 8601, not used directly in V3)
├── viewSettings: GanttViewSettings
│   └── barDurationDisplay: "wd" | "cd" | "resource" | "dates" | "all" | "clean"
├── holidays: GanttHoliday[]
│   └── [{ id, name, date (yyyy-MM-dd), region, type }]
│
├── phases: GanttPhase[]
│   └── Phase[0]
│       ├── id, name, color
│       ├── startDate: string (yyyy-MM-dd)
│       ├── endDate: string (yyyy-MM-dd)
│       ├── collapsed: boolean
│       ├── tasks: GanttTask[]
│       │   └── Task[0]
│       │       ├── id, name, phaseId
│       │       ├── startDate, endDate
│       │       ├── resourceAssignments: TaskResourceAssignment[]
│       │       │   └── [{ resourceId, allocationPercentage }]
│       │       └── level, parentTaskId (for hierarchy)
│       │
│       └── phaseResourceAssignments: PhaseResourceAssignment[]
│           └── [{ resourceId, allocationPercentage }]
│
├── milestones: GanttMilestone[]
│   └── [{ id, name, date, icon, color }]
│
└── resources: Resource[]
    └── [{ id, name, category, designation, chargeRatePerHour }]
```

## Duration Calculation Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│ Start: Task or Phase with startDate & endDate (strings)      │
└──────────────────────────────────────────────────────────────┘
                          │
                          v
┌──────────────────────────────────────────────────────────────┐
│ Step 1: Convert to Date Objects                             │
│ parseISO(startDate) → Date                                  │
│ parseISO(endDate) → Date                                    │
└──────────────────────────────────────────────────────────────┘
                          │
                          v
┌──────────────────────────────────────────────────────────────┐
│ Step 2: Get Holiday List for Range                          │
│ getHolidaysInRange(startDate, endDate, regionCode)          │
│ Returns: GanttHoliday[] with matching holidays              │
└──────────────────────────────────────────────────────────────┘
                          │
                          v
┌──────────────────────────────────────────────────────────────┐
│ Step 3: Calculate Working Days                              │
│ calculateWorkingDaysInclusive(start, end, holidays)         │
│                                                              │
│ Loop through each day:                                      │
│   if (!isWeekend(day) && !isHoliday(day))                   │
│     count++                                                  │
│                                                              │
│ Returns: number (e.g., 45 working days)                     │
└──────────────────────────────────────────────────────────────┘
                          │
                          v
┌──────────────────────────────────────────────────────────────┐
│ Step 4: Format for Display                                  │
│ formatWorkingDays(45) → "45d"                               │
│                                                              │
│ Or for calendar view:                                       │
│ calendarDays = differenceInDays(end, start) + 1             │
│ formatDuration(64) → "2 weeks" or "2.1 months"              │
└──────────────────────────────────────────────────────────────┘
                          │
                          v
┌──────────────────────────────────────────────────────────────┐
│ Result: Display in Sidebar Duration Column                  │
│ "45d" for task duration in table                            │
└──────────────────────────────────────────────────────────────┘
```

## Timeline Header Calculation

```
Project Timeline: Jan 2026 - Dec 2027 (730 calendar days)

Zoom Mode: "month" (default)
│
├─ eachMonthOfInterval(start, end)
│  Returns: [2026-01-01, 2026-02-01, 2026-03-01, ... 2027-12-01]
│
├─ For each marker date:
│  ├─ Calculate left position: (dayOffset / totalDays) * 100%
│  ├─ Calculate width until next marker
│  └─ Format labels:
│     ├─ primary: format(date, "MMM") → "Jan"
│     └─ secondary: format(date, "yy") → "26"
│
└─ Render in timeline header:
   │
   ├─ Cell 1: left: 0%, width: 8.2%, label: "Jan / 26"
   ├─ Cell 2: left: 8.2%, width: 7.8%, label: "Feb / 26"
   ├─ Cell 3: left: 16%, width: 8.2%, label: "Mar / 26"
   └─ ... (12 months per year × 2 years = 24 cells)
```

## Timeline Position Calculation

```
Task: Jan 10, 2026 - Feb 15, 2026
Project Timeline: Jan 1, 2026 - Dec 31, 2027

Step 1: Get start position
  dayOffset = differenceInDays(taskStart, projectStart)
            = differenceInDays(Jan 10, 2026, Jan 1, 2026)
            = 9 days
  left% = (9 / 730) * 100
        = 1.23%

Step 2: Get bar width
  taskDuration = differenceInDays(taskEnd, taskStart)
               = differenceInDays(Feb 15, 2026, Jan 10, 2026)
               = 36 days
  width% = (36 / 730) * 100
         = 4.93%

Step 3: Render task bar
  position: absolute
  left: 1.23%
  width: 4.93%
  height: 32px
  backgroundColor: rgb(0, 122, 255)  ← Task color

Result: Task bar visually spans 4.93% of timeline starting at 1.23%
```

## State Management (Zustand Store)

```
useGanttToolStoreV2
│
├── Data State
│   ├── currentProject: GanttProject | null
│   ├── projects: GanttProject[]
│   └── lastSavedProject: GanttProject | null
│
├── UI State
│   ├── selection: { selectedItemId, selectedItemType }
│   ├── sidePanel: { isOpen, mode, itemType, itemId }
│   ├── isLoading: boolean
│   └── error: string | null
│
├── Sync State
│   ├── isSyncing: boolean
│   ├── syncStatus: "idle" | "saving" | "synced" | "error"
│   └── lastSyncAt: Date | null
│
└── Methods (Actions)
    ├── Getters
    │   ├── getProjectDuration()
    │   │   └─ Returns: { startDate, endDate, durationDays }
    │   │      Uses: Math.min/max of all phase dates
    │   │
    │   └── getWorkingDays(start, end)
    │       └─ Returns: calculateWorkingDaysInclusive()
    │
    ├── Mutations (with auto-save)
    │   ├── addPhase, updatePhase, deletePhase
    │   ├── addTask, updateTask, deleteTask
    │   └── addMilestone, updateMilestone, deleteMilestone
    │
    └── UI Actions
        ├── selectItem(id, type)
        ├── openSidePanel(mode, itemType, id)
        └── togglePhaseCollapse(phaseId)
```

