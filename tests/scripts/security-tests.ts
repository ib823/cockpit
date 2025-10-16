#!/usr/bin/env tsx
/**
 * Security & Penetration Testing Suite for Login System
 *
 * Tests for common security vulnerabilities:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - CSRF (Cross-Site Request Forgery)
 * - Rate Limiting Bypass
 * - Session Hijacking
 * - Timing Attacks
 * - Brute Force Protection
 * - Header Injection
 * - Authentication Bypass
 *
 * Usage:
 *   tsx tests/scripts/security-tests.ts
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface SecurityTestResult {
  name: string;
  passed: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details?: string;
}

const BASE_URL = 'http://localhost:3000';
const results: SecurityTestResult[] = [];

/**
 * Test 1: SQL Injection in Email Field
 */
async function testSqlInjection(): Promise<SecurityTestResult> {
  const sqlPayloads = [
    "admin'--",
    "admin' OR '1'='1",
    "'; DROP TABLE users; --",
    "admin' OR 1=1--",
    "' UNION SELECT * FROM users--",
  ];

  for (const payload of sqlPayloads) {
    const response = await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload }),
    });

    const data = await response.json();

    // Should return 400 (validation error) or 404 (not found), NOT 200 or 500
    if (response.status === 500 || (response.status === 200 && data.ok)) {
      return {
        name: 'SQL Injection Protection',
        passed: false,
        severity: 'CRITICAL',
        description: 'SQL injection payload may have been executed',
        details: `Payload: ${payload}, Status: ${response.status}`,
      };
    }
  }

  return {
    name: 'SQL Injection Protection',
    passed: true,
    severity: 'CRITICAL',
    description: 'SQL injection payloads properly rejected',
  };
}

/**
 * Test 2: XSS in Email and Input Fields
 */
async function testXSS(): Promise<SecurityTestResult> {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
  ];

  for (const payload of xssPayloads) {
    const response = await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload }),
    });

    const data = await response.json();

    // Check if response contains unsanitized payload
    const responseText = JSON.stringify(data);
    if (responseText.includes('<script>') || responseText.includes('onerror=')) {
      return {
        name: 'XSS Protection',
        passed: false,
        severity: 'HIGH',
        description: 'XSS payload reflected without sanitization',
        details: `Payload: ${payload}`,
      };
    }
  }

  return {
    name: 'XSS Protection',
    passed: true,
    severity: 'HIGH',
    description: 'XSS payloads properly sanitized',
  };
}

/**
 * Test 3: CSRF Token Validation
 */
