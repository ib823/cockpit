# Production Deployment Security Checklist

**CRITICAL**: Complete these steps before deploying to production

---

## 1. Generate New SESSION_SECRET (5 minutes)

```bash
# Generate secure 64+ character secret
openssl rand -base64 64
```

**Set in production environment**:

- Vercel: Settings → Environment Variables → Add `SESSION_SECRET`
- Other platforms: Add to environment variables

**Test**: Build should fail if SESSION_SECRET < 64 characters ✅

---

## 2. Rotate Database Credentials (10 minutes)

1. Go to Neon dashboard
2. Navigate to your database
3. Settings → Reset password
4. Update `DATABASE_URL` in production environment variables
5. **DO NOT** commit new credentials to git

---

## 3. Configure Upstash Redis (15 minutes)

### Create Upstash Account

1. Go to https://upstash.com/
2. Create free account
3. Create new Redis database
4. Region: Choose closest to your app (e.g., `us-east-1`)

### Get Credentials

1. Click your database
2. Copy `UPSTASH_REDIS_REST_URL`
3. Copy `UPSTASH_REDIS_REST_TOKEN`

### Set Environment Variables

Add to production:

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Test**: Sessions should persist, logout should work ✅

---

## 4. Security Testing (30 minutes)

### Test Authentication Flow

```bash
# 1. Login as regular user
curl -X POST https://yourapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'

# 2. Try accessing admin route (should fail)
curl https://yourapp.com/admin \
  -H "Cookie: sb=user-session-token"

# Expected: 403 Forbidden or redirect
```

### Test Rate Limiting

```bash
# Make 6 login attempts in 5 minutes (should get rate limited)
for i in {1..6}; do
  curl -X POST https://yourapp.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","code":"000000"}'
  echo "Attempt $i"
done

# Expected: 6th attempt returns 429 Too Many Requests
```

### Test Session Timeout

```bash
# 1. Login
# 2. Wait 11 minutes
# 3. Try to access protected route
# Expected: Redirect to login (session expired)
```

### Test Session Revocation

```bash
# 1. Login from browser
# 2. Call revoke-all-sessions endpoint
curl -X POST https://yourapp.com/api/auth/revoke-all-sessions \
  -H "Cookie: sb=your-session-token"

# 3. Try to access protected route with same session
# Expected: Redirect to login (session revoked)
```

### Test Admin Protection

```bash
# 1. Login as admin
curl -X POST https://yourapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourapp.com","code":"123456"}'

# 2. Access admin route (should work)
curl https://yourapp.com/admin \
  -H "Cookie: sb=admin-session-token"

# 3. Check audit logs in database
SELECT * FROM "AuditEvent"
WHERE type = 'unauthorized_admin_access'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 5. Environment Variables Checklist

### Required for Production

- ✅ `SESSION_SECRET` (64+ characters)
- ✅ `DATABASE_URL` (PostgreSQL connection string)
- ✅ `UPSTASH_REDIS_REST_URL`
- ✅ `UPSTASH_REDIS_REST_TOKEN`
- ✅ `NEXT_PUBLIC_APP_URL` (your production URL)

### Optional (Email)

- ⚪ `RESEND_API_KEY` (for magic link emails)
- ⚪ `EMAIL_FROM` (sender email address)

### Check All Set

```bash
# Vercel
vercel env ls

# Other platforms
printenv | grep -E "(SESSION_SECRET|DATABASE_URL|UPSTASH|APP_URL)"
```

---

## 6. Monitoring Setup (Post-Deployment)

### Set Up Logging

Monitor these security events:

- `[SECURITY] Unauthorized admin access attempt`
- `[Session] Revoked session`
- `[RateLimit] Too many requests`

### Database Queries for Monitoring

```sql
-- Unauthorized admin access attempts (last 24h)
SELECT * FROM "AuditEvent"
WHERE type = 'unauthorized_admin_access'
  AND "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;

-- Admin sessions revoked (last 7 days)
SELECT * FROM "AuditEvent"
WHERE type = 'admin_revoke_sessions'
  AND "createdAt" > NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;

-- User login frequency (last 24h)
SELECT "userId", COUNT(*) as login_count
FROM "AuditEvent"
WHERE type = 'login'
  AND "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "userId"
ORDER BY login_count DESC;
```

### Set Up Alerts

Configure alerts for:

1. **> 10 unauthorized admin access attempts in 1 hour**
2. **> 100 rate limit violations in 1 hour**
3. **> 5 session revocations for same user in 1 day**

---

## 7. Security Headers (Next.js Config)

These are already configured in `next.config.js`, verify:

```javascript
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; ..."
}
```

---

## 8. Pre-Deployment Verification

Run these commands before deploying:

```bash
# 1. TypeScript compilation
npm run typecheck

