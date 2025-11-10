# Implementation & Testing Plan - Zero-Breakage Strategy

**Objective**: Apply responsive design fixes systematically while ensuring zero regressions
**Approach**: Incremental changes + comprehensive testing at each step
**Timeline**: 3 weeks with daily checkpoints

---

## Part 1: Pre-Implementation Setup (Day 1)

### 1.1 Create Git Branch Strategy

```bash
# Start from clean main branch
git checkout main
git pull origin main

# Create feature branch for P0 fixes
git checkout -b fix/mobile-responsive-p0

# Verify clean state
git status
```

**Branch Naming Convention**:

- `fix/mobile-responsive-p0` - Priority 0 critical fixes
- `fix/mobile-responsive-p1` - Priority 1 high-impact fixes
- `feat/mobile-enhancements` - Priority 2 polish features

---

### 1.2 Set Up Testing Infrastructure

**Install Testing Dependencies**:

```bash
# Visual regression testing
npm install --save-dev @percy/cli @percy/playwright

# Responsive testing
npm install --save-dev playwright @playwright/test

# Accessibility testing
npm install --save-dev @axe-core/playwright

# Bundle size monitoring
npm install --save-dev @next/bundle-analyzer
```

**Configure Playwright**:

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Desktop browsers
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-desktop",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile devices - CRITICAL FOR OUR CHANGES
    {
      name: "iphone-se",
      use: {
        ...devices["iPhone SE"],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: "iphone-12",
      use: {
        ...devices["iPhone 12"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "iphone-14-pro-max",
      use: {
        ...devices["iPhone 14 Pro Max"],
        viewport: { width: 430, height: 932 },
      },
    },
    {
      name: "ipad-mini",
      use: {
        ...devices["iPad Mini"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "pixel-5",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### 1.3 Create Baseline Screenshots (BEFORE Changes)

This is critical - we need to capture the current state before making ANY changes.

**Create Screenshot Script**:

```typescript
// tests/visual/baseline.spec.ts
import { test, expect } from "@playwright/test";

const viewports = [
  { name: "mobile-375", width: 375, height: 667 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const routes = [
  "/",
  "/login",
  "/dashboard",
  "/project/capture",
  "/project/plan",
  "/project/present",
  "/project/decide",
  "/admin",
];

for (const viewport of viewports) {
  for (const route of routes) {
    test(`${route} - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Navigate to route
      await page.goto(route);

      // Wait for page to be fully loaded
      await page.waitForLoadState("networkidle");

      // Take full page screenshot
      await page.screenshot({
        path: `tests/visual/baseline/${viewport.name}${route.replace(/\//g, "_")}.png`,
        fullPage: true,
      });
    });
  }
}
```

**Run Baseline Capture**:

```bash
# Start dev server
npm run dev

# In another terminal, capture baseline
npx playwright test tests/visual/baseline.spec.ts

# This creates baseline screenshots in tests/visual/baseline/
# Commit these to git for comparison
git add tests/visual/baseline/
git commit -m "chore: add visual regression baseline screenshots"
```

---

### 1.4 Document Current Functionality (Smoke Test Checklist)

**Create Manual Test Checklist**:

```markdown
# tests/manual/smoke-test-checklist.md

## Authentication

- [ ] Can log in with email/password
- [ ] Can log in with passkey
- [ ] Can log out
- [ ] Session persists on page refresh

## Project Workflows

### Capture Mode

- [ ] Can create new project
- [ ] Can enter requirements manually
- [ ] Can paste requirements
- [ ] Chips are generated
- [ ] Can edit chips
- [ ] Can delete chips
- [ ] Can navigate to Plan mode

### Plan Mode

- [ ] Timeline displays correctly
- [ ] Can add/edit/delete tasks
- [ ] Can change dependencies
- [ ] Can switch between tabs (Calendar, Benchmarks, Resources)
- [ ] Side panel opens/closes
- [ ] Can navigate to Present mode

### Present Mode

- [ ] Slides display correctly
- [ ] Can navigate between slides (arrows/dots)
- [ ] Can export presentation
- [ ] Can exit presentation
- [ ] Can navigate to Decide mode

### Decide Mode

- [ ] Decision cards display
- [ ] Can view gaps
- [ ] Can mark decisions complete
- [ ] Progress bar updates
- [ ] Can navigate back to Capture

## Admin Functions

- [ ] Can view user list
- [ ] Can create access code
- [ ] Can view security dashboard
- [ ] Can access settings

## General

- [ ] No console errors
- [ ] No network errors (check Network tab)
- [ ] Dark mode toggles correctly
- [ ] Toast notifications appear
- [ ] Loading states show
- [ ] Error states show appropriately
```

**Run Manual Smoke Test BEFORE Changes**:

```bash
# Document results
cp tests/manual/smoke-test-checklist.md tests/manual/smoke-test-BASELINE-$(date +%Y%m%d).md

# Fill out checklist, commit results
git add tests/manual/smoke-test-BASELINE-*.md
git commit -m "chore: baseline smoke test results"
```

---

## Part 2: Incremental Implementation Strategy

### 2.1 Change Application Process (Per Fix)

**Process Template** (repeat for each change):

```bash
# 1. Create micro-commit for single change
# 2. Test immediately
# 3. Commit if pass, revert if fail
# 4. Move to next change

# Example for Fix #1: PlanMode Panel Width
```

**Step-by-Step for Each Change**:

#### **Change 1: PlanMode Panel Width**

**A. Make the change**:

```tsx
// File: src/components/project-v2/modes/PlanMode.tsx

// BEFORE (Line 311):
className = "fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50";

// AFTER:
className =
  "fixed right-0 top-0 bottom-0 w-full sm:max-w-sm md:max-w-md lg:w-[480px] bg-white shadow-2xl z-50";
```

**B. Test immediately**:

```bash
# 1. Visual inspection (Chrome DevTools)
npm run dev

# Open http://localhost:3000/project/plan
# Press F12 → Toggle device toolbar (Cmd+Shift+M)
# Test these viewports:
# - iPhone SE (375px) - panel should be full width
# - iPhone 12 (390px) - panel should be full width
# - iPad Mini (768px) - panel should be max ~384px
# - Desktop (1280px) - panel should be 480px

# 2. Functional test
# - Can panel open?
# - Can panel close?
# - Can scroll panel content?
# - Can interact with content behind panel?
# - Are tabs still accessible?

# 3. Automated test
npx playwright test tests/e2e/plan-mode.spec.ts --project=iphone-se
npx playwright test tests/e2e/plan-mode.spec.ts --project=iphone-12
npx playwright test tests/e2e/plan-mode.spec.ts --project=desktop
```

**C. Visual regression check**:

```bash
# Take new screenshot
npx playwright test tests/visual/baseline.spec.ts --grep "plan"

# Compare with baseline
# Use a visual diff tool or Percy
npm run visual-diff
```

**D. Commit if tests pass**:

```bash
# If all tests pass
git add src/components/project-v2/modes/PlanMode.tsx
git commit -m "fix(mobile): make PlanMode panel responsive

- Change w-[480px] to w-full sm:max-w-sm md:max-w-md lg:w-[480px]
- Fixes panel overflow on mobile devices (375-414px)
- Tested on iPhone SE, iPhone 12, iPad, Desktop
- No regressions in panel functionality

Closes #ISSUE-123"

# If tests fail
git restore src/components/project-v2/modes/PlanMode.tsx
# Debug and fix, then retry
```

---

### 2.2 Automated Test Suite (Create Before Changes)

**Create E2E Tests for Each Component**:

```typescript
// tests/e2e/plan-mode.spec.ts
import { test, expect } from "@playwright/test";

test.describe("PlanMode", () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to plan mode
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    await page.goto("/project/plan");
  });

  test("should display plan mode layout", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Plan");
  });

  test("should open side panel", async ({ page }) => {
    const panelButton = page.locator('button:has-text("Resources")');
    await panelButton.click();

    const panel = page.locator('[data-testid="resource-panel"]');
    await expect(panel).toBeVisible();
  });

  test("should close side panel on mobile", async ({ page, viewport }) => {
    // Only run on mobile viewports
    if (viewport.width < 768) {
      const panelButton = page.locator('button:has-text("Resources")');
      await panelButton.click();

      const panel = page.locator('[data-testid="resource-panel"]');
      await expect(panel).toBeVisible();

      // Panel should have full width on mobile
      const boundingBox = await panel.boundingBox();
      expect(boundingBox.width).toBeGreaterThanOrEqual(viewport.width - 10);

      // Should be able to close
      const closeButton = panel.locator('button[aria-label="Close"]');
      await closeButton.click();
      await expect(panel).not.toBeVisible();
    }
  });

  test("should not cause horizontal scroll", async ({ page }) => {
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
  });

  test("should display tabs", async ({ page }) => {
    await expect(page.locator('button:has-text("Calendar")')).toBeVisible();
    await expect(page.locator('button:has-text("Benchmarks")')).toBeVisible();
    await expect(page.locator('button:has-text("Resources")')).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

    await page.click('button:has-text("Benchmarks")');
    await expect(page.locator('[data-testid="benchmarks-view"]')).toBeVisible();
  });
});
```

**Create Responsive Layout Tests**:

```typescript
// tests/e2e/responsive.spec.ts
import { test, expect } from "@playwright/test";

