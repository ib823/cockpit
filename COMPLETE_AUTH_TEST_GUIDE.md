# Complete Authentication & Notification Testing Guide

## 🎯 All Systems Ready for Testing

### Dev Server
**URL:** http://localhost:3001/login

### What Was Fixed

#### 1. Authentication Flow ✅
- ✅ Challenge TTL: 60s → 300s (5 minutes)
- ✅ Auto-retry on challenge expiration
- ✅ Clear error messages with auto-clear
- ✅ Proper error banner display
- ✅ All error paths handled consistently

#### 2. Notification System ✅
- ✅ Fixed hardcoded email bug
- ✅ Updated modal content and positioning
- ✅ Service worker configured
- ✅ VAPID keys in place
- ✅ Public computer detection

## 📋 Complete Testing Protocol

### Phase 1: New User Registration

**Test Case 1.1: Fresh Registration**
1. Navigate to: http://localhost:3001/login
2. Enter email: `ikmls@hotmail.com`
3. Click "Continue"
4. **Observe:** Code input appears
5. Enter 6-digit code from admin
6. Click "Verify"
7. **Observe:** Passkey registration prompt appears
8. Complete passkey on your device
9. **Expected Result:**
   - ✅ Success message: "Welcome!"
   - ✅ Auto-redirect to home in 2 seconds
   - ✅ No errors in console

**Test Case 1.2: Enable Notifications During Registration**
1. Start fresh (clear browser data or new email)
2. Navigate to: http://localhost:3001/login
3. Enter email
4. **Observe:** "Instant 1st Login" toggle (blue, available)
5. Click the toggle
6. **Observe:** Modal appears centered:
   - Title: "Use Personal Devices Only"
   - Line 1: "Your phone, laptop, or tablet"
   - Line 2: "Never on shared or public devices"
   - Line 3: "Does not work in private browsing..."
   - Button: "Understood"
7. Click "Understood"
8. **Observe:** Browser permission prompt
9. Click "Allow"
10. **Expected Result:**
    - ✅ Toggle turns to active state (checkmark)
    - ✅ Console logs: "Service Worker registered"
    - ✅ No errors

11. Continue with registration (steps 2-9 from Test 1.1)

### Phase 2: Returning User Login

**Test Case 2.1: Normal Login**
1. Navigate to: http://localhost:3001/login
2. Enter email: `ikmls@hotmail.com`
3. Click "Continue"
4. **Observe:** Passkey prompt appears immediately (no code needed)
5. Complete passkey authentication
6. **Expected Result:**
   - ✅ Success message: "Welcome back!"
   - ✅ Auto-redirect to home in 2 seconds
   - ✅ Notification toggle shows active state if previously enabled

**Test Case 2.2: Toggle Notification State**
1. Log in successfully
2. Go back to /login
3. Click notification toggle (active state)
4. **Expected Result:**
   - ✅ Toggle switches to available state
   - ✅ Subscription removed
5. Click toggle again
6. Modal appears → Click "Understood" → Allow
7. **Expected Result:**
   - ✅ Toggle returns to active state
   - ✅ New subscription created

### Phase 3: Error Handling

**Test Case 3.1: Invalid Code**
1. Navigate to login
2. Enter email
3. Enter invalid code: `000000`
4. Click "Verify"
5. **Expected Result:**
   - ✅ Error banner appears: "The provided code is incorrect."
   - ✅ Page shakes
   - ✅ Vibration (if supported)
   - ✅ Error auto-clears after 5 seconds

**Test Case 3.2: Cancel Passkey**
1. Navigate to login
2. Enter registered email
3. Click "Continue"
4. Passkey prompt appears
5. Click "Cancel" or dismiss prompt
6. **Expected Result:**
   - ✅ Error banner: "Passkey authentication cancelled"
   - ✅ Returns to email input
   - ✅ Can retry

**Test Case 3.3: Challenge Expiration (Now Fixed!)**
1. Navigate to login
2. Enter email → Continue
3. Enter code → Verify
4. When passkey prompt appears, **wait 2+ minutes**
5. Complete passkey
6. **Expected Result (OLD - would fail):**
   - ❌ Empty error `{}`
   - ❌ Vibration with no message

7. **Expected Result (NEW - fixed):**
   - ✅ Error banner: "Session expired. Please verify your code again."
   - ✅ Auto-retries after 1.5 seconds
   - ✅ User can complete registration

### Phase 4: Public Computer Detection

**Test Case 4.1: Incognito Mode**
1. Open incognito/private browsing window
2. Navigate to: http://localhost:3001/login
3. **Expected Result:**
   - ✅ Notification toggle is RED
   - ✅ Toggle is disabled (cursor: not-allowed)
   - ✅ Warning icon visible
   - ✅ Cannot click toggle

