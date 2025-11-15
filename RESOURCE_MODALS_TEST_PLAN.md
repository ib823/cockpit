# Resource Planning Modals - Comprehensive Test Plan

**Status:** Ready for QA
**Date:** 2025-11-14
**Refactored Modals:** 4/4

---

## Test Scope

All 4 Resource Planning modals have been refactored to use BaseModal. This test plan ensures 100% functionality is preserved.

---

## Modal 1: ResourcePlanningModal

**File:** `src/components/gantt-tool/ResourcePlanningModal.tsx`
**Access:** Via resource planning feature

### Test Cases

#### TC-RP-001: Modal Opens/Closes
- [ ] Modal opens with correct title "Resource Planning"
- [ ] Subtitle displays correctly
- [ ] Users icon visible in header
- [ ] Close button (X) works
- [ ] Escape key closes modal
- [ ] Click overlay closes modal
- [ ] Body scroll prevented when open

#### TC-RP-002: Tab Navigation
- [ ] "Role Templates" tab is active by default
- [ ] Click "Team Structure" tab switches view
- [ ] Click "Cost Planning" tab switches view
- [ ] Active tab has blue background
- [ ] Inactive tabs have gray text
- [ ] Tab content switches correctly

#### TC-RP-003: Role Templates Tab
- [ ] All default roles display (PM, FI, MM, ABAP, Basis, Security)
- [ ] Categories can be expanded/collapsed (ChevronDown/Right)
- [ ] Role cards show: name, description, skillsets, daily rate
- [ ] "Add Role Template" button visible
- [ ] "Add {Role Name}" button appears for each role

#### TC-RP-004: Placeholder Management
- [ ] Click "Add SAP FI Consultant" creates placeholder
- [ ] Placeholder shows as "SAP FI Consultant #1"
- [ ] Second placeholder shows as "#2"
- [ ] Placeholder appears under role card
- [ ] Trash icon visible on each placeholder
- [ ] Click trash removes placeholder
- [ ] Confirm deletion (if applicable)

#### TC-RP-005: Team Structure Tab
- [ ] Tab content displays
- [ ] "Org chart visualization coming soon..." message shows
- [ ] Drag and drop hint visible

#### TC-RP-006: Cost Planning Tab
- [ ] Total Team count displays correctly
- [ ] Daily Burn Rate calculates correctly (sum of all placeholder rates)
- [ ] 1 Month (20 days) projection = Daily Rate × 20
- [ ] 3 Months projection = Daily Rate × 60
- [ ] 6 Months projection = Daily Rate × 120
- [ ] Currency shows as EUR

#### TC-RP-007: Footer
- [ ] Shows "{N} team member(s) • EUR {X}/day"
- [ ] Count updates when placeholders added/removed
- [ ] Daily cost updates in real-time
- [ ] Cancel button visible and works
- [ ] Save button visible
- [ ] Save logs to console (TODO marker)

#### TC-RP-008: Data Persistence (Current Session)
- [ ] Add placeholders in Role Templates tab
- [ ] Switch to Cost Planning tab
- [ ] Counts and costs reflect added placeholders
- [ ] Switch back to Role Templates
- [ ] Placeholders still visible

---

## Modal 2: ResourcePlanningModalV2

**File:** `src/components/gantt-tool/ResourcePlanningModalV2.tsx`
**Access:** Via resource planning V2 feature

### Test Cases

#### TC-RPV2-001: Modal Opens/Closes
- [ ] Modal opens with title "Team Structure & Resource Planning"
- [ ] Subtitle displays correctly
- [ ] Users2 icon visible
- [ ] Close button works
- [ ] Escape key closes
- [ ] Overlay click closes

#### TC-RPV2-002: Cost Summary Banner
- [ ] "Daily Burn Rate" label visible
- [ ] Cost displays in EUR with commas
- [ ] Person count shows correctly
- [ ] Banner has blue background
- [ ] Updates in real-time when team members added/removed

#### TC-RPV2-003: Role Library (Left Column)
- [ ] All 6 default roles display
- [ ] Each role shows: name, category, daily rate, skillsets
- [ ] "Role Library" header visible
- [ ] Roles have border and hover effect
- [ ] Tip message displays at bottom

