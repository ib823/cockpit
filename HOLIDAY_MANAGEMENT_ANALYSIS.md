# Comprehensive Holiday Management System Analysis

## Executive Summary

The holiday management system has **TWO CONFLICTING IMPLEMENTATIONS** in the codebase:

1. **Working Days Library** (`/src/lib/gantt-tool/working-days.ts`) - CORRECT
   - Takes `holidays: GanttHoliday[]` array parameter
   - Uses `GanttHoliday` objects with `{id, name, date, region, type}`
   
2. **Old Holidays Module** (`/src/data/holidays.ts`) - LEGACY/INCORRECT
   - Takes `region: "ABMY" | "ABSG" | "ABVN"` string parameter
   - Uses static holiday data from HOLIDAYS constant

**CRITICAL BUG**: Several components are passing `region` string instead of `holidays` array to working-days functions, causing runtime errors.

---

## Part 1: The Two Holiday Systems

### System A: Working Days Library (CORRECT - Should Be Used)

**File**: `/workspaces/cockpit/src/lib/gantt-tool/working-days.ts`

**Functions**:
- `isHoliday(date: Date, holidays: GanttHoliday[]): boolean`
- `isWorkingDay(date: Date, holidays: GanttHoliday[]): boolean`
- `getNextWorkingDay(date: Date, holidays: GanttHoliday[]): Date`
- `getPreviousWorkingDay(date: Date, holidays: GanttHoliday[]): Date`
- `calculateWorkingDays(startDate, endDate, holidays): number` (exclusive)
- `calculateWorkingDaysInclusive(startDate, endDate, holidays): number` (inclusive)
- `addWorkingDays(startDate, daysToAdd, holidays): Date`
- `adjustDatesToWorkingDays(startDate, endDate, holidays): {startDate, endDate}`

**Expected Parameter**: 
```typescript
holidays: GanttHoliday[] = [
  {
    id: "holiday-123",
    name: "New Year's Day",
    date: "2025-01-01",
    region: "ABMY",
    type: "public"
  },
  ...
]
```

**Data Source**: From `GanttProject.holidays` in store/database

---

### System B: Holidays Module (LEGACY - Should NOT Be Used)

**File**: `/workspaces/cockpit/src/data/holidays.ts`

**Functions**:
- `isHoliday(date: Date, region: "ABMY" | "ABSG" | "ABVN"): boolean`
- `getHolidayName(date: Date, region): string | null`
- `getHolidaysInRange(startDate, endDate, region): Holiday[]`
- `calculateWorkingDays(startDate, endDate, region): number`
- `addWorkingDays(startDate, daysToAdd, region): Date`
- `getNextWorkingDay(date: Date, region): Date`

**Expected Parameter**: Region string like "ABMY", "ABSG", or "ABVN"

**Data Source**: Static HOLIDAYS constant (hardcoded holidays 2025-2030)

---

## Part 2: Data Flow Architecture

### Holiday Flow from Database → Store → Components

```
Database (Prisma)
    ↓
API Response (/api/gantt-tool/projects/{id})
    ↓
GanttProject.holidays (GanttHoliday[])
    ↓
useGanttToolStoreV2 (currentProject.holidays)
    ↓
Components receive via:
  - Direct: useGanttToolStoreV2().currentProject.holidays
  - Prop: Pass holidays to child components
    ↓
Working Days Functions (calculateWorkingDaysInclusive, etc.)
```

**Data Type**:
```typescript
interface GanttProject {
  id: string;
  name: string;
  holidays: GanttHoliday[];  // Project-specific holidays
  phases: GanttPhase[];
  // ... other fields
}

interface GanttHoliday {
  id: string;
  name: string;
  date: string;           // YYYY-MM-DD format
  region: string;         // For filtering/display (not used for calculation!)
  type: "public" | "company" | "custom";
}
```

---

## Part 3: Critical Issues Found

### Issue 1: TaskDeletionImpactModal - Region vs Holidays
**File**: `/workspaces/cockpit/src/components/gantt-tool/TaskDeletionImpactModal.tsx`
**Lines**: 9-45, 41-45, 61-65, 224-228
**Severity**: CRITICAL

