# Test Log Management

## 📁 Log File Locations

All test logs are saved in the **project root directory** (`/workspaces/cockpit/`):

### Ultimate Test Logs
```
ultimate-test-results-{timestamp}.log
```
- Created by: `npm run test:ultimate`
- Contains: Complete test results from all 83 tests
- Example: `ultimate-test-results-2025-10-10T01-33-38-184Z.log`

### Regular Test Logs
```
test-results-{timestamp}.log
```
- Created by: `npm run test:all`
- Contains: Basic test suite results
- Example: `test-results-2025-10-10T00-46-30-373Z.log`

---

## 🗑️ Automatic Log Cleanup

### Auto-Cleanup on Every Run ✅

Both test runners **automatically delete old logs** before creating new ones:

#### Ultimate Test Runner
```bash
npm run test:ultimate
# 🗑️ Cleaned up 3 old log file(s)
# Creates: ultimate-test-results-2025-10-10T01-50-00-000Z.log
```

#### Regular Test Runner
```bash
npm run test:all
# 🗑️ Cleaned up 2 old log file(s)
# Creates: test-results-2025-10-10T01-50-00-000Z.log
```

**Benefits:**
- ✅ Always have only the latest test results
- ✅ No log file clutter
- ✅ Saves disk space
- ✅ Easy to find latest results

---

## 📋 View Latest Test Results

### Quick View Commands

```bash
# View latest ultimate test results
cat ultimate-test-results-*.log

# View latest regular test results
cat test-results-*.log

# Search for failures in latest ultimate tests
grep -i "failed\|error\|critical" ultimate-test-results-*.log

# Search for passed tests
grep -i "passed\|success" ultimate-test-results-*.log
```

### Find Specific Log Files

```bash
# List all test logs (if any exist)
ls -lh *test-results*.log 2>/dev/null

# Find the newest log file
ls -t *test-results*.log | head -1

# View the newest log
cat $(ls -t *test-results*.log | head -1)
```

---

## 🧹 Manual Cleanup (If Needed)

### Delete All Test Logs

```bash
# Delete all ultimate test logs
rm -f ultimate-test-results-*.log

# Delete all regular test logs
rm -f test-results-*.log

# Delete ALL test logs
rm -f *test-results*.log
```

### Delete Logs Older Than X Days

```bash
# Delete logs older than 7 days
find . -name "*test-results*.log" -mtime +7 -delete
```

---

## 🔒 .gitignore Protection

Test logs are **automatically ignored by git**:

```gitignore
# testing
/coverage
test-results-*.log
ultimate-test-results-*.log
```

**This means:**
- ✅ Logs won't be committed to version control
- ✅ Won't clutter your git status
- ✅ Won't be pushed to remote repository

---

## 📊 Log File Contents

### Ultimate Test Log Structure

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                  🚀 ULTIMATE TEST SUITE - THE COMPLETE WORKS 🚀                ║
╚══════════════════════════════════════════════════════════════════════════════╝

[timestamp] Checking Prerequisites
[timestamp] ✓ Server is running
[timestamp] ✓ Node version: v22.17.0
[timestamp] ✓ Database is accessible
[timestamp] ✓ Playwright is installed

[timestamp] Running: [UNIT] Passkey Login Tests
[timestamp] ✓ PASSED in 2.45s

[timestamp] Running: [SECURITY] Ultimate Security Tests
[timestamp] ✓ SQL Injection Protection
[timestamp] ✓ NoSQL Injection Protection
...

[timestamp] 🎯 ULTIMATE TEST RESULTS SUMMARY
[timestamp] Total Test Suites: 8
[timestamp] Passed: 8
[timestamp] Failed: 0
[timestamp] Success Rate: 100.0%
```

### What's Logged

Each log file contains:
- ✅ Test execution timestamps
- ✅ Prerequisites check results
- ✅ Each test suite output (stdout/stderr)
- ✅ Pass/fail status for each test
- ✅ Execution duration
- ✅ Final summary with statistics
- ✅ Full error details (if any)

---

## 🎯 Best Practices

### 1. Let Auto-Cleanup Handle It
```bash
# Just run tests - old logs auto-delete
npm run test:ultimate
```

### 2. Save Important Results
```bash
# If you need to keep a specific log, rename it
mv ultimate-test-results-*.log important-test-run-$(date +%Y%m%d).log
```

### 3. Compare Test Runs
```bash
# Run test and save with descriptive name
npm run test:ultimate
cp ultimate-test-results-*.log baseline-test-$(date +%Y%m%d).log

# Run again later and compare
npm run test:ultimate
diff baseline-test-*.log ultimate-test-results-*.log
```

### 4. Export for CI/CD
```bash
# Upload to artifacts in GitHub Actions
- uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: ultimate-test-results-*.log
```

---

## 🔧 Troubleshooting

### Log File Not Created

**Problem:** Test runs but no log file appears

**Solutions:**
1. Check write permissions in project root
2. Ensure script has file system access
3. Check for errors in console output

### Multiple Log Files Exist

**Problem:** Old logs not being deleted

**Solution:** Update test scripts - they now auto-cleanup on every run!

### Can't Find Latest Log

```bash
# Find and view latest log (works even with multiple logs)
cat $(ls -t *test-results*.log 2>/dev/null | head -1)

# Or use this one-liner
cat $(find . -maxdepth 1 -name "*test-results*.log" -type f -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2)
```

---

## 📝 Summary

**Log Location:** Project root (`/workspaces/cockpit/`)

**Auto-Cleanup:** ✅ Enabled (deletes old logs on every run)

**Git Ignore:** ✅ Configured (logs won't be committed)

**View Latest:**
```bash
cat ultimate-test-results-*.log  # Ultimate tests
cat test-results-*.log           # Regular tests
```

**Manual Delete:**
```bash
rm -f *test-results*.log
```

**That's it! The system automatically manages logs for you.** 🎉