async function testCSRF(): Promise<SecurityTestResult> {
  // Try to login without proper origin/referer
  const response = await fetch(`${BASE_URL}/api/auth/begin-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://evil.com',
      'Referer': 'https://evil.com/attack',
    },
    body: JSON.stringify({ email: 'test@example.com' }),
  });

  // Should be blocked by CORS or CSRF protection
  if (response.status === 200 && response.headers.get('access-control-allow-origin') === 'https://evil.com') {
    return {
      name: 'CSRF Protection',
      passed: false,
      severity: 'HIGH',
      description: 'CSRF attack possible - no origin validation',
    };
  }

  return {
    name: 'CSRF Protection',
    passed: true,
    severity: 'HIGH',
    description: 'CSRF protection active',
  };
}

/**
 * Test 4: Rate Limiting Bypass Attempts
 */
async function testRateLimitBypass(): Promise<SecurityTestResult> {
  const userAgent1 = `security-test-${Date.now()}`;

  // Try to bypass with different techniques
  const bypassAttempts = [
    { headers: { 'X-Forwarded-For': '127.0.0.1, 192.168.1.100' } }, // IP spoofing
    { headers: { 'X-Real-IP': '1.2.3.4' } }, // IP header manipulation
    { headers: { 'User-Agent': userAgent1.toUpperCase() } }, // Case variation
    { headers: { 'X-Originating-IP': '8.8.8.8' } }, // Alternative IP header
  ];

  // First exhaust rate limit
  for (let i = 0; i < 21; i++) {
    await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent1,
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  }

  // Try bypass techniques
  for (const attempt of bypassAttempts) {
    const response = await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent1,
        ...attempt.headers,
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    // Should still be rate limited
    if (response.status !== 429) {
      return {
        name: 'Rate Limit Bypass Protection',
        passed: false,
        severity: 'MEDIUM',
        description: 'Rate limiting bypassed with header manipulation',
        details: `Bypass headers: ${JSON.stringify(attempt.headers)}`,
      };
    }
  }

  return {
    name: 'Rate Limit Bypass Protection',
    passed: true,
    severity: 'MEDIUM',
    description: 'Rate limiting cannot be bypassed',
  };
}

/**
 * Test 5: Timing Attack on User Enumeration
 */
async function testTimingAttack(): Promise<SecurityTestResult> {
  const validEmail = 'existing@example.com';
  const invalidEmail = 'nonexistent@example.com';

  const timings: number[] = [];

  // Measure timing for valid email
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validEmail }),
    });
    timings.push(Date.now() - start);
  }

  const avgValidTime = timings.reduce((a, b) => a + b, 0) / timings.length;

  // Measure timing for invalid email
  timings.length = 0;
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invalidEmail }),
    });
    timings.push(Date.now() - start);
  }

  const avgInvalidTime = timings.reduce((a, b) => a + b, 0) / timings.length;

  // Timing difference > 100ms could allow user enumeration
  const timingDiff = Math.abs(avgValidTime - avgInvalidTime);

  if (timingDiff > 100) {
    return {
      name: 'Timing Attack Protection',
      passed: false,
      severity: 'LOW',
      description: 'Timing difference allows user enumeration',
      details: `Valid: ${avgValidTime.toFixed(0)}ms, Invalid: ${avgInvalidTime.toFixed(0)}ms, Diff: ${timingDiff.toFixed(0)}ms`,
    };
  }

  return {
    name: 'Timing Attack Protection',
    passed: true,
    severity: 'LOW',
    description: 'Timing attack not possible',
    details: `Timing difference: ${timingDiff.toFixed(0)}ms`,
  };
}

/**
 * Test 6: HTTP Header Injection
 */
async function testHeaderInjection(): Promise<SecurityTestResult> {
  const injectionPayloads = [
    'test@example.com\r\nX-Injected: true',
    'test@example.com\nSet-Cookie: session=hijacked',
    'test@example.com%0d%0aX-Injected: true',
  ];

  for (const payload of injectionPayloads) {
    const response = await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload }),
    });

    // Check if injected headers appear in response
    if (response.headers.get('X-Injected') || response.headers.get('Set-Cookie')?.includes('hijacked')) {
      return {
        name: 'Header Injection Protection',
        passed: false,
        severity: 'HIGH',
        description: 'HTTP header injection successful',
        details: `Payload: ${payload}`,
      };
    }
  }

  return {
    name: 'Header Injection Protection',
    passed: true,
    severity: 'HIGH',
    description: 'Header injection properly blocked',
  };
}

/**
 * Test 7: NoSQL Injection
 */
async function testNoSqlInjection(): Promise<SecurityTestResult> {
  const noSqlPayloads = [
    { email: { $ne: null } },
    { email: { $gt: '' } },
    { email: { $regex: '.*' } },
  ];

  for (const payload of noSqlPayloads) {
    const response = await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Should return 400 (validation error), not 200
    if (response.status === 200) {
      const data = await response.json();
      if (data.ok) {
        return {
          name: 'NoSQL Injection Protection',
          passed: false,
          severity: 'CRITICAL',
          description: 'NoSQL injection successful',
          details: `Payload: ${JSON.stringify(payload)}`,
        };
      }
    }
  }

  return {
    name: 'NoSQL Injection Protection',
    passed: true,
    severity: 'CRITICAL',
    description: 'NoSQL injection properly blocked',
  };
}

/**
 * Test 8: Brute Force Protection
 */
async function testBruteForce(): Promise<SecurityTestResult> {
  const userAgent = `brute-force-test-${Date.now()}`;
  let blockedAt = -1;

  // Attempt brute force
  for (let i = 0; i < 25; i++) {
    const response = await fetch(`${BASE_URL}/api/auth/begin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({ email: `test${i}@example.com` }),
    });

    if (response.status === 429) {
      blockedAt = i;
      break;
    }
  }

  if (blockedAt === -1 || blockedAt > 20) {
    return {
      name: 'Brute Force Protection',
      passed: false,
      severity: 'HIGH',
      description: 'Brute force not blocked after 20+ attempts',
      details: `Blocked at: ${blockedAt === -1 ? 'Never' : blockedAt}`,
    };
  }

  return {
    name: 'Brute Force Protection',
    passed: true,
    severity: 'HIGH',
    description: `Brute force blocked after ${blockedAt} attempts`,
  };
}

/**
 * Test 9: Security Headers Check
 */
async function testSecurityHeaders(): Promise<SecurityTestResult> {
  const response = await fetch(`${BASE_URL}/login`);

  const requiredHeaders = {
    'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
    'X-Content-Type-Options': ['nosniff'],
    'Content-Security-Policy': ['default-src'],
    'Referrer-Policy': ['strict-origin', 'no-referrer'],
  };

  const missing: string[] = [];

  for (const [header, expectedValues] of Object.entries(requiredHeaders)) {
    const value = response.headers.get(header);
    if (!value || !expectedValues.some(exp => value.includes(exp))) {
      missing.push(header);
    }
  }

  if (missing.length > 0) {
    return {
      name: 'Security Headers',
      passed: false,
      severity: 'MEDIUM',
      description: 'Missing or incorrect security headers',
      details: `Missing: ${missing.join(', ')}`,
    };
  }

  return {
    name: 'Security Headers',
    passed: true,
    severity: 'MEDIUM',
    description: 'All security headers present',
  };
}

