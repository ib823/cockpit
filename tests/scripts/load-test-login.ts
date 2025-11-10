#!/usr/bin/env tsx
/**
 * Load Test Script for Login Endpoints
 * Stress test rate limiting and concurrent authentication requests
 *
 * Usage:
 *   tsx tests/scripts/load-test-login.ts [concurrency] [duration]
 *
 * Examples:
 *   tsx tests/scripts/load-test-login.ts 10 30    # 10 concurrent users for 30 seconds
 *   tsx tests/scripts/load-test-login.ts 50 60    # 50 concurrent users for 60 seconds
 */

const consoleColors = {
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

function logWithColor(message: string, color: keyof typeof consoleColors = "reset") {
  console.log(`${consoleColors[color]}${message}${consoleColors.reset}`);
}

interface LoadTestStats {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  errorRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  responseTimes: number[];
  statusCodes: Map<number, number>;
}

interface LoadTestConfig {
  concurrency: number;
  duration: number; // in seconds
  endpoint: string;
  method: string;
  body?: any;
}

/**
 * Simulate a single user making requests
 */
async function simulateUser(
  userId: number,
  config: LoadTestConfig,
  stats: LoadTestStats,
  stopSignal: { stop: boolean }
) {
  const userAgent = `load-test-user-${userId}-${Date.now()}`;
  const startTime = Date.now();

  while (!stopSignal.stop) {
    const requestStart = Date.now();

    try {
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      const responseTime = Date.now() - requestStart;

      stats.totalRequests++;
      stats.responseTimes.push(responseTime);

      const currentCount = stats.statusCodes.get(response.status) || 0;
      stats.statusCodes.set(response.status, currentCount + 1);

      if (response.status === 429) {
        stats.rateLimitedRequests++;
      } else if (response.ok) {
        stats.successfulRequests++;
      } else {
        stats.errorRequests++;
      }

      // Small delay between requests (100-300ms)
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));
    } catch (error: any) {
      stats.errorRequests++;
      stats.totalRequests++;
    }
  }
}

/**
 * Run load test
 */
async function runLoadTest(config: LoadTestConfig): Promise<LoadTestStats> {
  const stats: LoadTestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    rateLimitedRequests: 0,
    errorRequests: 0,
    avgResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    responseTimes: [],
    statusCodes: new Map(),
  };

  const stopSignal = { stop: false };

  log(`\nStarting load test...`, "bright");
  log(`Concurrency: ${config.concurrency} users`, "cyan");
  log(`Duration: ${config.duration}s`, "cyan");
  log(`Endpoint: ${config.endpoint}`, "cyan");
  log(`Method: ${config.method}`, "cyan");
  console.log("");

  // Start timer
  const startTime = Date.now();
  setTimeout(() => {
    stopSignal.stop = true;
  }, config.duration * 1000);

  // Launch concurrent users
  const users = [];
  for (let i = 0; i < config.concurrency; i++) {
    users.push(simulateUser(i, config, stats, stopSignal));
  }

  // Show progress
  const progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const rps = (stats.totalRequests / elapsed).toFixed(2);

    process.stdout.write(
      `\r${consoleColors.cyan}Progress: ${elapsed}/${config.duration}s | ` +
        `Requests: ${stats.totalRequests} | ` +
        `RPS: ${rps} | ` +
        `Success: ${stats.successfulRequests} | ` +
        `Rate Limited: ${stats.rateLimitedRequests}${consoleColors.reset}`
    );
  }, 1000);

  // Wait for all users to complete
  await Promise.all(users);
  clearInterval(progressInterval);
  console.log("\n");

  // Calculate statistics
  if (stats.responseTimes.length > 0) {
    stats.avgResponseTime =
      stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
    stats.minResponseTime = Math.min(...stats.responseTimes);
    stats.maxResponseTime = Math.max(...stats.responseTimes);
  }

  return stats;
}

/**
 * Display results
 */
