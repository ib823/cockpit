# QA TESTING PLAN - OPTION 2: COMPLETE QA TESTING

## Target: 92-95% Production-Ready Quality

**Created:** 2025-11-09
**Timeline:** 2 weeks
**Current Status:** 88% → Target: 92-95%
**Approach:** Systematic testing across devices, browsers, and workflows

---

## PHASE 1: VISUAL VERIFICATION (4-8 hours)

### Objective

Verify all UI components render correctly with realistic test data

### Test Environments

- Development server: `npm run dev`
- Browser: Chrome DevTools with responsive design mode

### Test Data Requirements

1. **Project with Complete Data:**
   - Name: "Enterprise SAP Implementation"
   - 5-8 phases with varied durations
   - 20+ tasks with hierarchy (levels 0-2)
   - Multiple resource assignments
   - 3-5 milestones
   - Budget data with realistic costs
   - Mix of task statuses: not started, in progress, at risk, blocked, completed

2. **Edge Cases:**
   - Empty project (no phases)
   - Single task project
   - Project with 100+ tasks (performance)
   - Project with very long names (truncation)
   - Project with special characters in names

### Visual Checklist

#### Desktop (≥ 1024px)

- [ ] GanttCanvas: Timeline grid aligned correctly
- [ ] GanttCanvas: Phase bars render with correct colors
- [ ] GanttCanvas: Task bars show correct durations
- [ ] GanttCanvas: Dependencies arrows visible and accurate
- [ ] GanttCanvas: Milestones positioned correctly
- [ ] GanttCanvas: Today marker visible
- [ ] GanttSidePanel: All metrics display correctly
- [ ] GanttSidePanel: Status legend shows all 5 states
- [ ] GanttToolbar: All controls accessible
- [ ] MissionControlModal: Charts render correctly
- [ ] MissionControlModal: No "91.666%" bugs
- [ ] MissionControlModal: Health score displays correctly
- [ ] CostDashboard: Budget charts visible
- [ ] BaselineComparisonPanel: Comparison data accurate

#### Tablet (768-1024px)

- [ ] Touch targets 44-48px minimum
- [ ] Responsive spacing appropriate
- [ ] Alert banner shows "Tablet View"
- [ ] Pinch-to-zoom works
- [ ] Pan gestures work

#### Mobile (< 768px)

- [ ] GanttMobileListView renders instead of canvas
- [ ] Phase cards collapsible/expandable
- [ ] Task indentation visible
- [ ] Progress bars display correctly
- [ ] Status tags color-coded
- [ ] Milestone section renders
- [ ] No horizontal scroll
- [ ] Hamburger menu accessible
- [ ] PlanMode panel full-width on mobile
- [ ] PresentMode controls visible and sized correctly

#### PresentMode Specific

- [ ] Text scales smoothly across breakpoints
- [ ] Navigation controls visible on all sizes
- [ ] Safe-area-inset respected on iPhone X+
- [ ] No content hidden by notch/home indicator
- [ ] Arrow keys work for navigation
- [ ] Fullscreen mode works

### Empty States

- [ ] "No project loaded" message displays
- [ ] "No phases added yet" message displays
- [ ] "No milestones" section hidden when empty
- [ ] Empty MissionControl shows appropriate message

### Color Verification

