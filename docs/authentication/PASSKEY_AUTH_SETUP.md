# Passkey Authentication System

## Overview

This application now uses **passwordless passkey authentication** (WebAuthn). No passwords needed - users authenticate with fingerprint, Face ID, or device PIN.

## Architecture

### Core Components

1. **Login Page** (`src/app/login/page.tsx`)
   - Clean, modern UI with proper error handling
   - Two flows: login (existing users) and registration (new users)
   - Proper loading states and user feedback

2. **Session Management** (`src/lib/session.ts`)
   - JWT-based sessions using `jose` library
   - HttpOnly cookies for security
   - 8-hour session expiration

3. **WebAuthn Integration** (`src/lib/webauthn.ts`)
   - SimpleWebAuthn v13 (browser + server)
   - Challenge storage with Redis fallback to in-memory
   - Proper RP ID and origin configuration

4. **API Routes**
   - `/api/auth/begin-login` - Start authentication
   - `/api/auth/finish-login` - Verify credential
   - `/api/auth/begin-register` - Start registration
   - `/api/auth/finish-register` - Complete registration
   - `/api/admin/create-access` - Admin generates codes

5. **Middleware** (`src/middleware.ts`)
   - Protects all routes except `/login` and `/api/auth/*`
   - Auto-redirects to `/login` if not authenticated
   - Rate limiting (60 req/min per IP)

## Database Schema

```prisma
model User {
  id              String          @id @default(cuid())
  email           String          @unique
  role            Role            @default(USER)
  exception       Boolean         @default(false)  // Never expires
  accessExpiresAt DateTime
  authenticators  Authenticator[]
  auditEvents     AuditEvent[]
}

model Authenticator {
  id         String   @id
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  publicKey  Bytes
  counter    Int
  transports String[]
  deviceType String
  backedUp   Boolean
  createdAt  DateTime @default(now())
  lastUsedAt DateTime @default(now())
}

model EmailApproval {
  email            String    @id
  tokenHash        String
  tokenExpiresAt   DateTime
  approvedByUserId String
  usedAt           DateTime?
  createdAt        DateTime  @default(now())
}
```

## Setup Instructions

### 1. Environment Variables

Ensure `.env.local` has:

```bash
# Database (Neon PostgreSQL)
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."

# Passkey Configuration
WEBAUTHN_RP_ID=localhost              # Production: yourdomain.com
WEBAUTHN_ORIGIN=http://localhost:3000 # Production: https://yourdomain.com
SESSION_SECRET=<long-random-string>   # At least 32 characters

# Optional: Upstash Redis for distributed challenge storage
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Bootstrap admin
ADMIN_EMAILS=admin@example.com
```

### 2. Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 3. Bootstrap Admin User

```bash
# Create initial admin with access code
npx tsx scripts/bootstrap-admin.ts admin@example.com

# Output:
# ✅ Admin user created successfully!
# 📋 Setup Instructions:
# 1. Go to http://localhost:3001/login
# 2. Enter the 6-digit code: 416073
# ...
```

## User Flows

### First-Time Registration

1. Admin generates 6-digit code via:
   - CLI: `npx tsx scripts/bootstrap-admin.ts user@email.com`
   - Web UI: `/admin` (requires admin login)

2. User visits `/login`:
   - Enters email
   - Enters 6-digit code
   - System prompts for passkey setup (fingerprint/Face ID)
   - Passkey registered → logged in

3. Code is marked as used (single-use)

### Returning User Login

1. User visits any protected route → redirected to `/login`
2. Enters email → clicks "Continue with Passkey"
3. Browser prompts for biometric/PIN
4. Authenticated → redirected to original destination

## Security Features

