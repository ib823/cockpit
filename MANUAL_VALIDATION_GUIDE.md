# Manual Validation Guide - 5 Minute Checklist

**Server**: ✅ Running at http://localhost:3000
**Component**: PlanMode Panel
**What to test**: Visual quality, layout stability, professional polish
**Time needed**: 5-10 minutes

---

## SETUP (30 seconds)

1. **Open Chrome** (or your preferred browser)
2. **Navigate to**: http://localhost:3000/project/plan
3. **Open DevTools**: Press `F12` (Windows) or `Cmd+Option+I` (Mac)
4. **Toggle Device Toolbar**: Press `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows)

---

## TEST SEQUENCE (5 minutes)

### Test 1: iPhone SE (375×667) - CRITICAL ⏱️ 1 min

**Setup**:
- In DevTools, select "iPhone SE" from dropdown OR
- Click "Responsive" and set width to **375px**

**What to check**:
- [ ] Navigate to PlanMode (/project/plan)
- [ ] Click any phase on the timeline/Gantt chart
- [ ] **Panel should slide in from right**
- [ ] Panel width should be **exactly viewport width** (no horizontal scroll)
- [ ] **Stats grid** (top 3 cards):
  - [ ] All 3 cards are **same height** ✅
  - [ ] Labels: "Days", "Effort", "People" - **No wrapping** ✅
  - [ ] Numbers are large and readable ✅
- [ ] **Template buttons** (if you click "Quick Team"):
  - [ ] Shows **2 columns** on mobile ✅
  - [ ] Button names: "Lite Team", "Standard Team", "Enterprise Team" - **No wrapping** ✅
  - [ ] All buttons **same height** ✅
- [ ] **Resource cards**:
  - [ ] Role names truncate if too long ✅
  - [ ] Delete button (X) is **easy to tap** ✅
  - [ ] Costs truncate if needed ✅
- [ ] **Task cards**:
  - [ ] Task names truncate if too long ✅
  - [ ] Edit/delete buttons are **easy to tap** ✅
  - [ ] Descriptions truncate after 2 lines ✅
- [ ] **Close panel** (X button in top right):
  - [ ] Button is **easy to tap** ✅
  - [ ] Panel closes smoothly ✅

**Expected Result**: Everything fits perfectly, no wrapping, no horizontal scroll

---

### Test 2: iPhone 12 (390×844) - VALIDATION ⏱️ 1 min

**Setup**:
- Select "iPhone 12" from dropdown OR set width to **390px**

**What to check**:
- [ ] Repeat same test as iPhone SE
- [ ] Should feel **more spacious** (15px wider)
- [ ] All same checks should pass
- [ ] No new issues

**Expected Result**: Same as iPhone SE but more comfortable

---

### Test 3: iPhone 14 Pro Max (430×932) - EDGE CASE ⏱️ 30 sec

**Setup**:
- Select "iPhone 14 Pro Max" OR set width to **430px**

**What to check**:
- [ ] Open panel
- [ ] **Very spacious** - lots of room
- [ ] Templates might still be 2 columns (that's fine)
- [ ] Everything looks comfortable

**Expected Result**: Very spacious, no issues

---

### Test 4: iPad Mini (768×1024) - TABLET ⏱️ 1 min

**Setup**:
- Select "iPad Mini" OR set width to **768px**

**What to check**:
- [ ] Open panel
- [ ] Panel width should be **~448px** (not full width)
- [ ] **Stats grid**:
  - [ ] Labels should be **larger** (14px instead of 12px)
- [ ] **Template buttons**:
  - [ ] Should show **3 columns** (not 2) ✅
  - [ ] More spacing between items ✅
- [ ] **Everything feels more spacious**

**Expected Result**: Tablet experience, 3-column layouts, larger text

---

### Test 5: Desktop (1280×800) - REGRESSION ⏱️ 1 min

**Setup**:
- Select "Responsive" and set width to **1280px** OR
- Close device toolbar (back to desktop)

**What to check**:
- [ ] Open panel
- [ ] Panel width should be **480px** (original size) ✅
- [ ] **This should look IDENTICAL to before changes** ✅
- [ ] All stats, templates, resources work as before
- [ ] No regressions
- [ ] **Zero visual differences from original**

**Expected Result**: Desktop experience unchanged, zero regressions

---

### Test 6: Layout Stress Test ⏱️ 1 min

**At iPhone SE (375px)**:

**Add a very long phase name**:
- [ ] Open panel for a phase
- [ ] Phase name should **truncate with "..."** ✅
- [ ] No wrapping, no layout break ✅

**Add very long task name**:
- [ ] Create a task with 50+ character name
- [ ] Should **truncate with "..."** ✅
- [ ] Edit/delete buttons still visible ✅

**Add very long task description**:
- [ ] Create task with long description
- [ ] Should show **max 2 lines** then "..." ✅
- [ ] No layout expansion ✅

**Add resource with long role name**:
- [ ] If role name is long (like "Solution Architect")
- [ ] Should **truncate** if too long ✅
- [ ] Delete button still accessible ✅

**Expected Result**: All long text truncates gracefully, no layout breaks

---

## VISUAL POLISH CHECK ⏱️ 30 sec

**At each viewport, subjectively check**:

- [ ] **Does it look professional?** (not cramped, good spacing)
- [ ] **Is text comfortable to read?** (not too small)
- [ ] **Are buttons easy to tap?** (not too small, good spacing)
- [ ] **Does spacing feel balanced?** (not too tight, not too loose)
- [ ] **Does it match quality of Notion/Linear/Asana?**

**If you answer "YES" to all → ✅ PASS**
**If any "NO" → Note what feels off**

---

## COMMON ISSUES TO LOOK FOR ⚠️

### ❌ Bad Signs:
- Horizontal scroll bar appears
- Text wraps to multiple lines breaking layout
- Card heights are misaligned (some taller than others)
- Buttons are too small to tap comfortably
- Text is too small to read easily
- Spacing feels cramped or awkward
- Layout shifts when text changes

### ✅ Good Signs:
- No horizontal scroll
- All grid items same height
- Text truncates cleanly with "..."
- Buttons are comfortable to tap
- Text is easy to read
- Spacing feels intentional
- Layout is stable

---

## QUICK DECISION MATRIX

### All Tests Pass ✅
**Action**: Ship it! You're good to go.
**Confidence**: 95%+

### 1-2 Minor Issues ⚠️
**Action**: Note the issues, decide if they're blockers
**Example**: "Text could be slightly larger on tablet"
**Decision**: Ship and iterate OR quick fix

### 3+ Issues or Critical Issue ❌
**Action**: Don't ship, report issues to me
**Example**: "Cards are different heights on iPhone SE"
**Decision**: Need fixes before shipping

---

## RESULTS FORM

Copy and fill this out:

```
MANUAL VALIDATION RESULTS
Date: [DATE]
Tester: [YOUR NAME]

