# VISUAL VERIFICATION CHECKLIST

## Manual Testing Guide for Option 2 QA

**Date:** 2025-11-09
**Test Type:** Visual Verification + Manual Testing
**Purpose:** Validate all UI components render correctly before automated testing
**Target Completion:** 92-95% Production-Ready Quality

---

## TEST SETUP

### 1. Start Development Server

```bash
npm run dev
# Server should start at http://localhost:3000
```

### 2. Create Realistic Test Data

Use the following test project configuration:

**Project Details:**

- Name: "Enterprise SAP S/4HANA Implementation"
- Start Date: 30 days ago
- End Date: 60 days from now
- Budget: $1,000,000
- Status: Active

**Phases (5):**

1. Planning & Analysis (Days 1-30)
2. Development (Days 31-60)
3. Testing (Days 61-75)
4. Deployment (Days 76-85)
5. Hypercare (Days 86-90)

**Tasks per Phase:** 4-6 tasks with varied progress (0%, 25%, 50%, 75%, 100%)

**Milestones (3):**

- Planning Complete (Day 30)
- UAT Sign-off (Day 75)
- Go-Live (Day 85)

### 3. Browser Setup

Open these browsers for testing:

- Google Chrome (latest)
- Firefox (latest)
- Safari (macOS/iOS if available)
- Microsoft Edge (latest)

### 4. Device Emulation (Chrome DevTools)

Use responsive design mode (Ctrl+Shift+M / Cmd+Shift+M):

- iPhone SE (375px × 667px)
- iPhone 12/13/14 (390px × 844px)
- iPad (768px × 1024px)
- Desktop HD (1280px × 720px)
- Desktop 4K (3840px × 2160px)

---

## PHASE 1: DESKTOP VERIFICATION (≥ 1024px)

### Test at: 1280px × 720px (Standard Desktop)

#### GanttCanvas - Timeline View

- [ ] Timeline grid renders with proper alignment
- [ ] Month/week headers visible
- [ ] Today marker shows current date (vertical red line)
- [ ] Phase bars display with correct colors
- [ ] Task bars positioned within correct phases
- [ ] Task bars show correct duration (visual length)
- [ ] Task hierarchy indentation visible (subtasks indented)
- [ ] Dependency arrows draw between correct tasks
- [ ] Milestones show as diamond markers
- [ ] Phase boundaries align with dates
- [ ] No visual gaps or overlaps

**Screenshot:** Save as `desktop-gantt-timeline-1280.png`

#### GanttSidePanel

