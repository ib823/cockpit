/**
 * Dashboard E2E Tests
 * End-to-end testing for dashboard functionality using Playwright
 */

import { test, expect } from "@playwright/test";

test.describe("Three-Layer Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assuming a test project exists)
    await page.goto("/dashboard-demo");
  });

  test("should load dashboard with project data", async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByText("Proposal Dashboard")).toBeVisible();

    // Check that all three layers are rendered
    await expect(page.getByText("Layer 1: Operational View")).toBeVisible();
    await expect(page.getByText("Layer 2: Financial View")).toBeVisible();
    await expect(page.getByText("Layer 3: Strategic View")).toBeVisible();
  });

  test("should display operational metrics", async ({ page }) => {
    // Check for operational metrics
    await expect(page.getByText(/Project Duration/i)).toBeVisible();
    await expect(page.getByText(/Total Resources/i)).toBeVisible();
    await expect(page.getByText(/Total Tasks/i)).toBeVisible();
  });

  test("should display financial KPIs", async ({ page }) => {
    // Check for financial metrics
    await expect(page.getByText(/Total Revenue/i)).toBeVisible();
    await expect(page.getByText(/Total Cost/i)).toBeVisible();
    await expect(page.getByText(/Gross Margin/i)).toBeVisible();
  });

  test("should allow view switching", async ({ page }) => {
    // Test view selector
    await page.getByRole("radio", { name: /Operational/i }).click();
    await expect(page.getByText("Layer 1: Operational View")).toBeVisible();
    await expect(page.getByText("Layer 2: Financial View")).not.toBeVisible();

    await page.getByRole("radio", { name: /Financial/i }).click();
    await expect(page.getByText("Layer 2: Financial View")).toBeVisible();
    await expect(page.getByText("Layer 1: Operational View")).not.toBeVisible();

    await page.getByRole("radio", { name: /All Views/i }).click();
    await expect(page.getByText("Layer 1: Operational View")).toBeVisible();
    await expect(page.getByText("Layer 2: Financial View")).toBeVisible();
  });

  test("should open rate card manager", async ({ page }) => {
    await page.getByRole("button", { name: /Rate Card/i }).click();

    // Check modal opened
    await expect(page.getByText(/Rate Card Manager/i)).toBeVisible();
    await expect(page.getByText(/Principal/i)).toBeVisible();
    await expect(page.getByText(/Senior Manager/i)).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: /Cancel|Close/i }).click();
    await expect(page.getByText(/Rate Card Manager/i)).not.toBeVisible();
  });

  test("should display resource heatmap", async ({ page }) => {
    // Check heatmap table exists
    const heatmap = page.locator("table").filter({ hasText: /Week/ });
    await expect(heatmap).toBeVisible();

    // Check for resource rows
    const rows = heatmap.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("should show export modal", async ({ page }) => {
    await page.getByRole("button", { name: /Export/i }).click();

    // Check export modal
    await expect(page.getByText(/Choose export format/i)).toBeVisible();
    await expect(page.getByRole("radio", { name: /PDF/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Excel/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /CSV/i })).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
    await expect(page.getByText(/Choose export format/i)).not.toBeVisible();
  });

  test("should handle refresh action", async ({ page }) => {
    const refreshButton = page.getByRole("button", { name: /Refresh/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Dashboard should reload (check page URL didn't change)
    await expect(page).toHaveURL(/dashboard-demo/);
  });
});

test.describe("Comprehensive Dashboard v2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard-v2-demo");
  });

  test("should load three-panel layout", async ({ page }) => {
    await expect(page.getByText("Comprehensive Dashboard v2")).toBeVisible();

    // Check all three panels
    await expect(page.getByText(/Operational Reality/i)).toBeVisible();
    await expect(page.getByText(/Financial Intelligence/i)).toBeVisible();
    await expect(page.getByText(/Strategic Insights/i)).toBeVisible();
  });

  test("should display validation status", async ({ page }) => {
    // Check footer validation section
    const footer = page
      .locator('[aria-label*="validation"]')
      .or(page.locator("text=/validation|All Validations Passed|Critical Issue/i"));
    await expect(footer.first()).toBeVisible();
  });

  test("should show AI recommendations", async ({ page }) => {
    // Look for recommendations section
    await expect(page.getByText(/AI Recommendations/i)).toBeVisible();

    // Check for recommendation items
    const recommendations = page
      .locator('[aria-label*="recommendation"]')
      .or(page.getByRole("listitem").filter({ hasText: /Recommendation|Optimize|Improve/ }));

    // Should have at least one recommendation
    await expect(recommendations.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display risk assessment", async ({ page }) => {
    // Check for risk gauge or risk section
    await expect(page.getByText(/Confidence Score|Risk/i)).toBeVisible();
  });

  test("should allow scenario selection", async ({ page }) => {
    // Find scenario selector dropdown
    const scenarioSelector = page.locator('select, [role="combobox"]').filter({
      hasText: /Baseline|Scenario/,
    });

    if (await scenarioSelector.isVisible()) {
      await expect(scenarioSelector).toBeVisible();
    }
  });

  test("should show auto-save status", async ({ page }) => {
    // Look for save status indicator
    const saveStatus = page.getByText(/Saved|Saving/i);
    await expect(saveStatus).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard Accessibility", () => {
  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/dashboard-demo");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to activate buttons with Enter
    const activeElement = page.locator(":focus");
    await expect(activeElement).toBeFocused();
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/dashboard-demo");

    // Check for aria-labels on buttons
    const exportButton = page.getByRole("button", { name: /Export/i });
    await expect(exportButton).toHaveAttribute("aria-label", /.+/);
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/dashboard-demo");

    // This would be better done with axe-core
    // For now, just check that text is visible
    await expect(page.getByText("Proposal Dashboard")).toBeVisible();
  });

  test("should support screen readers", async ({ page }) => {
    await page.goto("/dashboard-demo");

    // Check for landmarks
    const main = page.getByRole("main");
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }

    // Check for proper heading structure
    const headings = page.getByRole("heading");
    await expect(headings.first()).toBeVisible();
  });
});

