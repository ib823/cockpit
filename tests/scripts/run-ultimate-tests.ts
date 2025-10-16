#!/usr/bin/env tsx
/**
 * 🚀 ULTIMATE TEST RUNNER - THE WORKS
 *
 * Runs EVERY SINGLE TEST:
 * - All unit/integration tests (Passkey, Admin, Magic Link, Rate Limiting)
 * - All E2E tests (Playwright)
 * - Ultimate security & penetration tests (OWASP Top 10 + more)
 * - Database security & integrity tests
 * - Load/stress tests
 * - Performance tests
 *
 * Exits on first critical failure
 * Outputs to: ultimate-test-results-{timestamp}.log
 *
 * Usage:
 *   npm run test:ultimate
 *   tsx tests/scripts/run-ultimate-tests.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Auto-cleanup old test logs before running
function cleanupOldLogs() {
  const { readdirSync, unlinkSync, existsSync } = require('fs');
  const cwd = process.cwd();

  try {
    const files = readdirSync(cwd);
    const logFiles = files.filter(f =>
      f.startsWith('ultimate-test-results-') && f.endsWith('.log')
    );

    logFiles.forEach(file => {
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
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = join(process.cwd(), `ultimate-test-results-${timestamp}.log`);

function log(message: string, color: keyof typeof colors = 'reset', logToFile = true) {
  const consoleMsg = `${colors[color]}${message}${colors.reset}`;
  console.log(consoleMsg);

  if (logToFile) {
    const fileMsg = `[${new Date().toISOString()}] ${message}\n`;
    appendFileSync(logFile, fileMsg);
  }
}

function logSection(title: string) {
  const border = '═'.repeat(80);
  log(`\n${border}`, 'bright');
  log(`  ${title}`, 'bright');
  log(`${border}`, 'bright');
}

interface TestSuite {
  name: string;
  command: string;
  critical: boolean;
  timeout?: number;
  category: 'unit' | 'security' | 'database' | 'e2e' | 'load';
}

const testSuites: TestSuite[] = [
  // ========================================================================
  // PHASE 1: UNIT & INTEGRATION TESTS
  // ========================================================================
  {
    name: '[UNIT] Passkey Login Tests',
    command: 'npm run test:auth:passkey',
    critical: true,
    timeout: 60000,
    category: 'unit',
  },
  {
    name: '[UNIT] Admin Login Tests',
    command: 'npm run test:auth:admin',
    critical: true,
    timeout: 60000,
    category: 'unit',
  },
  {
    name: '[UNIT] Magic Link Login Tests',
    command: 'npm run test:auth:magic',
    critical: true,
    timeout: 60000,
    category: 'unit',
  },
  {
    name: '[UNIT] Rate Limiting Tests',
    command: 'npm run test:auth:rate-limit',
    critical: true,
    timeout: 60000,
    category: 'unit',
  },

  // ========================================================================
  // PHASE 2: SECURITY & PENETRATION TESTS
  // ========================================================================
  {
    name: '[SECURITY] Ultimate Security Tests (OWASP Top 10)',
    command: 'tsx tests/scripts/ultimate-security-tests.ts',
    critical: true,
    timeout: 180000,
    category: 'security',
  },

  // ========================================================================
  // PHASE 3: DATABASE INTEGRITY TESTS
  // ========================================================================
  {
    name: '[DATABASE] Database Security & Integrity',
    command: 'tsx tests/scripts/database-integrity-tests.ts',
    critical: true,
    timeout: 120000,
    category: 'database',
  },

  // ========================================================================
  // PHASE 4: LOAD & PERFORMANCE TESTS
  // ========================================================================
  {
    name: '[LOAD] Login Endpoint Load Test',
    command: 'tsx tests/scripts/load-test-login.ts 20 30',
    critical: false,
    timeout: 60000,
    category: 'load',
  },

  // ========================================================================
  // PHASE 5: END-TO-END TESTS
  // ========================================================================
  {
    name: '[E2E] Login Flow E2E Tests',
    command: 'npm run test:e2e',
    critical: false,
    timeout: 180000,
    category: 'e2e',
  },
];

async function runTest(suite: TestSuite): Promise<boolean> {
  logSection(`Running: ${suite.name}`);
  log(`Category: ${suite.category.toUpperCase()}`, 'cyan');
  log(`Command: ${suite.command}`, 'cyan');
  log(`Critical: ${suite.critical ? 'YES' : 'NO'}`, suite.critical ? 'red' : 'yellow');

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(suite.command, {
      timeout: suite.timeout || 60000,
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log output
    if (stdout) {
      log('\n--- STDOUT ---', 'dim');
      log(stdout.trim(), 'reset');
    }

    if (stderr && stderr.trim().length > 0) {
      log('\n--- STDERR ---', 'yellow');
      log(stderr.trim(), 'yellow');
    }

    log(`\n✓ PASSED in ${duration}s`, 'green');
    log(`${'─'.repeat(80)}\n`, 'dim');

    return true;
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log(`\n✗ FAILED in ${duration}s`, 'red');
    log(`\nError: ${error.message}`, 'red');

    if (error.stdout) {
      log('\n--- STDOUT ---', 'dim');
      log(error.stdout.trim(), 'reset');
    }

    if (error.stderr) {
      log('\n--- STDERR ---', 'red');
      log(error.stderr.trim(), 'red');
    }

    log(`${'─'.repeat(80)}\n`, 'dim');

    return false;
  }
}

async function checkPrerequisites(): Promise<boolean> {
  logSection('Checking Prerequisites');

  // Check if server is running
  try {
    const response = await fetch('http://localhost:3000/api/health');
    log('✓ Server is running at http://localhost:3000', 'green');
  } catch {
    log('✗ Server is NOT running', 'red');
    log('  Please start the server: npm run dev', 'yellow');
    return false;
  }

  // Check Node version
  const nodeVersion = process.version;
  log(`✓ Node version: ${nodeVersion}`, 'green');

  // Check database connection
  try {
    await execAsync('npx prisma db execute --stdin <<< "SELECT 1"', { timeout: 5000 });
    log('✓ Database is accessible', 'green');
  } catch {
    log('⚠ Database connection issue (some tests may fail)', 'yellow');
  }

  // Check Playwright
  try {
    await execAsync('npx playwright --version');
    log('✓ Playwright is installed', 'green');
  } catch {
    log('⚠ Playwright not installed (E2E tests will fail)', 'yellow');
    log('  Install with: npx playwright install', 'yellow');
  }

  return true;
}

async function generateSummary(results: Map<string, boolean>) {
  logSection('🎯 ULTIMATE TEST RESULTS SUMMARY');

  // Group by category
  const categories = {
    unit: [] as string[],
    security: [] as string[],
    database: [] as string[],
    load: [] as string[],
    e2e: [] as string[],
  };

  testSuites.forEach(suite => {
    const result = results.get(suite.name);
    if (result !== undefined) {
      categories[suite.category].push(`${result ? '✓' : '✗'} ${suite.name}`);
    }
  });

  // Display by category
  log('\n📊 Results by Category:\n', 'bright');

  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      log(`${category.toUpperCase()}:`, 'cyan');
      tests.forEach(test => {
        const color = test.startsWith('✓') ? 'green' : 'red';
        log(`  ${test}`, color);
      });
      log('');
    }
  });

  // Overall stats
  let passed = 0;
  let failed = 0;

  results.forEach((success) => {
    if (success) {
      passed++;
    } else {
      failed++;
    }
  });

  log('═'.repeat(80), 'bright');
  log(`Total Test Suites: ${results.size}`, 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  const successRate = ((passed / results.size) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, failed > 0 ? 'yellow' : 'green');

  return failed === 0;
}

async function main() {
  // Initialize log file
  const header = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                  🚀 ULTIMATE TEST SUITE - THE COMPLETE WORKS 🚀                ║
║                                                                              ║
║  Test Run: ${new Date().toISOString().padEnd(60)}║
║                                                                              ║
║  Testing:                                                                    ║
║    ✓ Unit & Integration Tests                                               ║
║    ✓ OWASP Top 10 Security Tests                                            ║
║    ✓ Database Integrity Tests                                               ║
║    ✓ Load & Performance Tests                                               ║
║    ✓ End-to-End Tests                                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `.trim();

  writeFileSync(logFile, header + '\n\n');
  log(header, 'bright', false);

  log(`\n📝 Log file: ${logFile}`, 'cyan');

  // Check prerequisites
  const prereqsOk = await checkPrerequisites();
  if (!prereqsOk) {
    log('\n✗ Prerequisites check failed. Aborting.', 'red');
    process.exit(1);
  }

  // Run all test suites
  const results = new Map<string, boolean>();
  const startTime = Date.now();

  let criticalFailures = 0;

  for (const suite of testSuites) {
    const success = await runTest(suite);
    results.set(suite.name, success);

    // Exit on critical failure
    if (!success && suite.critical) {
      criticalFailures++;
      log(`\n🚨 CRITICAL TEST FAILED: ${suite.name}`, 'red');
      log('Aborting remaining tests due to critical failure.', 'red');

      await generateSummary(results);

      log(`\n✗ ULTIMATE TEST SUITE FAILED`, 'red');
      log(`Critical failures: ${criticalFailures}`, 'red');
      log(`Full logs: ${logFile}`, 'cyan');

      process.exit(1);
    }
  }

  // Generate final summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const allPassed = await generateSummary(results);

  log(`\nTotal Duration: ${totalDuration}s (${(parseInt(totalDuration) / 60).toFixed(1)} minutes)`, 'cyan');
  log(`Full logs: ${logFile}`, 'cyan');

  if (allPassed) {
    log(`\n╔════════════════════════════════════════════════════════════╗`, 'green');
    log(`║                                                            ║`, 'green');
    log(`║  ✓✓✓ ALL TESTS PASSED - SYSTEM FULLY SECURE! ✓✓✓          ║`, 'green');
    log(`║                                                            ║`, 'green');
    log(`╚════════════════════════════════════════════════════════════╝`, 'green');
    process.exit(0);
  } else {
    log(`\n╔════════════════════════════════════════════════════════════╗`, 'red');
    log(`║                                                            ║`, 'red');
    log(`║  ✗✗✗ SOME TESTS FAILED - REVIEW REQUIRED ✗✗✗              ║`, 'red');
    log(`║                                                            ║`, 'red');
    log(`╚════════════════════════════════════════════════════════════╝`, 'red');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n🚨 Unhandled error: ${error}`, 'red');
  process.exit(1);
});

main().catch((error) => {
  log(`\n🚨 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
