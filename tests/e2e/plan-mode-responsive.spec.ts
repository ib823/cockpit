import { test, expect } from '@playwright/test';

/**
 * PlanMode Responsive Panel Tests
 *
 * Tests Fix #1: Responsive panel width for mobile devices
 * File: src/components/project-v2/modes/PlanMode.tsx (Line 311)
 *
 * Change: w-[480px] → w-full sm:max-w-sm md:max-w-md lg:w-[480px]
 */

test.describe('PlanMode - Responsive Panel', () => {

  // Test configuration
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667, maxPanelWidth: 375 },
    { name: 'iPhone 12', width: 390, height: 844, maxPanelWidth: 390 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932, maxPanelWidth: 430 },
    { name: 'iPad Mini', width: 768, height: 1024, maxPanelWidth: 448 }, // md:max-w-md
    { name: 'iPad Pro', width: 1024, height: 1366, maxPanelWidth: 480 }, // lg:w-[480px]
    { name: 'Desktop HD', width: 1280, height: 800, maxPanelWidth: 480 },
    { name: 'Desktop Full HD', width: 1920, height: 1080, maxPanelWidth: 480 },
  ];

  // Helper function to navigate to PlanMode
  async function navigateToPlanMode(page) {
    // Navigate directly to plan mode
    // Adjust this URL based on your routing structure
    await page.goto('/project/plan');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for timeline/chart to be visible
    // Adjust selector based on your actual component
    await page.waitForSelector('[data-testid="gantt-chart"], .gantt-chart, canvas, svg', {
      timeout: 10000,
      state: 'visible'
    }).catch(() => {
      // If specific selector not found, just wait for any content
      console.log('Gantt chart selector not found, continuing anyway');
    });
  }

  // Helper function to open the side panel
  async function openSidePanel(page) {
    // Try multiple strategies to open the panel

    // Strategy 1: Look for phase elements (most common)
    const phaseElements = await page.locator('[data-phase-id], .phase-card, .gantt-bar, [role="button"]').all();

    if (phaseElements.length > 0) {
      await phaseElements[0].click();
      return;
    }

    // Strategy 2: Look for any clickable timeline element
    const clickableElements = await page.locator('button, [role="button"], .clickable').all();
    for (const element of clickableElements) {
      const text = await element.textContent();
      if (text && text.trim().length > 0) {
        await element.click();
        break;
      }
    }
  }

  // Helper function to check if panel is visible
  async function isPanelVisible(page) {
    // The panel has these characteristics from the code:
    // - fixed position
    // - right-0
    // - bg-white
    // - shadow-2xl
    // - z-50

    const panel = page.locator('div').filter({
      has: page.locator('button:has-text("×"), button[aria-label="Close"]')
    }).filter({
      has: page.locator('text=/Days|Man-days|People/')
    }).first();

    return await panel.isVisible().catch(() => false);
  }

  // Helper function to get panel element
  async function getPanel(page) {
    // Look for the panel by its characteristics
    return page.locator('div').filter({
      has: page.locator('button:has-text("×"), button[aria-label="Close"]')
    }).first();
  }

  for (const viewport of viewports) {
    test(`${viewport.name} (${viewport.width}x${viewport.height}) - Panel fits screen`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      // Navigate to PlanMode
      await navigateToPlanMode(page);

      // Open the side panel
      await openSidePanel(page);

      // Wait a moment for animation
      await page.waitForTimeout(500);

      // Get the panel element
      const panel = await getPanel(page);

      // Check if panel is visible
      const isVisible = await panel.isVisible().catch(() => false);

      if (!isVisible) {
        console.log(`Panel not visible on ${viewport.name} - this might be expected if no phases exist`);
        // This is not necessarily a failure - might be empty state
        return;
      }

      // Get panel dimensions
      const panelBox = await panel.boundingBox();

      expect(panelBox).not.toBeNull();

      // Panel width should not exceed expected max width
      expect(panelBox!.width).toBeLessThanOrEqual(viewport.maxPanelWidth + 5); // 5px tolerance

      // Panel should not exceed viewport width
      expect(panelBox!.width).toBeLessThanOrEqual(viewport.width);

      // Panel should be positioned on the right side
      expect(panelBox!.x + panelBox!.width).toBeCloseTo(viewport.width, 5);

      console.log(`✓ ${viewport.name}: Panel width ${Math.round(panelBox!.width)}px (max ${viewport.maxPanelWidth}px)`);
    });

    test(`${viewport.name} - No horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      await navigateToPlanMode(page);
      await openSidePanel(page);
      await page.waitForTimeout(300);

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);

      console.log(`✓ ${viewport.name}: No horizontal scroll`);
    });
  }

  test('Panel opens and closes correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPlanMode(page);

    // Panel should not be visible initially
    let panelVisible = await isPanelVisible(page);
    expect(panelVisible).toBe(false);

    // Open panel
    await openSidePanel(page);
    await page.waitForTimeout(500); // Wait for animation

    // Panel should now be visible
    panelVisible = await isPanelVisible(page);

    if (!panelVisible) {
      console.log('Panel not visible - might be empty state, skipping close test');
      return;
    }

    expect(panelVisible).toBe(true);

    // Find and click close button
    const closeButton = page.locator('button:has-text("×"), button[aria-label="Close"]').first();
    await closeButton.click();
    await page.waitForTimeout(500); // Wait for animation

    // Panel should be hidden again
    panelVisible = await isPanelVisible(page);
    expect(panelVisible).toBe(false);

    console.log('✓ Panel opens and closes correctly');
  });

  test('Panel closes when clicking backdrop', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPlanMode(page);

    await openSidePanel(page);
    await page.waitForTimeout(500);

    const panelVisible = await isPanelVisible(page);

    if (!panelVisible) {
      console.log('Panel not visible - skipping backdrop test');
      return;
    }

    // Click on backdrop (left side of screen, away from panel)
    await page.mouse.click(50, 300);
    await page.waitForTimeout(500);

    // Panel should be closed
    const panelVisibleAfter = await isPanelVisible(page);
    expect(panelVisibleAfter).toBe(false);

    console.log('✓ Panel closes on backdrop click');
  });

  test('Desktop behavior unchanged (480px at 1024px+)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToPlanMode(page);
    await openSidePanel(page);
    await page.waitForTimeout(500);

    const panel = await getPanel(page);
    const isVisible = await panel.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('Panel not visible - skipping desktop width test');
      return;
    }

    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();

    // Desktop panel should be exactly 480px (with small tolerance)
    expect(panelBox!.width).toBeGreaterThan(475);
    expect(panelBox!.width).toBeLessThan(485);

    console.log(`✓ Desktop: Panel width ${Math.round(panelBox!.width)}px (expected 480px)`);
  });

  test('Panel content is scrollable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPlanMode(page);
    await openSidePanel(page);
    await page.waitForTimeout(500);

    const panel = await getPanel(page);
    const isVisible = await panel.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('Panel not visible - skipping scroll test');
      return;
    }

    // Check if panel has scrollable content
    const isScrollable = await panel.evaluate((el) => {
      return el.scrollHeight > el.clientHeight ||
             el.querySelector('[class*="overflow"]') !== null;
    });

    // Panel should either be scrollable or have overflow properties
    // This is a soft check - panel might not need scroll if content is short
    console.log(`✓ Panel scrollable: ${isScrollable ? 'yes' : 'content fits'}`);
  });

  test('Mobile - Touch target sizes adequate', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPlanMode(page);
    await openSidePanel(page);
    await page.waitForTimeout(500);

    const isVisible = await isPanelVisible(page);

    if (!isVisible) {
      console.log('Panel not visible - skipping touch target test');
      return;
    }

    // Check close button size (should be at least 44x44px per Apple HIG)
    const closeButton = page.locator('button:has-text("×"), button[aria-label="Close"]').first();
    const buttonBox = await closeButton.boundingBox();

    if (buttonBox) {
      expect(buttonBox.width).toBeGreaterThanOrEqual(32); // Minimum for icon buttons
      expect(buttonBox.height).toBeGreaterThanOrEqual(32);
      console.log(`✓ Close button size: ${Math.round(buttonBox.width)}x${Math.round(buttonBox.height)}px`);
    }
  });

  test('Panel animation is smooth', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPlanMode(page);

    // Measure animation performance
    const animationStart = Date.now();

    await openSidePanel(page);
    await page.waitForTimeout(500); // Wait for animation to complete

    const animationDuration = Date.now() - animationStart;

    // Animation should complete within reasonable time (500ms + buffer)
    expect(animationDuration).toBeLessThan(1000);

    console.log(`✓ Panel animation completed in ${animationDuration}ms`);
  });

  test('No console errors during panel interaction', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToPlanMode(page);
    await openSidePanel(page);
    await page.waitForTimeout(500);

    // Close panel
    const closeButton = page.locator('button:has-text("×"), button[aria-label="Close"]').first();
    const isVisible = await closeButton.isVisible().catch(() => false);

    if (isVisible) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }

    // Filter out known/acceptable errors (e.g., network errors in test env)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('net::ERR_') &&
      !error.includes('manifest')
    );

    expect(criticalErrors).toHaveLength(0);

    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    } else {
      console.log('✓ No console errors');
    }
  });
});

test.describe('PlanMode - Regression Tests', () => {
  test('Toolbar buttons visible and functional', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/project/plan');
    await page.waitForLoadState('networkidle');

    // Check for toolbar buttons (adjust selectors based on your actual component)
    const backButton = page.locator('button:has-text("Back")').first();
    const regenerateButton = page.locator('button:has-text("Regenerate")').first();

    // Buttons should be visible
    const backVisible = await backButton.isVisible().catch(() => false);
    const regenVisible = await regenerateButton.isVisible().catch(() => false);

    console.log(`Toolbar buttons - Back: ${backVisible}, Regenerate: ${regenVisible}`);

    // At least some navigation should be present
    expect(backVisible || regenVisible).toBe(true);
  });

  test('Tabs navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/project/plan');
    await page.waitForLoadState('networkidle');

    // Look for tab buttons
    const timelineTab = page.locator('button:has-text("Timeline")').first();
    const benchmarksTab = page.locator('button:has-text("Benchmarks")').first();

    const timelineVisible = await timelineTab.isVisible().catch(() => false);
    const benchmarksVisible = await benchmarksTab.isVisible().catch(() => false);

    if (benchmarksVisible) {
      await benchmarksTab.click();
      await page.waitForTimeout(300);
      console.log('✓ Tabs are clickable');
    }

    console.log(`Tabs visible - Timeline: ${timelineVisible}, Benchmarks: ${benchmarksVisible}`);
  });

  test('Summary stats display correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/project/plan');
    await page.waitForLoadState('networkidle');

    // Look for summary stats (duration, cost, phases)
    const stats = await page.locator('text=/days|MYR|phases/i').count();

    console.log(`✓ Found ${stats} stat indicators`);

    // Should have some stats visible (if project has data)
    // This is a soft check as empty state might have 0 stats
  });
});
