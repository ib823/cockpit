#!/usr/bin/env tsx
/**
 * Master Test Runner - Complete Login & Security Test Suite
 *
 * Runs all tests sequentially, exits on first failure, outputs to log file
 *
 * Usage:
 *   npm run test:all
 *   tsx tests/scripts/run-all-tests.ts
 *
 * Output:
 *   - Console: Real-time progress
 *   - File: test-results-{timestamp}.log
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, appendFileSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// Auto-cleanup old test logs before running
function cleanupOldLogs() {
  const { readdirSync, unlinkSync } = require("fs");
  const cwd = process.cwd();

  try {
    const files = readdirSync(cwd);
    const logFiles = files.filter((f) => f.startsWith("test-results-") && f.endsWith(".log"));

    logFiles.forEach((file) => {
      try {
        unlinkSync(join(cwd, file));
      } catch (err) {
        // Ignore errors
      }
    });

    if (logFiles.length > 0) {
      console.log(`🗑️  Cleaned up ${logFiles.length} old log file(s)\n`);
    }
  } catch (err) {
    // Ignore errors
  }
}

// Clean up old logs
cleanupOldLogs();

// Test output file
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = join(process.cwd(), `test-results-${timestamp}.log`);

function log(message: string, color: keyof typeof colors = "reset", logToFile = true) {
  const consoleMsg = `${colors[color]}${message}${colors.reset}`;
  console.log(consoleMsg);

  if (logToFile) {
    const fileMsg = `[${new Date().toISOString()}] ${message}\n`;
    appendFileSync(logFile, fileMsg);
  }
}

function logSection(title: string) {
  const border = "═".repeat(80);
  log(`\n${border}`, "bright");
  log(`  ${title}`, "bright");
  log(`${border}`, "bright");
}

interface TestSuite {
  name: string;
  command: string;
  critical: boolean; // If true, failure stops all tests
  timeout?: number; // milliseconds
}

const testSuites: TestSuite[] = [
  // 1. Unit/Integration Tests
  {
    name: "Passkey Login Tests",
    command: "npm run test:auth:passkey",
    critical: true,
    timeout: 60000,
  },
  {
    name: "Admin Login Tests",
    command: "npm run test:auth:admin",
    critical: true,
    timeout: 60000,
  },
  {
    name: "Magic Link Login Tests",
    command: "npm run test:auth:magic",
    critical: true,
    timeout: 60000,
  },
  {
    name: "Rate Limiting Tests",
    command: "npm run test:auth:rate-limit",
    critical: true,
    timeout: 60000,
  },

  // 2. Security Tests
  {
    name: "Security & Penetration Tests",
    command: "tsx tests/scripts/security-tests.ts",
    critical: true,
    timeout: 120000,
  },

  // 3. Load Tests
  {
    name: "Load Test - Login Endpoint",
    command: "tsx tests/scripts/load-test-login.ts 10 30",
    critical: false,
    timeout: 45000,
  },

  // 4. E2E Tests (requires server running)
  {
    name: "E2E Login Flow Tests",
    command: "npm run test:e2e",
    critical: false,
    timeout: 120000,
  },
];

async function runTest(suite: TestSuite): Promise<boolean> {
  logSection(`Running: ${suite.name}`);
  log(`Command: ${suite.command}`, "cyan");

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(suite.command, {
      timeout: suite.timeout || 60000,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log output
    if (stdout) {
      log("\n--- STDOUT ---", "dim");
      log(stdout.trim(), "reset");
    }

    if (stderr && stderr.trim().length > 0) {
      log("\n--- STDERR ---", "yellow");
      log(stderr.trim(), "yellow");
    }

    log(`\n✓ PASSED in ${duration}s`, "green");
    log(`${"─".repeat(80)}\n`, "dim");

    return true;
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log(`\n✗ FAILED in ${duration}s`, "red");
    log(`\nError: ${error.message}`, "red");

    if (error.stdout) {
      log("\n--- STDOUT ---", "dim");
      log(error.stdout.trim(), "reset");
    }

    if (error.stderr) {
      log("\n--- STDERR ---", "red");
      log(error.stderr.trim(), "red");
    }

    log(`${"─".repeat(80)}\n`, "dim");

    return false;
  }
}

async function checkPrerequisites(): Promise<boolean> {
  logSection("Checking Prerequisites");

  // Check if server is running
  try {
    const response = await fetch("http://localhost:3000/api/health");
    log("✓ Server is running at http://localhost:3000", "green");
  } catch {
    log("✗ Server is NOT running", "red");
    log("  Please start the server: npm run dev", "yellow");
    return false;
  }

  // Check Node version
  const nodeVersion = process.version;
  log(`✓ Node version: ${nodeVersion}`, "green");

  // Check if Playwright is installed (for E2E tests)
  try {
    await execAsync("npx playwright --version");
    log("✓ Playwright is installed", "green");
  } catch {
    log("⚠ Playwright not installed (E2E tests will fail)", "yellow");
    log("  Install with: npx playwright install", "yellow");
  }

  return true;
}

async function generateSummary(results: Map<string, boolean>) {
  logSection("Test Results Summary");

  let passed = 0;
  let failed = 0;

  results.forEach((success, name) => {
    if (success) {
      log(`✓ ${name}`, "green");
      passed++;
    } else {
      log(`✗ ${name}`, "red");
      failed++;
    }
  });

  log(`\nTotal: ${results.size} test suites`, "cyan");
  log(`Passed: ${passed}`, "green");
  log(`Failed: ${failed}`, failed > 0 ? "red" : "green");

  const successRate = ((passed / results.size) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, failed > 0 ? "yellow" : "green");

  return failed === 0;
}

async function main() {
  // Initialize log file
  const header = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE LOGIN & SECURITY TEST SUITE                    ║
║                                                                            ║
║  Test Run: ${new Date().toISOString()}                    ║
╚════════════════════════════════════════════════════════════════════════════╝
  `.trim();

  writeFileSync(logFile, header + "\n\n");
  log(header, "bright", false);

  log(`\nLog file: ${logFile}`, "cyan");

  // Check prerequisites
  const prereqsOk = await checkPrerequisites();
  if (!prereqsOk) {
    log("\n✗ Prerequisites check failed. Aborting.", "red");
    process.exit(1);
  }

  // Run all test suites
  const results = new Map<string, boolean>();
  const startTime = Date.now();

  for (const suite of testSuites) {
    const success = await runTest(suite);
    results.set(suite.name, success);

    // Exit on critical failure
    if (!success && suite.critical) {
      log(`\n✗ CRITICAL TEST FAILED: ${suite.name}`, "red");
      log("Aborting remaining tests due to critical failure.", "red");

      await generateSummary(results);

      log(`\n✗ TEST SUITE FAILED`, "red");
      log(`Full logs: ${logFile}`, "cyan");

      process.exit(1);
    }
  }

  // Generate final summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const allPassed = await generateSummary(results);

  log(`\nTotal Duration: ${totalDuration}s`, "cyan");
  log(`Full logs: ${logFile}`, "cyan");

  if (allPassed) {
    log(`\n✓ ALL TESTS PASSED!`, "green");
    process.exit(0);
  } else {
    log(`\n✗ SOME TESTS FAILED`, "red");
    process.exit(1);
  }
}

// Handle errors
process.on("unhandledRejection", (error) => {
  log(`\nUnhandled error: ${error}`, "red");
  process.exit(1);
});

main().catch((error) => {
  log(`\nFatal error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
