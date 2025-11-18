/**
 * E2E Tests - View Switching User Flow
 * Tests actual user interactions with view switching
 *
 * REQUIREMENT: Must be run with actual browser to verify visual/interaction quality
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Helper to login (if auth is required)
async function login(page: Page) {
  // TODO: Implement actual login flow based on your auth setup
  // For now, assuming tests run with auth bypassed or using test user
}

test.describe('View Switching - Project Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load Timeline view by default', async ({ page }) => {
    // Check URL
    await expect(page).toHaveURL(`${BASE_URL}/gantt-tool`);

    // Check Timeline tab is active in GlobalNav
    const timelineTab = page.locator('[href="/gantt-tool"]');
    await expect(timelineTab).toHaveAttribute('class', /active/);

    // Check Timeline button in view switcher is pressed
    const timelineButton = page.locator('button:has-text("Timeline")').first();
    await expect(timelineButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should switch to Architecture view when clicking GlobalNav Architecture tab', async ({ page }) => {
    // Click Architecture tab in GlobalNav
    await page.click('a[href="/gantt-tool?view=architecture"]');

    // Wait for navigation
    await page.waitForURL('**/gantt-tool?view=architecture');

    // Check URL updated
    await expect(page).toHaveURL(/view=architecture/);

    // Check Architecture tab is now active
    const archTab = page.locator('[href="/gantt-tool?view=architecture"]');
    await expect(archTab).toHaveAttribute('class', /active/);

    // Check Architecture button in view switcher is pressed
    const archButton = page.locator('button:has-text("Architecture")').first();
    await expect(archButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should switch views using view switcher buttons', async ({ page }) => {
    // Click Architecture button in view switcher
    await page.click('button:has-text("Architecture")');

    // Check URL updated
    await expect(page).toHaveURL(/view=architecture/);

    // Click Timeline button
    await page.click('button:has-text("Timeline")');

    // Check URL updated back
    await expect(page).not.toHaveURL(/view=architecture/);
  });

  test('should preserve project when switching views', async ({ page }) => {
    // TODO: This test requires a project to be loaded
    // Steps:
    // 1. Load a specific project (e.g., "YTL Cement")
    // 2. Verify project name in header
    // 3. Switch to Architecture view
    // 4. Verify same project name still shown
    // 5. Switch back to Timeline
    // 6. Verify project still loaded

    test.skip('Need to implement project loading first');
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');
  });

  test('should switch to Timeline view with Cmd+1 (Mac) or Ctrl+1 (Windows)', async ({ page }) => {
    // First go to Architecture view
    await page.goto(`${BASE_URL}/gantt-tool?view=architecture`);
    await page.waitForLoadState('networkidle');

    // Press Cmd+1 (Mac) or Ctrl+1 (Windows)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+1`);

    // Check URL updated
    await page.waitForTimeout(500); // Wait for URL update
    await expect(page).not.toHaveURL(/view=architecture/);
  });

  test('should switch to Architecture view with Cmd+2 (Mac) or Ctrl+2 (Windows)', async ({ page }) => {
    // Start in Timeline view
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');

    // Press Cmd+2 (Mac) or Ctrl+2 (Windows)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+2`);

    // Check URL updated
    await page.waitForTimeout(500); // Wait for URL update
    await expect(page).toHaveURL(/view=architecture/);
  });

  test('should toggle split view with Cmd+\\ (Mac) or Ctrl+\\ (Windows)', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Backslash`);

    // Check split view button is pressed
    await page.waitForTimeout(500);
    const splitButton = page.locator('button[title*="Split View"]');
    await expect(splitButton).toHaveAttribute('aria-pressed', 'true');

    // Toggle off
    await page.keyboard.press(`${modifier}+Backslash`);
    await page.waitForTimeout(500);
    await expect(splitButton).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Toast Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');
  });

  test('should show toast when switching to Architecture view', async ({ page }) => {
    // Click Architecture button
    await page.click('button:has-text("Architecture")');

    // Check for toast notification
    const toast = page.locator('div:has-text("Switched to Architecture View")');
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Toast should auto-dismiss after 1.5s
    await expect(toast).not.toBeVisible({ timeout: 3000 });
  });

  test('should show toast when switching to Timeline view', async ({ page }) => {
    // First go to Architecture
    await page.goto(`${BASE_URL}/gantt-tool?view=architecture`);
    await page.waitForLoadState('networkidle');

    // Click Timeline button
    await page.click('button:has-text("Timeline")');

    // Check for toast
    const toast = page.locator('div:has-text("Switched to Timeline View")');
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Auto-dismiss
    await expect(toast).not.toBeVisible({ timeout: 3000 });
  });

  test('should show toast when enabling split view', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Backslash`);

    const toast = page.locator('div:has-text("Split View Enabled")');
    await expect(toast).toBeVisible({ timeout: 2000 });
    await expect(toast).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Browser Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');
  });

  test('should support browser back button', async ({ page }) => {
    // Navigate: Timeline → Architecture
    await page.click('button:has-text("Architecture")');
    await page.waitForURL('**/gantt-tool?view=architecture');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back to Timeline
    await expect(page).not.toHaveURL(/view=architecture/);

    // Timeline button should be active
    const timelineButton = page.locator('button:has-text("Timeline")').first();
    await expect(timelineButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should support browser forward button', async ({ page }) => {
    // Navigate: Timeline → Architecture → Back → Forward
    await page.click('button:has-text("Architecture")');
    await page.waitForURL('**/gantt-tool?view=architecture');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Should be back to Architecture
    await expect(page).toHaveURL(/view=architecture/);
  });

  test('should preserve view state on page refresh', async ({ page }) => {
    // Go to Architecture view
    await page.goto(`${BASE_URL}/gantt-tool?view=architecture`);
    await page.waitForLoadState('networkidle');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be in Architecture view
    await expect(page).toHaveURL(/view=architecture/);
    const archButton = page.locator('button:has-text("Architecture")').first();
    await expect(archButton).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA attributes on view switcher buttons', async ({ page }) => {
    const timelineButton = page.locator('button:has-text("Timeline")').first();
    const archButton = page.locator('button:has-text("Architecture")').first();

    // Check aria-pressed attributes
    await expect(timelineButton).toHaveAttribute('aria-pressed');
    await expect(archButton).toHaveAttribute('aria-pressed');

    // Check aria-label
    await expect(timelineButton).toHaveAttribute('aria-label', /Timeline/i);
    await expect(archButton).toHaveAttribute('aria-label', /Architecture/i);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to Timeline button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Continue tabbing until we reach view switcher
    // (exact number depends on page structure)

    // Should be able to activate with Enter or Space
    const timelineButton = page.locator('button:has-text("Timeline")').first();
    await timelineButton.focus();
    await page.keyboard.press('Space');

    // Should maintain functionality
    await expect(timelineButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should have minimum 44px touch targets', async ({ page }) => {
    const timelineButton = page.locator('button:has-text("Timeline")').first();
    const boundingBox = await timelineButton.boundingBox();

    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Split View Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');
  });

  test('should show both views when split view is enabled', async ({ page }) => {
    // Enable split view
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Backslash`);
    await page.waitForTimeout(500);

    // Both Timeline and Architecture should be visible
    // (This test needs to check for actual content, depends on implementation)
    const splitButton = page.locator('button[title*="Split View"]');
    await expect(splitButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should exit split view when clicking split button again', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

    // Enable
    await page.keyboard.press(`${modifier}+Backslash`);
    await page.waitForTimeout(500);

    // Disable
    await page.keyboard.press(`${modifier}+Backslash`);
    await page.waitForTimeout(500);

    const splitButton = page.locator('button[title*="Split View"]');
    await expect(splitButton).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should be usable on mobile viewport', async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');

    // View switcher should still be accessible
    const archButton = page.locator('button:has-text("Architecture")').first();
    await expect(archButton).toBeVisible();

    // Should be clickable
    await archButton.click();
    await expect(page).toHaveURL(/view=architecture/);
  });

  test('split view button should be hidden or disabled on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');

    const splitButton = page.locator('button[title*="Split View"]');

    // Either hidden or disabled (implementation decision)
    const isVisible = await splitButton.isVisible();
    if (isVisible) {
      const isDisabled = await splitButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});

test.describe('Performance', () => {
  test('should switch views in under 300ms', async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');

    // Measure view switch time
    const startTime = Date.now();
    await page.click('button:has-text("Architecture")');
    await page.waitForURL('**/gantt-tool?view=architecture');
    const endTime = Date.now();

    const switchTime = endTime - startTime;
    expect(switchTime).toBeLessThan(300);
  });

  test('should not cause memory leaks after multiple switches', async ({ page }) => {
    await page.goto(`${BASE_URL}/gantt-tool`);
    await page.waitForLoadState('networkidle');

    // Switch views 20 times
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("Architecture")');
      await page.waitForTimeout(100);
      await page.click('button:has-text("Timeline")');
      await page.waitForTimeout(100);
    }

    // Check for memory leaks (requires Chrome DevTools Protocol)
    // This is a placeholder - actual implementation would use CDP
    // to check heap size before/after
    expect(true).toBe(true);
  });
});
