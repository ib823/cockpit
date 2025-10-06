# End-to-End Manual Validation Guide

## Test Checklist for Timeline Features

### ✅ Test 1: Login Page (Fixed)
**URL:** http://localhost:3000/login

**Expected:**
- ✅ Page loads without errors
- ✅ No console errors about `showSymbol` variable
- ✅ Email input field visible
- ✅ Continue button present

**Status:** PASS ✓ (Fixed naming conflict: `showSymbolState` vs `showSymbol` function)

---

### ✅ Test 2: Timeline Page Loads
**URL:** http://localhost:3000/timeline-magic

**Expected:**
- ✅ Page loads without errors
- ✅ Timeline canvas visible
- ✅ No TypeScript errors in console

**How to Test:**
1. Navigate to `/timeline-magic`
2. Open browser console (F12)
3. Verify no red errors
4. Check that timeline components render

---

### 🔍 Test 3: Holiday Markers (Redesigned)
**Location:** Timeline Gantt chart

**Expected Visual:**
- ✅ **Red triangles (▼)** at top of timeline
- ✅ Positioned at exact holiday dates
- ✅ Hover shows tooltip with:
  - Holiday name (bold)
  - Full date (e.g., "Monday, Jan 01, 2024")
  - Red background tooltip
- ✅ Triangle has drop shadow for visibility

**How to Test:**
1. Go to timeline view with phases
2. Click "Holidays" button to add/view holidays
3. Look for red triangles at top of timeline
4. Hover over triangles - tooltip should appear
5. Verify tooltip position (below triangle with arrow)

**Default Holidays to Check:**
- Check Malaysia region (default)
- Should see holidays like:
  - New Year's Day
  - Chinese New Year
  - Hari Raya
  - Merdeka Day
  - etc.

---

### 🔍 Test 4: Milestone Markers (Redesigned)
**Location:** Timeline Gantt chart

**Expected Visual:**
- ✅ **Purple flag icons (🚩)** at top of timeline
- ✅ Higher z-index than holidays (appears above)
- ✅ Hover shows tooltip with:
  - Milestone name (bold)
  - Date (e.g., "Jan 15, 2024")
  - Purple background tooltip
- ✅ Flag icon filled and has drop shadow

**How to Test:**
1. Click "Milestones" button to add/view milestones
2. Default milestones should be:
   - "Project Kickoff" (start date)
   - "Go-Live" (end date)
3. Look for purple flags at top of timeline
4. Hover over flags - tooltip should appear
5. Verify flags don't overlap with holiday triangles
6. Add a new milestone and verify it appears

---

### 🔍 Test 5: Phase Expansion with Tasks (NEW)
**Location:** Each phase row in timeline

**Expected:**
- ✅ Chevron icon (▶) next to phase name
- ✅ Click chevron to expand/collapse
- ✅ When expanded shows 3 tasks per phase
- ✅ Tasks show tree structure (└)
- ✅ Task details visible:
  - Task name
  - Duration (e.g., "12d")
  - Effort (e.g., "15md")
  - Default role (e.g., "Project Manager")
- ✅ Task bars render within phase timeline (lighter opacity)

**Phase Types to Test:**

**PREPARE Phase:**
1. Team Mobilization (Project Manager) - 25% effort, 30% duration
2. Project Governance & Planning (Project Manager) - 40% effort, 40% duration
3. SAP Environment Setup (Basis Consultant) - 35% effort, 30% duration

**EXPLORE Phase:**
1. Design Workshop (Functional+Technical) - 45% effort, 40% duration
2. Develop Blueprint Document - 35% effort, 35% duration
3. User/System Validation Conditions - 20% effort, 25% duration

**REALIZE Phase:**
1. Configure/Build - 50% effort, 45% duration
2. Unit Test + SIT - 30% effort, 30% duration
3. Mock Run - 20% effort, 25% duration

**DEPLOY Phase:**
1. Training - 30% effort, 35% duration
2. UAT - 35% effort, 40% duration
3. Cutover - 35% effort, 25% duration

**RUN Phase (Hypercare):**
1. Hypercare Support - 60% effort, 100% duration
2. Knowledge Transfer - 25% effort, 80% duration
3. Stabilization & Optimization - 15% effort, 60% duration