const criticalRoutes = [
  "/",
  "/dashboard",
  "/project/capture",
  "/project/plan",
  "/project/present",
  "/project/decide",
];

for (const route of criticalRoutes) {
  test.describe(`${route} - Responsive Tests`, () => {
    test("should not have horizontal scroll on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(route);

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("should not have horizontal scroll on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(route);

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("should not have horizontal scroll on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(route);

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("all interactive elements should be tappable on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(route);

      const buttons = await page.locator("button, a[href]").all();

      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box) {
          // Minimum 44x44px touch target (Apple HIG)
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
}
```

**Create Accessibility Tests**:

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Tests", () => {
  test("should not have accessibility violations on dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have accessibility violations on plan mode", async ({ page }) => {
    await page.goto("/project/plan");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

---

### 2.3 Testing Checklist Per Change

**For EVERY change, run this checklist**:

```markdown
## Testing Checklist - [Component Name] - [Date]

### 1. Visual Inspection

- [ ] Mobile (375px) - Chrome DevTools
- [ ] Mobile (390px) - Chrome DevTools
- [ ] Tablet (768px) - Chrome DevTools
- [ ] Desktop (1280px) - Chrome DevTools
- [ ] Desktop (1920px) - Chrome DevTools

### 2. Functional Testing

- [ ] Component renders
- [ ] Interactions work (clicks, hovers, focus)
- [ ] Forms submit correctly
- [ ] Navigation works
- [ ] State updates correctly
- [ ] Loading states show
- [ ] Error states show

### 3. Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Edge (latest)

### 4. Automated Tests

- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Unit tests pass: `npm run test`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Linting passes: `npm run lint`

### 5. Regression Testing

- [ ] Adjacent components still work
- [ ] Routes still navigate correctly
- [ ] No new console errors
- [ ] No new network errors

### 6. Performance

- [ ] No significant bundle size increase
- [ ] Page loads in < 3 seconds
- [ ] No layout shift (CLS)
- [ ] Lighthouse score unchanged or improved

### 7. Visual Regression

- [ ] Screenshot comparison shows only intended changes
- [ ] No unintended styling changes
- [ ] Typography unchanged (unless intended)
- [ ] Spacing unchanged (unless intended)

### 8. Accessibility

- [ ] Keyboard navigation still works
- [ ] Focus visible
- [ ] Screen reader announces correctly
- [ ] ARIA labels correct
- [ ] Color contrast maintained

---

**Result**: ✅ PASS / ❌ FAIL

**Notes**: [Any issues found, edge cases, etc.]

**Tester**: [Your name]
**Date**: [Date]
```

---

## Part 3: Implementation Order with Safety Checks

### Week 1: P0 Critical Fixes

#### **Day 1: Setup + Fix 1 (PlanMode Panel)**

**Morning (2 hours)**:

```bash
# 1. Setup testing infrastructure
npm install --save-dev playwright @playwright/test @axe-core/playwright

# 2. Create baseline screenshots
npx playwright test tests/visual/baseline.spec.ts

# 3. Run baseline smoke tests
# Manually test all workflows, document results
```

**Afternoon (2 hours)**:

```bash
# 4. Implement Fix 1: PlanMode panel width
# Edit: src/components/project-v2/modes/PlanMode.tsx:311

# 5. Test immediately
npm run dev
# Visual test in Chrome DevTools (375px, 390px, 768px, 1280px)

# 6. Run automated tests
npx playwright test tests/e2e/plan-mode.spec.ts

# 7. Visual regression check
npx playwright test tests/visual/baseline.spec.ts --grep "plan"
# Compare screenshots

# 8. If pass, commit
git add src/components/project-v2/modes/PlanMode.tsx
git commit -m "fix(mobile): make PlanMode panel responsive"

# 9. If fail, revert and debug
git restore src/components/project-v2/modes/PlanMode.tsx
```

**End of Day Checkpoint**:

- [ ] Fix applied
- [ ] Tests passing
- [ ] Committed to branch
- [ ] No regressions found

---

#### **Day 2: Fix 2 (AppLayout Scroll) + Fix 3 (Hamburger Menu Part 1)**

**Morning (1 hour)**:

```bash
# Fix 2: AppLayout horizontal scroll
# Edit: src/components/layout/AppLayout.tsx:42-43

# Test
npm run dev
# Check for horizontal scroll on all viewports
# Run: npx playwright test tests/e2e/responsive.spec.ts

# Commit if pass
git add src/components/layout/AppLayout.tsx
git commit -m "fix(mobile): remove 100vw causing horizontal scroll"
```

**Afternoon (3 hours)**:

```bash
# Fix 3: Add hamburger menu (complex change)
# Edit: src/components/layout/AppLayout.tsx (major changes)

# Test thoroughly
# - Visual inspection (mobile, tablet, desktop)
# - Drawer opens/closes
# - Navigation works
# - Desktop layout unchanged

# Run full test suite
npm run test
npm run test:e2e
npm run typecheck

# Commit if pass
git add src/components/layout/AppLayout.tsx
git commit -m "feat(mobile): add hamburger menu navigation"
```

**End of Day Checkpoint**:

- [ ] 2 more fixes applied
- [ ] All tests passing
- [ ] No regressions
- [ ] Ready for Day 3

---

#### **Day 3: Testing & Refinement**

**Full Day (6 hours)**:

```bash
# 1. Run complete test suite
npm run test          # Unit tests
npm run test:e2e      # E2E tests all viewports
npm run typecheck     # TypeScript
npm run lint          # Linting
npm run build         # Production build

# 2. Manual smoke test on all viewports
# Use checklist from Section 1.4

# 3. Cross-browser testing
# Chrome, Firefox, Safari, Edge

# 4. Visual regression review
# Compare all screenshots with baseline

# 5. Performance testing
npm run build
npm run start
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# 6. Fix any issues found
# If issues found, fix and re-test

# 7. Create PR for review
git push origin fix/mobile-responsive-p0
# Open PR on GitHub
```

---

#### **Day 4-5: Code Review + Deploy to Staging**

**Day 4 (PR Review)**:

- Share PR with team
- Address review comments
- Re-test after changes

**Day 5 (Staging Deployment)**:

```bash
# Merge to main after approval
git checkout main
git pull origin main
git merge fix/mobile-responsive-p0

# Deploy to staging
npm run build
# Deploy via your CI/CD pipeline

# Test on staging environment
# - Smoke test all workflows
# - Test on real devices (iPhone, iPad, Android)
# - Monitor for errors in production logs

# If issues found, roll back
git revert HEAD
git push origin main

# If all good, proceed to production
```

---

## Part 4: Rollback Strategy

### 4.1 Immediate Rollback (If Critical Issue Found)

**Git Revert**:

```bash
# If issue found after merge
git log --oneline  # Find commit hash
git revert <commit-hash>
git push origin main

# Or revert multiple commits
git revert <oldest-hash>^..<newest-hash>
```

**Feature Flag (Recommended for Production)**:

Add feature flags for major changes:

```typescript
// lib/feature-flags.ts
export const featureFlags = {
  mobileResponsiveNav: process.env.NEXT_PUBLIC_FEATURE_MOBILE_NAV === 'true',
  mobileGanttView: process.env.NEXT_PUBLIC_FEATURE_MOBILE_GANTT === 'true',
};

// In AppLayout.tsx
import { featureFlags } from '@/lib/feature-flags';

export function AppLayout({ children }) {
  const showMobileNav = featureFlags.mobileResponsiveNav;

  return (
    <Layout>
      {showMobileNav ? (
        <MobileResponsiveHeader />
      ) : (
        <OriginalHeader />
      )}
      {/* ... */}
    </Layout>
  );
}
```

**Toggle Off**:

```bash
# .env.production
NEXT_PUBLIC_FEATURE_MOBILE_NAV=false

# Redeploy (instant rollback without code changes)
```

---

### 4.2 Monitoring After Deployment

**Set Up Error Tracking**:

```typescript
// If using Sentry or similar
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Track component errors
export function PlanMode() {
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "navigation",
      message: "Entered PlanMode",
      level: "info",
    });
  }, []);

  // ... component code
}
```

**Monitor Key Metrics**:

```markdown
## Post-Deployment Monitoring (First 24 Hours)

### Error Rates

- [ ] No increase in JavaScript errors
- [ ] No increase in API errors
- [ ] No increase in failed page loads

### Performance

- [ ] Page load time unchanged or improved
- [ ] Core Web Vitals stable
- [ ] No layout shift issues

### User Behavior

- [ ] Mobile conversion rate stable
- [ ] Session duration stable
- [ ] Bounce rate stable or improved

### Specific Checks

- [ ] PlanMode panel usage working
- [ ] Navigation clicks working
- [ ] Form submissions working
```

---

## Part 5: Continuous Testing Strategy

### 5.1 Automated CI/CD Pipeline

**GitHub Actions Workflow**:

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: E2E tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

      - name: Visual regression tests
        run: npm run visual-test
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

**Run on Every PR**:

- Prevents breaking changes from merging
- Visual regression catches unintended changes
- Accessibility tests enforce standards

---

### 5.2 Pre-Commit Hooks

**Husky + Lint-Staged**:

```bash
npm install --save-dev husky lint-staged

# Setup husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**Configuration**:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{ts,tsx}": ["bash -c 'npm run typecheck'"]
  }
}
```

**Prevents committing**:

- TypeScript errors
- Linting errors
- Formatting issues

---

## Part 6: Testing Schedule Summary

### Daily Testing Routine (During Implementation)

**Every Morning**:

```bash
# 1. Pull latest changes
git checkout main
git pull origin main
git checkout fix/mobile-responsive-p0
git merge main  # Keep branch updated

