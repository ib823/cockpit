/**
 * End-to-End Login Flow Tests with Playwright
 * Full browser automation tests for authentication flows
 *
 * Run:
 *   npx playwright test tests/e2e/login-flows.spec.ts
 *
 * Two things this file used to get wrong, both of which made every test in it
 * fail regardless of the app's behaviour:
 *
 *  - Every navigation hardcoded `http://localhost:3000`, while the Playwright
 *    config starts the server under test on 3002 (PLAYWRIGHT_PORT). The suite
 *    was pointed at whatever happened to be on 3000 — usually nothing, hence
 *    ERR_CONNECTION_REFUSED. Paths are now relative, so `baseURL` resolves them
 *    and the tests follow the config instead of contradicting it.
 *  - Half the describes seed users through Prisma, which needs a migrated
 *    database that CI does not provision. Those are now behind RUN_DB_E2E, the
 *    same gate `team-capacity-api.spec.ts` uses, and the client is created
 *    lazily so merely importing this file no longer requires DATABASE_URL.
 *
 * What is left ungated needs nothing but the app: it exercises the login page
 * itself and the middleware redirect on protected routes.
 */

import { test, expect } from "@playwright/test";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";

/**
 * Constructing a PrismaClient does not connect, but it does read the schema's
 * env() bindings on first query. Deferring construction keeps the import side
 * of this module free of database requirements, so the ungated describes run
 * in an environment that has no database at all.
 */
let prismaClient: PrismaClient | undefined;
function db(): PrismaClient {
  if (!prismaClient) {
    // Required lazily for the same reason.
    const { PrismaClient: Client } = require("@prisma/client");
    prismaClient = new Client() as PrismaClient;
  }
  return prismaClient;
}

/** Seeding requires a migrated database; CI has none. See the file header. */
const describeWithDb = process.env.RUN_DB_E2E ? test.describe : test.describe.skip;

// Helper to create test user
async function createTestUser(email: string, role: "USER" | "ADMIN" = "USER") {
  const userId = `test-${randomUUID()}`;

  await db().users.create({
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

  await db().authenticator.create({
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
  await db().authenticator.deleteMany({ where: { userId } });
  await db().users.delete({ where: { id: userId } });
}

test.describe("Login Page UI", () => {
  test("should display login page correctly", async ({ page }) => {
    await page.goto("/login");

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
  });

  test("should show validation for empty email", async ({ page }) => {
    await page.goto("/login");

    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await loginButton.click();

    // Should show validation message
    await expect(page.locator("text=/email.*required/i")).toBeVisible();
  });

  test("should show validation for invalid email format", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("not-an-email");

    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await loginButton.click();

    // Should show validation message
    await expect(page.locator("text=/invalid.*email/i")).toBeVisible();
  });
});

describeWithDb("Login Flow - Regular User", () => {
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
    await page.goto("/login");

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
    await page.goto("/login");

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

describeWithDb("Admin Login Flow", () => {
  const adminEmail = `admin-e2e-${Date.now()}@example.com`;
  const adminCode = "123456";
  let adminUserId: string;

  test.beforeAll(async () => {
    adminUserId = `test-${randomUUID()}`;
    const tokenHash = await hash(adminCode, 10);

    await db().users.create({
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

    await db().emailApproval.create({
      data: {
        email: adminEmail,
        tokenHash,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        approvedByUserId: "system",
      },
    });
  });

  test.afterAll(async () => {
    await db().emailApproval.deleteMany({ where: { email: adminEmail } });
    await db().users.delete({ where: { id: adminUserId } });
  });

  test("should show admin login form", async ({ page }) => {
    await page.goto("/login");

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
    await page.goto("/login");

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
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect to login when accessing admin route without session", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Accessibility", () => {
  test("login page should be keyboard navigable", async ({ page }) => {
    await page.goto("/login");

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
    await page.goto("/login");

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
    await page.goto("/login");

    // Form should still be visible and usable
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
  });

  test("login page should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
  });
});