#### TC-RPV2-004: Drag and Drop - Roles to Departments
- [ ] **CRITICAL:** Drag role from left library
- [ ] Cursor changes to grab
- [ ] Hover over client department highlights it (blue background)
- [ ] Drop role on department creates team member
- [ ] Team member appears under "Your Team" section
- [ ] Team member shows: placeholder name, role name, daily rate
- [ ] Multiple members can be dropped on same department
- [ ] Drag-drop works for all 3 default departments

#### TC-RPV2-005: Client Structure (Right Column)
- [ ] "Organization Structure" header visible
- [ ] "Edit Client Structure" button visible
- [ ] 3 default departments display:
  - [ ] Finance Department
  - [ ] Operations Department
  - [ ] IT Department
- [ ] Each has Building2 icon
- [ ] Each shows "Client department" label

#### TC-RPV2-006: Team Member Management
- [ ] Team members appear under assigned department
- [ ] Count shows: "Your Team (N)"
- [ ] Placeholder name displays (e.g., "Project Manager #1")
- [ ] Role name shows below
- [ ] Daily rate visible with € symbol
- [ ] Trash icon appears on each member
- [ ] Click trash removes member
- [ ] Department updates to show drop zone when empty

#### TC-RPV2-007: Client Structure Editor
- [ ] Click "Edit Client Structure" button
- [ ] "Add Client Department" button appears
- [ ] Click button prompts for name
- [ ] Enter name creates new department
- [ ] New department appears in list
- [ ] Can drag roles to new department

#### TC-RPV2-008: Footer
- [ ] Total Team count displays
- [ ] Monthly Cost (20 days) = Daily Rate × 20
- [ ] Both stats visible side-by-side
- [ ] Cancel button works
- [ ] Save Team Structure button logs data
- [ ] Footer layout is clean

#### TC-RPV2-009: Real-time Updates
- [ ] Add team member → counts update
- [ ] Remove team member → costs recalculate
- [ ] Banner, footer, and sections stay in sync

---

## Modal 3: PhaseTaskResourceAllocationModal

**File:** `src/components/gantt-tool/PhaseTaskResourceAllocationModal.tsx`
**Access:** Via phase/task resource allocation

### Test Cases

#### TC-PTRA-001: Modal Opens for Phase
- [ ] Title shows "Allocating Resources to Phase"
- [ ] Subtitle shows phase name
- [ ] Users icon visible
- [ ] Info banner appears (blue background)
- [ ] Banner text: "Phase-Level Assignment: Only resources configured..."

#### TC-PTRA-002: Modal Opens for Task
- [ ] Title shows "Allocating Resources to Task"
- [ ] Subtitle shows task name and phase name
- [ ] Calendar icon with "Phase: {name}"
- [ ] No info banner (task-level)

