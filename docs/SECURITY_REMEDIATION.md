# SECURITY REMEDIATION GUIDE

## Keystone Application - Phase C Implementation

**Date:** October 22, 2025
**Status:** ✅ COMPLETED
**Remediation Phase:** C

---

## CRITICAL: IMMEDIATE SECRET ROTATION REQUIRED

### Background

During Phase B security audit, **6 critical secrets** were found exposed in the `.env` file:

1. `DATABASE_URL` - Full PostgreSQL credentials
2. `DATABASE_URL_UNPOOLED` - Same credentials, unpooled
3. `NEXTAUTH_SECRET` - Session signing key
4. `ADMIN_PASSWORD_HASH` - Admin password hash
5. `VAPID_PRIVATE_KEY` - Push notification private key
6. `VERCEL_OIDC_TOKEN` - Vercel deployment token

**Impact:** If `.env` was ever committed to Git, these secrets are permanently in Git history and must be considered compromised.

---

## STEP 1: Generate New Secrets

### 1.1 DATABASE_URL (CRITICAL - Priority P0)

```bash
# Option A: Create new Neon database
# 1. Go to https://console.neon.tech
# 2. Create new project: "cockpit-production-new"
# 3. Copy new connection string

# Option B: Rotate Neon database password
# 1. Go to Neon console → Settings → Reset password
# 2. Copy new connection string
```

**New value format:**

```
DATABASE_URL=postgresql://new_user:NEW_PASSWORD@ep-xxxxx.aws.neon.tech/new_db?sslmode=require
```

### 1.2 NEXTAUTH_SECRET (CRITICAL - Priority P0)

```bash
# Generate new 256-bit secret
openssl rand -base64 32
```

**Example output:**

```
NEXTAUTH_SECRET=X9fJ2kL8mN4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK=
```

### 1.3 ADMIN_PASSWORD_HASH (HIGH - Priority P1)

```bash
# Generate new strong password (use password manager)
# Then hash it with bcrypt cost factor 12:
node -e "console.log(require('bcryptjs').hashSync('NEW_SECURE_PASSWORD_HERE', 12))"
```

**Example output:**

```
ADMIN_PASSWORD_HASH=$2b$12$NEW_HASH_VALUE_HERE
```

### 1.4 VAPID Keys (HIGH - Priority P1)

```bash
# Generate new VAPID key pair
npx web-push generate-vapid-keys
```

**Example output:**

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNEWPublicKeyHere...
VAPID_PRIVATE_KEY=NEWPrivateKeyHere...
```

---

## STEP 2: Update Environment Variables

### 2.1 Local Development

```bash
# 1. Create new .env.local (never commit to Git)
cp .env.example .env.local

# 2. Fill in ALL new secrets from Step 1
# 3. Verify .env.local is in .gitignore
grep ".env.local" .gitignore

# 4. Delete old .env file if it exists
rm .env

# 5. Verify .env is also in .gitignore
echo ".env" >> .gitignore
```

### 2.2 Production (Vercel)

```bash
# 1. Update all secrets in Vercel dashboard
# Go to: Project Settings → Environment Variables

# 2. Delete old variables
# 3. Add new variables (mark as "Production")
# 4. Redeploy application

# OR use Vercel CLI:
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# (paste new value when prompted)

vercel env rm NEXTAUTH_SECRET production
vercel env add NEXTAUTH_SECRET production

# Repeat for all secrets
```

---

## STEP 3: Migrate Database (if using new database)

```bash
# If you created a NEW database, migrate the schema:

# 1. Update DATABASE_URL in .env.local
# 2. Push Prisma schema to new database
pnpm prisma db push

# 3. (Optional) Migrate data from old database
# Use pg_dump and pg_restore or custom migration scripts
```

---

## STEP 4: Invalidate Old Sessions

```bash
# After rotating NEXTAUTH_SECRET, all existing sessions become invalid
# Users will need to re-authenticate

# 1. Clear sessions table (optional - sessions will naturally expire)
# 2. Notify users that they need to log in again
# 3. Monitor for authentication errors in first 24 hours
```

---

## STEP 5: Verify Secret Rotation

### 5.1 Checklist

- [ ] New DATABASE_URL works in production
- [ ] New NEXTAUTH_SECRET doesn't break existing functionality
- [ ] Admin can still log in with new password
- [ ] Push notifications still work (if enabled)
- [ ] No secrets in `.env` file (file deleted or not committed)
- [ ] `.env.local` contains all new secrets
- [ ] `.env` and `.env.local` both in `.gitignore`
- [ ] Old secrets deleted from Vercel dashboard
- [ ] Git history checked for `.env` exposure

### 5.2 Git History Check

```bash
# Check if .env was ever committed
git log --all --full-history -- .env

