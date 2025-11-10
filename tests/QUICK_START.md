# Authentication Testing - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
# If not already installed
npm install

# For E2E tests (optional)
npm install -D @playwright/test
npx playwright install
```

### 2. Make Sure Server is Running

```bash
# In terminal 1
npm run dev
```

### 3. Run Tests

```bash
# In terminal 2 - Choose your test method:

# Option A: Interactive CLI (RECOMMENDED for quick testing)
npm run test:login:manual

# Option B: All unit tests
npm run test:auth

# Option C: Load/stress test
npm run test:login:load 10 30  # 10 users, 30 seconds

# Option D: E2E browser tests
npm run test:e2e:headed
```

## 📋 Quick Command Reference

### Unit/Integration Tests

```bash
npm run test:auth              # All auth tests
npm run test:auth:passkey      # Passkey login only
npm run test:auth:admin        # Admin login only
npm run test:auth:magic        # Magic link only
npm run test:auth:rate-limit   # Rate limiting only
npm run test:coverage          # With coverage report
```

### Manual Testing

```bash
npm run test:login:manual      # Interactive CLI menu
```

Menu options:

- `1` - Regular user login (passkey)
- `2` - User not found scenario
- `3` - Admin login with code
- `4` - Expired access scenario
- `5` - Rate limiting test
- `a` - Run all tests
- `q` - Quit

### Load Testing

```bash
npm run test:login:load                    # Default: 10 users, 30 sec
tsx tests/scripts/load-test-login.ts 50 60 # Custom: 50 users, 60 sec
```

### E2E Tests (Playwright)

```bash
npm run test:e2e         # Headless mode
npm run test:e2e:headed  # Watch browser
npm run test:e2e:debug   # Debug mode
```

## 🎯 Test What You Need

### "I want to quickly verify login works"

→ `npm run test:login:manual` → Select test 1

### "I want to test rate limiting"

→ `npm run test:login:manual` → Select test 5
→ Or: `npm run test:auth:rate-limit`

### "I want to stress test the system"

→ `npm run test:login:load 50 60`

### "I want to see the UI in action"

→ `npm run test:e2e:headed`

### "I want comprehensive coverage"

→ `npm run test:auth && npm run test:e2e`

## 🔍 Common Scenarios Tested

| What                        | Test File               | Command                        |
| --------------------------- | ----------------------- | ------------------------------ |
| ✓ Valid passkey login       | `login-passkey.test.ts` | `npm run test:auth:passkey`    |
| ✗ User not found            | `login-passkey.test.ts` | `npm run test:auth:passkey`    |
| ✗ No passkey registered     | `login-passkey.test.ts` | `npm run test:auth:passkey`    |
| ✗ Expired access            | `login-passkey.test.ts` | `npm run test:auth:passkey`    |
| ✓ Admin code login          | `login-admin.test.ts`   | `npm run test:auth:admin`      |
| ✗ Invalid admin code        | `login-admin.test.ts`   | `npm run test:auth:admin`      |
| ✗ Used/expired code         | `login-admin.test.ts`   | `npm run test:auth:admin`      |
| ✓ Magic link (with passkey) | `login-magic.test.ts`   | `npm run test:auth:magic`      |
| ✓ Magic link (need setup)   | `login-magic.test.ts`   | `npm run test:auth:magic`      |
| ✗ Expired magic token       | `login-magic.test.ts`   | `npm run test:auth:magic`      |
| ⚠ Rate limit blocking      | `rate-limiting.test.ts` | `npm run test:auth:rate-limit` |
| ⚠ Rate limit recovery      | `rate-limiting.test.ts` | `npm run test:auth:rate-limit` |

## 💡 Tips

### Rate Limit Testing

If you get blocked:

- Wait 5 minutes for login endpoints
- Wait 1 minute for API endpoints
- Or restart the dev server
- Or change your user-agent in the test

### Database Issues

```bash
# Reset test database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Test Failures

```bash
# Verbose output
npm run test:auth -- --reporter=verbose

# Run specific test
npm run test:auth -- --grep="specific test name"
```

## 📊 Understanding Results

### Manual CLI Output

```bash
✓ Success (green)
✗ Error (red)
ℹ Info (cyan)
⚠ Warning (yellow)
```

### Load Test Output

```bash
Total Requests:      1,234
Successful:          1,020 (82.66%)  ← Should be high
Rate Limited:        214 (17.34%)   ← Expected if testing limits
Errors:              0               ← Should be 0
```

### E2E Test Output

```bash
✓ All tests passed                  ← Good!
✗ 2 tests failed                    ← Check browser screenshots
```

## 🐛 Troubleshooting

**"Server not running"**
→ Start dev server: `npm run dev`

**"Database connection failed"**
→ Check `.env` file has `DATABASE_URL`

**"Playwright not installed"**
→ Run: `npx playwright install`

**"Rate limit blocking me"**
→ Wait 5 minutes OR restart server OR use different user-agent

**"Tests timing out"**
→ Increase timeout in `vitest.config.ts` (default: 30s)

## 📚 More Info

See full documentation: `tests/README.md`

## 🎉 Quick Win

Try this now:

```bash
npm run test:login:manual
```

Then select: `a` (run all tests)

You'll see all scenarios tested automatically with colored output!