# 2. Run full test suite
npm run test
npm run typecheck

# 3. Visual inspection
npm run dev
# Check each modified component manually
```

**After Each Change**:

```bash
# 1. Visual test (2 minutes)
# 2. Functional test (3 minutes)
# 3. Automated test (1 minute)
# 4. Commit if pass (1 minute)
# Total: 7 minutes per change
```

**End of Day**:

```bash
# 1. Run full test suite (5 minutes)
npm run test
npm run test:e2e
npm run typecheck
npm run lint

# 2. Build check (2 minutes)
npm run build

# 3. Push to remote (1 minute)
git push origin fix/mobile-responsive-p0

# Total: 8 minutes
```

---

### Weekly Testing Cycle

**Monday**: Setup + P0 Fix 1
**Tuesday**: P0 Fix 2 + 3
**Wednesday**: Full testing + refinement
**Thursday**: Code review + fixes
**Friday**: Deploy to staging + monitor

**Next Monday**: Start P1 fixes (repeat cycle)

---

## Part 7: Safety Checkpoints

### Checkpoint 1: Before Starting (MANDATORY)

```bash
# ✓ Baseline screenshots captured
# ✓ Manual smoke test completed
# ✓ All tests passing on main branch
# ✓ Git branch created
# ✓ Testing infrastructure installed