**Problem**:
```typescript
interface TaskDeletionImpactModalProps {
  task: GanttTask;
  phase: GanttPhase;
  allTasks: GanttTask[];
  allResources: Resource[];
  onConfirm: () => void;
  onCancel: () => void;
  region?: "ABMY" | "ABSG" | "ABVN";  // ← WRONG! Should be holidays array
}

// Called with:
const workingDays = calculateWorkingDaysInclusive(
  new Date(task.startDate),
  new Date(task.endDate),
  region  // ← PASSES STRING instead of array!
);
```

**Expected**:
```typescript
const workingDays = calculateWorkingDaysInclusive(
  new Date(task.startDate),
  new Date(task.endDate),
  allHolidays  // Should pass holidays array
);
```

**Impact**: Type mismatch, function expects array of GanttHoliday objects

---

### Issue 2: PhaseDeletionImpactModal - Same Bug as Above
**File**: `/workspaces/cockpit/src/components/gantt-tool/PhaseDeletionImpactModal.tsx`
**Lines**: 9-52, 92-96
**Severity**: CRITICAL

**Problem**: Identical to Issue 1 - passes `region` string instead of `holidays` array

---

### Issue 3: AddTaskModal - Wrong Parameter
**File**: `/workspaces/cockpit/src/components/gantt-tool/AddTaskModal.tsx`
**Lines**: 159-163
**Severity**: HIGH

**Problem**:
```typescript
const workingDays = calculateWorkingDaysInclusive(
  new Date(formData.startDate),
  new Date(formData.endDate),
  currentProject?.viewSettings.barDurationDisplay || "wd"  // ← WRONG!
);
```

Should be:
```typescript
const workingDays = calculateWorkingDaysInclusive(
  new Date(formData.startDate),
  new Date(formData.endDate),
  currentProject?.holidays || []  // CORRECT
);
```

---

### Issue 4: ResourceIndicator - Unclear Parameter Source
**File**: `/workspaces/cockpit/src/components/gantt-tool/ResourceIndicator.tsx`
**Lines**: 54-60
**Severity**: MEDIUM

**Problem**: Dynamic require and unclear `taskHolidays` parameter
```typescript
const taskWorkingDays = taskStartDate && taskEndDate
  ? (() => {
      const { calculateWorkingDaysInclusive } = require("@/lib/gantt-tool/working-days");
      return calculateWorkingDaysInclusive(taskStartDate, taskEndDate, taskHolidays);
    })()
  : 0;
```

**Question**: Where does `taskHolidays` come from? Is it a prop?

---

### Issue 5: HolidayAwareDatePicker - May Use Wrong System
**File**: `/workspaces/cockpit/src/components/ui/HolidayAwareDatePicker.tsx`
**Severity**: MEDIUM

**Problem**: Takes `region` prop - may be using legacy holidays.ts instead of currentProject.holidays

---

## Part 4: Working Days Function Usage Summary

### Table: All Working Days Function Usage

| File | Function | Parameter | Status |
|------|----------|-----------|--------|
| gantt-tool-store-v2.ts | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| gantt-tool-store-v2.ts | addWorkingDays | holidays array | ✅ CORRECT |
| gantt-tool-store-v2.ts | adjustDatesToWorkingDays | holidays array | ✅ CORRECT |
| AddTaskModal.tsx | calculateWorkingDaysInclusive | barDurationDisplay | ❌ WRONG |
| EditTaskModal.tsx | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| TaskDeletionImpactModal.tsx | calculateWorkingDaysInclusive | region string | ❌ CRITICAL BUG |
| PhaseDeletionImpactModal.tsx | calculateWorkingDaysInclusive | region string | ❌ CRITICAL BUG |
| GanttCanvasV3.tsx | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| GanttCanvas.tsx | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| GanttSidePanel.tsx | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| GanttMobileListView.tsx | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| AddPhaseModal.tsx | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| EditPhaseModal.tsx | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| ResourceIndicator.tsx | calculateWorkingDaysInclusive | taskHolidays (unclear) | ⚠️ SUSPICIOUS |
| export-utils.ts | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |
| project-metrics.ts | calculateWorkingDaysInclusive | holidays array | ✅ CORRECT |