**Test Case 4.2: Normal Browser**
1. Regular browser window
2. Navigate to login
3. **Expected Result:**
   - ✅ Notification toggle is BLUE
   - ✅ Toggle is clickable
   - ✅ Bell icon visible

### Phase 5: Admin Login

**Test Case 5.1: Admin Code Login**
1. Navigate to login
2. Enter admin email (configured in system)
3. Click "Continue"
4. **Observe:** Code input appears (no passkey)
5. Enter admin code
6. Click "Verify"
7. **Expected Result:**
   - ✅ Success message: "Welcome, Admin!"
   - ✅ Auto-redirect to /admin in 2 seconds

## 🔍 What to Check in Console

### Normal Flow (No Errors)
```
✅ Service Worker registered: ServiceWorkerRegistration {...}
✅ Push subscription: PushSubscription {...}
```

### Error Scenarios
```
❌ Registration error: NotAllowedError: User cancelled
❌ Failed to parse finish-login response: SyntaxError
✅ Login failed: {ok: false, message: "...", challengeExpired: true}
```

## 🐛 Known Issues (All Fixed)

| Issue | Status | Fix |
|-------|--------|-----|
| Challenge expires too fast (60s) | ✅ Fixed | Increased to 300s |
| Empty error response `{}` | ✅ Fixed | Added challengeExpired flag |
| No error banner on failure | ✅ Fixed | All paths set errorMessage |
| Hardcoded email in notifications | ✅ Fixed | Pass email as prop |
| Modal wrong positioning | ✅ Fixed | Centered with inset-0 |
| Modal wrong content | ✅ Fixed | Updated to spec |

## 📊 Success Criteria

### ✅ Registration Flow
- [ ] User can register with 6-digit code
- [ ] Passkey registration works on localhost
- [ ] Success message displays
- [ ] Redirects to home page
- [ ] No console errors

### ✅ Login Flow
- [ ] User can login with passkey
- [ ] Success message displays
- [ ] Redirects to home page
- [ ] No console errors

### ✅ Notification Flow
- [ ] Toggle appears on login page
- [ ] Modal shows on toggle click
- [ ] Modal content matches spec
- [ ] Browser permission requested
- [ ] Subscription saves with correct email
- [ ] Toggle state persists across refreshes

### ✅ Error Handling
- [ ] All errors show in banner
- [ ] Error messages are clear
- [ ] Errors auto-clear after 5s
- [ ] Challenge expiration auto-retries
- [ ] No infinite loops

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Remove test documentation files
   - Clean up any debug console.logs
   - Update README with authentication flow
   - Deploy to staging

2. **If tests fail:**
   - Document exact failure scenario
   - Check browser console for errors
   - Check server terminal for errors
   - Report issue with reproduction steps

## 💡 Tips for Testing

1. **Use localhost, not 127.0.0.1**
   - Passkeys require localhost or HTTPS

2. **Clear browser data between tests**
   - Notifications: Chrome DevTools → Application → Service Workers → Unregister
   - Passkeys: Settings → Privacy → Security Keys → Manage

3. **Check both browser console and terminal**
   - Browser: F12 → Console
   - Terminal: Where `npm run dev` is running

4. **Test on multiple browsers**
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari 16.4+: Full support

5. **Test mobile devices**
   - Use ngrok or similar to expose localhost
   - Or deploy to staging with HTTPS

## 📝 Test Results Template

```
Date: YYYY-MM-DD
Tester: [Your Name]
Browser: Chrome 120 / Firefox 121 / Safari 17
Device: Desktop / iPhone 15 / Android

Phase 1 - Registration:
[ ] Test 1.1: Fresh Registration - PASS/FAIL
[ ] Test 1.2: Enable Notifications - PASS/FAIL

Phase 2 - Login:
[ ] Test 2.1: Normal Login - PASS/FAIL
[ ] Test 2.2: Toggle State - PASS/FAIL

Phase 3 - Errors:
[ ] Test 3.1: Invalid Code - PASS/FAIL
[ ] Test 3.2: Cancel Passkey - PASS/FAIL
[ ] Test 3.3: Challenge Expiration - PASS/FAIL

Phase 4 - Public Detection:
[ ] Test 4.1: Incognito Mode - PASS/FAIL
[ ] Test 4.2: Normal Browser - PASS/FAIL

Phase 5 - Admin:
[ ] Test 5.1: Admin Login - PASS/FAIL

Notes:
[Any issues, observations, or suggestions]
```
