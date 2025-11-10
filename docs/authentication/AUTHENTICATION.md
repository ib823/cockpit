# Authentication System

## Overview

Minimal, elegant passwordless authentication inspired by Apple's design philosophy.

## Design Principles

✨ **Simplicity** - Clean white background, minimal UI, focus on essentials
🎯 **Progressive Disclosure** - Code input only appears when needed
⚡ **Instant Feedback** - Smooth transitions, clear states
🔒 **Secure by Default** - Passkey-only, no passwords

## Login Flow

### For Existing Users

1. **Email Input**
   - Clean, minimal form
   - Bottom border focus indicator
   - Enter email → Continue

2. **Passkey Prompt**
   - Browser native passkey UI
   - Fingerprint/Face ID/PIN
   - Instant authentication

3. **Success**
   - Green checkmark
   - Smooth redirect

### For New Users

1. **Email Input**
   - Same as existing users
   - Enter email → Continue

2. **Code Entry** (auto-shown if no passkey found)
   - "Enter the code from your admin"
   - 6-digit numeric input
   - Mono font, wide tracking

3. **Passkey Setup**
   - Browser prompts for passkey creation
   - Set fingerprint/Face ID/PIN

4. **Success**
   - Ready to use immediately

## Admin Dashboard

### Features

✅ **Generate Access Codes**

- Enter user email
- Generate 6-digit code
- Copy to clipboard

✅ **Code Display**

- Large, readable mono font
- Visual indicators (checkmarks, icons)
- Expiry/usage information

✅ **Instructions**

- Step-by-step guide
- Clear, concise

### Access

URL: `/admin`
Requires: ADMIN role

## API Endpoints

```
POST /api/auth/begin-login
POST /api/auth/finish-login
POST /api/auth/begin-register
POST /api/auth/finish-register
POST /api/admin/create-access (requires admin)
```

## Components

### Login Page (`/login`)

**Colors:**

- Background: Pure white (#ffffff)
- Text: Slate 900 (#0f172a)
- Borders: Slate 200/900 (#e2e8f0/#0f172a)
- Success: Green 100/600/900

**Typography:**

- Heading: 3xl, font-light, tight tracking
- Input: Base size, clean
- Code: 2xl, mono, wide tracking

**States:**

- `email` - Email input visible
- `code` - Code input visible (when passkey not found)
- `waiting` - Spinner shown
- `done` - Success checkmark

### Admin Page (`/admin`)

**Layout:**

- Two-column grid (responsive)
- Left: Create access form
- Right: Code display
- Bottom: Instructions

**Colors:**

- Background: Slate 50 (#f8fafc)
- Cards: White with border
- Accents: Blue 50/100/800/900

## User Experience

### Login (Existing User)

1. Type email
2. Click Continue
3. Passkey prompt appears
4. ✓ Done (< 5 seconds)

### First Time Setup

1. Type email
2. Click Continue
3. Enter 6-digit code
4. Click Verify
5. Set up passkey
6. ✓ Done (< 30 seconds)

### Admin Creating Access

1. Type user email
2. Click Generate
3. Copy code
4. Share with user
5. ✓ Done (< 10 seconds)

## Security

✅ No passwords stored
✅ Enumeration-safe (doesn't reveal if email exists)
✅ 6-digit codes expire in 24 hours
✅ Single-use codes
✅ HttpOnly session cookies
✅ CSRF protection

## Technical Details

**Session Management:**

- JWT with `jose` library
- 8-hour expiration
- HttpOnly, Secure, SameSite=Lax

**WebAuthn:**

- SimpleWebAuthn v13
- User verification required
- Resident keys (device-bound)

**Challenge Storage:**

- Redis (production)
- In-memory fallback (development)
- 60-second TTL

## URLs

- Login: http://localhost:3001/login
- Admin: http://localhost:3001/admin
- App: http://localhost:3001/

## Bootstrap Admin

```bash
npx tsx scripts/bootstrap-admin.ts admin@example.com
```

**Current Code:** `821880`

## Next Steps

- [ ] Email delivery (SendGrid/Resend)
- [ ] SMS delivery option
- [ ] QR code sharing
- [ ] Multi-device passkey support
- [ ] Account recovery flow
- [ ] Activity log