# If any ✗, STOP and fix before proceeding
```

### Checkpoint 2: After Each Fix (MANDATORY)

```bash
# ✓ Visual inspection passed (all viewports)
# ✓ Functional testing passed
# ✓ Automated tests passed
# ✓ No console errors
# ✓ No horizontal scroll
# ✓ Touch targets sized correctly
# ✓ Committed to git

# If any ✗, REVERT change and debug
```

### Checkpoint 3: Before Merging to Main (MANDATORY)

```bash
# ✓ All tests passing
# ✓ Build succeeds
# ✓ Visual regression reviewed
# ✓ Cross-browser tested
# ✓ Performance metrics unchanged
# ✓ Accessibility tests pass
# ✓ Code reviewed by teammate
# ✓ Smoke test checklist completed

# If any ✗, DO NOT MERGE
```

### Checkpoint 4: After Staging Deployment (MANDATORY)

```bash
# ✓ Staging URL accessible
# ✓ Can log in
# ✓ All workflows work
# ✓ Tested on real iPhone
# ✓ Tested on real Android device
# ✓ No errors in logs
# ✓ Performance acceptable

# If any ✗, ROLLBACK immediately
```

---

## Part 8: Emergency Procedures

### If Critical Bug Found in Production

**Immediate Actions** (5 minutes):

```bash
# 1. Verify issue is real (not user error)
# 2. Assess severity (blocks users?)
# 3. If critical, rollback immediately

