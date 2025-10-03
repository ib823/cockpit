# 🧪 PRE-TEST REPORT - Project V2

**Date**: October 3, 2025
**Status**: ✅ READY TO TEST
**Build**: ✅ SUCCESS (with warnings only)

---

## ✅ Build Status

### Compilation
```
✓ Compiled successfully in 40s
✓ Build completed without errors
⚠ 15 ESLint warnings (non-blocking)
```

### Issues Fixed
1. ✅ Fixed `phases` property error in timeline-magic page
2. ✅ Added `parseText` method to presales store
3. ✅ Added `setDecision` method to presales store
4. ✅ Fixed `chip.kind` → `chip.type` property name
5. ✅ Fixed TypeScript color indexing in MetricCard

---

## 🌐 Available Routes

### Production Routes
| URL | Component | Description | Status |
|-----|-----------|-------------|--------|
| `/` | MagicLandingPage | Steve Jobs-style landing | ✅ Ready |
| `/project` | ProjectShell (V2) | New 4-mode UX | ✅ Ready |
| `/timeline-magic` | MagicTimelinePage | Example timeline | ✅ Ready |
| `/timeline` | Old timeline | Legacy | ✅ Works |
| `/presales` | Presales page | Legacy | ✅ Works |

### Test Flow
```
1. Start at: http://localhost:3001/
2. Click "Start Your First Project" or drop zone
3. Navigate to: /project (New V2 UI)
4. Test all 4 modes:
   - Capture (Blue)
   - Decide (Purple)
   - Plan (Green)
   - Present (Dark)
```

---

## 🎯 Test Checklist

### 🔵 Mode 1: CAPTURE (Blue)

**URL**: `/project` (default mode)

#### Empty State Test
- [ ] Drop zone visible with upload icon
- [ ] "Drop your RFP here" text displayed
- [ ] Paste textarea visible
- [ ] "Load Sample RFP" button visible
- [ ] Drop zone hover effect works

#### Sample RFP Test
- [ ] Click "Load Sample RFP"
- [ ] Loading animation appears (sparkles rotating)
- [ ] Chips animate in one-by-one
- [ ] Each chip shows:
  - Type badge (MODULES, EMPLOYEES, etc.)
  - Confidence dot (green/yellow/red)
  - Value text
  - Source text
  - Confidence percentage
- [ ] Progress indicator updates
- [ ] Progress shows percentage

#### Completion Test
- [ ] When >80% complete, green completion card appears
- [ ] "Requirements Complete!" message shows
- [ ] Floating CTA button appears bottom-right
- [ ] "Continue to decisions" button works
- [ ] Clicking CTA navigates to Decide mode

#### Manual Input Test
- [ ] Paste text in textarea
- [ ] "Extract Requirements" button enables
- [ ] Click button extracts chips
- [ ] Chips display correctly

---

### 🟣 Mode 2: DECIDE (Purple)

**Accessible from**: Capture mode "Continue" button

#### Layout Test
- [ ] Hero banner shows "Make Key Decisions"
- [ ] Progress bar shows 0/5 complete
- [ ] All 5 decision cards visible:
  1. Module Selection
  2. Banking Integration
  3. Single Sign-On
  4. Rate Card Region
  5. Deployment Model

#### Interaction Test
- [ ] Each decision shows 3+ options
- [ ] Hover over option shows impact preview
- [ ] Impact shows duration, cost, risk
- [ ] Clicking option selects it
- [ ] Selected option has green border + checkmark
- [ ] Progress bar updates when decision made
- [ ] Can change selected option

#### Impact Preview Test
- [ ] Hover shows inline impacts (duration, cost)
- [ ] Impacts show + or - values
- [ ] Color coding works (red for increase, green for decrease)

#### Completion Test
- [ ] When all 5 decisions made, floating CTA appears
- [ ] "All Decisions Made!" message shows
- [ ] "Generate project plan" button works
- [ ] Clicking navigates to Plan mode

---

### 🟢 Mode 3: PLAN (Green)

**Accessible from**: Decide mode "Generate Plan" button