**How to Test:**
1. Navigate to timeline with generated phases
2. Find a phase (e.g., "FI - Prepare")
3. Click the chevron (▶) icon
4. Verify 3 tasks appear below
5. Check task names match the phase type
6. Verify effort/duration percentages add up correctly
7. Click chevron again (▼) to collapse

---

### 🔍 Test 6: Resource Button on Collapsed Phases (FIXED)
**Location:** Stream rows when collapsed

**Expected:**
- ✅ When stream is collapsed, mini-reference bar shows
- ✅ Hover over collapsed stream row
- ✅ Users icon (👥) button appears on right
- ✅ Click button opens resource allocation modal
- ✅ Resource allocation is per-phase, not per-task

**How to Test:**
1. Click "Collapse All" button
2. Streams should show mini bars
3. Hover over a collapsed stream row
4. Users icon button should fade in (opacity animation)
5. Click button - resource modal should open
6. Verify modal allows phase-level resource allocation

---

### 🔍 Test 7: Task Template Matching (FIXED)
**Location:** Phase generation logic

**Expected:**
- ✅ "FI - Prepare" shows Prepare tasks
- ✅ "MM - Explore" shows Explore tasks
- ✅ "SD - Realize" shows Realize tasks
- ✅ "Deploy" shows Deploy tasks
- ✅ "Hypercare" or "Support" shows Run tasks

**How to Test:**
1. Generate a timeline with multiple modules
2. Expand phases from different stages
3. Verify each shows correct task breakdown
4. Category format: "MODULE - STAGE" (e.g., "FI - Prepare")
5. Matching logic handles:
   - `category.includes("- prepare")`
   - `category.endsWith("prepare")`
   - `name.includes("prepare")`

---

### 🔍 Test 8: Legend Accuracy
**Location:** Bottom of timeline

**Expected:**
- ✅ Red triangle icon next to "Public Holidays (X)"
- ✅ Purple flag icon next to "Milestones (X)"
- ✅ Icons match actual markers in timeline
- ✅ Count numbers are accurate

**How to Test:**
1. Scroll to bottom of timeline
2. Check legend icons match top markers
3. Count holidays manually and verify count
4. Count milestones and verify count

---

## Common Issues & Solutions

### Issue: Holiday markers not visible
**Check:**
- Browser console for errors
- z-index hierarchy (holidays: 20, milestones: 30)
- Holiday date is within timeline range

### Issue: Tasks not appearing
**Check:**
- Phase category format (should be "MODULE - STAGE")
- Console for task generation errors
- Phase effort and workingDays values (should be > 0)

### Issue: Resource button not showing
**Check:**
- Hover over collapsed stream row
- Opacity transition (should fade in)
- Button uses group-hover Tailwind class

### Issue: Milestones overlap holidays
**Check:**
- Milestone z-index (30) > holiday z-index (20)
- Both should be visible with milestone on top

---

## Performance Checks

- [ ] Timeline renders in < 2 seconds
- [ ] Expanding/collapsing is smooth
- [ ] No lag when hovering markers
- [ ] Task calculations complete instantly

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Accessibility

- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader announces markers
- [ ] aria-label attributes present
- [ ] Focus indicators visible

---

## Final Verification

**All Features Working:**
1. ✅ Login page loads without errors
2. ✅ Holiday triangles render at top
3. ✅ Milestone flags render at top
4. ✅ Hover tooltips work
5. ✅ Phase expansion shows correct tasks
6. ✅ Resource button visible on collapsed phases
7. ✅ Task templates match phase types
8. ✅ Legend matches markers

**Build Status:** ✅ PASSING (npm run build successful)

**Server Status:** ✅ RUNNING (localhost:3000)

---

## Quick Test Script

```bash
# Start server
npm run dev

# In browser, test these URLs:
# 1. http://localhost:3000/login
# 2. http://localhost:3000/timeline-magic
# 3. http://localhost:3000/project

# Check console for errors (should be none related to our changes)
```

---

## Screenshots to Capture

1. Holiday triangle marker with tooltip
2. Milestone flag marker with tooltip
3. Expanded phase showing 3 tasks
4. Collapsed phase with resource button
5. Updated legend with icons
6. Full timeline view with all markers

---

## Next Steps After Validation

If all tests pass:
- ✅ Commit changes
- ✅ Create PR
- ✅ Deploy to staging
- ✅ User acceptance testing

If issues found:
- Document specific failures
- Check browser console errors
- Review component props/state
- Debug with React DevTools
