# Security Policy

## Supported Versions

We actively maintain security updates for the current version of SAP Implementation Cockpit.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Features

### Authentication & Authorization

- **NextAuth 4.24**: Industry-standard JWT-based authentication
- **WebAuthn/Passkeys**: FIDO2-compliant biometric authentication
- **Role-Based Access Control**: USER, MANAGER, ADMIN roles with granular permissions
- **Session Security**: HTTP-only, secure, SameSite=Lax cookies with 24-hour expiration
- **Password Security**: bcrypt hashing with salt rounds (when passwords are used)

### Infrastructure Security

- **Rate Limiting**:
  - 60 requests/minute per IP globally
  - 5 login attempts per 5 minutes per IP
  - Upstash Redis-backed in production
- **CSRF Protection**: NextAuth built-in CSRF tokens + SameSite cookies
- **SQL Injection Protection**: Parameterized queries via Prisma ORM
- **XSS Protection**: React automatic escaping + DOMPurify for HTML sanitization
- **Security Headers**:
  - Content-Security-Policy (CSP)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security (HSTS) in production
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy for camera/microphone/geolocation

### Audit & Monitoring

- **Audit Logging**: All admin access and security events logged to `AuditEvent` table
- **Failed Login Tracking**: Unauthorized access attempts logged with IP, user agent, timestamp
- **Admin Access Monitoring**: All admin route access logged with full context
- **CVE Mitigation**: Blocks Next.js internal headers (CVE-2025-29927)

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Reporting Process

1. **Email**: Send vulnerability details to your organization's security team
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if available)
3. **Response Time**: We aim to acknowledge reports within 48 hours
4. **Disclosure**: We follow coordinated disclosure practices

### What to Report

Report any security issues including but not limited to:

- Authentication bypass or privilege escalation
- SQL injection or XSS vulnerabilities
- CSRF vulnerabilities
- Information disclosure (PII, credentials, tokens)
- Denial of Service (DoS) vulnerabilities
- Insecure cryptographic practices
- Dependency vulnerabilities (if exploitable in our context)

### What NOT to Report

The following are expected behavior and not vulnerabilities:

- Missing HTTP security headers in development mode
- In-memory rate limiting fallback (dev only - documented)
- Rate limit test endpoints (dev only)
- Console logs in development mode
- Missing HSTS header on localhost

## Security Best Practices for Deployment

### Environment Variables

**Critical**: Never commit `.env.local` or expose these variables:

- `NEXTAUTH_SECRET`: Minimum 32 characters, cryptographically random
- `DATABASE_URL`: Contains credentials - use connection pooling in production
- `UPSTASH_REDIS_REST_TOKEN`: Required for distributed rate limiting
- `RESEND_API_KEY`: Email service credentials
- `RP_ID`: WebAuthn relying party ID (must match domain)

Generate secure secrets:
```bash
openssl rand -base64 32
```

### Database Security

- **Connection Pooling**: Use `DATABASE_URL` with connection limits
- **Least Privilege**: Database user should only have necessary permissions
- **Backup Strategy**: Regular automated backups with encryption
- **SSL/TLS**: Always use encrypted connections to database

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use Upstash Redis (not in-memory rate limiting)
- [ ] Enable HSTS headers (automatic in production)
- [ ] Configure CSP to match your CDN/assets
- [ ] Set up database connection pooling (Neon, Supabase, or PgBouncer)
- [ ] Enable audit log monitoring/alerting
- [ ] Rotate `NEXTAUTH_SECRET` periodically (invalidates all sessions)
- [ ] Configure CORS policies if using separate frontend
- [ ] Set up DDoS protection (Cloudflare, AWS Shield)
- [ ] Enable database backups with point-in-time recovery

### WebAuthn Configuration

For production WebAuthn/Passkeys:

- `RP_ID` must match your domain exactly (e.g., `app.example.com`)
- `RP_NAME` should be your application display name
- `RP_ORIGIN` must include protocol and port if non-standard
- Test on staging with production-like domain structure

### Monitoring & Alerting

Recommended monitoring:

- **Failed login attempts**: Alert on >10 failures from single IP in 5 minutes
- **Admin access patterns**: Alert on unusual admin access times/locations
- **Rate limit violations**: Track and alert on sustained rate limit hits
- **Database errors**: Monitor for query failures (potential injection attempts)
- **Session token generation**: Alert on unusual token generation rates

## Development Guidelines

### For Contributors

1. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to `.gitignore`
   - Run `git-secrets` or similar tools

2. **Validate all inputs**
   - Use Zod schemas for validation
   - Sanitize HTML with DOMPurify
   - Check input lengths and bounds

3. **Follow secure coding practices**
   - No `eval()` or `Function()` constructor
   - No `dangerouslySetInnerHTML` without DOMPurify
   - Use Prisma for database queries (automatic parameterization)
   - Use NextAuth CSRF protection for mutations

4. **Test security features**
   - Write tests for input validation
   - Test rate limiting
   - Verify security headers
   - Test RBAC permissions

5. **Review dependencies**
   - Audit new dependencies: `pnpm audit`
   - Keep dependencies up-to-date
   - Remove unused dependencies

### Security Checklist for PRs

- [ ] No hardcoded secrets or API keys
- [ ] Input validation added for new user inputs
- [ ] Rate limiting considered for new endpoints
- [ ] Error handling sanitizes sensitive information
- [ ] Dependencies reviewed (`pnpm audit` passing)
- [ ] Security tests added (if applicable)
- [ ] CSP headers compatible with new features
- [ ] No new `unsafe-eval` or `unsafe-inline` usage
- [ ] RBAC permissions verified for new routes

## Security Maintenance

### Dependency Updates

- **Critical vulnerabilities**: Patched within 24 hours
- **High severity**: Patched within 1 week
- **Medium severity**: Patched in next release cycle

Run security audits:
```bash
pnpm audit
```

### Next.js & React Updates

We track security advisories for:
- Next.js (currently 15.5.3)
- React (currently 19.1.1)
- NextAuth (currently 4.24.11)
- Prisma (currently 6.16.2)

## Incident Response

If a security incident occurs:

1. **Contain**: Disable affected endpoints/features immediately
2. **Assess**: Determine scope and impact via audit logs
3. **Remediate**: Apply patches/fixes
4. **Notify**: Inform affected users (if PII/data breach)
5. **Document**: Update audit logs and incident report
6. **Review**: Conduct post-mortem and improve processes

## Compliance

This application implements security controls aligned with:

- OWASP Top 10 (2021)
- NIST Cybersecurity Framework
- CIS Controls v8
- GDPR requirements for data protection (if applicable)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [WebAuthn Guide](https://webauthn.guide/)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

## Security Contact

For security-related questions or to report vulnerabilities, contact your organization's security team.

---

**Last Updated**: January 2025