# Rollback via feature flag (30 seconds)
NEXT_PUBLIC_FEATURE_MOBILE_NAV=false

# OR revert commit (2 minutes)
git revert <commit-hash>
git push origin main

# Redeploy (2 minutes)
```

**Follow-Up** (next hour):

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-mobile-bug

# 2. Fix the issue
# 3. Test thoroughly
# 4. Fast-track review
# 5. Deploy to staging
# 6. Test on staging
# 7. Deploy to production
# 8. Monitor closely
```

---

## Summary: Zero-Breakage Guarantee

### How We Ensure Nothing Breaks

1. **Baseline Capture**: Screenshots + smoke tests before changes
2. **Incremental Changes**: One fix at a time, never bulk changes
3. **Immediate Testing**: Test after every single change (7 minutes)
4. **Automated Safety Net**: E2E tests catch regressions
5. **Visual Regression**: Screenshots catch unintended changes
6. **Feature Flags**: Can disable changes without redeploying code
7. **Staging Environment**: Test in production-like environment first
8. **Real Device Testing**: Test on actual iPhones/iPads/Android
9. **Rollback Plan**: Can revert in 30 seconds if needed
10. **Monitoring**: Watch error rates and metrics post-deploy

### Testing Time Budget

**Per Change**: 7 minutes
**Per Day**: 20 minutes (morning + end-of-day)
**Per Week**: 3 hours (includes code review + staging test)

**Total for P0 Fixes** (3 critical fixes):

- Implementation: 6 hours
- Testing: 8 hours
- Code review: 2 hours
- **Total: 16 hours over 5 days**

---

## Next Steps

**Day 1 Tasks**:

```bash
# Morning
1. Create branch: git checkout -b fix/mobile-responsive-p0
2. Install Playwright: npm install --save-dev playwright
3. Create baseline tests: copy script from Section 1.3
4. Run baseline: npx playwright test tests/visual/baseline.spec.ts
5. Manual smoke test: use checklist from Section 1.4

# Afternoon
6. Implement Fix 1 (PlanMode panel)
7. Test Fix 1 (visual + automated)
8. Commit if pass, revert if fail
9. Document results

# Tomorrow
10. Continue with Fix 2 & 3
```

**Are you ready to start? I can help you with:**

1. Setting up the testing infrastructure
2. Creating the baseline screenshots
3. Writing the automated tests
4. Implementing each fix step-by-step
5. Reviewing test results

Let me know which part you want to tackle first!
