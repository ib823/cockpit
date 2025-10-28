# First-Time Login Notification Flow - Test Guide

## Current Implementation Status

✅ Service Worker exists: `/public/sw.js`
✅ VAPID keys configured in `.env.local`
✅ Push notification toggle component: `PushNotificationToggle.tsx`
✅ Security education modal: `SecurityEducationModal.tsx`
✅ Push notification API routes exist

## How It Works (Current Flow)

### 1. Login Page Shows Notification Toggle
**Location:** `/login` page (email stage)
- A toggle button appears below the email input
- Label: "Instant 1st Login"
- 3 visual states:
  - **Danger** (red): Public/incognito browser detected
  - **Available** (blue): Can enable notifications
  - **Active** (blue with checkmark): Notifications enabled

### 2. User Clicks to Enable Notifications
When user clicks the toggle:
1. **Security Education Modal appears** (centered on screen)
   - Title: "Use Personal Devices Only"
   - Content:
     - Your phone, laptop, or tablet
     - Never on shared or public devices
     - Does not work in private browsing (e.g., incognito, Tor)
   - Button: "Understood"

2. **User clicks "Understood"**
   - Browser prompts for notification permission
   - Service worker registers
   - Push subscription created
   - Subscription sent to server
   - Toggle switches to "Active" state

### 3. Future Logins
- User receives push notification on their device
- Clicking notification opens login link
- User completes passkey authentication
- Fast login achieved

## Testing Checklist

### Test 1: Enable Notifications (Happy Path)
- [ ] Navigate to http://localhost:3001/login
- [ ] See "Instant 1st Login" toggle (blue, available state)
- [ ] Click toggle
- [ ] Security education modal appears (centered)
- [ ] Read modal content (matches specification)
- [ ] Click "Understood"
- [ ] Browser permission prompt appears
- [ ] Click "Allow"
- [ ] Toggle switches to active state (checkmark visible)
- [ ] Console shows: "Service Worker registered" and "Push subscription:"

### Test 2: Deny Notifications
- [ ] Navigate to http://localhost:3001/login
- [ ] Click toggle
- [ ] Modal appears
- [ ] Click "Understood"
- [ ] Browser permission prompt appears
- [ ] Click "Block/Deny"
- [ ] Toggle returns to available state
- [ ] No errors in console

### Test 3: Public Computer Detection
- [ ] Open incognito/private browsing window
- [ ] Navigate to http://localhost:3001/login
- [ ] Toggle shows danger state (red, disabled)
- [ ] Toggle cannot be clicked
- [ ] Tooltip or visual indicates unsafe environment

### Test 4: Already Subscribed
- [ ] Enable notifications (Test 1)
- [ ] Refresh page
- [ ] Toggle shows active state immediately
- [ ] No duplicate subscriptions created

### Test 5: Unsubscribe
- [ ] With notifications enabled (active state)
- [ ] Click toggle again
- [ ] Toggle switches to available state
- [ ] Push subscription removed
- [ ] Console confirms unsubscribe

## Known Issues to Verify

### Issue 1: Email Hardcoded
**File:** `PushNotificationToggle.tsx:75`
```typescript
const saved = await sendPushSubscriptionToServer(subscription, 'admin@admin.com');
```
❌ Email is hardcoded to 'admin@admin.com'
✅ **FIX NEEDED:** Should use the actual user's email from login state

### Issue 2: Modal Already Fixed
✅ Modal content updated to match specification
✅ Modal centered on screen
✅ Modal appears on toggle click

## Recommended Improvements

### 1. Fix Hardcoded Email
The notification toggle should receive the user's email as a prop:

```typescript
// PushNotificationToggle.tsx
export default function PushNotificationToggle({ email }: { email?: string }) {
  // ...
  const saved = await sendPushSubscriptionToServer(subscription, email || '');
}

// page.tsx
<PushNotificationToggle email={email} />
```

### 2. Auto-Show Modal on First Visit
Currently: Modal only shows when user clicks toggle
Suggestion: Show modal automatically on first visit to login page

### 3. Persist Dismissal
If user dismisses modal, remember choice in localStorage
Don't show again unless user explicitly clicks toggle

## API Endpoints

### Subscribe Endpoint
**POST** `/api/push/subscribe`
```json
{
  "email": "user@example.com",
  "subscription": {
    "endpoint": "...",
    "keys": { "p256dh": "...", "auth": "..." }
  }
}
```

### Send Notification Endpoint
**POST** `/api/push/send`
```json
{
  "email": "user@example.com",
  "title": "Login Link",
  "body": "Click to login to Keystone",
  "url": "http://localhost:3001/login?token=..."
}
```

## Browser Support

✅ Chrome/Edge: Full support
✅ Firefox: Full support
✅ Safari 16.4+: Full support (requires user interaction)
❌ Safari < 16.4: Not supported
❌ Private/Incognito: Disabled (by design)

## Security Considerations

✅ Service worker requires HTTPS (localhost exception)
✅ VAPID keys properly configured
✅ Notification permission required
✅ Public computer detection implemented
✅ Education modal warns users about device safety

## Next Steps

1. **Test the current flow** - Follow testing checklist above
2. **Fix hardcoded email** - Pass actual user email to component
3. **Verify push notification sending** - Test admin can send notifications
4. **Test end-to-end** - From subscription → receiving notification → clicking → login
