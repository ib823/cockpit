# Complete Login & Security Test Suite - Guide

## 🚀 Quick Start

### Run All Tests (Recommended)

```bash
# Run complete test suite - exits on first critical failure
npm run test:all

# Output: Console + test-results-{timestamp}.log file
```

### Run Individual Test Categories

```bash
# Unit/Integration Tests
npm run test:auth              # All auth tests
npm run test:auth:passkey      # Passkey login only
npm run test:auth:admin        # Admin login only
npm run test:auth:magic        # Magic link only
npm run test:auth:rate-limit   # Rate limiting only

# Security Tests
npm run test:security          # Security & penetration tests

# Load/Performance Tests
npm run test:login:load        # Default: 10 users, 30 sec
npm run test:login:load 50 60  # Custom: 50 users, 60 sec

# E2E Tests (Playwright)
npm run test:e2e              # Headless
npm run test:e2e:headed       # With browser
npm run test:e2e:debug        # Debug mode

# Manual/Interactive
npm run test:login:manual     # Interactive CLI menu
```

---

## 📁 File Structure

```
tests/
├── auth/                                    # Unit/Integration Tests
│   ├── login-passkey.test.ts               # 9 tests
│   ├── login-admin.test.ts                 # 10 tests
│   ├── login-magic.test.ts                 # 11 tests
│   ├── rate-limiting.test.ts               # 10 tests
│   └── helpers/
│       ├── test-setup.ts                   # DB fixtures
│       ├── mock-users.ts                   # Test data
│       └── auth-helpers.ts                 # Utilities
│
├── scripts/
│   ├── run-all-tests.ts                    # ⭐ Master test runner
│   ├── security-tests.ts                   # ⭐ Security/penetration tests
│   ├── test-login-manual.ts               # Interactive CLI
│   └── load-test-login.ts                  # Load/stress tests
│
├── e2e/
│   └── login-flows.spec.ts                 # 12 E2E tests
│
├── README.md                               # Detailed documentation
├── QUICK_START.md                          # Quick reference
└── TEST_SUITE_GUIDE.md                     # This file

docs/
└── SECURITY_RECOMMENDATIONS.md             # ⭐ CAPTCHA alternatives & security
```

---

## ⭐ Master Test Runner (NEW)

### Features

- ✅ **Runs all tests sequentially** in logical order
- ✅ **Exits on first critical failure** (fast fail)
- ✅ **Outputs to log file** for investigation
- ✅ **Prerequisite checks** (server, dependencies)
- ✅ **Comprehensive summary** with pass/fail stats

### Test Execution Order

1. **Passkey Login Tests** (critical)
2. **Admin Login Tests** (critical)
3. **Magic Link Tests** (critical)
4. **Rate Limiting Tests** (critical)
5. **Security & Penetration Tests** (critical)
6. **Load Tests** (non-critical, continues on failure)
7. **E2E Tests** (non-critical, continues on failure)

### Usage

```bash
# Run all tests
npm run test:all

# Output files
ls test-results-*.log

# View latest results
cat test-results-$(ls -t test-results-*.log | head -1)
```

### Example Output

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE LOGIN & SECURITY TEST SUITE                    ║
║                                                                            ║
║  Test Run: 2025-10-10T00:00:00.000Z                                       ║
╚════════════════════════════════════════════════════════════════════════════╝

Log file: test-results-2025-10-10T00-00-00-000Z.log

═══════════════════════════════════════════════════════════════════════════════
  Checking Prerequisites
═══════════════════════════════════════════════════════════════════════════════
✓ Server is running at http://localhost:3000
✓ Node version: v20.0.0
✓ Playwright is installed

═══════════════════════════════════════════════════════════════════════════════
  Running: Passkey Login Tests
═══════════════════════════════════════════════════════════════════════════════
Command: npm run test:auth:passkey

✓ PASSED in 2.45s
────────────────────────────────────────────────────────────────────────────────

[... continues for all tests ...]

═══════════════════════════════════════════════════════════════════════════════
  Test Results Summary
═══════════════════════════════════════════════════════════════════════════════
✓ Passkey Login Tests
✓ Admin Login Tests
✓ Magic Link Login Tests
✓ Rate Limiting Tests
✓ Security & Penetration Tests
✓ Load Test - Login Endpoint
✓ E2E Login Flow Tests

Total: 7 test suites
Passed: 7
Failed: 0
Success Rate: 100.0%

