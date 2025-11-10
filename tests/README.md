# Authentication Test Suite

Comprehensive test suite for all authentication flows and rate limiting.

## 📁 Directory Structure

```
tests/
├── auth/
│   ├── login-passkey.test.ts        # Passkey login tests
│   ├── login-admin.test.ts          # Admin code login tests
│   ├── login-magic.test.ts          # Magic link login tests
│   ├── rate-limiting.test.ts        # Rate limit tests
│   └── helpers/
│       ├── test-setup.ts            # Database fixtures
│       ├── mock-users.ts            # User test data
│       └── auth-helpers.ts          # Helper functions
├── scripts/
│   ├── test-login-manual.ts        # Interactive CLI testing
│   └── load-test-login.ts          # Load/stress testing
├── e2e/
│   └── login-flows.spec.ts          # Playwright E2E tests
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# For E2E tests, install Playwright
npm install -D @playwright/test
npx playwright install
```

### Running Tests

```bash
# 1. Unit/Integration Tests (Vitest)
npm test tests/auth/

# Run specific test file
npm test tests/auth/login-passkey.test.ts

# 2. Manual Interactive CLI Testing
npm run test:login:manual
# or
tsx tests/scripts/test-login-manual.ts

# 3. Load/Stress Testing
npm run test:login:load
# or
tsx tests/scripts/load-test-login.ts 10 30  # 10 users, 30 seconds

# 4. E2E Tests (Playwright)
npx playwright test tests/e2e/login-flows.spec.ts

# Run E2E in headed mode (see browser)
npx playwright test tests/e2e/login-flows.spec.ts --headed

# Run E2E in debug mode
npx playwright test tests/e2e/login-flows.spec.ts --debug
```

## 📋 Test Coverage

### ✅ Passkey Login (`login-passkey.test.ts`)

**Success Scenarios:**

- ✓ User with valid passkey logs in
- ✓ Authentication challenge generated
- ✓ Session created on successful verification

**Failure Scenarios:**

- ✗ User email not found
- ✗ User has no passkey registered
- ✗ User has no approval code
- ✗ User access has expired
- ✗ Challenge expired before completion
- ✗ Passkey verification failed
- ✗ Missing required fields

**Tested Endpoints:**

- `POST /api/auth/begin-login`
- `POST /api/auth/finish-login`

### ✅ Admin Login (`login-admin.test.ts`)

**Success Scenarios:**

- ✓ Admin with valid code logs in
- ✓ Audit event created
- ✓ Code marked as used

**Failure Scenarios:**

- ✗ Invalid code provided
- ✗ Expired code
- ✗ Already used code
- ✗ Non-admin user attempts admin login
- ✗ User not found
- ✗ Expired admin access
- ✗ Missing required fields

**Tested Endpoints:**

- `POST /api/auth/admin-login`

### ✅ Magic Link Login (`login-magic.test.ts`)

**Success Scenarios:**

- ✓ User with passkey gets auth challenge
- ✓ User without passkey gets registration challenge
- ✓ Token marked as used
- ✓ Device info stored

**Failure Scenarios:**

- ✗ Invalid token
- ✗ Expired token (2 min expiry)
- ✗ Already used token
- ✗ User not found
- ✗ Expired user access
- ✗ Missing required fields

**Tested Endpoints:**

- `POST /api/auth/magic-login`

### ✅ Rate Limiting (`rate-limiting.test.ts`)

**Tests:**

- ✓ Login endpoints: 20 attempts per 5 minutes
- ✓ API endpoints: 60 requests per minute
- ✓ GET requests to /login not rate limited
- ✓ Separate limits per IP/user-agent
- ✓ Rate limit headers present
- ✓ Retry-After header when blocked
- ✓ Static assets exempted

## 🔧 Manual CLI Testing

The interactive CLI test script (`test-login-manual.ts`) provides an easy way to test scenarios manually.

### Features:

- Interactive menu system
- Real-time feedback with colors
- Automatic test user creation/cleanup
- Rate limit testing
- All scenarios covered

### Usage:

```bash
npm run test:login:manual
```

**Menu:**

```
1. Regular User Login (Passkey)
2. User Not Found
3. Admin Login
4. Expired Access
5. Rate Limiting
a. Run all tests
q. Quit
```

### Example Output:

```
✓ Created user: test-user-1234@example.com
✓ begin-login: User found, passkey challenge generated
ℹ Challenge present: true
ℹ Cleanup completed
```

## 📊 Load Testing

The load test script (`load-test-login.ts`) stress tests rate limiting and measures performance.

### Features:

- Concurrent user simulation
- Real-time progress display
- Detailed statistics
- Response time percentiles
- Status code distribution

### Usage:

```bash
# Basic usage (10 concurrent users, 30 seconds)
tsx tests/scripts/load-test-login.ts

# Custom concurrency and duration
tsx tests/scripts/load-test-login.ts 50 60  # 50 users, 60 seconds
```

### Example Output:

```
╔════════════════════════════════════════╗
║   LOGIN ENDPOINT LOAD TEST             ║
╚════════════════════════════════════════╝

Total Requests:      1,234
Successful:          1,020 (82.66%)
Rate Limited:        214 (17.34%)
Errors:              0
Requests/second:     41.13

Response Times:
  Average:  245.32ms
  Min:      123.45ms
  Max:      1,234.56ms

Response Time Percentiles:
  50th (median):  210.23ms
  90th:           412.34ms
  95th:           567.89ms
  99th:           987.65ms

✓ Login rate limiting is active
  Average blocks per user: 4.28
```