---

## Part 5: Files That Are Correct

These files properly use the working days library with holidays arrays:

✅ `/workspaces/cockpit/src/stores/gantt-tool-store-v2.ts`
✅ `/workspaces/cockpit/src/components/gantt-tool/EditTaskModal.tsx`
✅ `/workspaces/cockpit/src/components/gantt-tool/GanttCanvasV3.tsx`
✅ `/workspaces/cockpit/src/components/gantt-tool/GanttCanvas.tsx`
✅ `/workspaces/cockpit/src/components/gantt-tool/GanttSidePanel.tsx`
✅ `/workspaces/cockpit/src/components/gantt-tool/GanttMobileListView.tsx`
✅ `/workspaces/cockpit/src/components/gantt-tool/AddPhaseModal.tsx`
✅ `/workspaces/cockpit/src/components/gantt-tool/EditPhaseModal.tsx`
✅ `/workspaces/cockpit/src/lib/gantt-tool/export-utils.ts`
✅ `/workspaces/cockpit/src/lib/gantt-tool/project-metrics.ts`

---

## Part 6: Buggy Patterns to Avoid

### Pattern 1: Passing Region Instead of Holidays
```typescript
// WRONG - This is what TaskDeletionImpactModal does
calculateWorkingDaysInclusive(start, end, region)

// RIGHT - This is what the function expects
calculateWorkingDaysInclusive(start, end, currentProject.holidays || [])
```

### Pattern 2: Using Legacy holidays.ts Functions
```typescript
// WRONG - Don't use these in Gantt tool
import { calculateWorkingDays } from "@/data/holidays";
calculateWorkingDays(start, end, "ABMY");

// RIGHT - Use these instead
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
calculateWorkingDaysInclusive(start, end, holidays);
```

### Pattern 3: Not Passing Holidays at All
```typescript
// WRONG - Omitting holidays parameter
const wd = calculateWorkingDaysInclusive(start, end);

// RIGHT - Always pass holidays (even if empty array)
const wd = calculateWorkingDaysInclusive(start, end, project.holidays || []);
```

---

## Part 7: Recommended Fixes

### Priority 1: CRITICAL BUGS (Must Fix Immediately)

1. **TaskDeletionImpactModal.tsx** (Lines 9-96)
   - Change `region?: "ABMY" | "ABSG" | "ABVN"` prop to accept holidays
   - Or accept parent's holidays and pass through
   - Replace all `region` parameters with holidays array

2. **PhaseDeletionImpactModal.tsx** (Lines 9-96)
   - Same fix as TaskDeletionImpactModal

### Priority 2: HIGH PRIORITY (Should Fix Soon)

3. **AddTaskModal.tsx** (Lines 159-163)
   - Replace `currentProject?.viewSettings.barDurationDisplay || "wd"` with `currentProject?.holidays || []`

### Priority 3: MEDIUM PRIORITY (Investigate)

4. **ResourceIndicator.tsx** (Lines 54-60)
   - Verify source of `taskHolidays` parameter
   - Ensure it's an array of GanttHoliday objects
   - Remove dynamic require if possible

5. **HolidayAwareDatePicker.tsx**
   - Check if using legacy holidays.ts
   - Should align with currentProject.holidays instead

---

## Conclusion

The holiday management system clearly separates:

1. **Working Days Library** - NEW, CORRECT, project-specific holidays
   - Used by store for data mutations
   - Used by most components correctly
   - Takes `holidays: GanttHoliday[]` array

2. **Holidays Module** - LEGACY, hardcoded regional holidays
   - Should NOT be used in Gantt tool
   - Takes `region: string` parameter
   - Only useful for historical reference

**Critical bugs identified**: TaskDeletionImpactModal and PhaseDeletionImpactModal are passing the wrong parameter type.

**Recommended action**: See Priority fixes in Part 7 above.