- [ ] Status colors match GANTT_STATUS_COLORS:
  - Not Started: gray (#9CA3AF)
  - In Progress: blue (#3B82F6)
  - At Risk: amber (#F59E0B)
  - Blocked: red (#EF4444)
  - Completed: green (#10B981)

### Typography

- [ ] Font sizes responsive (text-xs to text-7xl)
- [ ] Line heights appropriate
- [ ] Text truncation works (truncate, line-clamp-2)
- [ ] No text overflow

### Performance

- [ ] No layout shift on page load
- [ ] Smooth scrolling on mobile
- [ ] No janky animations
- [ ] Charts render in < 1 second

---

## PHASE 2: DEVICE MATRIX TESTING (4-8 hours)

### Test Devices & Viewports

| Device          | Width  | Height | Orientation | Priority |
| --------------- | ------ | ------ | ----------- | -------- |
| iPhone SE       | 375px  | 667px  | Portrait    | HIGH     |
| iPhone SE       | 667px  | 375px  | Landscape   | MEDIUM   |
| iPhone 12/13/14 | 390px  | 844px  | Portrait    | HIGH     |
| iPhone Pro Max  | 428px  | 926px  | Portrait    | MEDIUM   |
| iPad            | 768px  | 1024px | Portrait    | HIGH     |
| iPad            | 1024px | 768px  | Landscape   | HIGH     |
| iPad Pro        | 1024px | 1366px | Portrait    | MEDIUM   |
| Desktop HD      | 1280px | 720px  | -           | HIGH     |
| Desktop FHD     | 1920px | 1080px | -           | MEDIUM   |
| Desktop 4K      | 3840px | 2160px | -           | LOW      |

### Testing Method

Use Chrome DevTools responsive design mode:

```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device from dropdown OR
4. Enter custom dimensions
5. Test both portrait and landscape
```

### Per-Device Checklist

#### iPhone SE (375px) - Minimum Width

- [ ] GanttMobileListView displays (not timeline)
- [ ] All text readable (no overlap)
- [ ] Touch targets 44px minimum
- [ ] No horizontal scroll
- [ ] Hamburger menu accessible
- [ ] PlanMode panel full-width
- [ ] PresentMode text readable (text-3xl)
- [ ] Controls positioned correctly
- [ ] Phase cards fit width
- [ ] Task names truncate properly

#### iPhone 12/13/14 (390px) - Standard Mobile

- [ ] All iPhone SE tests pass
- [ ] Slightly more breathing room
- [ ] Typography comfortable

#### iPhone Pro Max (428px) - Large Mobile

- [ ] Still shows mobile list view
- [ ] Better spacing utilization
- [ ] Typography scales up appropriately

#### iPad (768px) - Tablet Portrait

- [ ] GanttCanvas displays (not list view)
- [ ] Tablet alert banner visible
- [ ] Touch-optimized controls
- [ ] Sufficient timeline width
- [ ] Side panel accessible

#### iPad Landscape (1024px) - Tablet/Small Desktop

- [ ] Full Gantt timeline visible
- [ ] No tablet banner (desktop mode)
- [ ] All features accessible
- [ ] Comfortable viewing

#### Desktop HD (1280px) - Standard Desktop

- [ ] Full desktop experience
- [ ] All panels visible
- [ ] Optimal layout
- [ ] No wasted space

#### Desktop 4K (3840px) - Large Desktop

- [ ] Layout doesn't break
- [ ] Max-width constraints work
- [ ] Content centered appropriately
- [ ] No excessive stretching

### Breakpoint Transitions

Test smooth transitions between breakpoints:

- [ ] 767px → 768px: List view → Timeline (no flash)
- [ ] 1023px → 1024px: Tablet → Desktop (smooth)
- [ ] 639px → 640px: Mobile → Small (typography scales)

### Safe Area Insets (iPhone X+)

Simulate notch with DevTools:

- [ ] Top content not hidden by notch
- [ ] Bottom controls not hidden by home indicator
- [ ] Left/right content respects rounded corners
- [ ] `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` working

---

## PHASE 3: CROSS-BROWSER TESTING (4-6 hours)

### Target Browsers

| Browser | Version | Platform          | Priority | Market Share |
| ------- | ------- | ----------------- | -------- | ------------ |
| Chrome  | Latest  | Windows/Mac/Linux | HIGH     | 65%          |
| Safari  | Latest  | macOS             | HIGH     | 20%          |
| Safari  | Latest  | iOS               | HIGH     | 15% (mobile) |
| Firefox | Latest  | Windows/Mac/Linux | MEDIUM   | 8%           |
| Edge    | Latest  | Windows           | MEDIUM   | 5%           |

### Installation

```bash
# macOS (using Homebrew)
brew install --cask google-chrome
brew install --cask firefox
brew install --cask microsoft-edge

# Linux
sudo apt install chromium-browser firefox

# Safari: Pre-installed on macOS
# iOS Safari: Test on physical device or Xcode simulator
```

### Per-Browser Checklist

#### Chrome (Chromium)

- [ ] All visual tests pass
- [ ] DevTools responsive mode works
- [ ] Safe-area-inset polyfills work
- [ ] Touch events work
- [ ] Performance good

#### Safari (macOS)

- [ ] All visual tests pass
- [ ] Native safe-area-inset support works
- [ ] Flexbox layout correct
- [ ] Grid layout correct
- [ ] Animations smooth
- [ ] Touch-action CSS works

#### Safari (iOS)

- [ ] Test on physical iPhone if possible
- [ ] Safe-area-inset respects notch
- [ ] Touch events work (no 300ms delay)
- [ ] Pinch-to-zoom works on tablet view
- [ ] Scroll behavior smooth
- [ ] Fixed positioning works
- [ ] Viewport meta tag correct

#### Firefox

- [ ] All visual tests pass
- [ ] CSS Grid layout correct
- [ ] Flexbox behavior matches Chrome
- [ ] Safe-area-inset polyfill works
- [ ] Responsive breakpoints work

#### Edge (Chromium)

- [ ] All visual tests pass
- [ ] Behavior matches Chrome
- [ ] No Edge-specific bugs

### CSS Feature Support

Test modern CSS features across browsers:

- [ ] `clamp()` for responsive typography
- [ ] `env(safe-area-inset-*)` for notch support
- [ ] CSS Grid
- [ ] Flexbox with gap
- [ ] `line-clamp` for text truncation
- [ ] Touch-action CSS property
- [ ] Backdrop-filter (if used)

### JavaScript Feature Support

- [ ] ES6+ syntax (arrow functions, destructuring)
- [ ] Optional chaining (`?.`)
- [ ] Nullish coalescing (`??`)
- [ ] Array methods (`.filter`, `.map`, `.reduce`)
- [ ] `window.matchMedia` for responsive detection

### Known Browser Quirks to Test

- [ ] Safari: `-webkit-overflow-scrolling: touch`
- [ ] iOS Safari: 100vh bug (use `100dvh` if needed)
- [ ] Firefox: Scrollbar width differences
- [ ] Edge: Legacy Edge compatibility (if supporting)

---

## PHASE 4: INTEGRATION TESTING (8-12 hours)

### Objective

Test component interactions and data flow across the application

### Test Framework Setup

```bash
# Already have Vitest installed
# Add testing-library for component integration tests
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Integration Test Suites

#### 1. MissionControl Calculations (HIGH PRIORITY)

**File:** `src/components/gantt-tool/__tests__/MissionControlModal.integration.test.tsx`

**Tests:**

- [ ] Health score calculation with realistic data
- [ ] Budget utilization accuracy
- [ ] Schedule progress calculation
- [ ] Resource utilization calculation
- [ ] Alert count accuracy
- [ ] Real-time updates when data changes
- [ ] No floating-point bugs in display
- [ ] Negative days prevention works

**Test Scenarios:**

```typescript
describe("MissionControl Integration", () => {
  it("calculates health score correctly for on-track project", () => {
    // Project: 50% complete, 45% time elapsed, 48% budget used
    // Expected: Health score 90-95 (green)
  });

  it("calculates health score correctly for at-risk project", () => {
    // Project: 30% complete, 60% time elapsed, 70% budget used
    // Expected: Health score 40-50 (yellow)
  });

  it("prevents negative elapsed days for future projects", () => {
    // Project starts in 2 months
    // Expected: Elapsed days = 0, not negative
  });

  it("formats all percentages to 1 decimal place", () => {
    // Check budget, schedule, resource percentages
    // Expected: "91.7%" not "91.66666666666666%"
  });
});
```

#### 2. Gantt Canvas Rendering (MEDIUM PRIORITY)

**File:** `src/components/gantt-tool/__tests__/GanttCanvas.integration.test.tsx`

**Tests:**

- [ ] Phases render in correct order
- [ ] Tasks render within correct phases
- [ ] Dependencies draw between correct tasks
- [ ] Milestones positioned on correct dates
- [ ] Today marker shows current date
- [ ] Timeline scale calculates correctly
- [ ] Zoom in/out updates all elements
- [ ] Scroll position maintained on data update

#### 3. Responsive View Switching (HIGH PRIORITY)

**File:** `src/components/gantt-tool/__tests__/ResponsiveGanttWrapper.integration.test.tsx`

**Tests:**

- [ ] Shows list view when width < 768px
- [ ] Shows timeline when width >= 768px
- [ ] Transitions smoothly on resize
- [ ] Maintains data state during view switch
- [ ] SSR-safe (no hydration errors)
- [ ] View mode toggle works (if enabled)

#### 4. Data Flow: API → Store → UI (HIGH PRIORITY)

**File:** `src/__tests__/data-flow.integration.test.tsx`

**Tests:**

- [ ] Fetch project from API
- [ ] Update store with project data
- [ ] UI updates with new data
- [ ] Optimistic updates work
- [ ] Error states display correctly
- [ ] Loading states display correctly

#### 5. User Workflows (E2E-style integration)

**File:** `src/__tests__/user-workflows.integration.test.tsx`

**Tests:**

- [ ] User creates new project
- [ ] User adds phase to project
- [ ] User adds task to phase
- [ ] User updates task progress
- [ ] MissionControl updates reflect changes
- [ ] User exports project
- [ ] User switches between modes (Plan/Present)

---

## PHASE 5: E2E TESTING (8-12 hours)

### Framework Setup

```bash
# Install Playwright for E2E testing
npm install --save-dev @playwright/test
npx playwright install
```

### E2E Test Suites

#### Critical User Journeys

**1. New Project Creation**

```typescript
test("user creates and configures new project", async ({ page }) => {
  // 1. Navigate to app
  // 2. Click "New Project"
  // 3. Fill in project details
  // 4. Add first phase
  // 5. Add first task
  // 6. Verify Gantt updates
  // 7. Verify MissionControl shows data
});
```

**2. Mobile Navigation**

```typescript
test("mobile user navigates entire app", async ({ page }) => {
  // 1. Set viewport to iPhone SE (375px)
  // 2. Open hamburger menu
  // 3. Navigate to Projects
  // 4. Open project
  // 5. Verify list view shows
  // 6. Expand phase
  // 7. View task details
  // 8. Check MissionControl
});
```

**3. Responsive Transitions**

```typescript
test("app adapts to window resize", async ({ page }) => {
  // 1. Start at desktop size
  // 2. Verify timeline shows
  // 3. Resize to mobile
  // 4. Verify list view shows
  // 5. Resize back to desktop
  // 6. Verify data persists
});
```

---

## PHASE 6: ISSUE TRACKING & FIXES (8-16 hours)

### Issue Template

```markdown
## Issue #N: [Title]

**Severity:** Critical / High / Medium / Low
**Found In:** Visual / Device / Browser / Integration / E2E
**Device/Browser:** [Specific environment]
**Reproducible:** Yes / Sometimes / No

### Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior

[What should happen]

### Actual Behavior

[What actually happens]

### Screenshots

[If applicable]

### Proposed Fix

[Initial thoughts on solution]

### Status

[ ] Investigating
[ ] Fix in progress
[ ] Fixed
[ ] Verified
[ ] Closed
```

### Issue Categorization

**Critical (Block release):**

- App crashes or completely broken
- Data loss or corruption
- Major accessibility violations
- Security vulnerabilities

**High (Fix before release):**

- Feature doesn't work as designed
- Visual bugs on primary devices
- Performance issues
- UX significantly degraded

**Medium (Should fix):**

- Minor visual inconsistencies
- Edge case bugs
- Non-critical UX issues
- Performance optimizations

**Low (Nice to have):**

- Visual polish
- Minor optimizations
- Documentation updates

### Fix Workflow

1. Document issue
2. Reproduce locally
3. Write regression test (if applicable)
4. Implement fix
5. Verify fix works
6. Run regression tests
7. Mark as verified
8. Update documentation

---

## PHASE 7: FINAL VALIDATION (4-8 hours)

### Regression Testing

Run all previous tests to ensure fixes didn't break anything:

- [ ] All 181 unit tests pass
- [ ] Visual verification tests pass
- [ ] Device matrix tests pass
- [ ] Cross-browser tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass

### Performance Benchmarks

- [ ] Lighthouse score ≥ 90 (desktop)
- [ ] Lighthouse score ≥ 80 (mobile)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500KB (gzipped)

### Accessibility Audit

```bash
# Install axe-core
npm install --save-dev @axe-core/react

# Run automated accessibility tests
npm run test:a11y
```

- [ ] No critical accessibility violations
- [ ] Color contrast ratios meet WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible

### Quality Gates

**Before marking as "Production-Ready":**

- [ ] 0 Critical issues
- [ ] 0 High issues (or documented exceptions)
- [ ] < 5 Medium issues
- [ ] All unit tests passing (181/181)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Tested on ≥ 3 browsers
- [ ] Tested on ≥ 5 device sizes
- [ ] Lighthouse score ≥ 85
- [ ] No accessibility violations (WCAG AA)
- [ ] Code reviewed
- [ ] Documentation updated

---

## SUCCESS CRITERIA

### Quantitative Metrics

- **Overall Completion:** 88% → 92-95%
- **Test Coverage:** 45% → 65%
- **P0 Blockers:** 5/5 resolved ✅
- **Critical Bugs:** 0
- **High Priority Bugs:** 0
- **Device Coverage:** 6+ devices tested
- **Browser Coverage:** 4+ browsers tested
- **Lighthouse Score:** ≥ 85

### Qualitative Metrics

- User can complete all workflows on mobile
- No visual bugs on primary devices
- Performance feels smooth
- No accessibility blockers
- Code quality maintained
- Documentation comprehensive

### Timeline Checkpoints

**End of Week 1:**

- [ ] Visual verification complete
- [ ] Device matrix testing complete
- [ ] Cross-browser testing complete
- [ ] Critical issues identified and prioritized

**End of Week 2:**

- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] All high/critical issues fixed
- [ ] Final validation complete
- [ ] Documentation updated
- [ ] Ready for production deployment

---

## RISK MITIGATION

### Identified Risks

1. **Risk:** Browser-specific bugs discovered late
   **Mitigation:** Test in all browsers early (Phase 3)
   **Contingency:** Document known issues, provide workarounds

2. **Risk:** Device-specific layout issues
   **Mitigation:** Test full device matrix (Phase 2)
   **Contingency:** Adjust breakpoints or add device-specific CSS

3. **Risk:** Integration tests reveal data flow bugs
   **Mitigation:** Test early, fix immediately
   **Contingency:** Rollback changes, re-architect if needed

4. **Risk:** Performance degradation on lower-end devices
   **Mitigation:** Test on iPhone SE (slowest target device)
   **Contingency:** Optimize bundle, lazy load components

5. **Risk:** Timeline overruns
   **Mitigation:** Daily progress tracking, ruthless prioritization
   **Contingency:** Move low-priority items to Phase 3 (post-launch)

---

## DAILY PROGRESS TRACKING

### Week 1

**Day 1-2: Visual + Device Testing**

- [ ] Set up test environments
- [ ] Complete visual verification
- [ ] Test iPhone SE to iPad
- [ ] Document issues

**Day 3-4: Cross-Browser Testing**

- [ ] Test Chrome, Safari, Firefox
- [ ] Test iOS Safari (physical device)
- [ ] Document browser-specific issues
- [ ] Begin fixes

**Day 5: Issue Fixes**

- [ ] Fix critical issues
- [ ] Fix high-priority issues
- [ ] Re-test affected areas

### Week 2

**Day 6-7: Integration Testing**

- [ ] Set up testing-library
- [ ] Write MissionControl integration tests
- [ ] Write ResponsiveWrapper integration tests
- [ ] Write data flow tests

**Day 8-9: E2E Testing**

- [ ] Set up Playwright
- [ ] Write critical user journey tests
- [ ] Write mobile navigation tests
- [ ] Write responsive transition tests

**Day 10: Final Validation**

- [ ] Run full regression suite
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Documentation review
- [ ] Sign-off

---

**Plan Status:** In Progress
**Last Updated:** 2025-11-09
**Owner:** Claude Code QA Team
**Stakeholders:** Development Team, Product Owner