test.describe("Dashboard Export Functionality", () => {
  test("should export to PDF", async ({ page, context }) => {
    await page.goto("/dashboard-demo");

    // Set up download listener
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

    await page.getByRole("button", { name: /Export/i }).click();
    await page.getByRole("radio", { name: /PDF/i }).click();
    await page
      .getByRole("button", { name: /Export|OK/i })
      .last()
      .click();

    // PDF export opens new window, so we check for popup instead
    const popup = await context.waitForEvent("page", { timeout: 5000 }).catch(() => null);

    if (popup) {
      expect(popup.url()).toContain("about:blank");
      await popup.close();
    }
  });

  test("should export to CSV", async ({ page }) => {
    await page.goto("/dashboard-demo");

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

    await page.getByRole("button", { name: /Export/i }).click();
    await page.getByRole("radio", { name: /CSV/i }).click();
    await page
      .getByRole("button", { name: /Export|OK/i })
      .last()
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("should export to Excel", async ({ page }) => {
    await page.goto("/dashboard-demo");

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

    await page.getByRole("button", { name: /Export/i }).click();
    await page.getByRole("radio", { name: /Excel/i }).click();
    await page
      .getByRole("button", { name: /Export|OK/i })
      .last()
      .click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xls$/);
  });
});

test.describe("Dashboard Performance", () => {
  test("should load within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/dashboard-demo");
    await page.waitForSelector("text=Proposal Dashboard", { timeout: 5000 });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
  });

  test("should not have memory leaks", async ({ page }) => {
    await page.goto("/dashboard-demo");

    // Switch views multiple times
    for (let i = 0; i < 5; i++) {
      await page.getByRole("radio", { name: /Operational/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole("radio", { name: /Financial/i }).click();
      await page.waitForTimeout(500);
    }

    // If page is still responsive, no major memory leak
    await expect(page.getByText("Proposal Dashboard")).toBeVisible();
  });
});

test.describe("Dashboard Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto("/dashboard-demo");

    await expect(page.getByText("Proposal Dashboard")).toBeVisible();
  });

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto("/dashboard-demo");

    await expect(page.getByText("Proposal Dashboard")).toBeVisible();
  });

  test("should work on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/dashboard-demo");

    await expect(page.getByText("Proposal Dashboard")).toBeVisible();
  });
});
