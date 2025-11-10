# Debugging Production Save Errors

## Current Status

✅ Local save operation works perfectly
❌ Production save operation returns 500 errors
⏱️ Added detailed performance logging to identify the issue

## How to Check Vercel Logs

### Option 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on "Logs" tab
4. Filter by "Errors" or search for "PATCH"
5. Look for logs from `/api/gantt-tool/projects/[projectId]`

### Option 2: Vercel CLI (Most Detailed)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# View live logs
vercel logs --follow

# Or filter for specific errors
vercel logs --follow | grep -i "PATCH\|error\|failed"
```

### Option 3: Check specific function logs

```bash
# Get the last 100 log entries
vercel logs --limit 100

# Look for our new detailed logging:
# - "[API] ===== PATCH Request Started ====="
# - "[API] Starting database transaction..."
# - "[API] Updating main project fields..."
# - "[API] Creating X phases with tasks..."
# - "[API] Transaction committed successfully in Xms"
```

## What to Look For

The new logging will show **exactly where the operation fails**:

### 1. Before Transaction

```
[API] ===== PATCH Request Started =====
[API] Project ID: xxx
[API] Reading request body...
[API] Request body keys: [...]
[API] Validating data...
```

### 2. During Transaction

```
[API] Starting database transaction...
[API] Updating main project fields...
[API] Deleting existing resources...
[API] Creating X resources...
[API] Deleting existing phases...
[API] Creating X phases with tasks...
[API] Updating X milestones...
[API] Updating X holidays...
[API] Transaction operations complete, committing...
[API] Transaction committed successfully in XXXms
```

### 3. After Transaction

```
[API] Fetching updated project for response...
[API] Project retrieved successfully, serializing...
[API] ===== PATCH Request Completed in XXXms =====
```

## Common Production Issues

### 1. Timeout (Most Likely)

**Symptoms:**

- No error message in logs
- Request just stops midway
- "504 Gateway Timeout" errors

**Vercel Limits:**

- Hobby plan: **10 seconds**
- Pro plan: **60 seconds**

**Solution:**

- Check transaction duration in logs
- If > 10s, upgrade to Pro plan or optimize the save operation

### 2. Database Connection Pool Exhaustion

**Symptoms:**

```
Error: Can't reach database server
P1001: Can't reach database server at `xxx`
```

**Solution:**

- Check Prisma connection pool settings
- Ensure `prisma.$disconnect()` is called properly

### 3. Memory Limit

**Symptoms:**

```
Error: JavaScript heap out of memory
```

**Solution:**

- Reduce data size
- Optimize serialization

### 4. Foreign Key Constraint Violations

**Symptoms:**

```
Prisma error code: P2003
Foreign key constraint violation
```

**Solution:**

- Check resource assignments reference valid resource IDs
- Ensure resources are created before phases

## Next Steps

1. **Deploy the latest changes** (already done ✅)
2. **Try saving your project again** in production
3. **Check Vercel logs** immediately after the failure
4. **Share the log output** with me - look for:
   - The last log line before it fails
   - Any error messages
   - The transaction duration (if shown)

## Quick Diagnostic Commands

```bash
# Check recent deployments
vercel ls

# Get logs from last 5 minutes
vercel logs --since 5m

# Watch logs in real-time while you reproduce the issue
vercel logs --follow
```

## Sample Log Output (Success)

```
[API] ===== PATCH Request Started =====
[API] Project ID: cmhdareks000512ussi08yu78
[API] Request body keys: ["name", "description", "startDate", "phases", "milestones", "holidays", "resources"]
[API] Validating data...
[API] Starting database transaction...
[API] Updating main project fields...
[API] Deleting existing resources...
[API] Deleting existing phases...
[API] Creating 4 phases with tasks...
[API] Updating 2 milestones...
[API] Updating 0 holidays...
[API] Transaction operations complete, committing...
[API] Transaction committed successfully in 450ms
[API] Fetching updated project for response...
[API] Project retrieved successfully, serializing...
[API] ===== PATCH Request Completed in 650ms =====
```

## Sample Log Output (Failure)

Look for where it stops:

```
[API] ===== PATCH Request Started =====
[API] Project ID: cmhdareks000512ussi08yu78
[API] Starting database transaction...
[API] Updating main project fields...
[API] Creating 4 phases with tasks...
[TIMEOUT - no more logs]
```

This would indicate a timeout during phase creation.
