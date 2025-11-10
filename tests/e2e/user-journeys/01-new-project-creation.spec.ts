/**
 * E2E User Journey: New Project Creation
 *
 * Critical workflow test covering:
 * 1. Navigate to new project form
 * 2. Fill in project details
 * 3. Create first phase
 * 4. Add first task
 * 5. Verify Gantt updates
 * 6. Verify MissionControl reflects changes
 */

import { test, expect } from "@playwright/test";

test.describe("New Project Creation Journey", () => {
  test("user can create project with phases and tasks", async ({ page }) => {
    // Step 1: Navigate to app
    await page.goto("/");

    // Step 2: Click "New Project"
    await page.click('text=New Project, button:has-text("New Project")').catch(() => {
      // Fallback: try button directly
      return page.click("button", { hasText: /new.*project/i });
    });

    // Wait for form
    await page.waitForSelector('form, [role="form"]');

    // Step 3: Fill in project details
    await page.fill(
      'input[name="name"], input[placeholder*="name" i]',
      "E2E Test Project - New Creation"
    );
    await page.fill(
      'input[name="description"], textarea[name="description"]',
      "Automated test project created via Playwright E2E test"
    );

    // Set dates (30 days ago to 60 days from now)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 60);

    await page.fill(
      'input[name="startDate"], input[type="date"]',
      startDate.toISOString().split("T")[0]
    );
    await page.fill('input[name="endDate"]', endDate.toISOString().split("T")[0]);

    // Set budget
    await page.fill('input[name="budget"]', "1000000");

    // Step 4: Submit form
    await page.click('button[type="submit"], button:has-text("Create")');

    // Wait for redirect to project page
    await page.waitForURL(/\/projects\/.*\/gantt/, { timeout: 10000 });

    // Step 5: Verify project page loaded
    await expect(page.locator('h1, [data-testid="project-title"]')).toContainText(
      "E2E Test Project"
    );

    // Step 6: Add first phase
    const addPhaseButton = page.locator("button", { hasText: /add.*phase/i });
    await addPhaseButton.first().click();

    // Fill phase form
    await page.waitForSelector('input[name="phaseName"], input[placeholder*="phase" i]');
    await page.fill(
      'input[name="phaseName"], input[placeholder*="phase" i]',
      "Planning & Analysis"
    );

    // Set phase dates
    await page.fill('input[name="phaseStartDate"]', startDate.toISOString().split("T")[0]);

    const phaseEndDate = new Date(startDate);
    phaseEndDate.setDate(startDate.getDate() + 30);
    await page.fill('input[name="phaseEndDate"]', phaseEndDate.toISOString().split("T")[0]);

    // Submit phase
    await page.click("button", { hasText: /save|create.*phase/i });

    // Wait for phase to appear
    await page.waitForTimeout(1000);

    // Step 7: Add first task
    const addTaskButton = page.locator("button", { hasText: /add.*task/i });
    await addTaskButton.first().click();

    // Fill task form
    await page.waitForSelector('input[name="taskName"], input[placeholder*="task" i]');
    await page.fill(
      'input[name="taskName"], input[placeholder*="task" i]',
      "Requirements Gathering"
    );

    // Set task dates
    await page.fill('input[name="taskStartDate"]', startDate.toISOString().split("T")[0]);

    const taskEndDate = new Date(startDate);
    taskEndDate.setDate(startDate.getDate() + 10);
    await page.fill('input[name="taskEndDate"]', taskEndDate.toISOString().split("T")[0]);

    // Set progress
    await page.fill('input[name="progress"], input[type="number"]', "50");

    // Submit task
    await page.click("button", { hasText: /save|create.*task/i });

    // Wait for task to appear
    await page.waitForTimeout(1000);

    // Step 8: Verify Gantt updates
    const ganttCanvas = page.locator('[data-testid="gantt-canvas"]');
    if ((await ganttCanvas.count()) > 0) {
      await expect(ganttCanvas).toBeVisible();

      // Verify phase bar exists
      const phaseBar = page.locator('[data-testid^="phase-bar-"], text=Planning');
      await expect(phaseBar.first()).toBeVisible();

      // Verify task bar exists
      const taskBar = page.locator('[data-testid^="task-bar-"], text=Requirements');
      await expect(taskBar.first()).toBeVisible();
    }

    // Step 9: Open MissionControl
    const mcButton = page.locator("button", { hasText: /mission.*control|dashboard/i });
    if ((await mcButton.count()) > 0) {
      await mcButton.first().click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"]');

      // Verify shows project data (not all zeros)
      const dialogText = await page.locator('[role="dialog"]').textContent();
      expect(dialogText).toContain("Planning");

      // Verify health score displays
      const healthScore = page.locator('[data-testid="health-score"], text=/health/i');
      await expect(healthScore.first()).toBeVisible();

      // Close modal
      await page.keyboard.press("Escape");
    }

    // Step 10: Take screenshot of completed journey
    await page.screenshot({
      path: "test-results/e2e/journey-new-project-complete.png",
      fullPage: true,
    });
  });

  test("user can create project on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Open hamburger menu
    const hamburger = page.locator('button[aria-label*="menu"], button:has([class*="hamburger"])');
    if ((await hamburger.count()) > 0) {
      await hamburger.first().click();
    }

    // Click New Project in drawer
    await page.click("text=New Project");

    // Fill form (same as desktop)
    await page.waitForSelector("form");
    await page.fill('input[name="name"]', "Mobile E2E Project");
    await page.fill('input[name="startDate"]', "2025-01-01");
    await page.fill('input[name="endDate"]', "2025-03-31");
    await page.fill('input[name="budget"]', "500000");

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/projects\/.*/);

    // Verify mobile list view shows
    await expect(page.locator('[data-testid="gantt-mobile-list"]')).toBeVisible();

    await page.screenshot({
      path: "test-results/e2e/journey-new-project-mobile.png",
      fullPage: true,
    });
  });
});