## 🎭 E2E Tests (Playwright)

Browser automation tests for full user flows.

### Features:

- Full browser simulation
- UI interaction testing
- Accessibility checks
- Responsive design testing
- Keyboard navigation

### Running:

```bash
# All E2E tests
npx playwright test tests/e2e/

# Watch mode
npx playwright test tests/e2e/ --headed

# Debug mode
npx playwright test tests/e2e/ --debug

# Generate report
npx playwright test tests/e2e/ --reporter=html
npx playwright show-report
```

## 🔍 Test Scenarios Summary

| Scenario                      | Passkey | Admin | Magic Link | Rate Limit | E2E |
| ----------------------------- | :-----: | :---: | :--------: | :--------: | :-: |
| Success - Valid credentials   |    ✓    |   ✓   |     ✓      |     -      |  ✓  |
| Failure - User not found      |    ✓    |   ✓   |     ✓      |     -      |  ✓  |
| Failure - No passkey          |    ✓    |   -   |     ✓      |     -      |  -  |
| Failure - No approval         |    ✓    |   -   |     -      |     -      |  -  |
| Failure - Expired access      |    ✓    |   ✓   |     ✓      |     -      |  -  |
| Failure - Expired challenge   |    ✓    |   -   |     -      |     -      |  -  |
| Failure - Invalid credentials |    ✓    |   ✓   |     ✓      |     -      |  ✓  |
| Failure - Used token          |    -    |   ✓   |     ✓      |     -      |  -  |
| Rate limit - Login POST       |    -    |   -   |     -      |     ✓      |  ✓  |
| Rate limit - API GET          |    -    |   -   |     -      |     ✓      |  -  |
| Rate limit - Recovery         |    -    |   -   |     -      |     ✓      |  -  |
| Security - Headers            |    -    |   -   |     -      |     ✓      |  -  |
| UI - Accessibility            |    -    |   -   |     -      |     -      |  ✓  |
| UI - Responsive               |    -    |   -   |     -      |     -      |  ✓  |

## 🛠️ Configuration

### Test Database

Set `TEST_DATABASE_URL` in your `.env.test` file:

```bash
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/cockpit_test"
```

### Environment Variables

```bash
# Required for tests
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"

# Optional for E2E tests
BASE_URL="http://localhost:3000"  # Default
```

## 📝 Adding New Tests

### 1. Unit/Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupTestDatabase, teardownTestDatabase } from "./helpers/test-setup";

describe("My New Test", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("should do something", async () => {
    // Your test code
    expect(true).toBe(true);
  });
});
```

### 2. Manual CLI Tests

Add to `test-login-manual.ts`:

```typescript
async function testMyScenario() {
  logInfo("Testing my scenario...");
  // Your test logic
  logSuccess("Test passed!");
}

// Add to scenarios array
const scenarios: TestScenario[] = [
  // ... existing scenarios
  {
    id: "6",
    name: "My New Scenario",
    description: "Description of what it tests",
    run: testMyScenario,
  },
];
```

### 3. E2E Tests

Add to `login-flows.spec.ts`:

```typescript
test.describe("My New Flow", () => {
  test("should do something", async ({ page }) => {
    await page.goto("http://localhost:3000/my-page");
    await expect(page.locator("...")).toBeVisible();
  });
});
```

## 🐛 Debugging

### Failed Unit Tests

```bash
# Run in verbose mode
npm test -- --reporter=verbose

# Run specific test
npm test -- --grep="specific test name"

# Run with debugger
node --inspect-brk node_modules/.bin/vitest
```

### Failed E2E Tests

```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode (step through)
npx playwright test --debug

# Take screenshots on failure (automatic)
# Check: test-results/

# View trace
npx playwright show-trace trace.zip
```

### Rate Limit Issues

If you're getting blocked during testing:

1. **Check middleware configuration** (`src/middleware.ts`):
   - Login limit: 20 attempts per 5 minutes
   - API limit: 60 requests per minute

2. **Clear rate limit state** (development):
   - Restart server
   - Change user-agent
   - Use different IP (x-forwarded-for header)

3. **Wait for window to reset**:
   - Login: 5 minutes
   - API: 1 minute

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Auth Tests

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
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test tests/auth/
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test tests/e2e/
```

## 🔐 Security Considerations

1. **Test Data Cleanup**: All tests clean up after themselves
2. **Test Isolation**: Each test uses unique IDs/emails
3. **No Secrets in Tests**: Mock data only
4. **Rate Limit Testing**: Uses separate identifiers

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [WebAuthn Testing Guide](https://webauthn.guide/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## ❓ Troubleshooting

### "Database connection failed"

- Ensure PostgreSQL is running
- Check `DATABASE_URL` or `TEST_DATABASE_URL`
- Run migrations: `npx prisma migrate dev`

### "Server not running" (manual/load tests)

- Start dev server: `npm run dev`
- Check server is on port 3000

### "Playwright not installed"

- Run: `npx playwright install`
- Or: `npx playwright install --with-deps`

### "Rate limit tests failing"

- Wait for rate limit window to reset
- Restart server to clear in-memory limits
- Check middleware configuration

## 📞 Support

For issues or questions:

1. Check this README
2. Review test output/errors
3. Check middleware configuration
4. Review audit logs in database
