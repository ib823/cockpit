# P0 Comprehensive Test Plan - Kiasu Level

**Date**: 2025-11-14
**Status**: 🔄 Ready for Execution
**Server**: ✅ http://localhost:3000
**Build**: ✅ Zero TypeScript Errors (3499 modules)

---

## Test Environment Status

✅ **Server Running**: http://localhost:3000
✅ **Compilation**: Zero errors (3499 modules compiled)
✅ **TypeScript Diagnostics**: Zero errors
✅ **Hot Reload**: Active

---

## Testing Philosophy (Steve Jobs/Jony Ive)

> "This is what customers pay us for—to sweat all these details so it's easy and pleasant for them to use our computers." — Steve Jobs

**Approach**:
- Test every interaction path
- Verify visual feedback
- Confirm accessibility
- Check edge cases
- Validate error handling
- Ensure consistency

---

## Test Execution Order

1. **Smoke Tests** (5 min) - Basic functionality
2. **Feature Tests** (20 min) - Each P0 feature in depth
3. **Integration Tests** (15 min) - Features working together
4. **Edge Case Tests** (20 min) - Boundary conditions
5. **Accessibility Tests** (10 min) - Keyboard, screen reader
6. **Performance Tests** (10 min) - Speed, animations

**Total Estimated Time**: 80 minutes

---

## 1. SMOKE TESTS (Critical Path)

### Test 1.1: Application Loads
**Steps**:
1. Navigate to http://localhost:3000/gantt-tool/v3
2. Wait for page to load

**Expected**:
- ✅ Page loads without errors
- ✅ Gantt chart visible
- ✅ No console errors
- ✅ Timeline rendered

**Result**: [ ]

---

### Test 1.2: Project Selection
**Steps**:
1. Click project selector dropdown
2. Select a project with phases and tasks

**Expected**:
- ✅ Project loads
- ✅ Phases visible in left sidebar
- ✅ Tasks visible under phases
- ✅ Timeline bars rendered

**Result**: [ ]

---

### Test 1.3: Basic Interactions
**Steps**:
1. Hover over a phase
2. Click to expand/collapse phase
3. Hover over a task
4. Click a task

**Expected**:
- ✅ Hover states work
- ✅ Phase expands/collapses smoothly
- ✅ Task selection works
- ✅ No console errors

**Result**: [ ]

---

## 2. EDIT MODAL TESTS (Requirement 9 - Part 1)

### Test 2.1: Edit Phase Modal - Open
**Steps**:
1. Click on a phase bar in timeline
2. Observe EditPhaseModal

**Expected**:
- ✅ Modal opens with smooth animation
- ✅ Modal title: "Edit Phase"
- ✅ Edit3 icon visible in header
- ✅ Phase name pre-populated
- ✅ Phase description pre-populated (if exists)
- ✅ Phase deliverables pre-populated (if exists)
- ✅ Phase color pre-selected
- ✅ Start date shows in HolidayAwareDatePicker (NOT basic HTML input)
- ✅ End date shows in HolidayAwareDatePicker
- ✅ Working days calculated and displayed
- ✅ Focus automatically on phase name field
- ✅ Phase name text is selected

**Result**: [ ]

**Issues Found**:
```
[Write any issues here]
```

---

### Test 2.2: Edit Phase Modal - Field Validation
**Steps**:
1. Open edit phase modal
2. Clear phase name field
3. Click "Save Changes"

**Expected**:
- ✅ Error message: "Phase name is required"
- ✅ Error shown in red below field
- ✅ Save button should still work (validation happens on submit)

**Steps**:
4. Type a phase name
5. Set end date before start date
6. Click "Save Changes"

**Expected**:
- ✅ Error message: "End date must be after start date"
- ✅ Error shown in red

**Result**: [ ]

---

### Test 2.3: Edit Phase Modal - Impact Warning
**Steps**:
1. Open phase that has tasks
2. Move start date forward (shrink phase from start)
3. Observe impact warning

**Expected**:
- ✅ Orange warning box appears
- ✅ Warning icon (AlertCircle) shown
- ✅ Message: "⚠️ X task(s) will be adjusted to fit within new dates"
- ✅ Warning updates in real-time as date changes

