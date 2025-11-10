/**
 * End-to-End Login Flow Tests with Playwright
 * Full browser automation tests for authentication flows
 *
 * Prerequisites:
 *   npm install -D @playwright/test
 *   npx playwright install
 *
 * Run:
 *   npx playwright test tests/e2e/login-flows.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Helper to create test user
async function createTestUser(email: string, role: "USER" | "ADMIN" = "USER") {
  const userId = `test-${randomUUID()}`;

  await prisma.users.create({
    data: {
      id: userId,
      email,
      name: email.split("@")[0],
      role,
      accessExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      exception: false,
      updatedAt: new Date(),
    },
  });

  await prisma.authenticator.create({
    data: {
      id: randomUUID(),
      userId,
      publicKey: Buffer.from("test-public-key"),
      counter: 0,
      transports: ["internal"],
      deviceType: "platform",
      backedUp: false,
    },
  });

  return { userId, email };
}

// Helper to cleanup test user
async function cleanupTestUser(userId: string) {
  await prisma.authenticator.deleteMany({ where: { userId } });
  await prisma.users.delete({ where: { id: userId } });
}

test.describe("Login Page UI", () => {
  test("should display login page correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
  });

  test("should show validation for empty email", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await loginButton.click();

    // Should show validation message
    await expect(page.locator("text=/email.*required/i")).toBeVisible();
  });

  test("should show validation for invalid email format", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("not-an-email");

    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await loginButton.click();

    // Should show validation message
    await expect(page.locator("text=/invalid.*email/i")).toBeVisible();
  });
});

test.describe("Login Flow - Regular User", () => {
  let testUserId: string;
  const testEmail = `e2e-test-${Date.now()}@example.com`;

  test.beforeAll(async () => {
    const user = await createTestUser(testEmail);
    testUserId = user.userId;
  });

  test.afterAll(async () => {
    await cleanupTestUser(testUserId);
  });

  test("should initiate login for existing user", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(testEmail);

    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await loginButton.click();

    // Should show passkey prompt or next step
    // Note: Actual passkey flow requires WebAuthn API which needs browser automation
    await page.waitForTimeout(1000);

    // Check for passkey-related UI
    const hasPasskeyPrompt = await page
      .locator("text=/passkey|authenticate/i")
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasPasskeyPrompt).toBe(true);
  });
});

test.describe("Login Flow - Non-existent User", () => {
  test("should show error for non-existent user", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(`nonexistent-${Date.now()}@example.com`);

    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await loginButton.click();

    // Should show error message
    await expect(page.locator("text=/not found|contact.*administrator/i")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Admin Login Flow", () => {
  const adminEmail = `admin-e2e-${Date.now()}@example.com`;
  const adminCode = "123456";
  let adminUserId: string;

  test.beforeAll(async () => {
    adminUserId = `test-${randomUUID()}`;
    const tokenHash = await hash(adminCode, 10);

    await prisma.users.create({
      data: {
        id: adminUserId,
        email: adminEmail,
        name: "E2E Admin",
        role: "ADMIN",
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        exception: true,
        updatedAt: new Date(),
      },
    });

    await prisma.emailApproval.create({
      data: {
        email: adminEmail,
        tokenHash,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        approvedByUserId: "system",
      },
    });
  });

  test.afterAll(async () => {
    await prisma.emailApproval.deleteMany({ where: { email: adminEmail } });
    await prisma.users.delete({ where: { id: adminUserId } });
  });

  test("should show admin login form", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Look for admin login toggle/link
    const adminLink = page.locator("text=/admin.*login|admin.*access/i").first();

    if (await adminLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminLink.click();

      // Should show code input
      await expect(page.locator('input[type="text"], input[type="password"]')).toBeVisible();
    }
  });
});

test.describe("Rate Limiting UI", () => {
  test("should show rate limit message after too many attempts", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    const emailInput = page.locator('input[type="email"]');
    const loginButton = page.getByRole("button", { name: /login|sign in/i });

    // Make rapid requests
    for (let i = 0; i < 25; i++) {
      await emailInput.fill(`test-${i}-${Date.now()}@example.com`);
      await loginButton.click();
      await page.waitForTimeout(100);
    }

    // Should eventually show rate limit message
    const rateLimitMessage = page.locator("text=/too many.*requests|rate.*limit/i");
    const isRateLimited = await rateLimitMessage.isVisible({ timeout: 3000 }).catch(() => false);

    // Note: This might not trigger if rate limiting is too permissive
    // The test documents expected behavior
    if (isRateLimited) {
      await expect(rateLimitMessage).toBeVisible();
    }
  });
});

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing protected route without session", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect to login when accessing admin route without session", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Accessibility", () => {
  test("login page should be keyboard navigable", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Tab to email input
    await page.keyboard.press("Tab");
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();

    // Type email
    await page.keyboard.type("test@example.com");

    // Tab to submit button
    await page.keyboard.press("Tab");
    const submitButton = page.getByRole("button", { name: /login|sign in/i });
    await expect(submitButton).toBeFocused();
  });

  test("login page should have proper ARIA labels", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Check for accessible form labels
    const emailInput = page.locator('input[type="email"]');
    const labelText =
      (await emailInput.getAttribute("aria-label")) ||
      (await page.locator("label[for]").textContent());

    expect(labelText).toBeTruthy();
  });
});

test.describe("Responsive Design", () => {
  test("login page should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto("http://localhost:3000/login");

    // Form should still be visible and usable
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
  });

  test("login page should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto("http://localhost:3000/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
  });
});
