/**
 * P2 Priority Items - Visual Regression Tests
 *
 * Tests P2 medium-priority UI items that require visual verification:
 * - P2-2: Month Labels on Bars
 * - P2-3: Duration Badges
 * - P2-4: Multi-Colored Segments
 * - P2-24: Zero Data Everywhere
 */

import { test, expect } from '@playwright/test';

async function createTestProject(page: any) {
  await page.goto('/projects/new');
  await page.fill('[name="name"]', 'Visual Test Project');
  await page.fill('[name="startDate"]', '2025-01-01');
  await page.fill('[name="endDate"]', '2025-03-31');
  await page.fill('[name="budget"]', '1000000');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/projects\/.*\/gantt/);
}

test.describe('P2-2: Month Labels on Bars', () => {
  test('desktop: task bars should NOT have month text', async ({ page }) => {
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');
    await page.waitForSelector('[data-testid="gantt-canvas"]');

    // Get all task bars
    const taskBars = page.locator('[data-testid^="task-bar-"], [class*="task-bar"]');
    const count = await taskBars.count();

    if (count > 0) {
      // Check first few task bars for month text
      for (let i = 0; i < Math.min(3, count); i++) {
        const taskBar = taskBars.nth(i);
        const text = await taskBar.textContent();

        // Should NOT contain month names or abbreviations
        expect(text).not.toMatch(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
        expect(text).not.toMatch(/january|february|march|april|june|july|august|september|october|november|december/i);
      }

      await page.screenshot({
        path: 'test-results/visual/p2-2-no-month-labels-on-bars.png',
        fullPage: true,
      });
    }
  });

  test('desktop: timeline header SHOULD have month labels', async ({ page }) => {
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');
    await page.waitForSelector('[data-testid="gantt-canvas"]');

    // Timeline header should have month labels
    const timelineHeader = page.locator('[data-testid="timeline-header"], [class*="timeline-header"]');

    if (await timelineHeader.count() > 0) {
      const headerText = await timelineHeader.first().textContent();

      // Header SHOULD contain month info
      expect(headerText).toMatch(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);

      await page.screenshot({
        path: 'test-results/visual/p2-2-month-labels-in-header.png',
      });
    }
  });
});

test.describe('P2-3: Duration Badges', () => {
  test('desktop: duration badges ("4wk") are toggleable', async ({ page }) => {
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');
    await page.waitForSelector('[data-testid="gantt-canvas"]');

    // Screenshot with badges visible
    await page.screenshot({
      path: 'test-results/visual/p2-3-badges-visible.png',
      fullPage: true,
    });

    // Try to find and click clean/minimal toggle
    const toggleButtons = page.locator('button', { hasText: /clean|minimal|badge|display/i });

    if (await toggleButtons.count() > 0) {
      // Click toggle to hide badges
      await toggleButtons.first().click();
      await page.waitForTimeout(500);

      // Screenshot with badges hidden
      await page.screenshot({
        path: 'test-results/visual/p2-3-badges-hidden.png',
        fullPage: true,
      });

      // Verify fewer badges visible
      const badges = page.locator('[data-testid*="badge"]', { hasText: /\d+d|\d+wk|\d+mo/i });
      const badgeCount = await badges.count();

      // Clean mode should have 0 or very few badges
      expect(badgeCount).toBeLessThan(3);
    }
  });
});

test.describe('P2-4: Multi-Colored Segments', () => {
  test('desktop: task bars are solid single color (not rainbow)', async ({ page }) => {
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');
    await page.waitForSelector('[data-testid="gantt-canvas"]');

    // Get all task bars
    const taskBars = page.locator('[data-testid^="task-bar-"]');
    const count = await taskBars.count();

    if (count > 0) {
      // Check each bar's background color
      for (let i = 0; i < Math.min(5, count); i++) {
        const taskBar = taskBars.nth(i);

        // Get computed background
        const bgColor = await taskBar.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor;
        });

        // Verify it's a valid color (not "transparent" or multiple colors)
        expect(bgColor).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);

        // Check for gradient (multi-color indicator)
        const bgImage = await taskBar.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backgroundImage;
        });

        // Should NOT have gradient
        expect(bgImage).not.toMatch(/gradient/i);
      }

      await page.screenshot({
        path: 'test-results/visual/p2-4-solid-color-bars.png',
        fullPage: true,
      });
    }
  });

  test('desktop: bars match parent phase color', async ({ page }) => {
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');
    await page.waitForSelector('[data-testid="gantt-canvas"]');

    // Get phase bars and task bars
    const phaseBars = page.locator('[data-testid^="phase-bar-"]');
    const taskBars = page.locator('[data-testid^="task-bar-"]');

    if (await phaseBars.count() > 0 && await taskBars.count() > 0) {
      // Get first phase color
      const phaseColor = await phaseBars.first().evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Get first task color (should match or be similar to phase)
      const taskColor = await taskBars.first().evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Colors should be similar (allow for opacity differences)
      // Extract RGB values and compare
      const phaseRGB = phaseColor.match(/\d+/g);
      const taskRGB = taskColor.match(/\d+/g);

      if (phaseRGB && taskRGB) {
        // R, G, B values should be within 30 units (allowing for opacity/shading)
        expect(Math.abs(parseInt(phaseRGB[0]) - parseInt(taskRGB[0]))).toBeLessThan(30);
        expect(Math.abs(parseInt(phaseRGB[1]) - parseInt(taskRGB[1]))).toBeLessThan(30);
        expect(Math.abs(parseInt(phaseRGB[2]) - parseInt(taskRGB[2]))).toBeLessThan(30);
      }

      await page.screenshot({
        path: 'test-results/visual/p2-4-phase-task-color-match.png',
        fullPage: true,
      });
    }
  });
});

