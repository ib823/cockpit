# Security Testing Checklist

## Pre-Deployment Security Validation

This checklist must be completed before every production deployment. All items marked **CRITICAL** must pass - deploy is blocked otherwise.

---

## OWASP Top 10 (2021) Testing

### A01: Broken Access Control ⚠️ **CRITICAL**

- [ ] **Vertical privilege escalation testing**
  - Login as USER role, attempt to access `/admin` routes
  - Expected: 403 Forbidden or redirect to home
  - Command: `curl -H "Cookie: session=<user-token>" https://app.com/admin`

- [ ] **Horizontal privilege escalation**  
  - User A attempts to access User B's projects
  - Expected: 403 or empty response
  - Test: Modify project IDs in API calls

- [ ] **API endpoint authorization**
  - Test all `/api/admin/*` routes require ADMIN role
  - Test `/api/projects/[id]` enforces ownership
  - Command: `pnpm test:security:access-control`

- [ ] **Role-based access control (RBAC)**
  - USER: Can CRUD own projects only
  - MANAGER: Can view team projects  
  - ADMIN: Can access all + admin panel

### A02: Cryptographic Failures

- [ ] **HTTPS enforcement**  
  - HTTP requests redirect to HTTPS in production
  - Command: `curl -I http://app.com | grep -i location`
  - Expected: Redirects to `https://app.com`

- [ ] **JWT/Session token strength**
  - NEXTAUTH_SECRET is 32+ characters
  - Tokens use HS256 or stronger algorithm
  - Verify: Check environment variable length

- [ ] **Password hashing**
  - Bcrypt with 10+ rounds (check: `$2a$10$` or `$2b$10$`)
  - Command: `echo $ADMIN_PASSWORD_HASH | grep -E '^\$2[ab]\$1[0-9]\$'`

- [ ] **Sensitive data encryption at rest**
  - Database credentials encrypted in vault
  - API keys not hardcoded in source

### A03: Injection ⚠️ **CRITICAL**

- [ ] **SQL injection automated testing**
  - Run: `pnpm test tests/security/sql-injection.test.ts`
  - Expected: All 8 tests PASS

- [ ] **SQL injection manual testing**
  - Test inputs: `' OR '1'='1`, `'; DROP TABLE--`, `1 UNION SELECT`
  - All should return safe responses (no errors, no data leak)

- [ ] **XSS injection testing**
  - Test payloads in all text inputs:
    ```
    <script>alert('xss')</script>
    <img src=x onerror=alert(1)>
    javascript:alert(document.cookie)
    <svg onload=alert(1)>
    "><script>alert(String.fromCharCode(88,83,83))</script>
    ```
  - Expected: All HTML/JS stripped or encoded

- [ ] **Command injection**  
  - Test file operations with inputs like `; rm -rf /`
  - Verify input sanitization on file imports

### A04: Insecure Design

- [ ] **Authentication flow security**
  - Magic links expire after use
  - Passkeys properly verify origin
  - No password in URL parameters

- [ ] **Rate limiting per user**
  - 60 requests/minute per authenticated user
  - 30 requests/minute per IP for anonymous
  - Test: Make 61 requests in < 60s
  - Expected: 429 Too Many Requests

- [ ] **Session management**
  - Sessions expire after inactivity (check MAX_AGE)
  - Logout invalidates session server-side
  - No session fixation vulnerabilities

### A05: Security Misconfiguration ⚠️ **CRITICAL**

- [ ] **Security headers present**
  ```bash
  curl -I https://app.com | grep -E "(X-Frame-Options|Content-Security-Policy|X-Content-Type-Options)"
  ```
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Content-Security-Policy: (check CSP is set)
  - Strict-Transport-Security (production only)

- [ ] **Error messages don't leak info**
  - 500 errors show generic message (not stack traces)
  - Database errors don't expose schema
  - Test: Trigger error, check response

- [ ] **Default credentials disabled**
  - No hardcoded passwords in source
  - ADMIN_PASSWORD_HASH removed from .env.example
  - Command: `grep -r "password.*=.*['\"]" src/ || echo PASS`

### A06: Vulnerable and Outdated Components