**Steps**:
4. Move end date backward (shrink phase from end)

**Expected**:
- ✅ Same warning behavior

**Steps**:
5. Expand phase dates (move start earlier or end later)

**Expected**:
- ✅ Warning disappears (expanding is safe)

**Result**: [ ]

---

### Test 2.4: Edit Phase Modal - HolidayAwareDatePicker
**Steps**:
1. Open edit phase modal
2. Click on Start Date field
3. Observe date picker

**Expected**:
- ✅ Calendar opens
- ✅ Holidays are highlighted (if any)
- ✅ Weekends are disabled
- ✅ Current date is pre-selected
- ✅ Can navigate months

**Steps**:
4. Select a new date
5. Observe working days calculation

**Expected**:
- ✅ Working days updates immediately
- ✅ Calculation excludes weekends
- ✅ Calculation excludes holidays

**Result**: [ ]

---

### Test 2.5: Edit Phase Modal - Save Changes
**Steps**:
1. Open edit phase modal
2. Change phase name to "Test Phase Edited"
3. Change color to different preset
4. Click "Save Changes"

**Expected**:
- ✅ Button shows "Saving..." during save
- ✅ Modal closes after successful save
- ✅ Phase name updates in Gantt chart
- ✅ Phase color updates in timeline
- ✅ Changes persist after page reload

**Result**: [ ]

---

### Test 2.6: Edit Phase Modal - Keyboard Shortcuts
**Steps**:
1. Open edit phase modal
2. Press Cmd+Enter (Mac) or Ctrl+Enter (Windows)

**Expected**:
- ✅ Form submits
- ✅ Modal closes
- ✅ Changes saved

**Steps**:
3. Open edit phase modal again
4. Press Escape key

**Expected**:
- ✅ Modal closes
- ✅ No changes saved

**Result**: [ ]

---

### Test 2.7: Edit Task Modal - Open
**Steps**:
1. Click on a task bar in timeline
2. Observe EditTaskModal

**Expected**:
- ✅ Modal opens with smooth animation
- ✅ Modal title: "Edit Task"
- ✅ Edit3 icon visible in header
- ✅ Task name pre-populated
- ✅ Task description pre-populated (if exists)
- ✅ Parent phase shown (read-only)
- ✅ Start/end dates use HolidayAwareDatePicker
- ✅ Working days calculated
- ✅ AMS section visible if task has AMS config
- ✅ Focus on task name field

**Result**: [ ]

---

### Test 2.8: Edit Task Modal - Phase Boundary Validation
**Steps**:
1. Open edit task modal
2. Note the parent phase dates (shown in modal)
3. Try to set task start date before phase start

**Expected**:
- ✅ Error message: "Task must start within phase (MMM d - MMM d)"
- ✅ Cannot save with invalid dates

**Steps**:
4. Try to set task end date after phase end

**Expected**:
- ✅ Error message: "Task must end within phase (MMM d - MMM d)"

**Result**: [ ]

---

### Test 2.9: Edit Task Modal - Resource Impact Warning
**Steps**:
1. Find a task with resource assignments
2. Open edit task modal
3. Change task dates (start or end)

**Expected**:
- ✅ Warning appears: "⚠️ X resource(s) (Y working days) will be affected"
- ✅ Shows count of assigned resources
- ✅ Shows working days impact

**Result**: [ ]

---

### Test 2.10: Edit Task Modal - Save Changes
**Steps**:
1. Open edit task modal
2. Change task name
3. Change dates (within phase boundaries)
4. Click "Save Changes"

**Expected**:
- ✅ Button shows "Saving..."
- ✅ Modal closes
- ✅ Task updates in Gantt chart
- ✅ Task bar repositions if dates changed

**Result**: [ ]

---

## 3. DELETION FLOW TESTS (Requirement 9 - Part 2)

### Test 3.1: Phase Delete Button Visibility
**Steps**:
1. Move mouse over a phase row in left sidebar
2. Move mouse away
3. Repeat with different phases

**Expected**:
- ✅ Delete button (red trash icon) appears on hover
- ✅ Delete button fades in smoothly (opacity 0 → 1)
- ✅ Delete button disappears when mouse leaves
- ✅ Delete button positioned after phase name