- [ ] Phase list shows all phases
- [ ] Task list shows all tasks under phases
- [ ] Expand/collapse icons work
- [ ] Progress bars display correctly
- [ ] Status tags show correct colors:
  - Not Started: Gray (#9CA3AF)
  - In Progress: Blue (#3B82F6)
  - At Risk: Amber (#F59E0B)
  - Blocked: Red (#EF4444)
  - Completed: Green (#10B981)
- [ ] Dates formatted correctly (MMM d, yyyy)
- [ ] Durations show single format (days/weeks/months)
- [ ] Resource icons visible

**Screenshot:** Save as `desktop-side-panel-1280.png`

#### GanttToolbar

- [ ] All toolbar buttons visible
- [ ] Zoom controls accessible
- [ ] View mode toggles work
- [ ] Export button enabled
- [ ] Baseline toggle works
- [ ] Filters accessible

**Screenshot:** Save as `desktop-toolbar-1280.png`

#### MissionControlModal

- [ ] Health score displays (0-100)
- [ ] Health score color matches status:
  - Green (80-100): On track
  - Yellow (50-79): At risk
  - Red (0-49): Critical
- [ ] Budget chart renders
- [ ] Schedule progress chart renders
- [ ] Resource utilization chart renders
- [ ] All percentages formatted to 1 decimal (no "91.666%")
- [ ] No "null days" or "undefined days"
- [ ] No negative elapsed days
- [ ] Alerts section shows issues
- [ ] Timeline section shows milestones

**Test Data Scenarios:**

1. On-track project: 50% tasks done, 33% time elapsed → Health 80-100
2. At-risk project: 20% tasks done, 50% time elapsed → Health 40-60
3. Over-budget project: 120% budget used → Health < 50, red alert

**Screenshot:** Save as `desktop-mission-control-1280.png`

#### CostDashboard

- [ ] Total budget displays (formatted: $1,000,000)
- [ ] Spent amount displays
- [ ] Remaining budget displays
- [ ] Budget utilization percentage (1 decimal)
- [ ] Cost breakdown chart visible
- [ ] Phase cost allocation shown
- [ ] No floating-point bugs

**Screenshot:** Save as `desktop-cost-dashboard-1280.png`

#### BaselineComparisonPanel

- [ ] Baseline selector works
- [ ] Variance charts display
- [ ] Schedule variance shown
- [ ] Cost variance shown
- [ ] Green/red coloring for positive/negative variance

**Screenshot:** Save as `desktop-baseline-comparison-1280.png`

---

## PHASE 2: TABLET VERIFICATION (768-1023px)

### Test at: 768px × 1024px (iPad Portrait)

#### Responsive Behavior

- [ ] GanttCanvas displays (timeline view, NOT list view)
- [ ] Tablet alert banner shows: "Tablet View - Optimized for touch"
- [ ] Banner is dismissible
- [ ] Timeline width appropriate for tablet
- [ ] Touch targets 44-48px minimum
- [ ] Pinch-to-zoom works (test manually on iPad if available)
- [ ] Pan gestures work
- [ ] Horizontal scroll available if needed
- [ ] Side panel accessible

**Screenshot:** Save as `tablet-gantt-768.png`

#### Touch Optimization

- [ ] Buttons are touch-friendly (48px tap target)
- [ ] No 300ms tap delay (test feels snappy)
- [ ] Active states visible on tap
- [ ] Drawer/modal gestures smooth

**Screenshot:** Save as `tablet-controls-768.png`

### Test at: 1024px × 768px (iPad Landscape)

#### Desktop Mode Trigger

- [ ] NO tablet banner (should be desktop mode)
- [ ] Full desktop timeline view
- [ ] All desktop features accessible
- [ ] Optimal layout for landscape

**Screenshot:** Save as `tablet-landscape-1024.png`

---

## PHASE 3: MOBILE VERIFICATION (< 768px)

### Test at: 375px × 667px (iPhone SE - Minimum Width)

#### GanttMobileListView

- [ ] List view displays (NOT timeline)
- [ ] No horizontal scroll
- [ ] Phase cards render
- [ ] Phase cards are collapsible/expandable
- [ ] ChevronDown/ChevronRight icons visible
- [ ] Phase names truncate if too long (no overflow)
- [ ] Phase progress bars display
- [ ] "X of Y tasks" count shows
- [ ] Progress percentage shows (1 decimal)
- [ ] Status tags visible and color-coded

**Screenshot:** Save as `mobile-list-375.png`

#### Task Items

- [ ] Tasks display under phases
- [ ] Task indentation visible (level-based padding)
- [ ] Border-left accent color from parent phase
- [ ] Task names truncate properly
- [ ] Progress bars show for each task
- [ ] At-risk tasks show AlertTriangle icon
- [ ] Resource count badges visible
- [ ] Dates formatted compactly (Oct 14)
- [ ] Duration shows (10 days, 3 weeks)

**Screenshot:** Save as `mobile-tasks-375.png`

#### Milestones Section

- [ ] Milestones section renders if milestones exist
- [ ] Section hidden if no milestones
- [ ] Flag icons color-coded
- [ ] Milestone names display
- [ ] Dates show compactly
- [ ] Chronologically sorted

**Screenshot:** Save as `mobile-milestones-375.png`

#### Mobile Navigation

- [ ] Hamburger menu visible (3 horizontal lines)
- [ ] Hamburger positioned top-right or top-left
- [ ] Tap hamburger opens drawer
- [ ] Drawer slides in from left
- [ ] Menu items listed vertically
- [ ] User info in drawer
- [ ] Tap outside closes drawer
- [ ] Select menu item navigates and closes drawer

**Screenshot:** Save as `mobile-navigation-375.png`

#### PlanMode Panel (Mobile)

- [ ] Panel is full-width on mobile (w-full)
- [ ] No fixed 480px width
- [ ] Content accessible
- [ ] Scroll works
- [ ] No content cutoff

**Screenshot:** Save as `mobile-planmode-375.png`

#### PresentMode (Mobile)

- [ ] Text scales down appropriately (text-3xl)
- [ ] Navigation controls visible
- [ ] Controls sized correctly (w-10 h-10)
- [ ] Bottom spacing (bottom-12)
- [ ] Side spacing (left-3, right-3)
- [ ] No content hidden
- [ ] Arrow keys still work

**Screenshot:** Save as `mobile-presentmode-375.png`

### Test at: 390px × 844px (iPhone 12/13/14 - Standard)

#### Verify All Mobile Tests Pass

- [ ] All iPhone SE tests pass
- [ ] Slightly more breathing room
- [ ] Typography comfortable

**Screenshot:** Save as `mobile-standard-390.png`

### Test at: 428px × 926px (iPhone Pro Max - Large)

#### Verify Large Mobile Behavior

- [ ] Still shows list view (< 768px)
- [ ] Better spacing utilization
- [ ] Typography scales appropriately

**Screenshot:** Save as `mobile-large-428.png`

---

## PHASE 4: SAFE AREA INSETS (iPhone X+)

### Test on iPhone X/11/12/13/14 (Notched Devices)

Use Chrome DevTools "Add device pixel ratio" to simulate:

- [ ] Top content not hidden by notch
- [ ] Bottom controls not hidden by home indicator
- [ ] `pt-safe` adds padding at top
- [ ] `pb-safe` adds padding at bottom
- [ ] `pl-safe` adds padding at left
- [ ] `pr-safe` adds padding at right
- [ ] Content respects rounded corners

**Screenshot:** Save as `safe-area-insets.png`

---

## PHASE 5: BREAKPOINT TRANSITIONS

### Test Smooth Transitions

#### 767px → 768px (Mobile to Tablet)

1. Set viewport to 767px
2. Verify list view shows
3. Slowly resize to 768px
4. Verify timeline appears
5. Check for:
   - [ ] No flash or flicker
   - [ ] Smooth transition
   - [ ] Data persists
   - [ ] No layout shift

**Screenshot:** Save as `transition-767-to-768.gif` (if recording)

#### 1023px → 1024px (Tablet to Desktop)

1. Set viewport to 1023px
2. Verify tablet banner shows
3. Resize to 1024px
4. Verify banner disappears
5. Check for smooth transition

**Screenshot:** Save as `transition-1023-to-1024.gif`

---

## PHASE 6: TYPOGRAPHY SCALING

### Verify Responsive Typography

Test at each breakpoint and verify text scales smoothly:

| Element          | Mobile (375px)  | Small (640px)    | Medium (768px)  | Large (1024px)  |
| ---------------- | --------------- | ---------------- | --------------- | --------------- |
| H1 (PresentMode) | text-3xl (30px) | text-5xl (48px)  | text-6xl (60px) | text-7xl (72px) |
| H2               | text-xl (20px)  | text-2xl (24px)  | text-3xl (30px) | text-4xl (36px) |
| Body             | text-sm (14px)  | text-base (16px) | text-lg (18px)  | text-lg (18px)  |
| Small            | text-xs (12px)  | text-xs (12px)   | text-sm (14px)  | text-sm (14px)  |

Checklist:

- [ ] No jarring jumps between sizes
- [ ] Clamp() creates smooth scaling
- [ ] Readable at all sizes
- [ ] No text overflow

**Screenshots:** Save as `typography-375.png`, `typography-640.png`, `typography-768.png`, `typography-1024.png`

---

## PHASE 7: EMPTY STATES

### Test Edge Cases

#### No Project Loaded

1. Navigate to Gantt without project
2. Verify:
   - [ ] "No project loaded" message displays
   - [ ] Flag icon shows (gray, opacity 50%)
   - [ ] Message centered
   - [ ] No error messages

**Screenshot:** Save as `empty-no-project.png`

#### No Phases Added

1. Create project with 0 phases
2. Verify:
   - [ ] "No phases added yet" message shows
   - [ ] Centered text
   - [ ] Appropriate styling

**Screenshot:** Save as `empty-no-phases.png`

#### No Milestones

1. Create project with 0 milestones
2. Verify:
   - [ ] Milestone section hidden
   - [ ] No empty boxes

**Screenshot:** Save as `empty-no-milestones.png`

---

## PHASE 8: COLOR VERIFICATION

### Status Colors

Create tasks with each status and verify colors:

| Status      | Expected Color | Hex Code | Visual Check |
| ----------- | -------------- | -------- | ------------ |
| Not Started | Gray           | #9CA3AF  | [ ] Matches  |
| In Progress | Blue           | #3B82F6  | [ ] Matches  |
| At Risk     | Amber          | #F59E0B  | [ ] Matches  |
| Blocked     | Red            | #EF4444  | [ ] Matches  |
| Completed   | Green          | #10B981  | [ ] Matches  |

**Screenshot:** Save as `status-colors.png`

### Phase Colors

Verify phases show custom colors:

- [ ] Each phase has distinct color
- [ ] Colors match design system
- [ ] Accessible contrast ratios

**Screenshot:** Save as `phase-colors.png`

---

## PHASE 9: PERFORMANCE

### Visual Performance Checks

#### Page Load

- [ ] No layout shift on initial load
- [ ] Components appear in order (no flash)
- [ ] Smooth fade-in animations
- [ ] No janky movements

#### Scrolling

- [ ] Mobile list scrolls smoothly (60fps)
- [ ] Desktop timeline scrolls smoothly
- [ ] No stuttering
- [ ] No white flashes

#### Interactions

- [ ] Expand/collapse smooth
- [ ] Modal open/close smooth
- [ ] Tab transitions smooth
- [ ] No delays > 100ms

**Record:** Use Chrome DevTools Performance tab, save as `performance-trace.json`

---

## PHASE 10: ACCESSIBILITY

### Manual Accessibility Checks

#### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Logical tab order
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals

#### Screen Reader (Optional)

- [ ] Labels read correctly
- [ ] Alt text on images/icons
- [ ] ARIA labels present
- [ ] Semantic HTML used

#### Color Contrast

- [ ] Text readable on backgrounds
- [ ] Status tags pass WCAG AA (4.5:1)
- [ ] Links distinguishable
- [ ] Disabled states clear

---

## TEST RESULTS SUMMARY

### Desktop (1280px)

- [ ] All components render ✅
- [ ] No visual bugs 🐛
- [ ] Performance smooth ⚡
- [ ] Screenshots captured 📸

### Tablet (768px)

- [ ] Timeline shows ✅
- [ ] Touch-optimized ✅
- [ ] Alert banner works ✅
- [ ] Screenshots captured 📸

### Mobile (375px)

- [ ] List view shows ✅
- [ ] No horizontal scroll ✅
- [ ] All features accessible ✅
- [ ] Screenshots captured 📸

### Cross-Breakpoint

- [ ] Smooth transitions ✅
- [ ] Data persists ✅
- [ ] No layout shift ✅

### Edge Cases

- [ ] Empty states work ✅
- [ ] Long names truncate ✅
- [ ] Safe areas respected ✅

---

## ISSUES FOUND

### Template for Logging Issues

**Issue #N:** [Title]

**Severity:** Critical / High / Medium / Low
**Component:** [GanttCanvas, MissionControl, etc.]
**Viewport:** [375px, 768px, 1280px, etc.]
**Browser:** [Chrome, Firefox, Safari, Edge]

**Description:**
[What's wrong]

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:**
[What should happen]

**Actual:**
[What happens]

**Screenshot:**
[Attach screenshot]

**Priority:**

- [ ] Block release
- [ ] Fix before release
- [ ] Fix after release
- [ ] Nice to have

---

## SIGN-OFF

### Visual Verification Complete

**Tested By:** \***\*\_\_\_\*\***
**Date:** \***\*\_\_\_\*\***
**Total Issues Found:** \***\*\_\_\_\*\***
**Critical Issues:** \***\*\_\_\_\*\***
**High Priority Issues:** \***\*\_\_\_\*\***
**Status:** ✅ PASSED / ⚠️ PASSED WITH ISSUES / ❌ FAILED

**Notes:**
[Any additional observations]

---

**Next Steps:**

1. Fix all critical issues
2. Fix all high-priority issues
3. Document medium/low issues for backlog
4. Proceed to automated testing (device matrix, cross-browser)
5. Run integration tests
6. Run E2E tests

**Estimated Time for Fixes:** **\_** hours

**Projected Completion Date:** \***\*\_\_\_\*\***