- [ ] **Dependency audit**
  ```bash
  pnpm audit --audit-level=moderate
  ```
  - Expected: 0 moderate+ vulnerabilities
  - If any found: Update or document exceptions

- [ ] **Regular updates scheduled**
  - Dependencies updated monthly
  - Security patches applied within 7 days
  - Next scheduled update: [DATE]

### A07: Identification and Authentication Failures

- [ ] **Brute force protection**
  - Login rate limited (20 attempts / 5 min)
  - Account lockout after repeated failures
  - Test: 25 failed logins in 2 minutes
  - Expected: Blocked after 20

- [ ] **Session handling**
  - Sessions invalidated on logout  
  - No concurrent session reuse
  - Test: Logout in tab 1, use session token in tab 2
  - Expected: 401 Unauthorized

- [ ] **Multi-device session management**
  - Users can view active sessions
  - Can revoke individual sessions
  - Verify: Check session management UI

### A08: Software and Data Integrity Failures

- [ ] **Package integrity**
  ```bash
  pnpm install --frozen-lockfile
  ```
  - Expected: Installs without warnings
  - package-lock.json committed to Git

- [ ] **Webhook signature validation** (if applicable)
  - All incoming webhooks verify signatures
  - Replay attacks prevented

### A09: Security Logging and Monitoring Failures

- [ ] **Audit logging operational**
  ```bash
  pnpm tsx -e "import { prisma } from './src/lib/db'; const count = await prisma.audit_logs.count(); console.log('Audit logs:', count > 0 ? 'PASS' : 'FAIL'); await prisma.\$disconnect();"
  ```

- [ ] **Sensitive operations logged**
  - All DELETE operations → audit_logs
  - Admin access attempts (success + fail)
  - Project sharing events
  - Data exports

- [ ] **Log retention policy**
  - Audit logs retained 7 years
  - Application logs retained 90 days
  - Security logs retained 1 year

### A10: Server-Side Request Forgery (SSRF)

- [ ] **URL validation in import features**
  - If app fetches external URLs, whitelist domains
  - Block internal IPs (127.0.0.1, 169.254.169.254)
  - Test: Try importing `http://169.254.169.254/` (AWS metadata)
  - Expected: Blocked

---

## XSS (Cross-Site Scripting) Testing

### Stored XSS

Test these payloads in all persistent fields (names, descriptions, comments):

```html
<script>alert('stored-xss')</script>
<img src=x onerror=alert('xss')>
<svg/onload=alert('xss')>
<iframe src="javascript:alert('xss')">
"><img src=x onerror=alert('xss')>
```

**Verification:**
- Payload should be HTML-encoded or stripped
- Alert should NOT execute when viewing the page
- Check browser DevTools console for errors

### Reflected XSS

Test query parameters:
```bash
curl "https://app.com/search?q=<script>alert('reflected')</script>"
```

Expected: Script tags escaped in response

### DOM-based XSS

Check client-side code for unsafe DOM manipulation:
- `innerHTML` usage (prefer `textContent`)
- `eval()` calls  
- `dangerouslySetInnerHTML` in React

---

## CSRF (Cross-Site Request Forgery) Testing

- [ ] **CSRF token validation**
  ```bash
  # POST without CSRF token
  curl -X POST https://app.com/api/projects \
    -H "Content-Type: application/json" \
    -H "Cookie: session=<token>" \
    -d '{"name":"test"}'
  ```
  - Expected: 403 Forbidden with "Invalid CSRF" message

- [ ] **SameSite cookie attribute**
  ```bash
  curl -I https://app.com | grep -i set-cookie
  ```
  - Verify cookies have `SameSite=Strict` or `SameSite=Lax`

---

## Authentication & Authorization Testing

### Password Security

- [ ] **Password strength requirements enforced**
  - Min 12 characters  
  - 1 uppercase, 1 lowercase, 1 number, 1 symbol
  - Test: Try weak password "Password123"
  - Expected: Rejected

- [ ] **Credential stuffing protection**
  - Rate limiting on login endpoint
  - Consider breach database check (HaveIBeenPwned API)

### Session Security