**Result**: [ ]

---

### Test 3.2: Phase Delete Button Interaction
**Steps**:
1. Hover over phase
2. Hover over delete button specifically

**Expected**:
- ✅ Delete button background changes to rgba(255, 59, 48, 0.1)
- ✅ Cursor changes to pointer

**Steps**:
3. Click delete button

**Expected**:
- ✅ PhaseDeletionImpactModal opens
- ✅ Click doesn't trigger phase selection

**Result**: [ ]

---

### Test 3.3: Phase Deletion Impact Modal - Low Impact
**Steps**:
1. Find a phase with 0-2 tasks, no resources
2. Click delete button
3. Observe modal

**Expected**:
- ✅ Modal opens with smooth animation
- ✅ Title: "Confirm Phase Deletion"
- ✅ Severity badge: "Low Impact" (green)
- ✅ Phase name, dates, and task count shown
- ✅ Impact analysis shows:
  - Tasks that will be deleted (list)
  - "No critical impacts detected" message
- ✅ "Cancel & Review" button
- ✅ "Confirm Delete" button (green for low impact)

**Result**: [ ]

---

### Test 3.4: Phase Deletion Impact Modal - High Impact
**Steps**:
1. Find a phase with 10+ tasks, multiple resources
2. Click delete button
3. Observe modal

**Expected**:
- ✅ Severity badge: "High Impact" or "CRITICAL IMPACT" (orange/red)
- ✅ Warning message: "⚠️ WARNING: This will significantly affect..."
- ✅ Impact sections visible:
  - All Tasks Will Be Permanently Deleted (red section)
  - Resource Allocations Will Be Lost (purple section)
  - Dependencies Will Be Broken (amber section - if applicable)
  - AMS Commitments Will Be Deleted (indigo section - if applicable)
  - Timeline Impact (blue section)
- ✅ Total budget impact shown (if resources assigned)
- ✅ Resource count and names listed
- ✅ Delete button: "Delete Phase (High Risk)" or "⚠️ Delete Anyway (Not Recommended)"

**Result**: [ ]

---

### Test 3.5: Phase Deletion Impact Modal - Dependencies
**Steps**:
1. Find a phase that other phases depend on
2. Click delete button
3. Check "Dependencies Will Be Broken" section

**Expected**:
- ✅ Section visible in amber
- ✅ Shows count of dependent phases
- ✅ Lists each dependent phase by name
- ✅ Message: "X phase(s depend) on this phase"

**Result**: [ ]

---

### Test 3.6: Phase Deletion - Cancel
**Steps**:
1. Open phase deletion impact modal
2. Click "Cancel & Review"

**Expected**:
- ✅ Modal closes
- ✅ No deletion occurs
- ✅ Phase still visible in Gantt
- ✅ No undo toast appears

**Result**: [ ]

---

### Test 3.7: Phase Deletion - Confirm & Undo Toast
**Steps**:
1. Open phase deletion impact modal for a simple phase
2. Note the phase name
3. Click "Confirm Delete"

**Expected**:
- ✅ Modal closes immediately
- ✅ Phase disappears from Gantt chart
- ✅ UndoToast appears at bottom center within 500ms
- ✅ Toast shows: "Deleted phase '[name]'"
- ✅ Toast shows: "5 seconds to undo"
- ✅ "Undo" button visible
- ✅ Close button (X) visible
- ✅ Progress bar at bottom showing countdown
- ✅ Toast uses destructive variant (red background)

**Result**: [ ]

---

### Test 3.8: Undo Toast - Progress Bar
**Steps**:
1. Delete a phase to trigger undo toast
2. Watch progress bar

**Expected**:
- ✅ Progress bar starts at 100% width
- ✅ Progress bar smoothly decreases over 5 seconds
- ✅ Progress bar reaches 0% at 5 seconds
- ✅ Toast auto-closes at 0%

**Result**: [ ]

---

### Test 3.9: Undo Toast - Undo Action
**Steps**:
1. Delete a phase
2. Click "Undo" button within 5 seconds