# 2. ESLint
npm run lint

# 3. Production build
npm run build

# 4. Check bundle size
du -sh .next/

# All should pass ✅
```

---

## 9. Post-Deployment Smoke Tests

After deploying, verify:

### Public Routes (No Auth Required)

- ✅ `GET /login` → Returns login page
- ✅ `GET /banner-demo` → Returns banner demo

### Protected Routes (Auth Required)

- ✅ `GET /` → Redirects to /login if not authenticated
- ✅ `GET /admin` → Redirects to /login if not authenticated
- ✅ `GET /project` → Redirects to /login if not authenticated

### Admin Routes (Admin Role Required)

- ✅ `GET /admin` → Returns admin page for admin user
- ✅ `GET /admin` → Redirects to / for regular user
- ✅ `POST /api/admin/approve-email` → 403 for non-admin

### API Security

- ✅ Rate limiting works (429 after 5 login attempts)
- ✅ Session timeout works (invalid after 10 minutes)
- ✅ Logout revokes session (cannot reuse token)
- ✅ Admin revoke works (target user logged out)

---

## 10. Security Incident Response Plan

If a security incident occurs:

### Immediate Actions (< 5 minutes)

1. **Revoke all sessions for affected user(s)**:

   ```bash
   curl -X POST https://yourapp.com/api/admin/users/{userId}/revoke-sessions \
     -H "Cookie: sb=admin-session-token"
   ```

2. **Check audit logs**:

   ```sql
   SELECT * FROM "AuditEvent"
   WHERE "userId" = 'affected-user-id'
   ORDER BY "createdAt" DESC;
   ```

3. **Block IP if needed** (add to firewall/WAF)

### Short-term Actions (< 1 hour)

1. Rotate SESSION_SECRET (invalidates all sessions)
2. Rotate database credentials
3. Review recent login activity
4. Notify affected users

### Long-term Actions (< 24 hours)

1. Root cause analysis
2. Implement additional controls if needed
3. Update security documentation
4. Schedule security audit

---

## 11. Compliance Checklist

### Banking/Financial Services Requirements

- ✅ Session timeout ≤ 10 minutes
- ✅ Strong password hashing (bcrypt ≥ 12 rounds)
- ✅ Rate limiting on authentication endpoints
- ✅ Audit logging of all access attempts
- ✅ Secure session management (httpOnly, secure, sameSite)
- ✅ CSRF protection (sameSite=strict)
- ✅ Role-based access control
- ✅ Immediate session revocation capability

### PCI-DSS Requirements

- ✅ Encryption in transit (HTTPS)
- ✅ Strong cryptography (HS256, bcrypt)
- ✅ Audit trails maintained
- ✅ Unique user IDs tracked
- ✅ Access control implemented

### SOC 2 Requirements

- ✅ Security controls documented
- ✅ Audit logging implemented
- ✅ Session management secure
- ✅ Access reviews possible (audit events)

---

## 12. Final Checklist

Before going live, confirm:

- [ ] SESSION_SECRET generated and set (64+ chars)
- [ ] Database credentials rotated
- [ ] Upstash Redis configured
- [ ] Environment variables verified
- [ ] Build succeeds without errors
- [ ] All smoke tests pass
- [ ] Rate limiting tested and working
- [ ] Session timeout tested (10 minutes)
- [ ] Logout tested (session revoked)
- [ ] Admin routes protected
- [ ] Audit logging verified
- [ ] Monitoring/alerts configured
- [ ] Incident response plan documented
- [ ] Security team notified

---

## Emergency Contacts

**Security Incident**:

- [ ] Security Team Email: \***\*\_\_\_\*\***
- [ ] On-Call Engineer: \***\*\_\_\_\*\***
- [ ] Database Admin: \***\*\_\_\_\*\***

**Production Issues**:

- [ ] DevOps Team: \***\*\_\_\_\*\***
- [ ] Infrastructure: \***\*\_\_\_\*\***

---

## Quick Commands Reference

```bash
# Generate SESSION_SECRET
openssl rand -base64 64

# Test rate limiting
for i in {1..6}; do curl -X POST https://yourapp.com/api/auth/login -d '{"email":"test@test.com","code":"000000"}'; done

# Check audit logs
psql $DATABASE_URL -c "SELECT * FROM \"AuditEvent\" ORDER BY \"createdAt\" DESC LIMIT 10;"

# Revoke all sessions for user
curl -X POST https://yourapp.com/api/admin/users/{userId}/revoke-sessions -H "Cookie: sb=admin-token"

# Build and deploy
npm run typecheck && npm run build && vercel --prod
```

---

**Last Updated**: 2025-10-06
**Security Level**: Banking/Financial Services Grade
**Status**: Production Ready ✅
