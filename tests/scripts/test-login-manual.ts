#!/usr/bin/env tsx
/**
 * Manual Login Test Script
 * Interactive CLI tool to test all authentication scenarios
 *
 * Usage:
 *   npm run test:login:manual
 *   or
 *   tsx tests/scripts/test-login-manual.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, "green");
}

function logError(message: string) {
  log(`✗ ${message}`, "red");
}

function logInfo(message: string) {
  log(`ℹ ${message}`, "cyan");
}

function logWarning(message: string) {
  log(`⚠ ${message}`, "yellow");
}

function logSection(title: string) {
  console.log("");
  log(`${"=".repeat(60)}`, "bright");
  log(title.toUpperCase(), "bright");
  log(`${"=".repeat(60)}`, "bright");
  console.log("");
}

// Readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${colors.blue}${prompt}${colors.reset} `, resolve);
  });
}

// Test scenarios
interface TestScenario {
  id: string;
  name: string;
  description: string;
  run: () => Promise<void>;
}

/**
 * Test 1: Regular User Login (Passkey)
 */
async function testRegularUserLogin() {
  logInfo("Testing regular user with passkey login flow...");

  const email = `test-user-${Date.now()}@example.com`;
  const userId = `test-${randomUUID()}`;

  try {
    // Create user with passkey
    log("Creating test user with passkey...");
    const user = await prisma.users.create({
      data: {
        id: userId,
        email,
        name: "Test User",
        role: "USER",
        accessExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        exception: false,
        updatedAt: new Date(),
      },
    });

    await prisma.authenticator.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        publicKey: Buffer.from("test-public-key"),
        counter: 0,
        transports: ["internal"],
        deviceType: "platform",
        backedUp: false,
      },
    });

    logSuccess(`Created user: ${email}`);

    // Test begin-login
    log("Testing begin-login endpoint...");
    const beginResponse = await fetch("http://localhost:3000/api/auth/begin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const beginData = await beginResponse.json();

    if (beginResponse.ok && beginData.ok && beginData.pendingPasskey) {
      logSuccess("begin-login: User found, passkey challenge generated");
      logInfo(`Challenge present: ${!!beginData.options?.challenge}`);
    } else {
      logError(`begin-login failed: ${beginData.message || "Unknown error"}`);
    }

    // Cleanup
    await prisma.authenticator.deleteMany({ where: { userId } });
    await prisma.users.delete({ where: { id: userId } });
    logInfo("Cleanup completed");
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
  }
}

/**
 * Test 2: User Not Found
 */