#### TC-PTRA-003: Currently Assigned Resources Section
- [ ] Section appears if resources already assigned
- [ ] Header shows "Currently Assigned (N)"
- [ ] Users icon in header
- [ ] Gray background (#F9FAFB)
- [ ] Resource cards display

#### TC-PTRA-004: Resource Card - Assigned
- [ ] Card shows resource emoji icon
- [ ] Resource name displays
- [ ] Designation shows (e.g., "Senior Consultant")
- [ ] Allocation slider visible (horizontal)
- [ ] Slider value matches allocation %
- [ ] Number input shows same value
- [ ] Notes textarea displays assignment notes

#### TC-PTRA-005: Allocation Slider Interaction
- [ ] **CRITICAL:** Drag slider left/right
- [ ] Percentage updates in real-time
- [ ] Number input syncs with slider
- [ ] Slider has gradient fill (blue up to value, gray after)
- [ ] Change number input updates slider
- [ ] Min value: 1%
- [ ] Max value: 100%

#### TC-PTRA-006: Assignment Notes
- [ ] Textarea shows current notes
- [ ] Can type new notes
- [ ] Notes save on change
- [ ] Placeholder: "What will they work on?"
- [ ] Multi-line supported (2 rows minimum)

#### TC-PTRA-007: Remove Assignment
- [ ] Trash icon visible on each card
- [ ] Icon is red (#FF3B30)
- [ ] Hover shows background
- [ ] Click prompts confirmation
- [ ] Confirm removes resource
- [ ] Card disappears
- [ ] Resource moves to "Available Resources"

#### TC-PTRA-008: Available Resources Section
- [ ] Header shows "Available Resources"
- [ ] Plus icon in header (green)
- [ ] Resources grouped by category
- [ ] Each category collapsible (ChevronDown/Right)

#### TC-PTRA-009: Category Management
- [ ] All categories display (if resources exist)
- [ ] Category header shows: icon, label, count
- [ ] Click header toggles collapse
- [ ] Resources hidden when collapsed
- [ ] Multiple categories can be open

#### TC-PTRA-010: Assign Resource from Available
- [ ] Resource card shows name, designation, description
- [ ] "Assign" button visible (blue)
- [ ] Plus icon in button
- [ ] Click Assign adds resource
- [ ] Card moves to "Currently Assigned"
- [ ] Default allocation: 80% for task, 20% for phase
- [ ] Smart notes generated automatically

#### TC-PTRA-011: Assignment Level Validation (Phase)
- [ ] Only phase-level resources visible in Available
- [ ] Task-only resources hidden
- [ ] "Both" level resources visible
- [ ] Alert shows if trying to assign task-only resource

#### TC-PTRA-012: Assignment Level Validation (Task)
- [ ] Only task-level resources visible
- [ ] Phase-only resources hidden
- [ ] "Both" level resources visible
- [ ] Alert shows if trying to assign phase-only resource

#### TC-PTRA-013: Empty States
- [ ] "All resources assigned!" if none available
- [ ] "No available resources" if project has none
- [ ] Users icon (large, gray) displays
- [ ] Helpful message shows

#### TC-PTRA-014: Footer
- [ ] "Done" button visible (blue)
- [ ] Click Done closes modal
- [ ] Changes saved to store

---

## Modal 4: ResourceManagerModal

**File:** `src/components/timeline/ResourceManagerModal.tsx`
**Access:** Via timeline resource manager

### Test Cases

#### TC-RM-001: Modal Opens/Closes
- [ ] Title shows "Resource Strategy"
- [ ] Subtitle shows phase name and working days
- [ ] Users icon visible
- [ ] Close works
- [ ] Escape key works

#### TC-RM-002: Strategic Metrics Bar
- [ ] Gradient background (blue to indigo)
- [ ] 4 metric cards display:
  1. Team Size (Users icon)
  2. Phase Cost (DollarSign icon)
  3. Quality Score (Award icon)
  4. Critical Roles (TrendingUp icon)

#### TC-RM-003: Metric Card - Team Size
- [ ] Shows count of resources
- [ ] Status: green if >= 3, yellow otherwise
- [ ] Updates when resources added/removed

#### TC-RM-004: Metric Card - Phase Cost
- [ ] Shows $Xk format
- [ ] Calculation: Σ(working days × 8 × allocation% × hourly rate)
- [ ] Always neutral color
- [ ] Updates in real-time

#### TC-RM-005: Metric Card - Quality Score
- [ ] Percentage value (0-100%)
- [ ] Green if >= 90%
- [ ] Yellow if 70-89%
- [ ] Red if < 70%
- [ ] Score includes: architect, lead, critical roles, over-allocation penalty

#### TC-RM-006: Metric Card - Critical Roles
- [ ] Shows "N/M" format (critical/total)
- [ ] Green if has architect AND lead
- [ ] Yellow otherwise
- [ ] Updates as team changes

#### TC-RM-007: Recommendations Section
- [ ] Gray background banner
- [ ] Warning if no architect
- [ ] Warning if no lead
- [ ] Critical alert if over-allocated
- [ ] Success message if quality >= 90%
- [ ] Multiple alerts can show

#### TC-RM-008: Alert Component
- [ ] Success: green background, CheckCircle icon
- [ ] Warning: yellow background, AlertTriangle icon
- [ ] Critical: red background, AlertTriangle icon
- [ ] Message text clear and actionable

#### TC-RM-009: Role Selector (Left Column)
- [ ] "Add Team Members" header
- [ ] 6 role profiles display:
  - [ ] Project Lead ($250/hr, critical)
  - [ ] Solution Architect ($220/hr, critical)
  - [ ] Functional Consultant ($180/hr, high)
  - [ ] Developer ($150/hr, high)
  - [ ] Business Analyst ($140/hr, medium)
  - [ ] QA Specialist ($120/hr, medium)

#### TC-RM-010: Role Card - Selector
- [ ] Role emoji icon
- [ ] Role name
- [ ] Expertise description
- [ ] Impact badge (critical/high/medium)
  - [ ] Critical: red
  - [ ] High: orange
  - [ ] Medium: gray
- [ ] Base rate displayed
- [ ] Hover effect (scale, blue border)
- [ ] Click adds resource

#### TC-RM-011: Add Resource
- [ ] Click role card creates new resource
- [ ] Resource appears in "Current Team"
- [ ] Name default: "{Role Name} {count}"
- [ ] Region default: ABMY (Malaysia)
- [ ] Allocation default: 100%
- [ ] Hourly rate = base rate × region cost index
- [ ] Metrics update immediately

#### TC-RM-012: Current Team (Right Column)
- [ ] "Current Team (N)" header
- [ ] Empty state if no resources:
  - [ ] Users icon (large)
  - [ ] "No team members yet" message
  - [ ] "Add roles from left panel" hint

#### TC-RM-013: Resource Card - Current Team
- [ ] Role emoji icon
- [ ] Name field (editable inline)
- [ ] Role name below
- [ ] Remove button (X, top right)
- [ ] Gray background

#### TC-RM-014: Resource Editing - Name
- [ ] Click name field to edit
- [ ] Type to change
- [ ] Border appears on hover/focus
- [ ] Changes save on blur

#### TC-RM-015: Resource Editing - Region
- [ ] Region dropdown shows 3 options:
  - [ ] 🇲🇾 ABMY (Malaysia, 1.0x)
  - [ ] 🇸🇬 ABSG (Singapore, 1.2x)
  - [ ] 🇻🇳 ABVN (Vietnam, 0.6x)
- [ ] Change region updates hourly rate automatically
- [ ] Phase cost recalculates

#### TC-RM-016: Resource Editing - Allocation
- [ ] Number input (0-200%)
- [ ] Shows "%" symbol
- [ ] Can type directly
- [ ] Phase cost updates
- [ ] Over 100% triggers over-allocation warning

#### TC-RM-017: Phase Cost Display (Per Resource)
- [ ] Shows $Xk format
- [ ] Blue background
- [ ] Calculation: working days × 8 × (allocation/100) × hourly rate
- [ ] Updates when allocation or region changes

#### TC-RM-018: Remove Resource
- [ ] X button on each card
- [ ] Click removes immediately
- [ ] Metrics recalculate
- [ ] Team count decreases
- [ ] Recommendations update

#### TC-RM-019: Motion Animations
- [ ] New resource appears with fade-in
- [ ] Removed resource fades out
- [ ] Cards have layout animation
- [ ] Smooth transitions (no jank)

#### TC-RM-020: Footer
- [ ] Left side: "{N} resources • $Xk total cost"
- [ ] Right side: Cancel + Save Team buttons
- [ ] Stats update in real-time
- [ ] Cancel closes without saving
- [ ] Save Team calls onSave callback

#### TC-RM-021: Complex Scenarios
- [ ] Add 5 resources, verify all metrics
- [ ] Change multiple regions, verify costs
- [ ] Set allocation to 150%, verify over-allocation alert
- [ ] Add architect, verify quality score improves
- [ ] Add lead, verify recommendations change
- [ ] Remove all resources, verify empty state
- [ ] Add resources back, verify everything works

---

## Cross-Modal Tests

### CM-001: BaseModal Consistency
- [ ] All 4 modals have same header style
- [ ] All use same close button
- [ ] All have same overlay opacity
- [ ] All have same border radius
- [ ] All have same shadow

### CM-002: Keyboard Navigation
- [ ] Escape closes all modals
- [ ] Tab navigates within modal
- [ ] Focus trapped inside modal
- [ ] First interactive element focused on open

### CM-003: Accessibility
- [ ] All modals have proper ARIA labels
- [ ] Close button has aria-label="Close modal"
- [ ] Headings use semantic HTML (h2, h3)
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

### CM-004: Responsive Behavior
- [ ] All modals constrain to 90vw on small screens
- [ ] All modals constrain to 90vh height
- [ ] Content scrolls when needed
- [ ] Footer remains visible (sticky)
- [ ] Header remains visible (sticky)

### CM-005: Performance
- [ ] Modals open in < 200ms
- [ ] Animations smooth (60fps)
- [ ] No layout shift on open
- [ ] No memory leaks on close
- [ ] Drag-drop remains smooth

---

## Regression Tests

### RG-001: Store Integration
- [ ] ResourcePlanningModal: console.log on save
- [ ] ResourcePlanningModalV2: console.log on save
- [ ] PhaseTaskResourceAllocationModal: store updates persist
- [ ] ResourceManagerModal: onSave callback called with correct data

### RG-002: Data Flow
- [ ] Add resource → appears in store
- [ ] Edit resource → updates in store
- [ ] Remove resource → removed from store
- [ ] Close without save → changes discarded (if applicable)

### RG-003: Edge Cases
- [ ] Open modal with no project → null guard works
- [ ] Open modal with empty resources array
- [ ] Open with 0 working days
- [ ] Drag-drop same role multiple times
- [ ] Rapid clicking add/remove buttons
- [ ] Change slider while typing in input

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Check:
- [ ] Modal renders correctly
- [ ] Drag-drop works
- [ ] Sliders work
- [ ] Animations smooth
- [ ] No console errors

---

## Performance Benchmarks

### Load Time
- [ ] Modal opens in < 200ms
- [ ] First paint < 100ms
- [ ] Interactive < 150ms

### Animation FPS
- [ ] Modal open animation: 60fps
- [ ] Drag-drop: 60fps
- [ ] Slider: 60fps
- [ ] Tab switch: 60fps

### Memory
- [ ] No memory leaks on open/close cycle (10x)
- [ ] Heap size stable
- [ ] Event listeners cleaned up

---

## Sign-off Checklist

### Developer
- [ ] All 4 modals refactored
- [ ] All imports correct
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code reviewed
- [ ] Documentation updated

### QA
- [ ] All test cases passed
- [ ] No regressions found
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] Accessibility verified

### Product Owner
- [ ] User experience unchanged
- [ ] All features working
- [ ] No complaints from users
- [ ] Ready for production

---

## Test Execution Log

| Test ID | Status | Tester | Date | Notes |
|---------|--------|--------|------|-------|
| TC-RP-001 | ⏳ Pending | - | - | - |
| TC-RP-002 | ⏳ Pending | - | - | - |
| ... | ⏳ Pending | - | - | - |

**Legend:**
- ✅ Passed
- ❌ Failed
- ⏳ Pending
- 🔄 In Progress
- ⚠️ Blocked

---

## Bug Report Template

**Bug ID:** BUG-RM-XXX
**Modal:** [ResourcePlanningModal|ResourcePlanningModalV2|PhaseTaskResourceAllocationModal|ResourceManagerModal]
**Test Case:** TC-XXX-XXX
**Severity:** [Critical|High|Medium|Low]

**Description:**
[What happened]

**Expected:**
[What should happen]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [version]
- OS: [Windows/Mac/Linux]

**Screenshots:**
[Attach if applicable]

**Console Errors:**
```
[Paste console errors]
```

---

## Conclusion

This comprehensive test plan covers:
- ✅ 4 refactored modals
- ✅ 100+ test cases
- ✅ All critical functionality
- ✅ Drag-drop interactions
- ✅ Slider controls
- ✅ Calculations and metrics
- ✅ Cross-modal consistency
- ✅ Accessibility
- ✅ Performance
- ✅ Browser compatibility

**Status: READY FOR QA EXECUTION**