iPhone SE (375px):     [ ] PASS  [ ] FAIL  Notes: ________________
iPhone 12 (390px):     [ ] PASS  [ ] FAIL  Notes: ________________
iPhone 14 (430px):     [ ] PASS  [ ] FAIL  Notes: ________________
iPad Mini (768px):     [ ] PASS  [ ] FAIL  Notes: ________________
Desktop (1280px):      [ ] PASS  [ ] FAIL  Notes: ________________
Stress Test:           [ ] PASS  [ ] FAIL  Notes: ________________
Visual Polish:         [ ] PASS  [ ] FAIL  Notes: ________________

OVERALL:               [ ] PASS  [ ] FAIL

Critical Issues Found: [NONE / LIST]
Minor Issues Found: [NONE / LIST]

Recommendation: [ ] SHIP  [ ] FIX THEN SHIP  [ ] MAJOR REWORK NEEDED
```

---

## IF ISSUES ARE FOUND

### Report Format:
```
Issue: [What's wrong]
Viewport: [375px / 768px / etc.]
Severity: [CRITICAL / HIGH / MEDIUM / LOW]
Screenshot: [Attach if possible]
Expected: [What should happen]
Actual: [What actually happens]
```

### Example:
```
Issue: Template button "Enterprise Team" wraps to 2 lines
Viewport: 375px (iPhone SE)
Severity: CRITICAL
Expected: Name should be on 1 line OR truncate
Actual: "Enterprise Team" wraps, making button taller than others
```

---

## ESTIMATED TIME

- **Setup**: 30 seconds
- **Test 1-5**: 5 minutes
- **Stress test**: 1 minute
- **Polish check**: 30 seconds
- **Total**: ~7 minutes

**Ready to start testing!**

---

## QUICK START COMMANDS

Open terminal and run:
```bash
# Server is already running at http://localhost:3000

# Just open your browser:
open http://localhost:3000/project/plan  # Mac
start http://localhost:3000/project/plan # Windows

# Then press F12 and Cmd+Shift+M to start testing
```

---

**Good luck! Report back with results.**