test.describe('P2-24: Zero Data Everywhere', () => {
  test('desktop: empty project shows placeholders (not "0" everywhere)', async ({ page }) => {
    // Create project but don't add phases/tasks
    await page.goto('/projects/new');
    await page.fill('[name="name"]', 'Empty Test Project');
    await page.fill('[name="startDate"]', '2025-01-01');
    await page.fill('[name="endDate"]', '2025-03-31');
    // Don't fill budget (leave at 0)
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/projects\/.*/);

    // Navigate to Gantt
    await page.goto('/projects');
    await page.click('text=Empty Test');

    // Check for "0" text instances
    const bodyText = await page.locator('body').textContent();

    // Count how many times "0" appears
    const zeroMatches = bodyText?.match(/\b0\b/g) || [];

    // Should have few "0" instances (< 5), rest should be placeholders
    expect(zeroMatches.length).toBeLessThan(5);

    // Should see placeholder text instead
    await expect(page.locator('text=/no.*phase|get.*started|add.*phase/i').first()).toBeVisible();

    await page.screenshot({
      path: 'test-results/visual/p2-24-empty-project-placeholders.png',
      fullPage: true,
    });
  });

  test('desktop: mission control with empty project shows helpful empty state', async ({ page }) => {
    // Navigate to empty project
    await page.goto('/projects/new');
    await page.fill('[name="name"]', 'Empty Mission Control Test');
    await page.fill('[name="startDate"]', '2025-01-01');
    await page.fill('[name="endDate"]', '2025-03-31');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/projects\/.*/);

    await page.goto('/projects');
    await page.click('text=Empty Mission Control');

    // Open Mission Control
    const mcButton = page.locator('button', { hasText: /mission.*control/i });
    if (await mcButton.count() > 0) {
      await mcButton.first().click();
      await page.waitForSelector('[role="dialog"]');

      // Should NOT show "0h", "0 tasks", etc. everywhere
      const dialogText = await page.locator('[role="dialog"]').textContent();

      // Should show some helpful message, not just zeros
      const helpfulText = /no.*data|get.*started|add.*phase|empty/i;
      expect(dialogText).toMatch(helpfulText);

      await page.screenshot({
        path: 'test-results/visual/p2-24-empty-mission-control.png',
        fullPage: true,
      });
    }
  });

  test('desktop: cost dashboard with $0 budget shows placeholder', async ({ page }) => {
    // Create project with $0 budget
    await page.goto('/projects/new');
    await page.fill('[name="name"]', 'Zero Budget Project');
    await page.fill('[name="startDate"]', '2025-01-01');
    await page.fill('[name="endDate"]', '2025-03-31');
    await page.fill('[name="budget"]', '0');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/projects\/.*/);

    await page.goto('/projects');
    await page.click('text=Zero Budget');

    // Open Cost Dashboard
    const costButton = page.locator('button', { hasText: /cost|budget/i });
    if (await costButton.count() > 0) {
      await costButton.first().click();
      await page.waitForSelector('[role="dialog"]');

      // Should show placeholder like "No budget set" not just "$0.00"
      const dialogText = await page.locator('[role="dialog"]').textContent();

      // Verify shows helpful message
      expect(dialogText).toMatch(/no.*budget|set.*budget|add.*budget/i);

      await page.screenshot({
        path: 'test-results/visual/p2-24-zero-budget-placeholder.png',
      });
    }
  });
});

test.describe('Visual Regression: Responsive Breakpoints', () => {
  test('mobile 375px: gantt shows list view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');

    // Should show mobile list view
    await expect(page.locator('[data-testid="gantt-mobile-list"]')).toBeVisible();

    // Should NOT show timeline
    await expect(page.locator('[data-testid="gantt-canvas"]')).not.toBeVisible();

    await page.screenshot({
      path: 'test-results/visual/mobile-375-list-view.png',
      fullPage: true,
    });
  });

  test('tablet 768px: gantt shows timeline', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');

    // Should show timeline
    await expect(page.locator('[data-testid="gantt-canvas"]')).toBeVisible();

    // Should show tablet banner
    await expect(page.locator('text=/tablet.*view/i')).toBeVisible();

    await page.screenshot({
      path: 'test-results/visual/tablet-768-timeline.png',
      fullPage: true,
    });
  });

  test('desktop 1280px: gantt shows full timeline', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await createTestProject(page);

    await page.goto('/projects');
    await page.click('text=Visual Test');

    // Should show full timeline
    await expect(page.locator('[data-testid="gantt-canvas"]')).toBeVisible();

    // Should NOT show tablet banner
    await expect(page.locator('text=/tablet.*view/i')).not.toBeVisible();

    await page.screenshot({
      path: 'test-results/visual/desktop-1280-full-timeline.png',
      fullPage: true,
    });
  });
});
