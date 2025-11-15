# Delete Integration - Comprehensive Test Plan
## Apple-Standard Quality Assurance for Edit Modal Delete Functionality

**Test Plan Version:** 1.0
**Date:** November 14, 2025
**Feature:** Delete Button Integration in EditPhaseModal and EditTaskModal
**Standards Applied:** Apple Human Interface Guidelines, Jobs/Ive Excellence Principles

---

## Executive Summary

This test plan covers the integration of delete functionality directly into Edit modals for both Phases and Tasks. The implementation moves delete buttons from canvas trash icons into the Edit modal footer (left-aligned, destructive variant), triggering the existing comprehensive deletion impact modals.

**Total Test Scenarios:** 76
**Coverage Areas:** 8 major categories
**Expected Pass Rate:** 100%
**Test Pyramid:** Unit → Integration → E2E → Accessibility → Performance

---

## Test Categories

### Category 1: Visual & Layout Tests (12 scenarios)

#### TC-VL-001: Delete Button Presence in EditPhaseModal
- **Description:** Verify Delete button appears in EditPhaseModal footer
- **Steps:**
  1. Open Gantt tool (http://localhost:3000/gantt-tool/v3)
  2. Create or select a project
  3. Double-click any phase to open EditPhaseModal
- **Expected Result:**
  - Delete button visible in footer, left-aligned
  - Button has Trash2 icon and "Delete Phase" text
  - Button has destructive (red) styling
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-VL-002: Delete Button Presence in EditTaskModal
- **Description:** Verify Delete button appears in EditTaskModal footer
- **Steps:**
  1. Open Gantt tool
  2. Double-click any task to open EditTaskModal
- **Expected Result:**
  - Delete button visible in footer, left-aligned
  - Button has Trash2 icon and "Delete Task" text
  - Button has destructive (red) styling
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-VL-003: Footer Layout - Three Section Design
- **Description:** Verify footer has correct three-section layout
- **Steps:**
  1. Open EditPhaseModal
  2. Inspect footer layout
- **Expected Result:**
  - Left section: Delete button
  - Center section: Flexible spacer (flex: 1)
  - Right section: Cancel + Save Changes buttons
  - Gap between elements: 12px
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-VL-004: Delete Button Color - Destructive Variant
- **Description:** Verify Delete button uses correct destructive styling
- **Steps:**
  1. Open EditPhaseModal
  2. Inspect Delete button styles
- **Expected Result:**
  - Background color: #FF3B30 (COLORS.status.error)
  - Text color: white (#FFFFFF)
  - Hover state: darker red
  - Matches ModalButton destructive variant
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-VL-005: Delete Button Icon Alignment
- **Description:** Verify Trash2 icon properly aligned in button
- **Steps:**
  1. Open EditPhaseModal or EditTaskModal
  2. Inspect Delete button icon
- **Expected Result:**
  - Icon size: w-4 h-4 (16px)
  - Icon positioned left of text with mr-2 (8px margin-right)
  - Icon vertically centered
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-VL-006: Button Spacing and Alignment
- **Description:** Verify all footer buttons properly spaced
- **Steps:**
  1. Open EditPhaseModal
  2. Measure button spacing
- **Expected Result:**
  - Gap between all buttons: 12px
  - All buttons vertically centered (alignItems: center)
  - Footer width: 100%
  - Display: flex
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-VL-007: Delete Button Disabled State
- **Description:** Verify Delete button disables during form submission
- **Steps:**
  1. Open EditPhaseModal
  2. Make changes and click Save Changes
  3. Observe Delete button during submission
- **Expected Result:**
  - Delete button has disabled={isSubmitting} prop
  - Button becomes disabled while saving
  - Button re-enables after save completes
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-VL-008: Responsive Layout - Mobile View
- **Description:** Verify footer layout on mobile screens (<768px)
- **Steps:**
  1. Open EditPhaseModal
  2. Resize browser to 375px width (iPhone)
  3. Observe footer layout
- **Expected Result:**
  - Buttons remain visible and usable
  - Layout may stack vertically if needed
  - Delete button still clearly visible
  - Touch targets ≥44px (Apple HIG minimum)
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-VL-009: Hover State Visual Feedback
- **Description:** Verify Delete button provides hover feedback
- **Steps:**
  1. Open EditPhaseModal
  2. Hover over Delete button
  3. Observe visual changes
- **Expected Result:**
  - Background color darkens on hover
  - Cursor changes to pointer
  - Transition: smooth (0.15s ease)
  - Matches ModalButton hover behavior
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-VL-010: Focus State for Keyboard Navigation
- **Description:** Verify Delete button shows focus indicator
- **Steps:**
  1. Open EditPhaseModal
  2. Press Tab to navigate to Delete button
  3. Observe focus state
- **Expected Result:**
  - Clear focus ring visible
  - Focus ring color: blue (#007AFF)
  - Focus ring width: 2px
  - Ring offset: 2px
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-VL-011: Color Contrast Accessibility
- **Description:** Verify Delete button meets WCAG AAA contrast
- **Steps:**
  1. Open EditPhaseModal
  2. Use color contrast analyzer on Delete button
- **Expected Result:**
  - Text-to-background contrast ≥7:1 (WCAG AAA)
  - Icon contrast ≥7:1
  - Readable by users with color blindness
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-VL-012: Animation and Transitions
- **Description:** Verify smooth transitions on button interactions
- **Steps:**
  1. Open EditPhaseModal
  2. Interact with Delete button (hover, focus, click)
- **Expected Result:**
  - All state transitions smooth (0.15s ease)
  - No janky animations
  - 60fps animation performance
  - Matches Apple HIG spring physics
- **Priority:** P2
- **Status:** ⬜ Not Run

---

### Category 2: Functional Tests - Phase Deletion (15 scenarios)

#### TC-FP-001: Delete Button Click Opens Impact Modal
- **Description:** Clicking Delete in EditPhaseModal opens PhaseDeletionImpactModal
- **Steps:**
  1. Open EditPhaseModal for any phase
  2. Click "Delete Phase" button
- **Expected Result:**
  - PhaseDeletionImpactModal opens
  - EditPhaseModal remains open in background
  - Impact modal shows correct phase data
  - Impact analysis displays
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-002: Impact Modal Receives Correct Props
- **Description:** PhaseDeletionImpactModal receives all required props
- **Steps:**
  1. Open EditPhaseModal for phase with tasks
  2. Click Delete Phase
  3. Inspect modal props
- **Expected Result:**
  - phase: Current phase object
  - allPhases: currentProject.phases
  - allResources: currentProject.resources || []
  - holidays: currentProject.holidays || []
  - onConfirm: Delete handler function
  - onCancel: Close modal function
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-003: Delete Confirmation - Low Impact Phase
- **Description:** Delete phase with low impact (no tasks, no resources)
- **Steps:**
  1. Create empty phase
  2. Open EditPhaseModal
  3. Click Delete Phase
  4. Click Confirm in impact modal
- **Expected Result:**
  - Impact modal shows "Low" severity
  - Phase deletes successfully
  - Both modals close (impact + edit)
  - Phase removed from Gantt chart
  - No errors in console
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-004: Delete Confirmation - Medium Impact Phase
- **Description:** Delete phase with tasks but no dependencies
- **Steps:**
  1. Create phase with 2-3 tasks
  2. Open EditPhaseModal
  3. Click Delete Phase
  4. Review impact analysis
  5. Click Confirm
- **Expected Result:**
  - Impact modal shows "Medium" severity
  - Lists all tasks that will be deleted
  - Shows resource cost impact
  - Phase and tasks delete successfully
  - Both modals close
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-005: Delete Confirmation - High Impact Phase
- **Description:** Delete phase with tasks and resource assignments
- **Steps:**
  1. Create phase with 5+ tasks
  2. Assign resources to tasks
  3. Open EditPhaseModal
  4. Click Delete Phase
  5. Review detailed impact
- **Expected Result:**
  - Impact modal shows "High" severity
  - Lists all tasks (5+)
  - Shows total resource cost
  - Shows resource hours impact
  - Warning colors (orange/red)
  - Delete confirmation button orange
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-006: Delete Confirmation - Critical Impact Phase
- **Description:** Delete phase with dependencies and high resource cost
- **Steps:**
  1. Create phase with 10+ tasks, dependencies, resources
  2. Total cost > $10,000
  3. Open EditPhaseModal
  4. Click Delete Phase
- **Expected Result:**
  - Impact modal shows "Critical" severity
  - Red warning colors throughout
  - Detailed dependency list
  - Resource cost breakdown
  - Strong warning messages
  - Delete button red/critical color
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-007: Delete Cancellation from Impact Modal
- **Description:** Cancel deletion from impact modal
- **Steps:**
  1. Open EditPhaseModal
  2. Click Delete Phase
  3. In impact modal, click Cancel
- **Expected Result:**
  - Impact modal closes
  - EditPhaseModal remains open
  - Phase NOT deleted
  - showDeleteModal state set to false
  - Can continue editing phase
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-008: Delete Then Close Edit Modal
- **Description:** After deletion, both modals close properly
- **Steps:**
  1. Open EditPhaseModal
  2. Click Delete Phase
  3. Confirm deletion
- **Expected Result:**
  - Phase deletes successfully
  - Impact modal closes (setShowDeleteModal(false))
  - Edit modal closes (onClose())
  - Return to Gantt canvas view
  - Deleted phase no longer visible
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-009: Delete Phase with No Current Project
- **Description:** Handle edge case where currentProject is null
- **Steps:**
  1. Clear currentProject (simulate race condition)
  2. Try to open EditPhaseModal
  3. Attempt to click Delete
- **Expected Result:**
  - Delete button should not trigger if !currentProject
  - Conditional: showDeleteModal && currentProject && (...)
  - No runtime errors
  - Graceful degradation
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-FP-010: Holiday Calculation in Phase Deletion
- **Description:** Verify holidays array correctly passed to deletion modal
- **Steps:**
  1. Set project holidays (e.g., 5 holidays)
  2. Create phase with tasks
  3. Click Delete Phase
  4. Review working days calculation
- **Expected Result:**
  - holidays: currentProject.holidays || []
  - Working days exclude holidays
  - Impact modal shows accurate working day counts
  - No "holidays.some is not a function" error
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-011: Delete Phase While Form Has Unsaved Changes
- **Description:** Delete phase when edit form has pending changes
- **Steps:**
  1. Open EditPhaseModal
  2. Change phase name (don't save)
  3. Click Delete Phase
  4. Confirm deletion
- **Expected Result:**
  - Deletion proceeds (original phase data deleted)
  - Unsaved changes discarded
  - No save validation errors
  - Both modals close
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-FP-012: Delete Last Phase in Project
- **Description:** Delete when only one phase exists
- **Steps:**
  1. Create project with 1 phase
  2. Open EditPhaseModal
  3. Delete the phase
- **Expected Result:**
  - Phase deletes successfully
  - Project now has 0 phases
  - Gantt chart shows empty state
  - No rendering errors
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-FP-013: Delete Phase Updates Store State
- **Description:** Verify Zustand store updates after deletion
- **Steps:**
  1. Open EditPhaseModal
  2. Note current phase count
  3. Delete phase
  4. Inspect store state
- **Expected Result:**
  - deletePhase(phaseId) called correctly
  - currentProject.phases array updated
  - Phase removed from store
  - UI re-renders from store update
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FP-014: Rapid Delete Button Clicks (Debounce)
- **Description:** Prevent multiple deletion modals from rapid clicking
- **Steps:**
  1. Open EditPhaseModal
  2. Click Delete Phase rapidly (5 times in 1 second)
- **Expected Result:**
  - Only ONE impact modal opens
  - No duplicate modals
  - No multiple deletion calls
  - Button may need debouncing
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-FP-015: Delete Phase Error Handling
- **Description:** Handle deletion failures gracefully
- **Steps:**
  1. Open EditPhaseModal
  2. Mock deletePhase to throw error
  3. Confirm deletion
- **Expected Result:**
  - Error caught and handled
  - User sees error message/toast
  - Modals remain open or close gracefully
  - Phase not deleted
  - User can retry
- **Priority:** P1
- **Status:** ⬜ Not Run

---

### Category 3: Functional Tests - Task Deletion (15 scenarios)

#### TC-FT-001: Delete Button Click Opens Task Impact Modal
- **Description:** Clicking Delete in EditTaskModal opens TaskDeletionImpactModal
- **Steps:**
  1. Open EditTaskModal for any task
  2. Click "Delete Task" button
- **Expected Result:**
  - TaskDeletionImpactModal opens
  - EditTaskModal remains open in background
  - Impact modal shows correct task data
  - Impact analysis displays
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-002: Task Impact Modal Receives Correct Props
- **Description:** TaskDeletionImpactModal receives all required props
- **Steps:**
  1. Open EditTaskModal
  2. Click Delete Task
  3. Inspect modal props
- **Expected Result:**
  - task: Current task object
  - phase: Parent phase object
  - allTasks: phase.tasks || []
  - allResources: currentProject.resources || []
  - holidays: currentProject.holidays || []
  - onConfirm: Delete handler
  - onCancel: Close modal function
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-003: Delete Task - Low Impact (No Resources)
- **Description:** Delete task with no resource assignments
- **Steps:**
  1. Create task with no resources
  2. Open EditTaskModal
  3. Click Delete Task
  4. Confirm deletion
- **Expected Result:**
  - Impact modal shows "Low" severity
  - No resource cost shown
  - Task deletes successfully
  - Both modals close
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-004: Delete Task - Medium Impact (With Resources)
- **Description:** Delete task with 1-2 resource assignments
- **Steps:**
  1. Create task
  2. Assign 1-2 resources
  3. Open EditTaskModal
  4. Delete task
- **Expected Result:**
  - Impact modal shows "Medium" severity
  - Lists resource assignments
  - Shows cost impact ($500-$5000)
  - Task deletes successfully
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-005: Delete Task - High Impact (Multiple Resources + Dependencies)
- **Description:** Delete task with dependencies and high cost
- **Steps:**
  1. Create task with 3+ resources
  2. Add task dependencies (predecessors/successors)
  3. Open EditTaskModal
  4. Delete task
- **Expected Result:**
  - Impact modal shows "High" severity
  - Lists all dependencies
  - Shows total resource cost
  - Warning about dependency chain break
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-006: Delete Task - AMS Configured Task
- **Description:** Delete task with AMS configuration
- **Steps:**
  1. Create task with isAMS: true
  2. Set AMS minimum duration
  3. Open EditTaskModal
  4. Delete task
- **Expected Result:**
  - Impact modal shows AMS flag
  - Notes AMS-specific data will be lost
  - Task deletes including AMS config
  - No orphaned AMS data
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-FT-007: Cancel Task Deletion
- **Description:** Cancel deletion from task impact modal
- **Steps:**
  1. Open EditTaskModal
  2. Click Delete Task
  3. Click Cancel in impact modal
- **Expected Result:**
  - Impact modal closes
  - EditTaskModal remains open
  - Task NOT deleted
  - Can continue editing
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-008: Delete Task Closes Both Modals
- **Description:** After deletion, both modals close
- **Steps:**
  1. Open EditTaskModal
  2. Delete task
  3. Confirm
- **Expected Result:**
  - deleteTask(phaseId, taskId) called
  - Impact modal closes
  - Edit modal closes
  - Task removed from Gantt
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-009: Delete Task Without Phase Context
- **Description:** Handle edge case where phase is null
- **Steps:**
  1. Simulate phase being undefined
  2. Try to delete task
- **Expected Result:**
  - Conditional: showDeleteModal && currentProject && phase && (...)
  - No impact modal opens if !phase
  - No runtime errors
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-FT-010: Holiday Calculation in Task Deletion
- **Description:** Verify holidays correctly passed for working days
- **Steps:**
  1. Set project holidays
  2. Create task spanning holidays
  3. Delete task
  4. Review working days in impact modal
- **Expected Result:**
  - holidays: currentProject.holidays || []
  - Working days calculation excludes holidays
  - Accurate cost calculation
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-011: Delete Task with Unsaved Edits
- **Description:** Delete task when form has pending changes
- **Steps:**
  1. Open EditTaskModal
  2. Change task name (don't save)
  3. Delete task
- **Expected Result:**
  - Original task deleted (unsaved changes ignored)
  - Both modals close
  - No save validation
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-FT-012: Delete Last Task in Phase
- **Description:** Delete when phase has only one task
- **Steps:**
  1. Create phase with 1 task
  2. Delete that task
- **Expected Result:**
  - Task deletes successfully
  - Phase now has 0 tasks
  - Phase remains (only task removed)
  - No errors
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-FT-013: Delete Task Updates Store
- **Description:** Verify store updates after task deletion
- **Steps:**
  1. Open EditTaskModal
  2. Delete task
  3. Inspect store state
- **Expected Result:**
  - deleteTask(phaseId, taskId) called
  - Task removed from phase.tasks array
  - Store state updated
  - UI re-renders
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-FT-014: Rapid Task Delete Clicks
- **Description:** Prevent duplicate modals from rapid clicking
- **Steps:**
  1. Open EditTaskModal
  2. Click Delete Task 5 times rapidly
- **Expected Result:**
  - Only one impact modal opens
  - No duplicate deletions
  - May need debouncing
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-FT-015: Delete Task Error Handling
- **Description:** Handle deletion failures
- **Steps:**
  1. Mock deleteTask to throw error
  2. Attempt deletion
- **Expected Result:**
  - Error caught gracefully
  - User notified
  - Task not deleted
  - Can retry
- **Priority:** P1
- **Status:** ⬜ Not Run

---

### Category 4: Integration Tests (12 scenarios)

#### TC-INT-001: Delete from Edit Modal vs Canvas Trash Icon
- **Description:** Compare delete flows from both entry points
- **Steps:**
  1. Delete task via Edit modal Delete button
  2. Delete task via canvas trash icon
  3. Compare user experience
- **Expected Result:**
  - Both flows use same TaskDeletionImpactModal
  - Same impact analysis shown
  - Same deletion logic executed
  - Consistent UX
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-INT-002: Edit Modal Integration with Gantt Store
- **Description:** Verify proper store integration
- **Steps:**
  1. Open EditPhaseModal
  2. Delete phase
  3. Check store updates
  4. Verify canvas re-renders
- **Expected Result:**
  - deletePhase calls store method
  - Store state updated via Zustand
  - Canvas subscribes to store changes
  - UI updates reactively
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-INT-003: Multiple Modals Open Simultaneously
- **Description:** Handle Edit + Impact modals both open
- **Steps:**
  1. Open EditPhaseModal
  2. Click Delete (Impact modal opens)
  3. Both modals now visible
- **Expected Result:**
  - Both modals render correctly
  - Impact modal in front (higher z-index)
  - Edit modal blurred/dimmed behind
  - Clicking Cancel closes only impact modal
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-INT-004: Focus Trap with Two Modals
- **Description:** Verify focus management with nested modals
- **Steps:**
  1. Open EditPhaseModal (has FocusTrap)
  2. Click Delete (Impact modal opens)
  3. Press Tab repeatedly
- **Expected Result:**
  - Focus trapped in Impact modal
  - Cannot tab to Edit modal behind
  - Escape key closes Impact modal
  - Focus returns to Edit modal
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-INT-005: Deletion Updates Project Metrics
- **Description:** Verify project metrics recalculate after deletion
- **Steps:**
  1. Note total project cost, duration, resource hours
  2. Delete high-cost phase
  3. Check updated metrics
- **Expected Result:**
  - Total cost decreases
  - Duration may decrease
  - Resource hours recalculated
  - Metrics shown in GanttSidePanel update
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-INT-006: Undo/Redo After Deletion
- **Description:** Test if deletion can be undone
- **Steps:**
  1. Delete phase via Edit modal
  2. Look for undo option
  3. Attempt to restore
- **Expected Result:**
  - Current implementation: No undo (immediate deletion)
  - Future enhancement: UndoToast component
  - Document current behavior
  - Note as future improvement
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-INT-007: Delete Phase Updates Timeline
- **Description:** Verify timeline view updates after phase deletion
- **Steps:**
  1. View project timeline
  2. Delete phase from Edit modal
  3. Check timeline
- **Expected Result:**
  - Phase removed from timeline
  - Timeline re-renders
  - Other phases shift if needed
  - No gaps or overlaps
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-INT-008: Delete Task Updates Resource Utilization
- **Description:** Resource utilization chart updates after task deletion
- **Steps:**
  1. Open ResourceDrawer
  2. Note resource allocation
  3. Delete task with resource assignments
  4. Check utilization updates
- **Expected Result:**
  - Resource hours decrease
  - Utilization % decreases
  - Chart updates in real-time
  - No stale data
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-INT-009: Network Request After Deletion
- **Description:** Verify API call to persist deletion
- **Steps:**
  1. Delete phase
  2. Monitor network tab
  3. Check API calls
- **Expected Result:**
  - DELETE or PATCH request sent
  - Server updates database
  - Response confirms deletion
  - Store updated after success
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-INT-010: Delete Phase with Active Baseline
- **Description:** Delete phase when baseline comparison active
- **Steps:**
  1. Create baseline snapshot
  2. Enable baseline comparison view
  3. Delete phase
  4. Check baseline view
- **Expected Result:**
  - Current version: phase deleted
  - Baseline version: phase still visible
  - Comparison shows deletion
  - No rendering conflicts
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-INT-011: Export After Deletion
- **Description:** Verify export functions work after deletion
- **Steps:**
  1. Delete phase/task
  2. Export project to Excel
  3. Verify exported data
- **Expected Result:**
  - Deleted items not in export
  - Excel structure valid
  - No references to deleted entities
  - Clean export
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-INT-012: Browser Back Button After Deletion
- **Description:** Handle browser navigation after deletion
- **Steps:**
  1. Delete phase
  2. Click browser back button
- **Expected Result:**
  - Handles navigation gracefully
  - No errors attempting to load deleted phase
  - Shows valid project state
- **Priority:** P2
- **Status:** ⬜ Not Run

---

### Category 5: Keyboard & Accessibility Tests (10 scenarios)

#### TC-ACC-001: Tab Navigation to Delete Button
- **Description:** Navigate to Delete button using keyboard
- **Steps:**
  1. Open EditPhaseModal
  2. Press Tab repeatedly
  3. Navigate to Delete button
- **Expected Result:**
  - Delete button receives focus
  - Clear focus indicator visible
  - Tab order: Form fields → Delete → Cancel → Save
  - Logical tab sequence
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-ACC-002: Enter Key Activates Delete Button
- **Description:** Trigger delete with Enter key
- **Steps:**
  1. Tab to Delete button
  2. Press Enter
- **Expected Result:**
  - Impact modal opens
  - Same behavior as clicking
  - No form submission
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-ACC-003: Space Key Activates Delete Button
- **Description:** Trigger delete with Space key
- **Steps:**
  1. Tab to Delete button
  2. Press Space
- **Expected Result:**
  - Impact modal opens
  - Button activation confirmed
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-ACC-004: Escape Key Closes Impact Modal
- **Description:** Close impact modal with Escape
- **Steps:**
  1. Click Delete Phase
  2. Impact modal opens
  3. Press Escape
- **Expected Result:**
  - Impact modal closes
  - Focus returns to Delete button
  - Edit modal remains open
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-ACC-005: Screen Reader Announces Delete Button
- **Description:** Verify screen reader support
- **Steps:**
  1. Enable VoiceOver (macOS) or NVDA (Windows)
  2. Navigate to Delete button
- **Expected Result:**
  - Announces "Delete Phase" or "Delete Task"
  - Announces button role
  - Announces destructive nature if possible
  - Clear, descriptive label
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-ACC-006: ARIA Labels and Roles
- **Description:** Verify ARIA attributes on Delete button
- **Steps:**
  1. Inspect Delete button HTML
  2. Check ARIA attributes
- **Expected Result:**
  - role="button"
  - aria-label descriptive
  - aria-disabled when isSubmitting
  - Follows WAI-ARIA best practices
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-ACC-007: Focus Trap in Impact Modal
- **Description:** Keyboard users can't escape impact modal
- **Steps:**
  1. Open impact modal
  2. Press Tab repeatedly
- **Expected Result:**
  - Focus cycles within modal only
  - Cannot tab to background elements
  - Modal has FocusTrap
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-ACC-008: Color Contrast for Low Vision
- **Description:** Test color contrast ratios
- **Steps:**
  1. Use axe DevTools or Lighthouse
  2. Check Delete button contrast
- **Expected Result:**
  - WCAG AAA compliance (7:1 ratio)
  - Text readable with low vision
  - Icon contrast sufficient
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-ACC-009: High Contrast Mode
- **Description:** Test in Windows High Contrast mode
- **Steps:**
  1. Enable Windows High Contrast
  2. Open EditPhaseModal
  3. Check Delete button visibility
- **Expected Result:**
  - Button visible and usable
  - Border or outline visible
  - Icon visible
  - Text readable
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-ACC-010: Reduced Motion Preference
- **Description:** Respect prefers-reduced-motion
- **Steps:**
  1. Enable reduced motion in OS
  2. Trigger delete flow
- **Expected Result:**
  - Modal animations disabled or simplified
  - No problematic motion
  - Still functional
- **Priority:** P2
- **Status:** ⬜ Not Run

---

### Category 6: Error Handling & Edge Cases (8 scenarios)

#### TC-ERR-001: Delete with Network Offline
- **Description:** Attempt deletion while offline
- **Steps:**
  1. Disable network connection
  2. Delete phase
  3. Confirm
- **Expected Result:**
  - Error message shown
  - User notified of offline state
  - Deletion not persisted
  - Can retry when online
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-ERR-002: Delete with Slow Network
- **Description:** Deletion with high latency
- **Steps:**
  1. Throttle network to 3G
  2. Delete phase
  3. Observe loading states
- **Expected Result:**
  - Loading indicator shown
  - Button disabled during request
  - User notified when complete
  - No timeout errors
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-ERR-003: Concurrent Deletions
- **Description:** Two users delete same phase simultaneously
- **Steps:**
  1. User A starts deleting phase
  2. User B deletes same phase
  3. User A confirms
- **Expected Result:**
  - Server handles conflict
  - User A notified phase already deleted
  - Graceful error handling
  - UI updates correctly
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-ERR-004: Delete Non-Existent Phase
- **Description:** Try deleting already-deleted phase
- **Steps:**
  1. Open EditPhaseModal
  2. Delete phase from another browser tab
  3. Click Delete in first tab
- **Expected Result:**
  - Error caught
  - User notified phase doesn't exist
  - Modal closes gracefully
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-ERR-005: Delete with Invalid Permissions
- **Description:** User without delete permission attempts deletion
- **Steps:**
  1. Log in as view-only user
  2. Try to delete phase
- **Expected Result:**
  - Delete button hidden or disabled
  - Or deletion request returns 403 Forbidden
  - User notified of insufficient permissions
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-ERR-006: Browser Crash During Deletion
- **Description:** Simulate browser crash mid-deletion
- **Steps:**
  1. Start deletion process
  2. Force browser crash
  3. Restart and check project state
- **Expected Result:**
  - If deletion sent to server: completed
  - If not sent: phase still exists
  - No corrupted state
  - Database consistency maintained
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-ERR-007: Delete with Console Errors
- **Description:** Verify no console errors during deletion
- **Steps:**
  1. Open browser console
  2. Delete phase and task
  3. Monitor console
- **Expected Result:**
  - Zero console errors
  - Zero console warnings (except known debug warnings)
  - Clean execution
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-ERR-008: Memory Leaks from Repeated Deletions
- **Description:** Test for memory leaks
- **Steps:**
  1. Delete 50 phases in sequence
  2. Monitor memory usage
- **Expected Result:**
  - Memory usage stable
  - No memory leaks
  - Modals properly unmounted
  - Event listeners cleaned up
- **Priority:** P2
- **Status:** ⬜ Not Run

---

### Category 7: Performance Tests (4 scenarios)

#### TC-PERF-001: Delete Button Render Time
- **Description:** Measure time to render Delete button
- **Steps:**
  1. Open EditPhaseModal
  2. Measure render time
- **Expected Result:**
  - Button renders in <50ms
  - No layout shift
  - 60fps animation
- **Priority:** P2
- **Status:** ⬜ Not Run

#### TC-PERF-002: Impact Modal Open Time
- **Description:** Time from click to impact modal display
- **Steps:**
  1. Click Delete Phase
  2. Measure time to modal visible
- **Expected Result:**
  - Modal opens in <100ms
  - Impact calculation <200ms for 100 tasks
  - Smooth animation
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-PERF-003: Large Project Deletion Performance
- **Description:** Delete from project with 100+ phases
- **Steps:**
  1. Create project with 100 phases, 500 tasks
  2. Delete a phase
  3. Measure performance
- **Expected Result:**
  - Impact calculation <500ms
  - Modal opens promptly
  - No UI freezing
  - Responsive during deletion
- **Priority:** P1
- **Status:** ⬜ Not Run

#### TC-PERF-004: Deletion API Response Time
- **Description:** Measure server-side deletion time
- **Steps:**
  1. Delete phase
  2. Monitor network request time
- **Expected Result:**
  - API response <1000ms
  - Database transaction completes
  - Optimized query performance
- **Priority:** P2
- **Status:** ⬜ Not Run

---

### Category 8: Cross-Browser & Device Tests (4 scenarios)

#### TC-CROSS-001: Chrome Desktop
- **Description:** Test on Chrome (latest)
- **Steps:**
  1. Open in Chrome
  2. Test all delete flows
- **Expected Result:**
  - All functionality works
  - Visual appearance correct
  - No browser-specific issues
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-CROSS-002: Safari Desktop
- **Description:** Test on Safari (macOS)
- **Steps:**
  1. Open in Safari
  2. Test delete functionality
- **Expected Result:**
  - Webkit rendering correct
  - Framer Motion animations work
  - Modal overlays correct
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-CROSS-003: Mobile Safari (iOS)
- **Description:** Test on iPhone
- **Steps:**
  1. Open on iPhone Safari
  2. Test delete button on touch
- **Expected Result:**
  - Touch targets ≥44px
  - Delete button tappable
  - Modals display correctly
  - Scrolling works
- **Priority:** P0
- **Status:** ⬜ Not Run

#### TC-CROSS-004: Firefox Desktop
- **Description:** Test on Firefox (latest)
- **Steps:**
  1. Open in Firefox
  2. Test deletion flows
- **Expected Result:**
  - Gecko rendering correct
  - All functionality works
  - No Firefox-specific bugs
- **Priority:** P1
- **Status:** ⬜ Not Run

---

## Test Execution Summary

### Total Scenarios: 76

**By Priority:**
- **P0 (Critical):** 38 scenarios
- **P1 (High):** 27 scenarios
- **P2 (Medium):** 11 scenarios

**By Category:**
- Visual & Layout: 12 scenarios
- Functional - Phase: 15 scenarios
- Functional - Task: 15 scenarios
- Integration: 12 scenarios
- Accessibility: 10 scenarios
- Error Handling: 8 scenarios
- Performance: 4 scenarios
- Cross-Browser: 4 scenarios

---

## Test Environment Requirements

### Hardware:
- macOS device (for Safari testing)
- Windows device (for High Contrast mode)
- iOS device (iPhone for mobile testing)
- Android device (optional)

### Software:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- VoiceOver (macOS) or NVDA (Windows)
- Network throttling tools
- axe DevTools or Lighthouse
- Performance monitoring tools

### Test Data:
- Empty project
- Project with 1 phase, 1 task
- Project with 10 phases, 50 tasks
- Project with 100 phases, 500 tasks
- Project with resource assignments
- Project with holidays configured
- Project with AMS tasks
- Project with baselines

---

## Success Criteria

### Must Pass (100%):
- All P0 scenarios (38/38)
- All P1 scenarios (27/27)

### Should Pass (90%+):
- P2 scenarios (10/11 minimum)

### Overall Target:
- **73/76 scenarios passing (96%)**

### Zero Tolerance:
- ❌ No console errors
- ❌ No runtime exceptions
- ❌ No data loss
- ❌ No accessibility violations (WCAG AA minimum)

---

## Test Execution Log Template

```
Test ID: TC-XX-XXX
Test Name: [Name]
Tested By: [Name]
Date: [YYYY-MM-DD]
Environment: [Browser/Device]
Result: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
Notes: [Any observations]
Screenshot: [If applicable]
Console Errors: [Yes/No - list if yes]
```

---

## Defect Tracking

### Critical Defects (P0):
- Must be fixed before release
- Block deployment

### High Defects (P1):
- Should be fixed in same release
- May require hotfix

### Medium Defects (P2):
- Fix in next release
- Document workaround

---

## Regression Test Checklist

After implementing delete integration, verify:

- [ ] Existing canvas trash icon delete still works
- [ ] GanttSidePanel phase/task lists update
- [ ] Project metrics recalculate correctly
- [ ] Resource utilization updates
- [ ] Timeline view updates
- [ ] Baseline comparison still functions
- [ ] Export to Excel includes correct data
- [ ] Undo/redo functionality (if implemented)
- [ ] Search functionality excludes deleted items
- [ ] Deep links to deleted items handled gracefully

---

## Test Automation Recommendations

### High-Value Automation Targets:
1. Delete phase/task happy paths (TC-FP-003, TC-FT-003)
2. Impact modal prop validation (TC-FP-002, TC-FT-002)
3. Store state updates (TC-FP-013, TC-FT-013)
4. Console error detection (TC-ERR-007)
5. Accessibility ARIA checks (TC-ACC-006)

### Manual Testing Required:
- Visual appearance (human judgment)
- Screen reader testing (requires assistive tech)
- Cross-browser nuances
- Performance feel/smoothness
- User experience flows

---

## Apple-Standard QA Checklist

Following Jobs/Ive Excellence Principles:

✅ **Simplicity**
- Delete button clear and obvious
- One-click access to deletion
- No confusing workflows

✅ **Consistency**
- Same UX for phase and task deletion
- Matches existing impact modal patterns
- Follows BaseModal design system

✅ **Forgiveness**
- Impact modal prevents accidental deletion
- Shows consequences before confirming
- Clear cancel option

✅ **Beauty**
- Apple HIG color palette
- Smooth animations (60fps)
- Attention to detail (8px spacing grid)

✅ **Quality**
- Zero console errors
- Zero crashes
- Zero data loss

---

## Sign-Off

**QA Lead:** _____________________ Date: _____
**Engineering Lead:** _____________________ Date: _____
**Product Owner:** _____________________ Date: _____

---

## Appendix A: Test Data Setup Scripts

```typescript
// Create test project with 100 phases
async function createLargeTestProject() {
  const project = await createProject({ name: "QA Test - Large" });
  for (let i = 1; i <= 100; i++) {
    await createPhase({
      projectId: project.id,
      name: `Phase ${i}`,
      startDate: addDays(new Date(), i * 7),
      endDate: addDays(new Date(), i * 7 + 5),
    });
  }
  return project;
}

// Create test phase with tasks and resources
async function createComplexPhase(projectId: string) {
  const phase = await createPhase({
    projectId,
    name: "QA Test - Complex Phase",
    startDate: new Date(),
    endDate: addDays(new Date(), 30),
  });

  // Add 10 tasks
  for (let i = 1; i <= 10; i++) {
    const task = await createTask({
      phaseId: phase.id,
      name: `Test Task ${i}`,
      startDate: addDays(new Date(), i),
      endDate: addDays(new Date(), i + 2),
    });

    // Assign 2 resources to each task
    await assignResource(task.id, "resource-1", 100);
    await assignResource(task.id, "resource-2", 50);
  }

  return phase;
}
```

---

## Appendix B: Manual Test Script

### Quick Manual Test (15 minutes)

**Phase Deletion Test:**
1. Open http://localhost:3000/gantt-tool/v3
2. Select any project
3. Double-click phase to open EditPhaseModal
4. Verify Delete button visible (left side, red)
5. Click Delete Phase
6. Verify impact modal opens
7. Click Cancel → modal closes, phase still exists
8. Click Delete Phase again
9. Click Confirm → both modals close, phase deleted ✅

**Task Deletion Test:**
1. Double-click task to open EditTaskModal
2. Verify Delete button visible (left side, red)
3. Click Delete Task
4. Verify impact modal shows task details
5. Click Cancel → modal closes, task still exists
6. Click Delete Task again
7. Click Confirm → both modals close, task deleted ✅

**Keyboard Test:**
1. Open EditPhaseModal
2. Press Tab until Delete button focused
3. Verify focus ring visible
4. Press Enter → impact modal opens ✅
5. Press Escape → impact modal closes ✅

**Console Check:**
1. Open DevTools Console
2. Perform all above tests
3. Verify zero errors ✅

---

*End of Comprehensive Test Plan*
*Total Coverage: 76 test scenarios*
*Standards: Apple HIG, WCAG 2.1 AAA, Jobs/Ive Excellence*
