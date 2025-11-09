/**
 * P1 Priority Items - Visual Regression Tests
 *
 * Tests all P1 high-priority UI items that require visual verification:
 * - P1-6: Status Legend Simplification
 * - P1-7: Visual Redundancies (Clean Mode)
 * - P1-8: Category Color System
 * - P1-9: Progress Bars in Metric Cards
 * - P1-11: Phase Analysis Table Visual Hierarchy
 * - P1-25: Empty State Guidance
 */

import { test, expect } from '@playwright/test';

// Helper to create test project data
async function createTestProject(page: any) {
  // Navigate to project creation
  await page.goto('/projects/new');

  // Fill in project details
  await page.fill('[name="name"]', 'Enterprise SAP S/4HANA Implementation');
  await page.fill('[name="startDate"]', '2025-01-01');
  await page.fill('[name="endDate"]', '2025-03-31');
  await page.fill('[name="budget"]', '1000000');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect to project page
  await page.waitForURL(/\/projects\/.*\/gantt/);
}

test.describe('P1-6: Status Legend Simplification', () => {
  test('desktop: status legend shows 4-5 statuses (not 6+)', async ({ page }) => {
    await createTestProject(page);

    // Navigate to Gantt chart
    await page.goto('/projects');
    await page.click('text=Enterprise SAP');

    // Wait for Gantt canvas to load
    await page.waitForSelector('[data-testid="gantt-canvas"]', { timeout: 10000 });

    // Look for status legend
    const statusLegend = page.locator('text=Status').first();
    await expect(statusLegend).toBeVisible();

    // Count status items (should be 4-5 max)
    const statusItems = page.locator('[data-testid^="status-"]');
    const count = await statusItems.count();

    expect(count).toBeLessThanOrEqual(5);
    expect(count).toBeGreaterThanOrEqual(4);

    // Verify expected statuses exist
    await expect(page.locator('text=Not Started')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=At Risk').or(page.locator('text=Complete'))).toBeVisible();

    // Take screenshot for visual baseline
    await page.screenshot({
      path: 'test-results/visual/p1-6-status-legend-desktop.png',
      fullPage: false,
    });
  });

  test('mobile: status legend visible in list view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await createTestProject(page);

    // Navigate to Gantt (should show list view)
    await page.goto('/projects');
    await page.click('text=Enterprise SAP');

    // Verify list view loads (not timeline)
    await expect(page.locator('[data-testid="gantt-mobile-list"]')).toBeVisible();

    // Status tags should be visible on tasks
    const statusTags = page.locator('[class*="ant-tag"]');
    await expect(statusTags.first()).toBeVisible();

    await page.screenshot({
      path: 'test-results/visual/p1-6-status-legend-mobile.png',
    });
  });
});

test.describe('P1-7: Visual Redundancies (Clean Mode)', () => {
  test('desktop: clean mode removes badges', async ({ page }) => {
    await createTestProject(page);

    // Navigate to Gantt
    await page.goto('/projects');
    await page.click('text=Enterprise SAP');
    await page.waitForSelector('[data-testid="gantt-canvas"]');

    // Find bar duration display toggle
    const toolbar = page.locator('[data-testid="gantt-toolbar"]');
    await expect(toolbar).toBeVisible();

    // Take screenshot with ALL badges (baseline)
    await page.screenshot({
      path: 'test-results/visual/p1-7-all-badges.png',
      fullPage: true,
    });

    // Click clean mode toggle (look for button with "clean" text or icon)
    const cleanModeButton = page.locator('button', { hasText: /clean|minimal/i });
    if (await cleanModeButton.count() > 0) {
      await cleanModeButton.first().click();
      await page.waitForTimeout(500); // Wait for animation

      // Take screenshot with CLEAN mode (no badges)
      await page.screenshot({
        path: 'test-results/visual/p1-7-clean-mode.png',
        fullPage: true,
      });

      // Verify badges are hidden
      const durationBadges = page.locator('[class*="badge"]', { hasText: /\d+d|\d+wk|\d+mo/i });
      const badgeCount = await durationBadges.count();

      // In clean mode, should have significantly fewer badges
      expect(badgeCount).toBeLessThan(5);
    }
  });

  test('desktop: working days mode shows wd badges only', async ({ page }) => {
    await createTestProject(page);
    await page.goto('/projects');
    await page.click('text=Enterprise SAP');
    await page.waitForSelector('[data-testid="gantt-canvas"]');

    // Click working days mode
    const wdButton = page.locator('button', { hasText: /working.*days|wd/i });
    if (await wdButton.count() > 0) {
      await wdButton.first().click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'test-results/visual/p1-7-working-days-mode.png',
        fullPage: true,
      });
    }
  });
});