#### Empty State Test
- [ ] If no timeline, shows empty state
- [ ] "Generate Timeline" button visible
- [ ] Clicking generates demo timeline

#### Toolbar Test
- [ ] Toolbar shows:
  - Zoom controls (Week/Month)
  - Present Mode button
  - Summary stats (Duration, Cost, Phases)
- [ ] Week/Month toggle works
- [ ] Stats display correctly

#### Timeline Test
- [ ] Timeline fills full width
- [ ] All phases displayed as horizontal bars
- [ ] Phase bars:
  - Sized proportionally to duration
  - Show phase name
  - Show duration label
  - Show resource count
  - Display resource avatars below
- [ ] Phase colors visible and distinct

#### Inspector Test
- [ ] Clicking phase opens slide-over inspector
- [ ] Inspector slides in from right
- [ ] Inspector shows:
  - Phase name in header
  - Duration, Resources, Cost
  - Team members list with avatars
  - Phase description
- [ ] Clicking outside closes inspector
- [ ] ESC key closes inspector
- [ ] X button closes inspector

#### Stale Warning Test
- [ ] If decisions changed, yellow warning banner appears
- [ ] "Timeline outdated" message shows
- [ ] "Regenerate" button works
- [ ] Clicking regenerate updates timeline

---

### ⚫ Mode 4: PRESENT (Dark)

**Accessible from**: Plan mode "Present Mode" button

#### Full-Screen Test
- [ ] Full-screen takeover (no other UI visible)
- [ ] Dark gradient background
- [ ] No edit controls visible
- [ ] No costs/rates visible
- [ ] Minimal chrome (only counter + exit)

#### Slides Test
- [ ] Slide 1: Cover
  - Project title
  - Summary stats (duration, phases, consultants)
  - NO COSTS VISIBLE
- [ ] Slide 2: Requirements
  - Chip cards displayed (max 8)
  - Type labels visible
  - Values visible
- [ ] Slide 3: Timeline
  - Animated phase bars
  - Phase names and durations
  - Resource counts (NOT costs)
- [ ] Slide 4: Team
  - Resource breakdown by phase
  - Team size per phase
  - NO RATES VISIBLE
- [ ] Slide 5: Summary
  - Key metrics (duration, phases, team)
  - NO COSTS/BUDGET VISIBLE
  - "Ready to transform" message

#### Navigation Test
- [ ] Dot navigation at bottom shows all 5 slides
- [ ] Current slide highlighted (filled dot)
- [ ] Clicking dots jumps to slide
- [ ] Left arrow key goes to previous slide
- [ ] Right arrow key goes to next slide
- [ ] First slide: left arrow disabled
- [ ] Last slide: right arrow disabled

#### Exit Test
- [ ] ESC key exits to Plan mode
- [ ] X button in top-right exits
- [ ] Exit returns to Plan mode (not Capture)

---

## ⌨️ Keyboard Shortcuts Test

### Global (All Modes)
- [ ] Tab navigates between focusable elements
- [ ] Enter activates buttons
- [ ] ESC closes modals/slide-overs

### Present Mode
- [ ] Arrow Left: Previous slide
- [ ] Arrow Right: Next slide
- [ ] ESC: Exit to Plan mode
- [ ] Click dots: Jump to slide

---

## 🎨 Visual Quality Test

### Animations
- [ ] Mode transitions smooth (300ms fade)
- [ ] Chip extraction staggered (50ms delays)
- [ ] Decision card hover scale (1.02)
- [ ] Progress bars animate smoothly
- [ ] Floating CTAs spring animation
- [ ] Present mode slide transitions smooth
- [ ] All animations feel 60fps

### Typography
- [ ] Headlines use font-light (300)
- [ ] Body text readable
- [ ] Proper hierarchy (7xl → xl)
- [ ] Tracking and spacing correct