**Expected**:
- ✅ Checkmark icon replaces undo icon
- ✅ Text changes to "Undoing..."
- ✅ Toast closes after ~300ms
- ✅ Phase reappears in Gantt chart
- ✅ Phase in exact same position
- ✅ All tasks restored
- ✅ All data intact (name, dates, color, resources)

**Result**: [ ]

---

### Test 3.10: Undo Toast - Manual Close
**Steps**:
1. Delete a phase
2. Click X button on toast

**Expected**:
- ✅ Toast closes immediately
- ✅ Phase remains deleted (undo not triggered)

**Result**: [ ]

---

### Test 3.11: Undo Toast - Auto-Close
**Steps**:
1. Delete a phase
2. Wait 5 seconds without clicking anything

**Expected**:
- ✅ Toast auto-closes after 5 seconds
- ✅ Phase remains deleted
- ✅ No errors in console

**Result**: [ ]

---

### Test 3.12: Task Delete Button Visibility
**Steps**:
1. Hover over a task row in left sidebar
2. Move mouse away

**Expected**:
- ✅ Delete button appears on hover (red trash icon)
- ✅ Delete button fades in smoothly
- ✅ Delete button disappears when mouse leaves
- ✅ Delete button positioned after task name

**Result**: [ ]

---

### Test 3.13: Task Deletion Impact Modal - Low Impact
**Steps**:
1. Find a task with no resources, no children, no dependents
2. Click delete button

**Expected**:
- ✅ TaskDeletionImpactModal opens
- ✅ Title: "Confirm Task Deletion"
- ✅ Severity: "Low Impact" (green)
- ✅ Task name, dates, working days shown
- ✅ Impact sections:
  - Impact Severity (summary)
  - Timeline Impact (working days removed)
- ✅ Message: "This task can be safely deleted"
- ✅ "Confirm Delete" button (green)

**Result**: [ ]

---

### Test 3.14: Task Deletion Impact Modal - High Impact
**Steps**:
1. Find a task with resources, child tasks, or dependents
2. Click delete button

**Expected**:
- ✅ Severity: "High Impact" or "Critical Impact"
- ✅ Impact sections visible:
  - Resource Assignments Will Be Lost (if applicable)
  - Child Tasks Will Be Orphaned (if applicable)
  - Task Dependencies Will Be Broken (if applicable)
  - Budget Impact (if resources)
  - AMS Task Deletion (if AMS)
- ✅ Each section shows detailed breakdown
- ✅ Resource section shows: name, allocation %, hours, cost
- ✅ Total cost calculated and displayed

**Result**: [ ]

---

### Test 3.15: Task Deletion - Confirm & Undo
**Steps**:
1. Delete a task
2. Observe undo toast
3. Click "Undo" within 5 seconds

**Expected**:
- ✅ Toast appears: "Deleted task '[name]'"
- ✅ Undo restores task completely
- ✅ Task in same position in Gantt
- ✅ All data intact

**Result**: [ ]

---

## 4. PEER CONNECTION LINES TESTS (Requirement 7)

### Test 4.1: Navigate to Org Chart Builder
**Steps**:
1. From Gantt tool page
2. Navigate to Org Chart Builder

**Expected**:
- ✅ Org chart visible
- ✅ Resource nodes displayed
- ✅ Parent-child lines visible (solid lines)

**Result**: [ ]

---

### Test 4.2: Peer Lines Toggle - Default State
**Steps**:
1. Look at toolbar in org chart builder
2. Find "Peer Lines" button

**Expected**:
- ✅ Button visible in toolbar
- ✅ Button label: "Peer Lines"
- ✅ Button NOT highlighted (default OFF)
- ✅ No peer connection lines visible by default

**Result**: [ ]

---

### Test 4.3: Peer Lines Toggle - Enable
**Steps**:
1. Click "Peer Lines" button

**Expected**:
- ✅ Button background changes to #007aff (blue)
- ✅ Button text color changes to white
- ✅ Peer connection lines fade in (300ms transition)
- ✅ Lines appear between sibling nodes
- ✅ Lines are dotted/dashed (strokeDasharray: "4 4")
- ✅ Lines are subtle (opacity: 0.1 color)
- ✅ Lines are 1.5px stroke width
- ✅ Lines use bezier curves (10% control point offset)

