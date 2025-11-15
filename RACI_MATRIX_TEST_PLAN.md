# RACI Matrix Feature - Test Plan

## Test Scenarios

### 1. Phase RACI Assignment

**Test Case 1.1: Assign RACI to Phase**
- **Steps**:
  1. Open project with phases
  2. Click on a phase to edit
  3. Scroll to "RACI Matrix" section
  4. Click "Edit RACI Matrix" button
  5. Select resource roles:
     - Resource 1: Responsible (R)
     - Resource 2: Accountable (A)
     - Resource 3: Consulted (C)
     - Resource 4: Informed (I)
  6. Click "Save RACI"
- **Expected**:
  - Summary shows: "1 Responsible, 1 Accountable, 1 Consulted, 1 Informed"
  - Phase saves successfully
  - RACI data persists after page refresh

**Test Case 1.2: Edit Existing Phase RACI**
- **Steps**:
  1. Open phase with existing RACI
  2. Click "Edit RACI Matrix"
  3. Change Resource 1 from R to C
  4. Click "Save RACI"
- **Expected**:
  - Summary updates: "0 Responsible, 1 Accountable, 2 Consulted, 1 Informed"
  - Changes save successfully

**Test Case 1.3: Remove All RACI**
- **Steps**:
  1. Open phase with RACI
  2. Click "Edit RACI Matrix"
  3. Set all resources to "No Role" (-)
  4. Click "Save RACI"
- **Expected**:
  - Summary shows: "No RACI assignments yet"
  - Warning about no Accountable (non-blocking)

---

### 2. Task RACI Assignment

**Test Case 2.1: Assign RACI to Task**
- **Steps**:
  1. Open task in edit mode
  2. Click "Edit RACI Matrix" button
  3. Assign roles to resources
  4. Click "Save RACI"
- **Expected**:
  - Task RACI saves successfully
  - Summary displays correctly
  - Data persists

**Test Case 2.2: Task RACI Independent of Phase RACI**
- **Steps**:
  1. Assign RACI to a phase
  2. Assign different RACI to a task within that phase
  3. Verify both are saved separately
- **Expected**:
  - Phase RACI and Task RACI are independent
  - Both persist correctly

---

### 3. Validation

**Test Case 3.1: Prevent Multiple Accountables**
- **Steps**:
  1. Open RACI editor
  2. Assign Resource 1 as Accountable (A)
  3. Assign Resource 2 as Accountable (A)
  4. Try to click "Save RACI"
- **Expected**:
  - Red error message: "Only one resource can be Accountable. Please select one."
  - Save button still enabled (allows user to fix)
  - No data saved

**Test Case 3.2: Warning for No Accountable**
- **Steps**:
  1. Open RACI editor
  2. Assign R, C, I but not A
  3. Click "Save RACI"
- **Expected**:
  - Orange warning: "Warning: No Accountable assigned. Consider assigning one."
  - Save succeeds (non-blocking warning)

**Test Case 3.3: Valid RACI (1 Accountable)**
- **Steps**:
  1. Open RACI editor
  2. Assign exactly 1 Accountable
  3. Click "Save RACI"
- **Expected**:
  - No errors or warnings
  - Save succeeds immediately

---

### 4. Collapsed Phase Preview

**Test Case 4.1: RACI Display in Preview**
- **Steps**:
  1. Assign RACI to a phase (1R, 1A, 2C, 3I)
  2. Collapse the phase
  3. Hover over collapsed phase bar
- **Expected**:
  - Tooltip shows "RACI Matrix" section
  - Displays: R:1, A:1, C:2, I:3
  - Color-coded badges match role colors

**Test Case 4.2: No RACI - Hide Section**
- **Steps**:
  1. Collapse a phase with no RACI assignments
  2. Hover over collapsed phase bar
- **Expected**:
  - Tooltip does NOT show "RACI Matrix" section
  - Other info (tasks, resources, duration) still visible

---

### 5. Excel Export

**Test Case 5.1: Export Project with RACI**
- **Steps**:
  1. Create project with:
     - Phase 1: 1R, 1A, 2C
     - Task 1.1: 1R, 1A, 1I
     - Task 1.2: 2R, 1A
  2. Click Export → Excel
  3. Open Excel file
  4. Navigate to "RACI Matrix" sheet
- **Expected**:
  - Sheet exists with proper formatting
  - Resources in rows, items in columns
  - R/A/C/I codes correctly displayed
  - Phase and Task items distinguished

**Test Case 5.2: Export Project without RACI**
- **Steps**:
  1. Create project with no RACI assignments
  2. Export to Excel
  3. Open "RACI Matrix" sheet
- **Expected**:
  - Sheet shows: "No RACI assignments defined for this project"

---

### 6. UI/UX

**Test Case 6.1: Keyboard Navigation**
- **Steps**:
  1. Open RACI editor
  2. Press Tab to navigate between resource role buttons
  3. Press Enter to select a role
  4. Press Cmd/Ctrl+Enter to save
- **Expected**:
  - Tab navigation works correctly
  - Enter selects/toggles role
  - Keyboard shortcut saves

**Test Case 6.2: Accessibility**
- **Steps**:
  1. Use screen reader (VoiceOver/NVDA)
  2. Navigate RACI editor
- **Expected**:
  - All elements have proper ARIA labels
  - Resource names read correctly
  - Role buttons read as "Set [Resource] as [Role]"

