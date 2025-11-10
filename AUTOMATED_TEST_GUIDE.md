# Automated Test Guide - PlanMode Responsive Fix

**Created**: 2025-11-09
**Purpose**: Verify Fix #1 works correctly across all devices

---

## What We Created

### 1. Comprehensive Test Suite

**File**: `tests/e2e/plan-mode-responsive.spec.ts`

**Tests Created** (13 total):

1. ✓ Panel fits screen on iPhone SE (375px)
2. ✓ Panel fits screen on iPhone 12 (390px)
3. ✓ Panel fits screen on iPhone 14 Pro Max (430px)
4. ✓ Panel fits screen on iPad Mini (768px)
5. ✓ Panel fits screen on iPad Pro (1024px)
6. ✓ Panel fits screen on Desktop HD (1280px)
7. ✓ Panel fits screen on Desktop Full HD (1920px)
8. ✓ No horizontal scroll (all viewports)
9. ✓ Panel opens and closes correctly
10. ✓ Panel closes on backdrop click
11. ✓ Desktop behavior unchanged (480px)
12. ✓ Panel content is scrollable
13. ✓ Touch target sizes adequate
14. ✓ Panel animation is smooth
15. ✓ No console errors

### 2. Playwright Configuration

**File**: `playwright.config.ts`

Configured for:

- 9 device profiles (iPhone SE → Desktop Full HD)
- Parallel test execution
- Screenshot on failure
- Video on failure
- HTML report generation

### 3. Test Runner Script

**File**: `run-responsive-tests.sh`

Quick script to:

- Start dev server automatically
- Run tests
- Show pass/fail results
- Clean up afterwards

---

## How to Run Tests

### Option 1: Quick Run (Recommended)

```bash
./run-responsive-tests.sh
```

This will:

1. Start dev server (if not running)
2. Run all responsive tests
3. Show results
4. Stop server when done

### Option 2: Manual Run

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e

# Or run specific test file
npx playwright test tests/e2e/plan-mode-responsive.spec.ts
```

### Option 3: Debug Mode (Visual)

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Debug mode (opens browser)
npm run test:e2e:debug
```

---

## Test Execution Details

### What Each Test Does

#### ✓ Panel Fits Screen Tests

```typescript
// For each viewport (375px, 390px, 768px, 1280px, etc.)
- Sets viewport size
- Navigates to /project/plan
- Opens side panel (clicks on phase)
- Measures panel width
- Verifies: panelWidth <= maxExpectedWidth
- Verifies: panelWidth <= viewportWidth
```

**Pass Criteria**:

- Panel never wider than screen
- Panel respects max-width constraints
- Desktop remains 480px

#### ✓ No Horizontal Scroll

```typescript
- Checks: document.scrollWidth <= document.clientWidth
```

**Pass Criteria**:

- No overflow on X-axis at any size

#### ✓ Functionality Tests

```typescript
- Panel opens on phase click
- Close button (X) works
- Backdrop click closes panel
- Content is scrollable
```

**Pass Criteria**:

- All interactions work as before

---

## Understanding Test Results

### Success Output

```
✅ ALL TESTS PASSED

Fix #1 is working correctly!
Panel adapts to screen size as expected.

Next step: Commit the changes
```

### Failure Output

```
❌ TESTS FAILED

Please review test output above.
Check playwright-report/index.html for details
```

---

## Test Reports

### HTML Report

```bash
# After tests run, open:
npx playwright show-report
```

**Report Includes**:

- Pass/fail for each test
- Screenshots of failures
- Execution time
- Stack traces
- Network activity

### Visual Inspection

```bash
# Run with headed mode to see tests execute
npx playwright test --headed
```

---

## Troubleshooting

### "Dev server not ready"

```bash
# Manually start server first
npm run dev

# Wait for: "Ready on http://localhost:3000"
# Then run tests in another terminal
npm run test:e2e
```

### "Cannot find element"

This might happen if:

- No phases exist in timeline (empty state)
- Different selector needed

**Solution**: Tests are designed to handle empty states gracefully.

### "Tests timing out"

```bash
# Increase timeout in playwright.config.ts
timeout: 60000 // 60 seconds
```

### "Browser not installed"

```bash
npx playwright install chromium
```

---

## Test Maintenance

### Adding New Viewport Tests

Edit `tests/e2e/plan-mode-responsive.spec.ts`:

```typescript
const viewports = [
  // Add new viewport here
  { name: "Galaxy Fold", width: 280, height: 653, maxPanelWidth: 280 },
];
```

### Updating Selectors

If component structure changes, update:

```typescript
// In helper functions
async function openSidePanel(page) {
  // Update selector here
  const phaseElements = await page.locator("[data-phase-id]").all();
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

---

## Performance Benchmarks

**Expected Execution Time**:

- All tests (7 viewports × 15 tests): ~2-3 minutes
- Single viewport: ~15-20 seconds
- Debug mode: Varies (manual control)

**Resource Usage**:

- Memory: ~500MB (Chromium browser)
- CPU: Moderate during test execution

---

## Test Coverage

### What's Tested ✅

- Panel width at 7 viewports
- Horizontal scroll (7 viewports)
- Open/close functionality
- Backdrop interaction
- Desktop behavior preservation
- Touch target sizing
- Animation performance
- Console error detection
- Toolbar visibility
- Tab navigation
- Summary stats

### What's Not Tested (Manual)

- Visual appearance (colors, fonts)
- Actual phase data rendering
- Integration with backend API
- Cross-browser (Firefox, Safari)
- Real device testing (iPhone, Android)

---

## Next Steps After Tests Pass

### 1. Review Results

```bash
npx playwright show-report
```

### 2. Commit Changes

```bash
git add src/components/project-v2/modes/PlanMode.tsx
git add tests/e2e/plan-mode-responsive.spec.ts
git add playwright.config.ts
git commit -m "fix(mobile): make PlanMode panel responsive

- Panel adapts to screen size (w-full sm:max-w-sm md:max-w-md lg:w-[480px])
- Fixes overflow on mobile devices (375-430px wide)
- Preserves desktop behavior (480px at 1024px+)
- Includes comprehensive E2E tests (15 test cases, 7 viewports)
- All tests passing"
```

### 3. Push and Create PR

```bash
git push origin fix/mobile-responsive-p0
# Then create PR on GitHub
```

---

## Quick Reference

```bash
# Run all tests
npm run test:e2e

# Run only PlanMode tests
npx playwright test plan-mode-responsive

# Debug specific test
npx playwright test plan-mode-responsive --debug

# Run on specific device
npx playwright test --project=iphone-se

# Show report
npx playwright show-report

# Update snapshots (if using visual regression)
npx playwright test --update-snapshots
```

---

**Test Suite Version**: 1.0
**Last Updated**: 2025-11-09
**Maintainer**: Development Team