✅ **No passwords** - Passkeys can't be phished or leaked
✅ **HttpOnly cookies** - JavaScript can't access session tokens
✅ **CSRF protection** - SameSite=Lax cookie policy
✅ **Rate limiting** - 60 requests/minute per IP
✅ **Proper headers** - Content-Type, security headers
✅ **Input validation** - Email format, numeric codes
✅ **Error sanitization** - No information leakage
✅ **Challenge expiry** - 60-second TTL on WebAuthn challenges
✅ **Code expiry** - 24-hour access codes
✅ **Audit trail** - AuditEvent table tracks logins

## Admin Panel

Access: `/admin` (requires ADMIN role)

Features:

- Generate 6-digit access codes for new users
- Codes expire in 24 hours
- Single-use only
- Shows QR code for easy sharing (future)

## Production Deployment

### Vercel/Production Checklist

1. **Update Environment Variables:**

   ```bash
   WEBAUTHN_RP_ID=yourdomain.com
   WEBAUTHN_ORIGIN=https://yourdomain.com
   SESSION_SECRET=<production-secret>
   UPSTASH_REDIS_REST_URL=<redis-url>
   UPSTASH_REDIS_REST_TOKEN=<redis-token>
   ```

2. **Use Upstash Redis:**
   - In-memory challenge storage won't work with serverless
   - Free tier: https://upstash.com

3. **Run Migrations:**

   ```bash
   npx prisma migrate deploy
   ```

4. **Bootstrap Admin:**

   ```bash
   npx tsx scripts/bootstrap-admin.ts admin@yourdomain.com
   ```

5. **Test WebAuthn:**
   - HTTPS required for production WebAuthn
   - Test with real device (not emulator)
   - Verify RP ID matches domain

## Troubleshooting

### "Invalid or expired code"

- Code expires after 24 hours
- Code is single-use only
- Regenerate new code via `/admin` or CLI

### "No passkey found"

- User never registered a passkey
- Database might have been reset
- User needs access code to re-register

### WebAuthn not working

- Check browser console for errors
- Verify `WEBAUTHN_RP_ID` matches domain
- Verify `WEBAUTHN_ORIGIN` matches URL
- HTTPS required in production (not localhost)

### Hydration errors

- Fixed with `suppressHydrationWarning` on html/body
- Caused by browser extensions (Grammarly, etc.)

## Files Modified/Created

**Created:**

- `src/lib/session.ts` - JWT session management
- `src/lib/webauthn.ts` - WebAuthn utilities
- `src/app/login/page.tsx` - Login page (rebuilt)
- `src/app/admin/page.tsx` - Admin panel
- `src/app/api/auth/begin-login/route.ts`
- `src/app/api/auth/finish-login/route.ts`
- `src/app/api/auth/begin-register/route.ts`
- `src/app/api/auth/finish-register/route.ts`
- `src/app/api/admin/create-access/route.ts`
- `scripts/bootstrap-admin.ts` - CLI tool
- `prisma/schema.prisma` - Auth tables added

**Modified:**

- `src/middleware.ts` - Added auth protection
- `src/app/layout.tsx` - Removed NextAuth, added hydration fixes
- `src/app/providers.tsx` - Removed SessionProvider
- `.env.local` - Added passkey config

**Removed:**

- `src/lib/auth.ts` - Old NextAuth config (conflicted)
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler

## Dependencies

```json
{
  "@simplewebauthn/browser": "13.2.2",
  "@simplewebauthn/server": "13.2.2",
  "@upstash/redis": "1.35.4",
  "bcryptjs": "3.0.2",
  "jose": "6.1.0"
}
```

## Next Steps

1. **Email notifications** - Send codes via email (SendGrid/Resend)
2. **QR codes** - Generate QR codes for mobile sharing
3. **Multi-device** - Allow users to register multiple passkeys
4. **Recovery** - Email-based account recovery
5. **SSO** - Add OAuth providers (Google, Microsoft)
6. **2FA** - Optional TOTP for high-security accounts

## Support

For issues or questions:

- Check browser console for errors
- Verify environment variables
- Check database connection
- Review audit logs in `AuditEvent` table