function displayResults(stats: LoadTestStats, duration: number) {
  log("=".repeat(70), "bright");
  log("LOAD TEST RESULTS", "bright");
  log("=".repeat(70), "bright");
  console.log("");

  const rps = (stats.totalRequests / duration).toFixed(2);
  const successRate = ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2);
  const rateLimitRate = ((stats.rateLimitedRequests / stats.totalRequests) * 100).toFixed(2);

  log(`Total Requests:      ${stats.totalRequests}`, "cyan");
  log(`Successful:          ${stats.successfulRequests} (${successRate}%)`, "green");
  log(`Rate Limited:        ${stats.rateLimitedRequests} (${rateLimitRate}%)`, "yellow");
  log(`Errors:              ${stats.errorRequests}`, "red");
  log(`Requests/second:     ${rps}`, "cyan");
  console.log("");

  log("Response Times:", "bright");
  log(`  Average:  ${stats.avgResponseTime.toFixed(2)}ms`, "cyan");
  log(`  Min:      ${stats.minResponseTime.toFixed(2)}ms`, "green");
  log(`  Max:      ${stats.maxResponseTime.toFixed(2)}ms`, "red");
  console.log("");

  log("Status Code Distribution:", "bright");
  const sortedCodes = Array.from(stats.statusCodes.entries()).sort((a, b) => b[1] - a[1]);
  sortedCodes.forEach(([code, count]) => {
    const percentage = ((count / stats.totalRequests) * 100).toFixed(2);
    const color = code === 200 ? "green" : code === 429 ? "yellow" : "red";
    log(`  ${code}: ${count} (${percentage}%)`, color);
  });
  console.log("");

  // Percentile calculations
  if (stats.responseTimes.length > 0) {
    const sorted = stats.responseTimes.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    log("Response Time Percentiles:", "bright");
    log(`  50th (median):  ${p50.toFixed(2)}ms`, "cyan");
    log(`  90th:           ${p90.toFixed(2)}ms`, "cyan");
    log(`  95th:           ${p95.toFixed(2)}ms`, "yellow");
    log(`  99th:           ${p99.toFixed(2)}ms`, "red");
  }

  console.log("");
  log("=".repeat(70), "bright");
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const concurrency = parseInt(args[0]) || 10;
  const duration = parseInt(args[1]) || 30;

  // Check if server is running
  try {
    await fetch("http://localhost:3000/api/health");
  } catch {
    log("Error: Server is not running at http://localhost:3000", "red");
    log("Please start the development server: npm run dev", "yellow");
    process.exit(1);
  }

  log("╔════════════════════════════════════════╗", "bright");
  log("║   LOGIN ENDPOINT LOAD TEST             ║", "bright");
  log("╚════════════════════════════════════════╝", "bright");
  console.log("");

  // Test 1: Login endpoint (POST)
  logWithColor("Test 1: Login Endpoint Rate Limiting", "bright");
  logWithColor("-".repeat(70), "dim");

  const loginConfig: LoadTestConfig = {
    concurrency,
    duration,
    endpoint: "http://localhost:3000/api/auth/begin-login",
    method: "POST",
    body: { email: `test-${Date.now()}@example.com` },
  };

  const loginStats = await runLoadTest(loginConfig);
  displayResults(loginStats, duration);

  // Test 2: General API endpoint (GET)
  log("\nTest 2: General API Rate Limiting", "bright");
  log("-".repeat(70), "dim");

  const apiConfig: LoadTestConfig = {
    concurrency,
    duration,
    endpoint: "http://localhost:3000/api/projects",
    method: "GET",
  };

  const apiStats = await runLoadTest(apiConfig);
  displayResults(apiStats, duration);

  // Analysis
  console.log("");
  log("╔════════════════════════════════════════╗", "bright");
  log("║   ANALYSIS & RECOMMENDATIONS           ║", "bright");
  log("╚════════════════════════════════════════╝", "bright");
  console.log("");

  if (loginStats.rateLimitedRequests > 0) {
    log("✓ Login rate limiting is active", "green");
    const avgPerUser = loginStats.rateLimitedRequests / concurrency;
    log(`  Average blocks per user: ${avgPerUser.toFixed(2)}`, "cyan");
  } else {
    log("⚠ No rate limiting detected on login endpoint", "yellow");
    log("  Consider reviewing rate limit configuration", "yellow");
  }

  if (apiStats.rateLimitedRequests > 0) {
    log("✓ API rate limiting is active", "green");
    const avgPerUser = apiStats.rateLimitedRequests / concurrency;
    log(`  Average blocks per user: ${avgPerUser.toFixed(2)}`, "cyan");
  } else {
    log("⚠ No rate limiting detected on API endpoints", "yellow");
  }

  console.log("");

  // Performance recommendations
  if (loginStats.avgResponseTime > 1000) {
    log("⚠ Login endpoint average response time is high (>1s)", "yellow");
    log("  Consider optimizing authentication flow", "yellow");
  }

  if (apiStats.avgResponseTime > 500) {
    log("⚠ API endpoint average response time is high (>500ms)", "yellow");
    log("  Consider adding caching or optimizing queries", "yellow");
  }

  console.log("");
  log("Load test complete!", "green");
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`, "red");
  process.exit(1);
});