### Colors
- [ ] Capture mode: Blue (#3b82f6)
- [ ] Decide mode: Purple (#8b5cf6)
- [ ] Plan mode: Green (#10b981)
- [ ] Present mode: Dark (#1f2937)
- [ ] Color contrast ≥4.5:1 (accessibility)

### Spacing
- [ ] Consistent padding (multiples of 8px)
- [ ] Proper whitespace
- [ ] No cramped layouts
- [ ] Breathing room around elements

---

## 🐛 Known Issues & Workarounds

### Non-Blocking Warnings
```
⚠ 15 ESLint warnings (any types, unused vars)
Status: Non-blocking, can be fixed later
```

### Potential Issues to Watch

#### Issue 1: Store Hydration
**Symptoms**: Chips not displaying, blank timeline
**Check**: Browser console for hydration errors
**Fix**: Clear localStorage and refresh

#### Issue 2: Animation Performance
**Symptoms**: Janky animations, low FPS
**Check**: Chrome DevTools > Performance
**Expected**: 60fps consistently
**Fix**: Reduce animation duration if needed

#### Issue 3: Keyboard Focus
**Symptoms**: Tab navigation not working
**Check**: Click into app first to focus
**Expected**: Tab navigates elements
**Fix**: Click anywhere in app

---

## 📊 Performance Targets

### Load Time
- **Target**: First Contentful Paint <1s
- **Measure**: Chrome DevTools > Performance
- **Method**: Hard refresh, record load

### Animation
- **Target**: 60fps for all animations
- **Measure**: Chrome DevTools > Performance > FPS
- **Method**: Record during mode transitions

### Bundle Size
- **Target**: <500KB gzipped
- **Measure**: Build output
- **Current**: Check `.next/static` folder

---

## 🔍 Debug Checklist

If something doesn't work:

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for red errors
   - Note error message and line number

2. **Check Network Tab**
   - Look for failed requests
   - Check API responses
   - Verify static assets load

3. **Check Store State**
   - Install React DevTools extension
   - Select component
   - View store values (chips, decisions, phases)

4. **Clear Cache**
   - Hard refresh: Cmd/Ctrl + Shift + R
   - Clear localStorage
   - Restart dev server

5. **Verify Build**
   - Run `npm run build`
   - Check for TypeScript errors
   - Look for new warnings

---

## ✅ Pre-Test Verification

Before you start testing, verify:

### Environment
- [ ] Node version ≥18
- [ ] pnpm installed
- [ ] Dependencies installed
- [ ] Build successful

### Files
- [ ] All 13 component files exist
- [ ] All 8 documentation files exist
- [ ] utils.ts exists
- [ ] Stores export correctly

### Server
- [ ] Dev server starts: `pnpm dev`
- [ ] No startup errors
- [ ] Server running on port 3001
- [ ] Can access http://localhost:3001

---

## 🚀 Start Testing

### Step 1: Start Server
```bash
cd /workspaces/cockpit
pnpm dev
```

### Step 2: Open Browser
Navigate to: **http://localhost:3001**

### Step 3: Follow Test Flow
1. Test landing page
2. Click "Start Project"
3. Test Capture mode
4. Test Decide mode
5. Test Plan mode
6. Test Present mode
7. Test keyboard shortcuts

### Step 4: Report Findings
- Note any errors in browser console
- Screenshot any visual issues
- Document steps to reproduce bugs
- Check performance metrics

---

## 📝 Test Report Template

Use this template to document test results:

```markdown
## Test Results - [Date]

### Environment
- Browser: [Chrome/Firefox/Safari]
- OS: [macOS/Windows/Linux]
- Screen: [Resolution]

### Tests Passed
- ✅ [Test name]
- ✅ [Test name]

### Tests Failed
- ❌ [Test name]
  - **Issue**: [Description]
  - **Steps**: [How to reproduce]
  - **Console**: [Error message]
  - **Screenshot**: [Attach if helpful]

### Performance
- FPS: [60fps target]
- Load time: [<1s target]
- Animation smoothness: [Smooth/Janky]

### Notes
[Any additional observations]
```

---

## 🎉 Success Criteria

Test is successful if:
- ✅ All 4 modes load without errors
- ✅ All primary interactions work
- ✅ Animations smooth (60fps)
- ✅ Keyboard navigation works
- ✅ Present mode hides costs
- ✅ No console errors
- ✅ Build succeeds

---

**Ready to test! Good luck! 🚀**
