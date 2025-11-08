# Passkey Fix Guide - Admin Login Issue

## Problem Summary

Your admin passkey (`ikmls@hotmail.com`) isn't working in production because of a **WebAuthn configuration mismatch**.

**Evidence:**
- ✅ User exists in database with ADMIN role
- ✅ Passkey is registered (created Nov 5, 2025)
- ❌ Passkey has NEVER been used successfully (counter = 0)
- ⚠️ This indicates WebAuthn RP ID or Origin mismatch

## Root Cause

When a passkey is registered, it's bound to specific WebAuthn settings:
- **RP ID** (Relying Party ID): Your domain
- **Origin**: Your full URL

If these don't match between registration and login, authentication fails.

## Solution

### Step 1: Check Current Production Config

Run this locally to verify what production sees:

```bash
# This shows your current production WebAuthn config
npx tsx scripts/check-webauthn-prod.ts
```

### Step 2: Fix Production Environment Variables

Go to your hosting dashboard (Vercel, Railway, AWS, etc.) and set:

**For Vercel deployment:**
```bash
WEBAUTHN_RP_ID=your-app.vercel.app
WEBAUTHN_ORIGIN=https://your-app.vercel.app
```

**For custom domain:**
```bash
WEBAUTHN_RP_ID=yourdomain.com          # or app.yourdomain.com
WEBAUTHN_ORIGIN=https://app.yourdomain.com
```

**Important Rules:**
- RP ID = domain only (no `https://`, no trailing slash)
- Origin = full URL with protocol (with `https://`, no trailing slash)
- They must match EXACTLY what the browser sees

### Step 3: Redeploy Your App

After changing environment variables, redeploy to apply changes.

### Step 4: Clear Old Passkey

The old passkey was registered with wrong config, so clear it:

```bash
# Safety check - shows what will be deleted
npx tsx scripts/clear-admin-passkey.ts

# Confirm and delete
npx tsx scripts/clear-admin-passkey.ts --confirm
```

### Step 5: Re-register Your Passkey

1. Go to your production app
2. Navigate to: `https://your-domain.com/register` or registration page
3. Enter `ikmls@hotmail.com`
4. Follow passkey registration prompts
5. Complete registration

### Step 6: Test Login

1. Go to login page
2. Enter `ikmls@hotmail.com`
3. Use your newly registered passkey
4. Should work now! ✅

## Verification Commands

### Check if passkey exists:
```bash
npx tsx scripts/check-admin-passkey-fixed.ts
```

### Check WebAuthn configuration:
```bash
npx tsx scripts/check-webauthn-prod.ts
```

### Clear passkey (if needed):
```bash
npx tsx scripts/clear-admin-passkey.ts --confirm
```

## Troubleshooting

### Still not working after fix?

1. **Check browser console** during login:
   - Look for WebAuthn errors
   - Common: "RP ID mismatch", "Origin mismatch"

2. **Verify environment variables applied**:
   - Check your hosting dashboard
   - Verify deployment succeeded
   - Check production logs for the actual values

3. **Try different browser**:
   - Chrome/Edge: Good WebAuthn support
   - Safari: Good on Mac/iOS
   - Firefox: Also supported

4. **Check passkey location**:
   - Is it in your device?
   - Is it in iCloud Keychain?
   - Is it in a hardware key?

### Common Errors

**"Challenge expired"**
- Registration/login took too long
- Try again immediately

**"Passkey not found"**
- You're using wrong device
- Or passkey was deleted
- Re-register

**"Verification failed"**
- RP ID mismatch
- Check production env vars
- Re-register with correct config

## Emergency Access

If you need immediate access before fixing passkeys, you have options:

### Option 1: Force Admin Session (for emergencies)
```bash
# Creates a temporary admin session
npx tsx scripts/create-admin-session.ts
```

### Option 2: Magic Link (if enabled)
Use magic link authentication instead of passkey temporarily.

### Option 3: Recovery Code
If you have recovery codes set up, use those.

## Prevention

To avoid this in the future:

1. **Always set WebAuthn env vars** before first passkey registration
2. **Don't change** RP ID or Origin after passkeys are registered
3. **Test passkey login** immediately after registration
4. **Keep backup** admin access method (recovery codes)

## Need More Help?

1. Check production logs during login attempt
2. Use the debug endpoint: `https://your-domain.com/api/debug/check-passkey?email=ikmls@hotmail.com`
3. Review browser console for WebAuthn errors
4. Check that the passkey counter increments after successful login

---

**Last Updated:** 2025-11-07
**Script Location:** `/scripts/`