- [ ] **Session timeout**
  - Idle timeout: 30 minutes
  - Max session duration: 24 hours
  - Test: Wait 31 minutes, attempt action
  - Expected: 401 requires re-auth

- [ ] **Concurrent session limits**
  - Max 5 active sessions per user
  - Oldest revoked when limit exceeded

---

## Input Validation Testing

### Boundary Value Testing

Test with edge cases:
- Empty strings
- Very long strings (10,000+ chars)
- NULL values
- Negative numbers where positive expected
- Special characters: `'; DROP TABLE--`, `../../../etc/passwd`

### File Upload Validation

- [ ] **File type validation**
  - Check magic bytes, not just extension
  - Test: Upload `.php` file renamed to `.xlsx`
  - Expected: Rejected

- [ ] **File size limits**
  - Max 10MB enforced
  - Test: Upload 11MB file
  - Expected: 413 Payload Too Large

- [ ] **Filename sanitization**
  - No path traversal: `../../etc/passwd`
  - No special chars: `<script>.xlsx`

---

## Rate Limiting Testing

### Global Rate Limits

```bash
# Test 61 requests in 60 seconds
for i in {1..61}; do
  curl -s https://app.com/api/projects &
done
wait
```

Expected: Last requests return 429

### Login Rate Limits

```bash
# 21 login attempts in 3 minutes
for i in {1..21}; do
  curl -X POST https://app.com/api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
```

Expected: Blocked after 20 attempts

---

## API Security Testing

### Authorization

- [ ] **Every endpoint checks authentication**
  - Try accessing without session token
  - Expected: 401 Unauthorized

- [ ] **Object-level authorization**
  - User A tries to access User B's project
  - Test: `GET /api/projects/{user-b-project-id}` with User A token
  - Expected: 404 or 403

### Input Validation

- [ ] **All inputs validated with Zod schemas**
  - Check: All routes import from `api-validators.ts`
  - Command: `grep -r "validateRequest\|safeParse" src/app/api/`

### Output Encoding

- [ ] **API responses properly encoded**
  - JSON responses have `Content-Type: application/json`
  - No HTML in JSON responses
  - Special characters escaped

---

## Tools & Automation

### Automated Scanners

**OWASP ZAP (Baseline Scan)**
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://app.com \
  -r zap-report.html
```

**Nikto (Web Server Scan)**
```bash
nikto -h https://app.com -o nikto-report.txt
```

**npm audit (Dependency Scan)**
```bash
pnpm audit --json > audit-report.json
```

### Manual Testing Tools

- **Burp Suite Community**: Intercept and modify requests
- **Postman**: API testing with saved collections
- **Browser DevTools**: Network tab, console for XSS

---

## Test Reporting

### For Each Vulnerability Found

Document in this format:

**Vulnerability:** [Name/Type]
**Severity:** Critical / High / Medium / Low
**Status:** Open / In Progress / Fixed / Won't Fix

**Description:**
[What is the vulnerability?]

**Impact:**
[What could an attacker do?]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Recommendation:**
[How to fix]

**Evidence:**
[Screenshots, curl commands, logs]

---

## Testing Schedule

- **Before Each Deploy:** Critical items only (marked ⚠️)
- **Weekly:** Full OWASP Top 10 testing
- **Monthly:** Automated scanner runs (ZAP, Nikto)
- **Quarterly:** Manual penetration test by security team
- **Annually:** Third-party security audit

---

## Compliance Checks

### GDPR (if applicable)
- [ ] User data exportable
- [ ] User data deletable ("right to be forgotten")
- [ ] Consent tracked for data collection
- [ ] Privacy policy accessible

### SOC 2 Type II
- [ ] All requirements in this checklist
- [ ] Audit logs demonstrate compliance
- [ ] Access controls documented

---

## Sign-Off

**Security Testing Completed By:** __________________  
**Date:** __________  
**Deployment Approved:** [ ] Yes [ ] No

**Critical Issues Found:** ______  
**High Issues Found:** ______  
**All Critical Issues Resolved:** [ ] Yes [ ] No

**Notes:**
```
[Add any additional notes or exceptions here]
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-12  
**Next Review:** 2025-11-12
