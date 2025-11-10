/**
 * E2E User Journey: Mobile Navigation
 *
 * Tests mobile-specific navigation flows:
 * 1. Hamburger menu opens drawer
 * 2. Navigate between pages via drawer
 * 3. Gantt list view navigation
 * 4. Modal interactions on mobile
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Navigation Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone SE - minimum width)
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("user navigates entire app via hamburger menu", async ({ page }) => {
    // Step 1: Navigate to app
    await page.goto("/");

    // Step 2: Verify hamburger menu visible
    const hamburger = page.locator('button[aria-label*="menu"], [class*="hamburger"]');
    await expect(hamburger.first()).toBeVisible();

    // Step 3: Click hamburger to open drawer
    await hamburger.first().click();

    // Step 4: Verify drawer opens
    await page.waitForSelector('[role="dialog"], .ant-drawer, [class*="drawer"]');

    const drawer = page.locator('[role="dialog"], .ant-drawer').first();
    await expect(drawer).toBeVisible();

    // Step 5: Verify menu items visible
    await expect(
      page.locator("text=Projects").or(page.locator('a[href*="project"]'))
    ).toBeVisible();
    await expect(
      page.locator("text=Dashboard").or(page.locator('a[href*="dashboard"]'))
    ).toBeVisible();

    // Step 6: Navigate to Projects
    await page.click('text=Projects, a[href*="project"]');

    // Wait for navigation
    await page.waitForURL(/.*projects.*/);

    // Step 7: Verify projects page loaded
    await expect(page.locator("h1, h2")).toContainText(/project/i);

    // Step 8: Open drawer again
    await hamburger.first().click();

    // Step 9: Navigate to another page
    const dashboardLink = page.locator('text=Dashboard, a[href*="dashboard"]');
    if ((await dashboardLink.count()) > 0) {
      await dashboardLink.first().click();
      await page.waitForURL(/.*dashboard.*/);
    }

    await page.screenshot({
      path: "test-results/e2e/mobile-nav-drawer.png",
    });
  });

  test("user can expand/collapse phases in mobile list view", async ({ page }) => {
    // Navigate to project with phases
    await page.goto("/projects");

    // Click on a project (assumes at least one exists)
    const projectLink = page.locator('[data-testid^="project-"], a[href*="gantt"]');
    if ((await projectLink.count()) > 0) {
      await projectLink.first().click();
    } else {
      // Create quick test project
      await page.click("text=New Project");
      await page.fill('input[name="name"]', "Mobile Nav Test");
      await page.fill('input[name="startDate"]', "2025-01-01");
      await page.fill('input[name="endDate"]', "2025-03-31");
      await page.click('button[type="submit"]');
    }

    // Wait for mobile list view
    await page.waitForSelector('[data-testid="gantt-mobile-list"]', { timeout: 5000 });

    // Verify list view loaded (not timeline)
    await expect(page.locator('[data-testid="gantt-mobile-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="gantt-canvas"]')).not.toBeVisible();

    // Find phase card
    const phaseCard = page.locator('[data-testid^="phase-card-"], [class*="phase-card"]').first();

    if ((await phaseCard.count()) > 0) {
      // Find expand/collapse button (chevron icon)
      const chevron = phaseCard.locator('button, [role="button"]').first();
      await chevron.click();

      // Wait for animation
      await page.waitForTimeout(300);

      // Verify tasks are hidden/shown
      const tasksExpanded = await page.locator('[data-testid^="task-item-"]').count();

      // Click again to toggle
      await chevron.click();
      await page.waitForTimeout(300);

      // Count should change
      const tasksCollapsed = await page.locator('[data-testid^="task-item-"]').count();

      expect(tasksExpanded).not.toBe(tasksCollapsed);
    }

    await page.screenshot({
      path: "test-results/e2e/mobile-list-expand-collapse.png",
      fullPage: true,
    });
  });

  test("user can access mission control on mobile", async ({ page }) => {
    await page.goto("/projects");

    // Navigate to project
    const projectLink = page.locator('[data-testid^="project-"], a[href*="gantt"]');
    if ((await projectLink.count()) > 0) {
      await projectLink.first().click();
      await page.waitForSelector('[data-testid="gantt-mobile-list"]');

      // Find and click Mission Control button
      const mcButton = page.locator("button", { hasText: /mission.*control|dashboard/i });

      if ((await mcButton.count()) > 0) {
        await mcButton.first().click();

        // Wait for modal
        await page.waitForSelector('[role="dialog"]');

        // Verify modal is full-screen on mobile
        const modal = page.locator('[role="dialog"]').first();
        const modalWidth = await modal.evaluate((el) => el.getBoundingClientRect().width);

        // Modal should be close to viewport width (375px)
        expect(modalWidth).toBeGreaterThan(350);

        // Verify content visible
        await expect(page.locator("text=/health|budget|schedule/i")).toBeVisible();

        // Close modal
        await page.click('button[aria-label*="close"], button:has-text("Close")');

        await page.screenshot({
          path: "test-results/e2e/mobile-mission-control.png",
          fullPage: true,
        });
      }
    }
  });

  test("user can scroll through long mobile list", async ({ page }) => {
    await page.goto("/projects");

    // Navigate to project with many phases/tasks
    const projectLink = page.locator('[data-testid^="project-"]').first();

    if ((await projectLink.count()) > 0) {
      await projectLink.click();
      await page.waitForSelector('[data-testid="gantt-mobile-list"]');

      // Get scroll height before
      const scrollHeightBefore = await page.evaluate(() => document.documentElement.scrollHeight);

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);

      // Verify scrolled
      const scrollTop = await page.evaluate(() => window.pageYOffset);
      expect(scrollTop).toBeGreaterThan(100);

      // Scroll should be smooth (no janky performance)
      await page.screenshot({
        path: "test-results/e2e/mobile-scroll.png",
        fullPage: true,
      });
    }
  });

  test("mobile: PlanMode panel is full-width", async ({ page }) => {
    await page.goto("/projects");

    // Navigate to project
    const projectLink = page.locator('[data-testid^="project-"]').first();

    if ((await projectLink.count()) > 0) {
      await projectLink.click();
      await page.waitForSelector('[data-testid="gantt-mobile-list"]');

      // Click to enter PlanMode
      const planModeButton = page.locator("button", { hasText: /plan.*mode|edit/i });

      if ((await planModeButton.count()) > 0) {
        await planModeButton.first().click();

        // Wait for PlanMode panel
        await page.waitForSelector('[data-testid="plan-mode-panel"], [class*="plan-mode"]');

        // Verify panel is full-width (not fixed 480px)
        const panel = page.locator('[data-testid="plan-mode-panel"]').first();
        const panelWidth = await panel.evaluate((el) => el.getBoundingClientRect().width);

        // Should be close to viewport width (375px), not 480px
        expect(panelWidth).toBeLessThan(400);
        expect(panelWidth).toBeGreaterThan(350);

        await page.screenshot({
          path: "test-results/e2e/mobile-planmode-fullwidth.png",
          fullPage: true,
        });
      }
    }
  });

  test("mobile: PresentMode controls are visible and sized correctly", async ({ page }) => {
    await page.goto("/projects");

    // Navigate to project
    const projectLink = page.locator('[data-testid^="project-"]').first();

    if ((await projectLink.count()) > 0) {
      await projectLink.click();
      await page.waitForTimeout(1000);

      // Click to enter PresentMode
      const presentModeButton = page.locator("button", { hasText: /present.*mode|presentation/i });

      if ((await presentModeButton.count()) > 0) {
        await presentModeButton.first().click();

        // Wait for PresentMode
        await page.waitForSelector('[data-testid="present-mode"], [class*="present"]');

        // Verify navigation controls visible
        const prevButton = page.locator('button[aria-label*="previous"], button:has-text("<")');
        const nextButton = page.locator('button[aria-label*="next"], button:has-text(">")');

        await expect(prevButton.first()).toBeVisible();
        await expect(nextButton.first()).toBeVisible();

        // Verify controls are touch-friendly (44-48px)
        const buttonSize = await nextButton.first().evaluate((el) => ({
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        }));

        expect(buttonSize.width).toBeGreaterThanOrEqual(40);
        expect(buttonSize.height).toBeGreaterThanOrEqual(40);

        // Verify text is scaled down (not overflowing)
        const headingSize = await page
          .locator("h1, h2")
          .first()
          .evaluate((el) => {
            const style = window.getComputedStyle(el);
            return parseFloat(style.fontSize);
          });

        // Mobile text should be smaller (text-3xl = 30px, not text-7xl = 72px)
        expect(headingSize).toBeLessThan(50);

        await page.screenshot({
          path: "test-results/e2e/mobile-presentmode.png",
          fullPage: true,
        });
      }
    }
  });
});