Total Duration: 45.32s
Full logs: test-results-2025-10-10T00-00-00-000Z.log

✓ ALL TESTS PASSED!
```

---

## 🔒 Security & Penetration Tests (NEW)

### Test Coverage

10 security tests covering common vulnerabilities:

1. **SQL Injection Protection** (CRITICAL)
   - Tests: `admin'--`, `' OR '1'='1`, `'; DROP TABLE`
   - Verifies: Payloads properly rejected

2. **XSS Protection** (HIGH)
   - Tests: `<script>`, `<img onerror>`, `javascript:`
   - Verifies: Payloads sanitized, not reflected

3. **CSRF Protection** (HIGH)
   - Tests: Cross-origin requests
   - Verifies: CORS/origin validation

4. **Rate Limit Bypass** (MEDIUM)
   - Tests: IP spoofing, header manipulation
   - Verifies: Cannot bypass with tricks

5. **Timing Attack Protection** (LOW)
   - Tests: User enumeration via response timing
   - Verifies: Consistent response times

6. **Header Injection** (HIGH)
   - Tests: CRLF injection, header poisoning
   - Verifies: Headers not injectable

7. **NoSQL Injection** (CRITICAL)
   - Tests: `{$ne: null}`, `{$regex: '.*'}`
   - Verifies: Query operators blocked

8. **Brute Force Protection** (HIGH)
   - Tests: Rapid login attempts
   - Verifies: Blocked after 20 attempts

9. **Security Headers** (MEDIUM)
   - Tests: CSP, X-Frame-Options, etc.
   - Verifies: All headers present

10. **Privilege Escalation** (CRITICAL)
    - Tests: Regular user → admin access
    - Verifies: Role enforcement

### Usage

```bash
npm run test:security
```

### Example Output

```
╔════════════════════════════════════════════════════════════════╗
║        SECURITY & PENETRATION TESTING SUITE                   ║
╚════════════════════════════════════════════════════════════════╝

Running security tests...

Testing: SQL Injection...
✓ SQL injection payloads properly rejected

Testing: XSS Protection...
✓ XSS payloads properly sanitized

Testing: CSRF Protection...
✓ CSRF protection active

[... continues ...]

═══════════════════════════════════════════════════════════════════
SECURITY TEST SUMMARY
═══════════════════════════════════════════════════════════════════

Total Tests: 10
Passed: 10
Failed: 0

✓ ALL SECURITY TESTS PASSED
```

If vulnerabilities are found:

```
🚨 CRITICAL Vulnerabilities: 1
  - SQL Injection Protection: SQL injection payload may have been executed
    Payload: admin'--, Status: 500

⚠️  HIGH Vulnerabilities: 2
  - XSS Protection: XSS payload reflected without sanitization
  - Brute Force Protection: Brute force not blocked after 20+ attempts

✗ SECURITY ISSUES FOUND
```

---

## 🛡️ Bot Protection & CAPTCHA Recommendations

See [docs/SECURITY_RECOMMENDATIONS.md](../docs/SECURITY_RECOMMENDATIONS.md) for:

### Recommended Solutions

1. **Cloudflare Turnstile** (BEST)
   - ✅ Invisible/minimal friction
   - ✅ Privacy-focused
   - ✅ FREE (1M/month)
   - ✅ Better UX than reCAPTCHA

2. **Honeypot Fields** (FREE)
   - ✅ Simple implementation
   - ✅ No user friction
   - ✅ Catches basic bots

3. **TOTP/MFA** (FREE)
   - ✅ Extra security layer
   - ✅ Industry standard
   - ✅ For admins

4. **Device Fingerprinting** (Advanced)
   - Trust scores
   - Behavioral analysis
   - FingerprintJS Pro ($200/mo)

### Quick Implementation

```bash
# Cloudflare Turnstile (RECOMMENDED)
# 1. Get keys: https://dash.cloudflare.com/turnstile
# 2. Add to .env:
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-key
TURNSTILE_SECRET_KEY=your-secret