**Result**: [ ]

---

### Test 4.4: Peer Lines vs Parent-Child Lines
**Steps**:
1. Enable peer lines
2. Compare peer lines with parent-child lines

**Expected**:
- ✅ Parent-child lines: Solid, more prominent
- ✅ Peer lines: Dotted, more subtle
- ✅ Visual distinction clear
- ✅ No line overlap issues

**Result**: [ ]

---

### Test 4.5: Peer Lines Toggle - Disable
**Steps**:
1. With peer lines enabled
2. Click "Peer Lines" button again

**Expected**:
- ✅ Button returns to default state (no background)
- ✅ Peer lines fade out (300ms transition)
- ✅ Only parent-child lines remain

**Result**: [ ]

---

## 5. RESOURCE PANEL SYNC TESTS (Requirement 8)

### Test 5.1: Resource Panel - Three Tiers Visible
**Steps**:
1. Open Gantt tool page
2. Look at resource panel on right side

**Expected**:
- ✅ Three sections visible:
  1. "In Org Chart" section (top)
  2. "Resource Pool" section (middle)
  3. "In Tasks/Phases" section (bottom)

**Result**: [ ]

---

### Test 5.2: Tier 1 - In Org Chart
**Steps**:
1. Check "In Org Chart" section
2. Compare with resources in org chart builder

**Expected**:
- ✅ Shows count of resources with managerResourceId
- ✅ Count matches resources in org chart
- ✅ Resources have hierarchical structure indicator

**Result**: [ ]

---

### Test 5.3: Tier 2 - Resource Pool
**Steps**:
1. Check "Resource Pool" section
2. Note count of unassigned resources

**Expected**:
- ✅ Shows resources without managerResourceId
- ✅ Shows resources not yet assigned to tasks
- ✅ Count accurate

**Result**: [ ]

---

### Test 5.4: Tier 3 - In Tasks/Phases with Utilization
**Steps**:
1. Check "In Tasks/Phases" section
2. Observe utilization tracker

**Expected**:
- ✅ Shows count of assigned resources
- ✅ Shows utilization percentage
- ✅ Progress bar visible
- ✅ Progress bar color:
  - Green (≥80% utilization)
  - Orange (50-79% utilization)
  - Gray (<50% utilization)
- ✅ Animated progress bar (smooth fill)

**Result**: [ ]

---

### Test 5.5: Resource Panel - Real-time Sync
**Steps**:
1. Note current resource counts
2. Add a task and assign a resource
3. Observe resource panel

**Expected**:
- ✅ "In Tasks/Phases" count increases
- ✅ Utilization percentage updates
- ✅ Progress bar updates smoothly
- ✅ Color may change based on new utilization

**Result**: [ ]

---

## 6. INTEGRATION TESTS

### Test 6.1: Edit then Delete
**Steps**:
1. Edit a phase (change name)
2. Save changes
3. Delete the same phase
4. Undo the deletion

**Expected**:
- ✅ Phase restored with edited name (not original)
- ✅ History system preserves edits through undo

**Result**: [ ]

---

### Test 6.2: Multiple Deletions in Sequence
**Steps**:
1. Delete Phase A
2. Wait for undo toast
3. Delete Phase B before first toast closes
4. Observe

**Expected**:
- ✅ First toast closes when second deletion occurs
- ✅ Only second toast visible
- ✅ Both deletions successful
- ✅ Can only undo most recent (Phase B)

**Result**: [ ]

---

### Test 6.3: Delete Phase with Tasks Having Resources
**Steps**:
1. Find phase with tasks that have resource assignments
2. Delete phase
3. Check impact modal

**Expected**:
- ✅ Resource impact shown in modal
- ✅ Budget impact calculated across all tasks
- ✅ Resource count accurate

**Steps**:
4. Confirm deletion
5. Check resource panel

**Expected**:
- ✅ "In Tasks/Phases" count decreases
- ✅ Utilization percentage updates
- ✅ Resources moved to appropriate tier

**Result**: [ ]

---

### Test 6.4: Rapid Undo Cycles
**Steps**:
1. Delete a phase
2. Click Undo immediately
3. Delete same phase again
4. Click Undo again
5. Repeat 5 times

