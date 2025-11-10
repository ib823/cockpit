# 🔐 Magic Link Security Guide

## Overview

The system now includes **instant one-click login** via push notifications using secure magic links. This document explains how it works, security measures, and when to use it.

---

## 🎯 How It Works

### For Users with Push Notifications Enabled:

```
1. Admin approves email
   ↓
2. System generates:
   - 64-character magic token (not guessable)
   - Expires in 5 minutes
   - One-time use only
   ↓
3. Push notification sent to user's browser
   Title: "🔐 Keystone Access Ready"
   Body: "✓ Click to login securely (expires in 5 min)"
   Actions: [🔓 Login Securely] [Not me? Ignore]
   ↓
4. User clicks notification
   ↓
5. Browser opens: /login?token=abc123...
   ↓
6. Auto-validates token → Logs user in
   ↓
7. Token marked as used (can't be reused)
```

### For Users WITHOUT Push Notifications:

- Falls back to traditional 6-digit code
- Sent via email/QR code
- Valid for 7 days
- Works cross-device

---

## 🔒 Security Measures Implemented

### 1. **Secure Token Generation**

```typescript
crypto.randomBytes(32).toString("hex");
// Generates 64-character token
// 2^256 possible combinations (impossible to guess)
```

**vs 6-digit code:**

- Magic link: 2^256 combinations (~10^77)
- 6-digit code: 1,000,000 combinations

### 2. **Short Expiration**

- Magic link: **5 minutes**
- 6-digit code: 7 days

**Why?** Magic links are instant-use, so short expiry is safer.

### 3. **One-Time Use**

```typescript
// Token marked as used immediately
await prisma.magicToken.update({
  where: { token },
  data: { usedAt: new Date() },
});

// Subsequent attempts rejected
if (magicToken.usedAt) {
  return error("This link has already been used");
}
```

### 4. **Device Fingerprinting**

```typescript
{
  userAgent: "Mozilla/5.0...",
  platform: "MacIntel",
  language: "en-US",
  screenResolution: "1920x1080"
}
```

Stored with each magic link use for audit trail.

### 5. **IP Address Logging**

```typescript
const ip = req.headers.get("x-forwarded-for") || "unknown";

await prisma.magicToken.update({
  data: { ipAddress: ip },
});
```

### 6. **Browser-Bound Delivery**

- Push subscription tied to specific browser
- Token only sent to subscribed device
- Can't intercept on different device

### 7. **Audit Trail**

```typescript
await prisma.auditEvent.create({
  data: {
    type: "MAGIC_LINK_LOGIN",
    meta: { ip, deviceInfo, tokenExpiry },
  },
});
```

All magic link logins logged for security review.

---

## ⚠️ Trust Indicators for Users

### Education Modal (Before Enabling)

Users see comprehensive modal explaining:

- What push notifications are
- How to verify legitimate notifications
- When NOT to use (public computers)
- Security implications

### Public Computer Detection

```typescript
// Automatic detection of:
- Incognito/private mode
- Kiosk mode browsers
- Public computer indicators

// UI shows warning:
"⚠️ Public/shared computer detected - use 6-digit code instead"
```

### Visual Trust Indicators in Notification

```
🔐 Keystone Access Ready          ← Official lock emoji
✓ Click to login securely         ← Trust language
(expires in 5 min)                ← Urgency indicator
[🔓 Login Securely]               ← Clear action
[Not me? Ignore]                  ← Easy dismiss
```

### Domain Verification

```typescript
data: {
  approvedDomain: "localhost",    // Shown in notification
  expiresIn: "5 minutes",
  isSecure: true
}
```

---

## 🚫 When NOT to Use Push Notifications

### NEVER Enable On:

1. **Public/Shared Computers**
   - Libraries, internet cafes
   - Airport kiosks, hotel business centers
   - Conference room computers

2. **Work/School Shared Devices**
   - Hot-desking areas
   - Shared terminals
   - Demo/testing devices

3. **Someone Else's Device**
   - Friend's laptop
   - Family member's phone
   - Borrowed devices

### Why?

**Push subscriptions persist on the device.** Anyone using it later could receive your login links!

---

## ✅ When It's SAFE to Use

### Enable On:

1. **Personal Devices**
   - Your laptop/desktop
   - Your phone/tablet
   - Devices only you use

2. **Company-Issued Devices**
   - Assigned to you individually
   - Not shared with others

3. **Secure Locations**
   - Home office
   - Private office space
   - Controlled access areas

---

## 🛡️ Security Comparison

| Feature                     | Magic Link         | 6-Digit Code    |
| --------------------------- | ------------------ | --------------- |
| **Strength**                | 2^256 combinations | 1M combinations |
| **Expiry**                  | 5 minutes          | 7 days          |
| **UX**                      | One click          | Manual entry    |
| **Cross-device**            | No                 | Yes             |
| **Public computer safe**    | No\*               | Yes             |
| **Phishing resistant**      | Yes                | No              |
| **Shoulder-surf resistant** | Yes                | No              |

