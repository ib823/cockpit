# Gantt Tool Documentation Index

This directory contains comprehensive documentation about the Gantt Tool implementation in the Cockpit project. Use this index to find the information you need.

## Documentation Files

### 1. GANTT_QUICK_REFERENCE.md (Start Here)
**Best for:** Quick lookups, common tasks, debugging tips
- Key files overview
- Common calculation snippets
- Column layout reference
- Zoom mode guide
- Date format standards
- Performance tips

**Read this first** if you need to:
- Find a specific function
- Understand date formats
- Add a new column to sidebar
- Debug duration calculations

---

### 2. GANTT_IMPLEMENTATION_ANALYSIS.md (Detailed Reference)
**Best for:** Understanding current implementation, architecture decisions
- Duration calculations overview
- Task/Phase data structures
- Timeline column definitions
- Date handling logic
- Working day calculations
- Project metrics reference

**Read this when you need to:**
- Understand how duration is currently calculated
- See all data structure fields
- Learn timeline header layout
- Understand working days logic
- Find where a specific feature is implemented

---

### 3. GANTT_ARCHITECTURE_VISUAL.md (Conceptual Understanding)
**Best for:** Understanding system design, data flow, component hierarchy
- Data flow architecture diagrams
- Component hierarchy tree
- Data structure hierarchy
- Duration calculation pipeline
- Timeline position calculations
- State management flow

**Read this when you need to:**
- Understand how data flows through the system
- See component relationships
- Learn how timeline positioning works
- Understand state management
- See visual representations

---

### 4. GANTT_IMPLEMENTATION_RECOMMENDATIONS.md (Implementation Guide)
**Best for:** Planning new features, optimization suggestions
- Calendar day duration feature plan
- Working days optimization
- Start/end date display options
- Timeline grid enhancements
- Performance optimization tips
- Testing strategy
- Type safety improvements
- Implementation priority matrix

**Read this when you need to:**
- Plan implementation of new features
- Optimize existing code
- Add calendar days display
- Improve date display
- Understand testing approach
- Plan database changes

---

## Quick Navigation by Task

### "I need to add calendar days (CD) display"
1. Start: GANTT_QUICK_REFERENCE.md → "Add a Calendar Days Column"
2. Details: GANTT_IMPLEMENTATION_RECOMMENDATIONS.md → "Calendar Day Duration (CD) Display"
3. Code: Look at GANTT_IMPLEMENTATION_ANALYSIS.md → "Sidebar Header Structure"

### "I want to understand how duration is calculated"
1. Start: GANTT_QUICK_REFERENCE.md → "Common Calculations"
2. Details: GANTT_IMPLEMENTATION_ANALYSIS.md → "Duration Calculations and Display"
3. Code Flow: GANTT_ARCHITECTURE_VISUAL.md → "Duration Calculation Pipeline"

### "I need to display start/end dates"
1. Start: GANTT_QUICK_REFERENCE.md → "Common Tasks" → "Display Start/End Dates"
2. Options: GANTT_IMPLEMENTATION_RECOMMENDATIONS.md → "Start/End Date Display"
3. Reference: GANTT_IMPLEMENTATION_ANALYSIS.md → "Date Handling"

### "How do I optimize performance?"
1. Tips: GANTT_QUICK_REFERENCE.md → "Performance Tips"
2. Details: GANTT_IMPLEMENTATION_RECOMMENDATIONS.md → "Performance Optimization"
3. Understanding: GANTT_ARCHITECTURE_VISUAL.md → "State Management"

### "I'm debugging a date issue"
1. Debugging: GANTT_QUICK_REFERENCE.md → "Debugging Tips"
2. Standards: GANTT_QUICK_REFERENCE.md → "Date Format Standards"
3. Details: GANTT_IMPLEMENTATION_ANALYSIS.md → "Date Handling and Working Day Calculations"