**Expected**:
- ✅ No errors
- ✅ Phase always restored correctly
- ✅ No data corruption
- ✅ Smooth animations each time

**Result**: [ ]

---

### Test 6.5: Edit Modal While Delete Toast Visible
**Steps**:
1. Delete a phase (Phase A)
2. While undo toast is visible
3. Click to edit a different phase (Phase B)

**Expected**:
- ✅ Edit modal opens
- ✅ Undo toast remains visible
- ✅ Both modals don't conflict
- ✅ Can interact with both independently

**Result**: [ ]

---

## 7. EDGE CASE TESTS

### Test 7.1: Delete Phase with 0 Tasks
**Steps**:
1. Create or find a phase with no tasks
2. Delete it

**Expected**:
- ✅ Impact modal shows: "0 tasks"
- ✅ Severity: Low
- ✅ Deletion successful
- ✅ Undo works

**Result**: [ ]

---

### Test 7.2: Delete Phase with 100+ Tasks
**Steps**:
1. Find or create phase with many tasks (>50)
2. Delete it

**Expected**:
- ✅ Impact modal shows all tasks (scrollable)
- ✅ Severity: Critical
- ✅ Performance remains smooth
- ✅ Modal renders without lag
- ✅ Deletion and undo both work

**Result**: [ ]

---

### Test 7.3: Edit Phase with Very Long Name
**Steps**:
1. Edit a phase
2. Enter a name with 200+ characters
3. Save

**Expected**:
- ✅ Name accepts input
- ✅ Name truncates in UI with ellipsis
- ✅ Full name visible on hover (title attribute)
- ✅ No layout breaking

**Result**: [ ]

---

### Test 7.4: Edit Task Start = End Date
**Steps**:
1. Edit a task
2. Set start and end to same date
3. Try to save

**Expected**:
- ✅ Error: "End date must be after start date"
- ✅ Cannot save
- ✅ Clear error message

**Result**: [ ]

---

### Test 7.5: Undo After Page Reload
**Steps**:
1. Delete a phase
2. Immediately refresh the page (before undo)

**Expected**:
- ✅ Page reloads
- ✅ Phase remains deleted (undo window lost)
- ✅ No undo toast (expected behavior)
- ✅ Can use history undo (Ctrl+Z) if implemented

**Result**: [ ]

---

### Test 7.6: Delete Button in Collapsed Phase
**Steps**:
1. Collapse a phase
2. Hover over collapsed phase row

**Expected**:
- ✅ Delete button still appears
- ✅ Works same as expanded phase
- ✅ Can delete collapsed phase

**Result**: [ ]

---

### Test 7.7: Network Failure During Delete
**Steps**:
1. Open DevTools → Network tab
2. Throttle to "Offline"
3. Try to delete a phase

**Expected**:
- ✅ Error message shown
- ✅ Phase NOT deleted from UI
- ✅ Clear error feedback
- ✅ Can retry when online

**Result**: [ ]

---

### Test 7.8: Very Fast Double-Click Delete Button
**Steps**:
1. Hover over phase
2. Double-click delete button very quickly

**Expected**:
- ✅ Modal opens only once
- ✅ No duplicate modals
- ✅ No console errors

**Result**: [ ]

---

## 8. ACCESSIBILITY TESTS

### Test 8.1: Keyboard Navigation - Edit Modal
**Steps**:
1. Click phase to open edit modal
2. Press Tab repeatedly

**Expected**:
- ✅ Focus moves through fields in logical order:
  - Phase name
  - Description
  - Deliverables
  - Start date
  - End date
  - Color buttons
  - Save button
  - Cancel button
- ✅ Focus trap: Tab doesn't leave modal
- ✅ Shift+Tab moves backwards
- ✅ Focus indicators clearly visible

**Result**: [ ]

---

### Test 8.2: Keyboard Navigation - Delete Modal
**Steps**:
1. Open delete impact modal
2. Press Tab

**Expected**:
- ✅ Focus on "Cancel & Review" button first
- ✅ Tab moves to "Confirm Delete" button
- ✅ Tab moves to close button (X)
- ✅ Shift+Tab reverses