**Test Case 6.3: Responsive Design**
- **Steps**:
  1. Open RACI editor on different screen sizes
  2. Test on mobile, tablet, desktop
- **Expected**:
  - Modal adapts to screen size
  - Role buttons remain usable
  - Summary displays correctly

---

### 7. Edge Cases

**Test Case 7.1: Project with No Resources**
- **Steps**:
  1. Create project with no resources
  2. Try to open RACI editor
- **Expected**:
  - Message: "No resources available. Add resources to the project first."

**Test Case 7.2: Many Resources (50+)**
- **Steps**:
  1. Create project with 50+ resources
  2. Open RACI editor
  3. Assign roles to multiple resources
- **Expected**:
  - Modal scrolls properly
  - Performance remains acceptable (< 100ms)
  - All resources accessible

**Test Case 7.3: Long Resource/Item Names**
- **Steps**:
  1. Create resource with very long name (100+ chars)
  2. Create phase with very long name
  3. Assign RACI and export to Excel
- **Expected**:
  - Names truncate with ellipsis in UI
  - Full names visible in Excel

---

### 8. Data Persistence

**Test Case 8.1: Auto-Save**
- **Steps**:
  1. Assign RACI to phase
  2. Click "Save RACI"
  3. Refresh page immediately
- **Expected**:
  - RACI data persists
  - Summary displays correctly after refresh

**Test Case 8.2: Undo/Redo**
- **Steps**:
  1. Assign RACI to phase
  2. Press Cmd/Ctrl+Z to undo
  3. Press Cmd/Ctrl+Shift+Z to redo
- **Expected**:
  - RACI assignment undoes correctly
  - RACI assignment redoes correctly

**Test Case 8.3: Database Sync**
- **Steps**:
  1. Assign RACI to phase
  2. Check database directly (Prisma Studio)
- **Expected**:
  - raciAssignments field populated correctly
  - All role data accurate

---

### 9. Integration

**Test Case 9.1: RACI with Resource Assignment**
- **Steps**:
  1. Assign Resource 1 to Task 1 (Resource Assignment)
  2. Assign Resource 1 as Responsible for Task 1 (RACI)
- **Expected**:
  - Both assignments coexist independently
  - No conflicts or errors

**Test Case 9.2: Delete Resource with RACI**
- **Steps**:
  1. Assign Resource 1 as Accountable for Phase 1
  2. Delete Resource 1 from project
- **Expected**:
  - RACI assignment removed automatically OR
  - Warning shown before deletion OR
  - Orphaned RACI handled gracefully

**Test Case 9.3: Delete Phase with RACI**
- **Steps**:
  1. Assign RACI to Phase 1
  2. Delete Phase 1
- **Expected**:
  - Phase deletion proceeds normally
  - RACI data deleted with phase

---

## Performance Benchmarks

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Open RACI Editor | < 50ms | < 100ms |
| Assign Role | < 10ms | < 50ms |
| Save RACI (local) | < 100ms | < 200ms |
| Save RACI (DB) | < 300ms | < 500ms |
| Excel Export (50 items) | < 1s | < 2s |
| Excel Export (200 items) | < 3s | < 5s |

---

## Browser Compatibility

Test on:
- ✅ Chrome 120+
- ✅ Safari 17+
- ✅ Firefox 120+
- ✅ Edge 120+

---

## Accessibility Checklist

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support (ARIA labels)
- ✅ Focus indicators visible
- ✅ Color contrast WCAG AA compliant
- ✅ No keyboard traps
- ✅ Error messages announced

---

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 Assign Phase RACI | ⏳ Pending | |
| 1.2 Edit Phase RACI | ⏳ Pending | |
| 1.3 Remove All RACI | ⏳ Pending | |
| 2.1 Assign Task RACI | ⏳ Pending | |
| 2.2 Independent RACI | ⏳ Pending | |
| 3.1 Multiple Accountable | ⏳ Pending | |
| 3.2 No Accountable Warning | ⏳ Pending | |
| 3.3 Valid RACI | ⏳ Pending | |
| 4.1 Preview Display | ⏳ Pending | |
| 4.2 Preview No RACI | ⏳ Pending | |
| 5.1 Excel Export with RACI | ⏳ Pending | |
| 5.2 Excel Export no RACI | ⏳ Pending | |
| 6.1 Keyboard Navigation | ⏳ Pending | |
| 6.2 Accessibility | ⏳ Pending | |
| 6.3 Responsive Design | ⏳ Pending | |
| 7.1 No Resources | ⏳ Pending | |
| 7.2 Many Resources | ⏳ Pending | |
| 7.3 Long Names | ⏳ Pending | |
| 8.1 Auto-Save | ⏳ Pending | |
| 8.2 Undo/Redo | ⏳ Pending | |
| 8.3 Database Sync | ⏳ Pending | |
| 9.1 RACI + Resource | ⏳ Pending | |
| 9.2 Delete Resource | ⏳ Pending | |
| 9.3 Delete Phase | ⏳ Pending | |

Legend:
- ⏳ Pending
- ✅ Pass
- ❌ Fail
- ⚠️ Issue Found

---

## Sign-Off

- **Developer**: Implementation Complete ✅
- **QA**: Testing Pending ⏳
- **Product Owner**: Acceptance Pending ⏳
- **Release**: Not Yet Deployed ⏳
