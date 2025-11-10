#!/usr/bin/env tsx
/**
 * Rate Limiting Verification Script
 *
 * Tests all rate limiting implementations to ensure they are working correctly.
 * Run with: npx tsx scripts/verify-rate-limiting.ts
 */

import { ServerRateLimiter } from "../src/lib/server-rate-limiter";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Server Rate Limiter - Basic Functionality
 */
async function testServerRateLimiterBasic() {
  const testLimiter = new ServerRateLimiter("test-basic", 3, 5000); // 3 requests per 5 seconds
  const identifier = `test-${Date.now()}`;

  try {
    // First request should succeed
    const result1 = await testLimiter.check(identifier);
    if (!result1.success) {
      results.push({
        name: "Server Rate Limiter - First Request",
        passed: false,
        message: "First request should always succeed",
        details: result1,
      });
      return;
    }

    // Second request should succeed
    const result2 = await testLimiter.check(identifier);
    if (!result2.success) {
      results.push({
        name: "Server Rate Limiter - Second Request",
        passed: false,
        message: "Second request should succeed",
        details: result2,
      });
      return;
    }

    // Third request should succeed
    const result3 = await testLimiter.check(identifier);
    if (!result3.success) {
      results.push({
        name: "Server Rate Limiter - Third Request",
        passed: false,
        message: "Third request should succeed",
        details: result3,
      });
      return;
    }

    // Fourth request should fail
    const result4 = await testLimiter.check(identifier);
    if (result4.success) {
      results.push({
        name: "Server Rate Limiter - Rate Limit Enforcement",
        passed: false,
        message: "Fourth request should be rate limited",
        details: result4,
      });
      return;
    }

    // Check rate limit headers
    if (result4.retryAfter === undefined) {
      results.push({
        name: "Server Rate Limiter - Retry-After Header",
        passed: false,
        message: "Rate limited response should include retryAfter",
        details: result4,
      });
      return;
    }

    results.push({
      name: "Server Rate Limiter - Basic Functionality",
      passed: true,
      message: "Rate limiter correctly enforces limits",
      details: {
        limit: result4.limit,
        remaining: result4.remaining,
        retryAfter: result4.retryAfter,
      },
    });
  } catch (error) {
    results.push({
      name: "Server Rate Limiter - Basic Functionality",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Test 2: Server Rate Limiter - Window Expiry
 */
async function testServerRateLimiterExpiry() {
  const testLimiter = new ServerRateLimiter("test-expiry", 2, 2000); // 2 requests per 2 seconds
  const identifier = `test-expiry-${Date.now()}`;

  try {
    // Use up the limit
    await testLimiter.check(identifier);
    await testLimiter.check(identifier);

    // Third request should fail
    const result1 = await testLimiter.check(identifier);
    if (result1.success) {
      results.push({
        name: "Server Rate Limiter - Window Expiry",
        passed: false,
        message: "Third request should be rate limited",
      });
      return;
    }

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 2100));

    // Request should succeed after window expiry
    const result2 = await testLimiter.check(identifier);
    if (!result2.success) {
      results.push({
        name: "Server Rate Limiter - Window Expiry",
        passed: false,
        message: "Request should succeed after window expiry",
        details: result2,
      });
      return;
    }

    results.push({
      name: "Server Rate Limiter - Window Expiry",
      passed: true,
      message: "Rate limit window correctly expires and resets",
    });
  } catch (error) {
    results.push({
      name: "Server Rate Limiter - Window Expiry",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Test 3: Server Rate Limiter - Identifier Isolation
 */
async function testServerRateLimiterIsolation() {
  const testLimiter = new ServerRateLimiter("test-isolation", 2, 5000);
  const identifier1 = `test-iso-1-${Date.now()}`;
  const identifier2 = `test-iso-2-${Date.now()}`;

  try {
    // Use up limit for identifier1
    await testLimiter.check(identifier1);
    await testLimiter.check(identifier1);
    const result1 = await testLimiter.check(identifier1);

    if (result1.success) {
      results.push({
        name: "Server Rate Limiter - Identifier Isolation",
        passed: false,
        message: "First identifier should be rate limited",
      });
      return;
    }

    // identifier2 should still be able to make requests
    const result2 = await testLimiter.check(identifier2);
    if (!result2.success) {
      results.push({
        name: "Server Rate Limiter - Identifier Isolation",
        passed: false,
        message: "Second identifier should not be rate limited",
        details: result2,
      });
      return;
    }

    results.push({
      name: "Server Rate Limiter - Identifier Isolation",
      passed: true,
      message: "Rate limits are correctly isolated per identifier",
    });
  } catch (error) {
    results.push({
      name: "Server Rate Limiter - Identifier Isolation",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Test 4: Pre-configured Limiters
 */
async function testPreconfiguredLimiters() {
  try {
    const { otpVerifyLimiter, otpSendLimiter, loginLimiter, webauthnLimiter } = await import(
      "../src/lib/server-rate-limiter"
    );

    const testId = `test-preconfig-${Date.now()}`;

    // Test each limiter can be called
    const otpResult = await otpVerifyLimiter.check(testId);
    const sendResult = await otpSendLimiter.check(testId);
    const loginResult = await loginLimiter.check(testId);
    const webauthnResult = await webauthnLimiter.check(testId);

    if (
      !otpResult.success ||
      !sendResult.success ||
      !loginResult.success ||
      !webauthnResult.success
    ) {
      results.push({
        name: "Pre-configured Limiters",
        passed: false,
        message: "Pre-configured limiters should allow first request",
      });
      return;
    }

    results.push({
      name: "Pre-configured Limiters",
      passed: true,
      message: "All pre-configured limiters are functional",
      details: {
        otpVerify: { limit: otpResult.limit, remaining: otpResult.remaining },
        otpSend: { limit: sendResult.limit, remaining: sendResult.remaining },
        login: { limit: loginResult.limit, remaining: loginResult.remaining },
        webauthn: { limit: webauthnResult.limit, remaining: webauthnResult.remaining },
      },
    });
  } catch (error) {
    results.push({
      name: "Pre-configured Limiters",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Test 5: Reset Functionality
 */
async function testResetFunctionality() {
  const testLimiter = new ServerRateLimiter("test-reset", 1, 5000);
  const identifier = `test-reset-${Date.now()}`;

  try {
    // Use up the limit
    await testLimiter.check(identifier);
    const result1 = await testLimiter.check(identifier);

    if (result1.success) {
      results.push({
        name: "Rate Limiter - Reset Functionality",
        passed: false,
        message: "Second request should be rate limited",
      });
      return;
    }

    // Reset the limit
    await testLimiter.reset(identifier);

    // Should be able to make request again
    const result2 = await testLimiter.check(identifier);
    if (!result2.success) {
      results.push({
        name: "Rate Limiter - Reset Functionality",
        passed: false,
        message: "Request should succeed after reset",
        details: result2,
      });
      return;
    }

    results.push({
      name: "Rate Limiter - Reset Functionality",
      passed: true,
      message: "Rate limit reset works correctly",
    });
  } catch (error) {
    results.push({
      name: "Rate Limiter - Reset Functionality",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Test 6: Environment Check
 */
async function testEnvironmentSetup() {
  const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!hasRedisUrl || !hasRedisToken) {
    results.push({
      name: "Environment Setup",
      passed: false,
      message: "Upstash Redis credentials not configured - using in-memory fallback",
      details: {
        hasUrl: hasRedisUrl,
        hasToken: hasRedisToken,
        warning: "In-memory rate limiting will not work across multiple server instances",
      },
    });
    return;
  }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    if (!/^https:\/\//i.test(url)) {
      results.push({
        name: "Environment Setup",
        passed: false,
        message: "Upstash Redis URL must start with https://",
      });
      return;
    }

    results.push({
      name: "Environment Setup",
      passed: true,
      message: "Upstash Redis credentials are configured correctly",
    });
  } catch (error) {
    results.push({
      name: "Environment Setup",
      passed: false,
      message: `Error validating environment: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("🚀 Starting Rate Limiting Verification\n");
  console.log("=".repeat(60));

  await testEnvironmentSetup();
  await testServerRateLimiterBasic();
  await testServerRateLimiterExpiry();
  await testServerRateLimiterIsolation();
  await testPreconfiguredLimiters();
  await testResetFunctionality();

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Results:\n");

  let passed = 0;
  let failed = 0;

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log();

    if (result.passed) passed++;
    else failed++;
  });

  console.log("=".repeat(60));
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("❌ Some tests failed. Please review the results above.\n");
    process.exit(1);
  } else {
    console.log("✅ All tests passed! Rate limiting is working correctly.\n");
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