### "I need to understand the code structure"
1. Overview: GANTT_IMPLEMENTATION_ANALYSIS.md → "Implementation Locations Summary"
2. Visuals: GANTT_ARCHITECTURE_VISUAL.md → "Component Hierarchy"
3. Details: GANTT_IMPLEMENTATION_ANALYSIS.md → Full sections

---

## Key Concepts Explained

### Working Days (WD)
- Calculation: Count Monday-Friday only, exclude weekends and holidays
- Function: `calculateWorkingDaysInclusive(startDate, endDate, holidays)`
- Display: "Xd" format (e.g., "45d")
- Location: Sidebar "Duration" column in GanttCanvasV3

### Calendar Days (CD)
- Calculation: Total days between dates (inclusive)
- Formula: `differenceInDays(endDate, startDate) + 1`
- Display: Can be "Xd" or formatted as "X weeks"/"X months"
- Current Status: Calculated but not displayed in V3

### Timeline Positions
- Calculated as: `(dayOffset / totalDays) * 100%`
- Used for: Bar positioning in timeline
- Reference point: Project start date

### Holiday Handling
- Source: `getHolidaysInRange()` from holiday data
- Format: ISO date string "yyyy-MM-dd"
- Used in: Working days calculation

---

## File Dependency Map

```
COMPONENT LAYER
└── GanttCanvasV3.tsx (2086 lines)
    ├── STORE LAYER
    │   └── useGanttToolStoreV2 (Zustand)
    │       ├── getProjectDuration()
    │       └── getWorkingDays()
    │
    └── UTILITY LAYER
        ├── working-days.ts
        │   └── calculateWorkingDaysInclusive()
        │   └── isWeekend(), isHoliday()
        │
        ├── date-utils.ts
        │   └── formatDuration()
        │   └── formatWorkingDays()
        │
        ├── project-metrics.ts
        │   └── calculateDuration()
        │
        └── holidays data
            └── getHolidaysInRange()

TYPE LAYER
└── gantt-tool.ts
    ├── GanttProject
    ├── GanttPhase
    ├── GanttTask
    ├── GanttViewSettings (barDurationDisplay)
    └── Various assignment types
```

---

## Important Constants

### Sidebar Layout (GanttCanvasV3.tsx)
```
TASK_NAME_WIDTH = 360px      // Task/Phase name
DURATION_WIDTH = 100px        // Working days
RESOURCES_WIDTH = 140px       // Resource icons
PHASE_ROW_HEIGHT = 40px       // Row heights
TASK_ROW_HEIGHT = 40px
DEFAULT_SIDEBAR_WIDTH = 620px // Total
```

### Zoom Modes
```
day, week, month, quarter, year
(Default in V3: month)
```

### Duration Display Options (barDurationDisplay)
```
"wd"      - Working days only
"cd"      - Calendar days only
"resource"- Resource allocation
"dates"   - Start/end dates
"all"     - All information
"clean"   - No text
```

---

## Common Code Patterns

### Getting Working Days
```typescript
import { calculateWorkingDaysInclusive } from '@/lib/gantt-tool/working-days';
const wd = calculateWorkingDaysInclusive(start, end, holidays);
```

### Formatting for Display
```typescript
import { formatWorkingDays } from '@/lib/gantt-tool/date-utils';
const display = formatWorkingDays(wd); // "24d"
```

### Getting Project Duration
```typescript
const { getProjectDuration } = useGanttToolStoreV2();
const duration = getProjectDuration();
// { startDate, endDate, durationDays }
```

### Calculating Calendar Days
```typescript
const calendarDays = differenceInDays(endDate, startDate) + 1;
```

---

## Documentation Maintenance

These documents should be updated when:
- Major features are added to the gantt tool
- Data structure interfaces change
- New calculation functions are added
- Component layout changes significantly
- Performance optimizations are made
- New utility functions are created

Last Updated: 2025-11-13
Updated By: Claude

