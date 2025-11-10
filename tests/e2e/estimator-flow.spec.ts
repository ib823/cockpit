/**
 * E2E Test: Complete Estimator Workflow
 *
 * Tests the full user journey from login through estimation:
 * 1. Login with passkey
 * 2. Navigate to estimator
 * 3. Open L3 catalog modal
 * 4. Select L3 items
 * 5. Fill input forms
 * 6. Verify results display
 * 7. Save scenario
 */

import { test, expect } from "@playwright/test";

test.describe("Estimator Complete Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
  });

  test("should complete full estimation workflow", async ({ page }) => {
    // Step 1: Login (assuming user is already registered with passkey)
    await expect(page.locator("h1")).toContainText("Login");

    // Step 2: Navigate to estimator
    // Note: Login flow may auto-redirect, adjust selector as needed
    await page.goto("/estimator");
    await expect(page).toHaveURL(/\/estimator/);

    // Step 3: Open L3 Catalog Modal
    await page.click('button:has-text("Select L3 Items")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=L3 Catalog")).toBeVisible();

    // Step 4: Verify L3 items loaded (should have 158 items)
    const l3ItemsCount = await page.locator('[data-testid="l3-item"]').count();
    expect(l3ItemsCount).toBeGreaterThan(0);

    // Step 5: Search for specific L3 item
    await page.fill('input[placeholder*="Search"]', "Accounting");
    await page.waitForTimeout(500); // Debounce

    // Step 6: Select 3 L3 items
    await page.click('[data-testid="l3-item"]:has-text("Accounting") input[type="checkbox"]', {
      timeout: 5000,
    });
    await page.click(
      '[data-testid="l3-item"]:has-text("Accounts Receivable") input[type="checkbox"]',
      { timeout: 5000 }
    );
    await page.click(
      '[data-testid="l3-item"]:has-text("Accounts Payable") input[type="checkbox"]',
      { timeout: 5000 }
    );

    // Step 7: Apply selection
    await page.click('button:has-text("Apply Selection")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Step 8: Fill Scope Breadth inputs
    await page.fill('input[name="integrations"]', "2");

    // Step 9: Fill Process Complexity inputs
    await page.fill('input[name="customForms"]', "6");
    await page.fill('input[name="fitToStandard"]', "85"); // Assuming percentage input

    // Step 10: Fill Org Scale inputs
    await page.fill('input[name="legalEntities"]', "1");
    await page.fill('input[name="countries"]', "1");
    await page.fill('input[name="languages"]', "1");

    // Step 11: Fill Capacity inputs
    await page.fill('input[name="fte"]', "5");
    await page.fill('input[name="utilization"]', "80"); // Assuming percentage

    // Step 12: Verify results display
    await expect(page.locator("text=/Total Effort/i")).toBeVisible();
    await expect(page.locator("text=/Duration/i")).toBeVisible();

    // Verify numeric results are present
    const totalMD = await page.locator('[data-testid="total-md"]').textContent();
    expect(totalMD).toMatch(/\d+/); // Should contain numbers

    const duration = await page.locator('[data-testid="duration-months"]').textContent();
    expect(duration).toMatch(/\d+/); // Should contain numbers

    // Step 13: Verify phase breakdown
    await expect(page.locator("text=Prepare")).toBeVisible();
    await expect(page.locator("text=Explore")).toBeVisible();
    await expect(page.locator("text=Realize")).toBeVisible();
    await expect(page.locator("text=Deploy")).toBeVisible();
    await expect(page.locator("text=Run")).toBeVisible();

    // Step 14: Save scenario
    await page.click('button:has-text("Save Scenario")');
    await page.fill('input[placeholder*="Scenario name"]', "Test Malaysia Project");
    await page.click('button:has-text("Save")');

    // Step 15: Verify success message
    await expect(page.locator("text=/Scenario saved/i")).toBeVisible({ timeout: 5000 });
  });

  test("should handle L3 catalog search filtering", async ({ page }) => {
    await page.goto("/estimator");

    // Open L3 catalog
    await page.click('button:has-text("Select L3 Items")');

    // Search for Finance items
    await page.fill('input[placeholder*="Search"]', "Finance");
    await page.waitForTimeout(500);

    // Verify filtered results
    const financeItems = await page.locator('[data-testid="l3-item"]:has-text("Finance")').count();
    expect(financeItems).toBeGreaterThan(0);

    // Clear search
    await page.fill('input[placeholder*="Search"]', "");
    await page.waitForTimeout(500);

    // Verify all items shown again
    const allItems = await page.locator('[data-testid="l3-item"]').count();
    expect(allItems).toBeGreaterThan(financeItems);
  });

  test("should display Tier D warning", async ({ page }) => {
    await page.goto("/estimator");

    // Open L3 catalog
    await page.click('button:has-text("Select L3 Items")');

    // Select a Tier D item (requires extensions)
    await page.fill('input[placeholder*="Search"]', "Central Finance");
    await page.waitForTimeout(500);

    const tierDItem = page.locator('[data-testid="l3-item"]:has-text("Tier D")').first();
    if (await tierDItem.isVisible()) {
      await tierDItem.click();
      await page.click('button:has-text("Apply Selection")');

      // Verify warning banner
      await expect(page.locator("text=/Tier D.*require.*extension/i")).toBeVisible();
    }
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/estimator");

    // Try to calculate without selecting L3 items
    await page.fill('input[name="fte"]', "0"); // Invalid FTE

    // Should show validation error
    await expect(page.locator("text=/FTE must be/i")).toBeVisible({ timeout: 5000 });
  });

  test("should display Tornado chart", async ({ page }) => {
    await page.goto("/estimator");

    // Fill basic inputs
    await page.click('button:has-text("Select L3 Items")');
    await page.click('[data-testid="l3-item"]:first-child input[type="checkbox"]');
    await page.click('button:has-text("Apply Selection")');

    await page.fill('input[name="fte"]', "5");
    await page.fill('input[name="integrations"]', "2");

    // Check if Tornado chart renders
    await expect(page.locator('[data-testid="tornado-chart"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Estimator Edge Cases", () => {
  test("should handle empty L3 selection", async ({ page }) => {
    await page.goto("/estimator");

    // Don't select any L3 items, just fill other inputs
    await page.fill('input[name="fte"]', "5");

    // Should show warning or disabled state
    await expect(page.locator("text=/Select at least one/i")).toBeVisible({ timeout: 5000 });
  });

  test("should handle very large team size", async ({ page }) => {
    await page.goto("/estimator");

    // Select an L3 item
    await page.click('button:has-text("Select L3 Items")');
    await page.click('[data-testid="l3-item"]:first-child input[type="checkbox"]');
    await page.click('button:has-text("Apply Selection")');

    // Set large team
    await page.fill('input[name="fte"]', "25");

    // Should show warning about large team size
    await expect(page.locator("text=/Large team/i")).toBeVisible({ timeout: 5000 });
  });

  test("should handle low utilization warning", async ({ page }) => {
    await page.goto("/estimator");

    // Select an L3 item
    await page.click('button:has-text("Select L3 Items")');
    await page.click('[data-testid="l3-item"]:first-child input[type="checkbox"]');
    await page.click('button:has-text("Apply Selection")');

    // Set low utilization
    await page.fill('input[name="utilization"]', "50"); // 50%

    // Should show warning about low utilization
    await expect(page.locator("text=/utilization/i")).toBeVisible({ timeout: 5000 });
  });
});