**Result**: [ ]

---

### Test 8.3: Escape Key Handling
**Steps**:
1. Open edit phase modal
2. Press Escape

**Expected**:
- ✅ Modal closes
- ✅ No changes saved

**Steps**:
3. Open delete impact modal
4. Press Escape

**Expected**:
- ✅ Modal closes
- ✅ No deletion occurs

**Result**: [ ]

---

### Test 8.4: Screen Reader (if available)
**Steps**:
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate to Gantt tool
3. Tab through interface

**Expected**:
- ✅ Phase names announced
- ✅ Task names announced
- ✅ Button labels clear: "Delete phase [name]"
- ✅ Modal titles announced
- ✅ Form labels announced
- ✅ Error messages announced

**Result**: [ ]

---

### Test 8.5: Color Contrast
**Steps**:
1. Visually inspect all text
2. Check contrast ratios (use browser DevTools)

**Expected**:
- ✅ All text meets WCAG AA (4.5:1 for normal text)
- ✅ Delete button (#FF3B30) stands out
- ✅ Error messages clearly visible

**Result**: [ ]

---

## 9. PERFORMANCE TESTS

### Test 9.1: Modal Open/Close Performance
**Steps**:
1. Open edit phase modal
2. Close it
3. Repeat 10 times rapidly
4. Check for lag

**Expected**:
- ✅ Smooth 60fps animations
- ✅ No visible lag
- ✅ No memory leaks (check DevTools Memory tab)

**Result**: [ ]

---

### Test 9.2: Large Project Performance
**Steps**:
1. Load project with 20+ phases, 200+ tasks
2. Hover over multiple phases quickly
3. Open/close edit modals

**Expected**:
- ✅ Delete buttons appear/disappear smoothly
- ✅ No frame drops
- ✅ Modals open quickly (<100ms)

**Result**: [ ]

---

### Test 9.3: Undo Toast Animation Performance
**Steps**:
1. Delete a phase
2. Watch undo toast countdown
3. Check for smooth animation

**Expected**:
- ✅ Progress bar animates smoothly (no jumps)
- ✅ 60fps throughout 5-second countdown
- ✅ No CPU spikes in DevTools Performance tab

**Result**: [ ]

---

## 10. CROSS-BROWSER TESTS (if time permits)

### Test 10.1: Chrome
**All critical tests above**
**Result**: [ ]

### Test 10.2: Firefox
**All critical tests above**
**Result**: [ ]

### Test 10.3: Safari
**All critical tests above**
**Result**: [ ]

### Test 10.4: Edge
**All critical tests above**
**Result**: [ ]

---

## TEST RESULT SUMMARY

### Total Tests Planned: 85

**Completed**: [ ] / 85
**Passed**: [ ] / 85
**Failed**: [ ] / 85
**Blocked**: [ ] / 85

### Critical Issues Found

```
[List critical issues here]

Issue 1:
- Test: [Test number and name]
- Description: [What went wrong]
- Severity: Critical/High/Medium/Low
- Steps to reproduce:
- Expected vs Actual:
- Screenshot/Video: [if available]

Issue 2:
...
```

### Pass/Fail Criteria

**GREEN LIGHT Criteria** (must all pass):
- ✅ Zero TypeScript errors
- ✅ All Smoke Tests (1.1-1.3) pass
- ✅ All Edit Modal core tests (2.1, 2.5, 2.7, 2.10) pass
- ✅ All Deletion core tests (3.7, 3.9, 3.15) pass
- ✅ No critical issues found

**Additional Success Criteria**:
- >90% of all tests pass
- No high-severity issues
- All P0 features functional

---

## NEXT STEPS AFTER TESTING

### If GREEN LIGHT ✅
1. Document test results
2. Create final sign-off report
3. Proceed to P1 implementation (Requirements 11, 12, 13)

### If ISSUES FOUND 🟡
1. Prioritize issues (Critical > High > Medium > Low)
2. Fix critical issues first
3. Re-test affected areas
4. Repeat until green light achieved

---

**Tester**: _______________
**Date Completed**: _______________
**Time Taken**: _______________
**Overall Assessment**: _______________