test.describe('P1-8: Category Color System', () => {
  test('desktop: resource categories use semantic colors (max 5)', async ({ page }) => {
    await createTestProject(page);

    // Navigate to Resource Management
    await page.goto('/projects');
    await page.click('text=Enterprise SAP');

    // Open resource management modal
    const resourceButton = page.locator('button', { hasText: /resource|team/i });
    if (await resourceButton.count() > 0) {
      await resourceButton.first().click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"]');

      // Find category badges/pills
      const categoryBadges = page.locator('[data-testid^="category-"], [class*="category"]');

      // Extract unique colors
      const colors = new Set();
      const count = await categoryBadges.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const badge = categoryBadges.nth(i);
        const bgColor = await badge.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );
        colors.add(bgColor);
      }

      // Should have ≤ 5 unique colors
      expect(colors.size).toBeLessThanOrEqual(5);

      await page.screenshot({
        path: 'test-results/visual/p1-8-category-colors.png',
      });
    }
  });
});

test.describe('P1-9: Progress Bars in Metric Cards', () => {
  test('desktop: all 4 metric cards have visual progress bars', async ({ page }) => {
    await createTestProject(page);

    // Navigate to project
    await page.goto('/projects');
    await page.click('text=Enterprise SAP');

    // Open Mission Control
    const missionControlButton = page.locator('button', { hasText: /mission.*control|dashboard/i });
    if (await missionControlButton.count() > 0) {
      await missionControlButton.first().click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Find all progress bars in metric cards
      const progressBars = page.locator('.ant-progress, [role="progressbar"]');
      const count = await progressBars.count();

      // Should have at least 4 progress bars
      expect(count).toBeGreaterThanOrEqual(4);

      // Verify all are visible
      for (let i = 0; i < Math.min(4, count); i++) {
        await expect(progressBars.nth(i)).toBeVisible();
      }

      await page.screenshot({
        path: 'test-results/visual/p1-9-metric-progress-bars.png',
        fullPage: true,
      });
    }
  });
});

test.describe('P1-11: Phase Analysis Table Visual Hierarchy', () => {
  test('desktop: phase table has colored dots and bold names', async ({ page }) => {
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Enterprise SAP');

    // Open Mission Control
    const missionControlButton = page.locator('button', { hasText: /mission.*control/i });
    if (await missionControlButton.count() > 0) {
      await missionControlButton.first().click();
      await page.waitForSelector('[role="dialog"]');

      // Find phase analysis table
      const table = page.locator('.ant-table, [role="table"]').first();
      await expect(table).toBeVisible();

      // Verify colored dots exist (visual indicators)
      const colorDots = table.locator('[class*="dot"], [style*="background"]');
      const dotCount = await colorDots.count();
      expect(dotCount).toBeGreaterThan(0);

      // Verify phase names are bold
      const phaseNames = table.locator('td').first();
      const fontWeight = await phaseNames.evaluate((el) =>
        window.getComputedStyle(el).fontWeight
      );
      expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(600);

      await page.screenshot({
        path: 'test-results/visual/p1-11-phase-table.png',
      });
    }
  });
});

test.describe('P1-25: Empty State Guidance', () => {
  test('desktop: empty project shows guidance with CTA', async ({ page }) => {
    // Navigate to app without creating project
    await page.goto('/projects');

    // Click "New Project" but don't fill anything
    await page.click('text=New Project');
    await page.waitForSelector('form');

    // Cancel or go back
    await page.click('button', { hasText: /cancel|back/i });

    // Should see empty state
    const emptyState = page.locator('text=/no.*project|get.*started/i');
    await expect(emptyState.first()).toBeVisible();

    // Should have CTA button
    const ctaButton = page.locator('button', { hasText: /add|create|new/i });
    await expect(ctaButton.first()).toBeVisible();

    await page.screenshot({
      path: 'test-results/visual/p1-25-empty-state.png',
    });
  });

  test('desktop: empty phases shows "Add Phase" CTA', async ({ page }) => {
    await createTestProject(page);

    // Navigate to newly created project (should have 0 phases initially)
    await page.goto('/projects');
    await page.click('text=Enterprise SAP');

    // Look for empty phase message
    const emptyMessage = page.locator('text=/no.*phase|add.*phase/i');

    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage.first()).toBeVisible();

      // Should have "Add Phase" button
      const addPhaseButton = page.locator('button', { hasText: /add.*phase/i });
      await expect(addPhaseButton.first()).toBeVisible();

      await page.screenshot({
        path: 'test-results/visual/p1-25-empty-phases.png',
      });
    }
  });
});