\*Not recommended for public computers, but code works everywhere

---

## 🔐 Additional Security Features

### 1. **Automatic Token Cleanup**

Expired tokens can be deleted:

```sql
DELETE FROM magic_tokens
WHERE expiresAt < NOW()
AND usedAt IS NOT NULL
```

### 2. **Rate Limiting** (Recommended)

Add to production:

```typescript
// Limit magic link generation per email
// Max 3 per 15 minutes per email
```

### 3. **HTTPS Required** (Production)

- Magic links only work over HTTPS in production
- localhost exempted for development

### 4. **Session Binding**

After magic link login:

```typescript
// Create session with user info
const session = await createSession(user.id, user.email, user.role);
```

---

## 📊 Audit & Monitoring

### What's Logged:

1. **Token Creation**
   - Email
   - Expiry time
   - Admin who approved

2. **Token Usage**
   - IP address
   - Device info
   - Timestamp
   - Success/failure

3. **Failed Attempts**
   - Invalid tokens
   - Expired tokens
   - Already-used tokens

### Review Audit Logs:

```sql
SELECT * FROM audit_events
WHERE type = 'MAGIC_LINK_LOGIN'
ORDER BY createdAt DESC
LIMIT 100
```

---

## 🚀 Setup Instructions

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### 2. Add to `.env.local`

```bash
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
```

### 3. Run Database Migration

```bash
npx prisma db push
```

### 4. Restart Server

```bash
npm run dev
```

---

## 🧪 Testing

### Test Magic Link Flow:

1. **Enable push on personal device:**

   ```
   - Visit /login
   - Click "Instant Login Notifications" toggle
   - Read security modal
   - Click "Enable Notifications"
   - Allow browser permission
   ```

2. **Admin approves email:**

   ```
   - Go to /admin
   - Enter user email
   - Click "Approve Email"
   ```

3. **User receives notification:**

   ```
   - Browser notification appears
   - Click "🔓 Login Securely"
   - Instantly logged in!
   ```

4. **Verify security:**
   ```
   - Try clicking notification again (should fail - already used)
   - Wait 5 minutes (should fail - expired)
   - Check audit log in database
   ```

---

## ❓ FAQ

**Q: Is magic link more secure than 6-digit code?**
A: Yes, significantly. 64-char token vs 6 digits, 5-min vs 7-day expiry, one-time use.

**Q: What if I accidentally enable on public computer?**
A: Immediately unsubscribe (toggle OFF) or clear browser data. Contact admin to revoke access.

**Q: Can magic links be forwarded/shared?**
A: Technically yes, but:

- Expires in 5 minutes
- One-time use only
- Device info logged (audit trail)

**Q: What if push notification is delayed?**
A: Token might expire. User can request new code or use 6-digit fallback.

**Q: Does this work offline?**
A: No. Requires internet for push delivery and token validation.

**Q: Is this vulnerable to man-in-the-middle?**
A: No. HTTPS required in production. Token validated server-side.

---

## 🎯 Best Practices

### For Users:

1. ✅ Only enable on personal devices
2. ✅ Verify domain in notification
3. ✅ Click "Not me? Ignore" if unexpected
4. ✅ Disable if device is lost/stolen
5. ✅ Use 6-digit code on public computers

### For Admins:

1. ✅ Educate users about when to use
2. ✅ Monitor audit logs regularly
3. ✅ Revoke access if suspicious activity
4. ✅ Use HTTPS in production
5. ✅ Consider rate limiting in production

### For Developers:

1. ✅ Keep VAPID keys secret
2. ✅ Clean up expired tokens regularly
3. ✅ Monitor error rates
4. ✅ Add rate limiting
5. ✅ Review audit logs

---

## 📚 Summary

**Magic Link Authentication:**

- ✅ **More secure** than 6-digit codes
- ✅ **Better UX** (one click vs typing)
- ✅ **Faster** (instant vs manual entry)
- ✅ **Safer** (short-lived, one-time use)
- ⚠️ **Personal devices only** (not for public computers)

**When to Use:**

- ✅ Personal devices → Magic link (best)
- ✅ Public computers → 6-digit code (safe)
- ✅ Cross-device → 6-digit code (works)
- ✅ Manual sharing → 6-digit code (flexible)

**Security:**

- 🔒 64-character tokens
- ⏱️ 5-minute expiry
- 🔐 One-time use
- 📝 Full audit trail
- 🛡️ Device fingerprinting
- 🌐 HTTPS required (production)

**Trust & Education:**

- 📚 Comprehensive education modal
- ⚠️ Public computer detection
- ✅ Visual trust indicators
- 🔍 Domain verification
- 👤 User consent required

**Ready to use safely!** 🎉