# 3. See docs for code examples
```

### Cost Comparison

| Solution             | Cost    | UX         | Security   |
| -------------------- | ------- | ---------- | ---------- |
| Cloudflare Turnstile | FREE    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |
| Honeypot             | FREE    | ⭐⭐⭐⭐⭐ | ⭐⭐       |
| TOTP/MFA             | FREE    | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| FingerprintJS        | $200/mo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |

**Recommendation: Start with Cloudflare Turnstile (FREE) + Honeypot (FREE)**

---

## 📊 Test Coverage Summary

### Total Test Count: 60+ tests

| Category           | Tests | Files | Status         |
| ------------------ | ----- | ----- | -------------- |
| **Passkey Login**  | 9     | 1     | ✅ Passing     |
| **Admin Login**    | 10    | 1     | ✅ Passing     |
| **Magic Link**     | 11    | 1     | ✅ Passing     |
| **Rate Limiting**  | 10    | 1     | ✅ Passing     |
| **Security Tests** | 10    | 1     | ✅ NEW         |
| **E2E Tests**      | 12    | 1     | ✅ Passing     |
| **Load Tests**     | 2     | 1     | ✅ Passing     |
| **Manual CLI**     | 6     | 1     | ✅ Interactive |

### Security Coverage

- ✅ Authentication (Passkey, Admin, Magic Link)
- ✅ Authorization (Role-based access)
- ✅ Rate Limiting (Login: 20/5min, API: 60/min)
- ✅ SQL/NoSQL Injection Prevention
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Security Headers
- ✅ Session Management
- ✅ Brute Force Protection
- ✅ Audit Logging

---

## 🔧 Troubleshooting

### Server Not Running

```
✗ Server is NOT running
  Please start the server: npm run dev
```

**Solution:**

```bash
# Terminal 1
npm run dev

# Terminal 2 (after server starts)
npm run test:all
```

### Playwright Not Installed

```
⚠ Playwright not installed (E2E tests will fail)
  Install with: npx playwright install
```

**Solution:**

```bash
npx playwright install --with-deps
```

### Rate Limit Blocking Tests

If tests are getting rate limited:

1. **Wait 5 minutes** for login limits to reset
2. **Restart dev server** to clear in-memory limits
3. **Change user-agent** in tests (already implemented with random IDs)

### Database Connection Failed

```
Can't reach database server at localhost:5432
```

**Solution:**

```bash
# Start PostgreSQL
# Check DATABASE_URL in .env
npx prisma migrate dev
```

### Test Output Too Verbose

Redirect stderr to file:

```bash
npm run test:all 2>errors.log
```

View only summary:

```bash
npm run test:all | grep -E "(✓|✗|Summary)"
```

---

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Complete Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Start dev server
        run: npm run dev &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run all tests
        run: npm run test:all

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results-*.log
```

---

## 🚦 Status & Next Steps

### ✅ Completed

- [x] 40 unit/integration tests
- [x] 12 E2E tests
- [x] 10 security/penetration tests
- [x] Load testing scripts
- [x] Manual interactive testing
- [x] Master test runner
- [x] Log file output
- [x] Exit on critical failure
- [x] Comprehensive documentation
- [x] CAPTCHA/bot protection recommendations

### 🎯 Recommended Next Steps

1. **Run full test suite**

   ```bash
   npm run test:all
   ```

2. **Review test results**

   ```bash
   cat test-results-$(ls -t test-results-*.log | head -1)
   ```

3. **Implement bot protection**
   - Add Cloudflare Turnstile (see docs/SECURITY_RECOMMENDATIONS.md)
   - Add honeypot fields (1 hour)
   - Add TOTP for admins (4 hours)

4. **Set up CI/CD**
   - Add GitHub Actions workflow
   - Run tests on every PR
   - Fail builds on security issues

5. **Monitor in production**
   - Review audit logs regularly
   - Track rate limit violations
   - Monitor failed login attempts

---

## 📚 Documentation Links

- [Full Test Documentation](./README.md)
- [Quick Start Guide](./QUICK_START.md)
- [Security Recommendations](../docs/SECURITY_RECOMMENDATIONS.md)
- [Test Suite Guide](./TEST_SUITE_GUIDE.md) (this file)

---

## 🎉 Summary

**You now have:**

✅ **60+ comprehensive tests** covering all login scenarios
✅ **Security testing** for 10 common vulnerabilities
✅ **Master test runner** with logging and exit-on-failure
✅ **CAPTCHA alternatives** with implementation guides
✅ **Complete documentation** for all test categories

**Run everything:**

```bash
npm run test:all
```

**All tests output to:** `test-results-{timestamp}.log`

**Total cost for excellent security:** **$0/month** 🎉
