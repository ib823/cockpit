# Debugging Import Error: "Failed to fetch"

## What This Error Means
"Failed to fetch" is a generic browser error that occurs when:
- The request cannot be sent at all (network issue)
- The browser blocks the request (CORS, CSP, or other security policy)
- The request payload is too large
- The server crashes before responding
- The request times out

## Steps to Debug

### 1. Check Browser Console
Open browser Developer Tools (F12) and check:

**Console Tab:**
- Look for any errors before "Failed to fetch"
- Check for CORS errors
- Look for CSP (Content Security Policy) violations
- Check for logs starting with `[ExcelImport]`

**Network Tab:**
- Find the failed PATCH request to `/api/gantt-tool/projects/{projectId}`
- Check the request status:
  - **(failed)** = Network error before server response
  - **403** = Blocked by middleware (CORS/CSRF)
  - **413** = Payload too large
  - **500** = Server error
  - **504** = Timeout
- Check Request Headers:
  - Verify `Origin` header matches the host
  - Verify `Content-Type: application/json`
- Check Request Payload size in the "Size" column

### 2. Check Server Logs
Look at the terminal running `npm run dev`:

**Look for:**
- `[API] ===== PATCH Request Started =====`
  - If you see this, the request reached the server
  - If you DON'T see this, the request was blocked before reaching the API

- CSRF/CORS errors:
  - `Invalid origin`
  - `Too many requests` (rate limit)

- Prisma errors:
  - Foreign key constraint violations
  - Invalid data types

### 3. Check Payload Size

In the browser console, you should see:
```
[ExcelImport] Payload size: XXXXX bytes
```

If the payload is > 1MB, this could be the issue.

## Common Causes & Fixes

### Issue 1: Large Payload Size
**Symptom:** Payload > 1MB when appending to a large existing project

**Fix:** Instead of sending all existing phases, only send the new phases and let the API merge them.

See the fix in: `ExcelTemplateImport.tsx` (updated version)

### Issue 2: CORS/Origin Header Mismatch
**Symptom:** Browser shows CORS error or middleware logs "Invalid origin"

**Check:**
- Middleware expects origin header to match host
- Make sure you're accessing the app via the same URL consistently

### Issue 3: Rate Limiting
**Symptom:** Middleware logs "Too many requests"

**Fix:** Wait 60 seconds and try again

### Issue 4: Database/Foreign Key Constraint
**Symptom:** Server logs show Prisma errors about foreign keys

**Fix:** Resource IDs in the phases must exist in the resources array

### Issue 5: Missing Origin Header
**Symptom:** Request has no Origin header

**This is unusual** - browsers always send Origin for fetch() requests

## Immediate Action Items

1. **Enable detailed logging:**
   - Open browser console (F12)
   - Open Network tab
   - Try the import again
   - Look for the PATCH request and check its status

2. **Check payload size:**
   - The console should show `[ExcelImport] Payload size: XXXXX bytes`
   - If > 1MB, this is likely the issue

3. **Verify origin:**
   - In Network tab, find the PATCH request
   - Check Request Headers
   - Verify `Origin` matches the URL you're using

4. **Check for server errors:**
   - Look at terminal running `npm run dev`
   - Look for `[API] ===== PATCH Request Started =====`
   - If not present, request was blocked by middleware

## Updated Code

I've added:
1. Better error handling in `ExcelTemplateImport.tsx`
2. Detailed logging in the API route
3. This debugging guide

**Next Steps:**
- Try the import again
- Check browser console and network tab
- Share the error details you see