# If .env appears in history, you MUST:
# 1. Rotate ALL secrets immediately
# 2. Consider using git-filter-repo to remove from history (dangerous)
# 3. Force-push to all branches (requires team coordination)
# 4. Re-clone repo for all team members
```

---

## VULNERABILITIES FIXED IN PHASE C

| ID        | Vulnerability                | CVSS | Status               |
| --------- | ---------------------------- | ---- | -------------------- |
| **V-001** | Weak OTP Generation          | 8.1  | ✅ FIXED             |
| **V-002** | OTP Brute Force              | 9.0  | ✅ FIXED             |
| **V-003** | OTP Plaintext Storage        | 7.5  | ✅ FIXED             |
| **V-004** | User Enumeration (Timing)    | 5.3  | ✅ FIXED             |
| **V-006** | Access Expiry TOCTOU         | 5.5  | ✅ FIXED             |
| **V-007** | Email Enumeration (Timing)   | 5.3  | ✅ FIXED             |
| **V-008** | Export Data Exfiltration     | 7.2  | ✅ FIXED             |
| **V-009** | Missing CSRF Protection      | 6.5  | ✅ FIXED (partial)   |
| **V-010** | Database Credentials Exposed | 9.8  | 🔄 REQUIRES ROTATION |
| **V-011** | NEXTAUTH_SECRET Exposed      | 9.1  | 🔄 REQUIRES ROTATION |
| **V-014** | Session Role Mapping Flaw    | 4.8  | ✅ FIXED             |

---

## CODE CHANGES SUMMARY

### New Files Created

1. `/src/lib/server-rate-limiter.ts` - Server-side rate limiting with Redis
2. `/src/lib/crypto-utils.ts` - OTP hashing and timing-safe comparison
3. `/src/lib/api-route-wrapper.ts` - CSRF protection wrapper
4. `/docs/SECURITY_REMEDIATION.md` - This file

### Files Modified

1. `/src/app/api/auth/send-otp/route.ts`
   - Cryptographically secure OTP generation
   - OTP hashing before storage
   - Rate limiting (3 requests per 15 min)

2. `/src/app/api/auth/verify-otp/route.ts`
   - Server-side rate limiting (5 attempts per 15 min)
   - OTP hash comparison
   - Timing-safe comparison

3. `/src/app/api/auth/finish-login/route.ts`
   - Access expiry TOCTOU fix (atomic transaction)
   - Preserve MANAGER role in sessions

4. `/src/app/api/auth/finish-register/route.ts`
   - Preserve all roles (USER, MANAGER, ADMIN)

5. `/src/app/api/admin/users/route.ts`
   - CSRF protection on user creation

6. `/src/app/api/export/csv/route.ts`
   - CSRF protection
   - Project ownership verification

7. `/src/app/api/export/powerpoint/route.ts`
   - CSRF protection
   - Project ownership verification

8. `/.env.example`
   - Comprehensive security documentation
   - Secret generation commands
   - Vulnerability references

---

## TESTING RECOMMENDATIONS

### 1. OTP Authentication

```bash
# Test OTP generation is cryptographically random
# Test rate limiting blocks brute force (6th attempt fails)
# Test OTPs are hashed in database
```

### 2. CSRF Protection

```bash
# Test admin user creation requires CSRF token
# Test export endpoints require CSRF token
# Test GET requests don't require CSRF token
```

### 3. Access Expiry

```bash
# Test expired users cannot login (atomic check)
# Test exception users can login regardless of expiry
```

### 4. Role Preservation

```bash
# Test MANAGER role creates MANAGER session (not USER)
# Test ADMIN role creates ADMIN session
# Test USER role creates USER session
```

---

## REMAINING VULNERABILITIES (Not Fixed in Phase C)

| ID    | Vulnerability                | CVSS | Priority | Recommendation                                    |
| ----- | ---------------------------- | ---- | -------- | ------------------------------------------------- |
| V-005 | OTP Leak in Dev Logs         | 3.7  | P3       | Disable OTP logging in production                 |
| V-012 | Resource-Level Authorization | 7.1  | P2       | Add ownership checks to all project routes        |
| V-013 | Shared Token Expiry          | 5.1  | P2       | Enforce expiresAt checks                          |
| V-015 | Insufficient Audit Logging   | 5.5  | P1       | Add logging to all admin operations               |
| V-016 | Public Endpoints             | 4.3  | P3       | Review `/api/import/gantt` access control         |
| V-022 | No Account Lockout           | 5.3  | P2       | Implement account lockout after N failed attempts |
| V-024 | No Content Security Policy   | 4.1  | P3       | Add CSP headers                                   |
| V-025 | Error Stack Traces           | 3.7  | P3       | Sanitize errors in production                     |

---

## COMPLIANCE STATUS AFTER PHASE C

### OWASP ASVS

- ✅ **2.2.1** Anti-automation controls - NOW COMPLIANT (rate limiting)
- ✅ **2.5.2** Cryptographic randomness - NOW COMPLIANT (crypto.randomInt)
- 🔄 **3.2.1** Session management - REQUIRES SECRET ROTATION
- ⚠️ **4.1.1** Access control enforcement - PARTIALLY FIXED (export endpoints)

### GDPR

- ⚠️ **Data minimization** - User enumeration partially fixed
- 🔄 **Accountability** - Requires audit logging expansion
- 🔄 **Security of processing** - Requires secret rotation

### SOC 2

- ✅ **CC6.6** Encryption controls - OTPs now hashed
- 🔄 **CC6.1** Logical access controls - CSRF partially implemented
- ⚠️ **CC7.2** System monitoring - Needs audit logging

---

## NEXT STEPS (Phase D - If Approved)

1. **Implement comprehensive audit logging** (V-015)
2. **Add resource-level authorization** to all project endpoints (V-012)
3. **Implement account lockout** mechanism (V-022)
4. **Add Content Security Policy** headers (V-024)
5. **Implement shared token expiry** enforcement (V-013)

---

**Document Version:** 1.0
**Last Updated:** October 22, 2025
**Classification:** CONFIDENTIAL - SECURITY DOCUMENTATION