async function testUserNotFound() {
  logInfo("Testing non-existent user...");

  const email = `nonexistent-${Date.now()}@example.com`;

  try {
    const response = await fetch("http://localhost:3000/api/auth/begin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.status === 404 && !data.ok && data.notApproved) {
      logSuccess("Correctly rejected non-existent user");
      logInfo(`Message: ${data.message}`);
    } else {
      logError(`Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
  }
}

/**
 * Test 3: Admin Login
 */
async function testAdminLogin() {
  logInfo("Testing admin login with code...");

  const email = `test-admin-${Date.now()}@example.com`;
  const code = "123456";
  const userId = `test-${randomUUID()}`;

  try {
    // Create admin user
    log("Creating admin user...");
    await prisma.users.create({
      data: {
        id: userId,
        email,
        name: "Test Admin",
        role: "ADMIN",
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        exception: true,
        updatedAt: new Date(),
      },
    });

    const tokenHash = await hash(code, 10);
    await prisma.emailApproval.create({
      data: {
        email,
        tokenHash,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        approvedByUserId: "system",
      },
    });

    logSuccess(`Created admin: ${email}`);
    logInfo(`Admin code: ${code}`);

    // Test admin login
    log("Testing admin-login endpoint...");
    const response = await fetch("http://localhost:3000/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      logSuccess("Admin login successful");
    } else {
      logError(`Admin login failed: ${data.message || "Unknown error"}`);
    }

    // Test with wrong code
    log("Testing with wrong code...");
    const wrongResponse = await fetch("http://localhost:3000/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: "999999" }),
    });

    const wrongData = await wrongResponse.json();

    if (wrongResponse.status === 401 && !wrongData.ok) {
      logSuccess("Correctly rejected wrong code");
    } else {
      logError("Should have rejected wrong code");
    }

    // Cleanup
    await prisma.emailApproval.deleteMany({ where: { email } });
    await prisma.users.delete({ where: { id: userId } });
    logInfo("Cleanup completed");
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
  }
}

/**
 * Test 4: Expired Access
 */
async function testExpiredAccess() {
  logInfo("Testing user with expired access...");

  const email = `test-expired-${Date.now()}@example.com`;
  const userId = `test-${randomUUID()}`;

  try {
    // Create user with expired access
    log("Creating user with expired access...");
    await prisma.users.create({
      data: {
        id: userId,
        email,
        name: "Expired User",
        role: "USER",
        accessExpiresAt: new Date(Date.now() - 1000), // Expired
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

    logSuccess(`Created user: ${email}`);

    // Test begin-login
    log("Testing begin-login with expired user...");
    const response = await fetch("http://localhost:3000/api/auth/begin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.status === 403 && !data.ok && data.message.includes("expired")) {
      logSuccess("Correctly rejected expired user");
      logInfo(`Message: ${data.message}`);
    } else {
      logError(`Expected 403, got ${response.status}: ${JSON.stringify(data)}`);
    }

    // Cleanup
    await prisma.authenticator.deleteMany({ where: { userId } });
    await prisma.users.delete({ where: { id: userId } });
    logInfo("Cleanup completed");
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
  }
}

/**
 * Test 5: Rate Limiting
 */
async function testRateLimiting() {
  logInfo("Testing rate limiting...");

  const email = `test-rate-limit-${Date.now()}@example.com`;

  try {
    log("Making multiple rapid requests...");

    let blockedCount = 0;
    let successCount = 0;

    for (let i = 0; i < 25; i++) {
      const response = await fetch("http://localhost:3000/api/auth/begin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `test-rate-limit-${Date.now()}`,
        },
        body: JSON.stringify({ email }),
      });

      const remaining = response.headers.get("X-RateLimit-Remaining");
      const limit = response.headers.get("X-RateLimit-Limit");

      if (response.status === 429) {
        blockedCount++;
        const retryAfter = response.headers.get("Retry-After");
        if (blockedCount === 1) {
          logWarning(`Request ${i + 1}: Rate limited (Retry-After: ${retryAfter}s)`);
        }
      } else {
        successCount++;
        if (i < 5 || (remaining && parseInt(remaining) < 5)) {
          logInfo(`Request ${i + 1}: OK (Remaining: ${remaining}/${limit})`);
        }
      }
    }

    logInfo(`Results: ${successCount} successful, ${blockedCount} blocked`);

    if (blockedCount > 0) {
      logSuccess("Rate limiting is working");
    } else {
      logWarning("No rate limiting detected (expected some blocks after 20 requests)");
    }
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
  }
}

/**
 * Main menu
 */
const scenarios: TestScenario[] = [
  {
    id: "1",
    name: "Regular User Login (Passkey)",
    description: "Test successful login flow with passkey",
    run: testRegularUserLogin,
  },
  {
    id: "2",
    name: "User Not Found",
    description: "Test login attempt with non-existent email",
    run: testUserNotFound,
  },
  {
    id: "3",
    name: "Admin Login",
    description: "Test admin login with code",
    run: testAdminLogin,
  },
  {
    id: "4",
    name: "Expired Access",
    description: "Test user with expired access",
    run: testExpiredAccess,
  },
  {
    id: "5",
    name: "Rate Limiting",
    description: "Test rate limiting behavior",
    run: testRateLimiting,
  },
];

async function showMenu() {
  logSection("Authentication Test Suite");

  log("Available Tests:", "bright");
  scenarios.forEach((scenario) => {
    log(`  ${scenario.id}. ${scenario.name}`, "cyan");
    log(`     ${scenario.description}`, "dim");
  });
  console.log("");
  log("  a. Run all tests", "yellow");
  log("  q. Quit", "dim");
  console.log("");

  const choice = await question("Select a test (1-5, a, q):");

  if (choice.toLowerCase() === "q") {
    log("\nGoodbye!", "cyan");
    rl.close();
    await prisma.$disconnect();
    process.exit(0);
  }

  if (choice.toLowerCase() === "a") {
    logSection("Running All Tests");
    for (const scenario of scenarios) {
      log(`\n--- ${scenario.name} ---`, "bright");
      await scenario.run();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait between tests
    }
    logSection("All Tests Complete");
  } else {
    const scenario = scenarios.find((s) => s.id === choice);
    if (scenario) {
      logSection(scenario.name);
      await scenario.run();
    } else {
      logError("Invalid choice");
    }
  }

  console.log("");
  await showMenu();
}

// Entry point
async function main() {
  try {
    // Check if server is running
    try {
      await fetch("http://localhost:3000/api/health");
    } catch {
      logError("Server is not running at http://localhost:3000");
      logInfo("Please start the development server: npm run dev");
      process.exit(1);
    }

    await showMenu();
  } catch (error: any) {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