/**
 * Test 10: Admin Privilege Escalation
 */
async function testPrivilegeEscalation(): Promise<SecurityTestResult> {
  // Try to login as admin with regular user credentials
  const response = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'regular@example.com', code: '000000' }),
  });

  const data = await response.json();

  // Should be rejected (401)
  if (response.status === 200 && data.ok) {
    return {
      name: 'Privilege Escalation Protection',
      passed: false,
      severity: 'CRITICAL',
      description: 'Regular user able to access admin endpoint',
    };
  }

  return {
    name: 'Privilege Escalation Protection',
    passed: true,
    severity: 'CRITICAL',
    description: 'Admin endpoint properly protected',
  };
}

/**
 * Main Test Runner
 */
async function runSecurityTests() {
  log('╔════════════════════════════════════════════════════════════════╗', 'bright');
  log('║        SECURITY & PENETRATION TESTING SUITE                   ║', 'bright');
  log('╚════════════════════════════════════════════════════════════════╝', 'bright');

  log('\nRunning security tests...\n', 'cyan');

  const tests = [
    { name: 'SQL Injection', fn: testSqlInjection },
    { name: 'XSS Protection', fn: testXSS },
    { name: 'CSRF Protection', fn: testCSRF },
    { name: 'Rate Limit Bypass', fn: testRateLimitBypass },
    { name: 'Timing Attack', fn: testTimingAttack },
    { name: 'Header Injection', fn: testHeaderInjection },
    { name: 'NoSQL Injection', fn: testNoSqlInjection },
    { name: 'Brute Force', fn: testBruteForce },
    { name: 'Security Headers', fn: testSecurityHeaders },
    { name: 'Privilege Escalation', fn: testPrivilegeEscalation },
  ];

  for (const test of tests) {
    log(`Testing: ${test.name}...`, 'cyan');
    try {
      const result = await test.fn();
      results.push(result);

      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? 'green' : 'red';
      log(`${icon} ${result.description}`, color);

      if (result.details) {
        log(`  ${result.details}`, 'yellow');
      }
    } catch (error: any) {
      log(`✗ Test failed: ${error.message}`, 'red');
      results.push({
        name: test.name,
        passed: false,
        severity: 'HIGH',
        description: `Test execution failed: ${error.message}`,
      });
    }
    log(''); // Blank line
  }

  // Summary
  log('═'.repeat(70), 'bright');
  log('SECURITY TEST SUMMARY', 'bright');
  log('═'.repeat(70), 'bright');

  const critical = results.filter(r => !r.passed && r.severity === 'CRITICAL');
  const high = results.filter(r => !r.passed && r.severity === 'HIGH');
  const medium = results.filter(r => !r.passed && r.severity === 'MEDIUM');
  const low = results.filter(r => !r.passed && r.severity === 'LOW');
  const passed = results.filter(r => r.passed);

  log(`\nTotal Tests: ${results.length}`, 'cyan');
  log(`Passed: ${passed.length}`, 'green');
  log(`Failed: ${results.length - passed.length}`, results.length > passed.length ? 'red' : 'green');

  if (critical.length > 0) {
    log(`\n🚨 CRITICAL Vulnerabilities: ${critical.length}`, 'red');
    critical.forEach(r => log(`  - ${r.name}: ${r.description}`, 'red'));
  }

  if (high.length > 0) {
    log(`\n⚠️  HIGH Vulnerabilities: ${high.length}`, 'red');
    high.forEach(r => log(`  - ${r.name}: ${r.description}`, 'red'));
  }

  if (medium.length > 0) {
    log(`\n⚠️  MEDIUM Vulnerabilities: ${medium.length}`, 'yellow');
    medium.forEach(r => log(`  - ${r.name}: ${r.description}`, 'yellow'));
  }

  if (low.length > 0) {
    log(`\nℹ️  LOW Vulnerabilities: ${low.length}`, 'yellow');
    low.forEach(r => log(`  - ${r.name}: ${r.description}`, 'yellow'));
  }

  if (results.length === passed.length) {
    log(`\n✓ ALL SECURITY TESTS PASSED`, 'green');
    process.exit(0);
  } else {
    log(`\n✗ SECURITY ISSUES FOUND`, 'red');
    process.exit(1);
  }
}

// Run tests
runSecurityTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
