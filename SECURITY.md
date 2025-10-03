# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: [your-security-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Best effort

## Security Measures

This application implements the following security measures:

### 1. Input Validation & Sanitization
- **DOMPurify** for XSS prevention
- Input length validation (50KB limit for RFP text)
- Numeric bounds checking
- Suspicious pattern detection (eval, Function, etc.)
- Recursive object sanitization

### 2. Security Headers
- Content Security Policy (CSP) with `unsafe-eval` only in development
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy

### 3. Rate Limiting
- Server-side rate limiting via middleware (60 req/min per IP)
- Client-side rate limiting for DoS prevention
- Processing timeouts (5s for RFP parsing)

### 4. CVE Protection
- **CVE-2025-29927**: Protected via middleware blocking `x-middleware-subrequest` header
- Regular dependency updates via Dependabot
- Automated security scanning via GitHub Actions

### 5. Error Handling
- Sanitized error messages in production
- No information disclosure through errors
- Secure logging with minimal sensitive data

### 6. Data Protection
- No sensitive data stored in localStorage without encryption
- Environment variables properly scoped (`NEXT_PUBLIC_*` for client)
- No hardcoded secrets or API keys
- `.env` file excluded from repository

## Dependency Security

### Automated Scanning
- **npm audit**: Weekly automated scans
- **Dependabot**: Automatic dependency updates
- **Semgrep**: Static code analysis
- **CodeQL**: Security vulnerability detection
- **TruffleHog**: Secret detection

### Current Dependency Status
All dependencies are up-to-date with no known critical vulnerabilities as of last scan.

## Development Guidelines

### For Contributors

1. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to `.gitignore`
   - Use `git-secrets` or similar tools

2. **Validate all inputs**
   - Use `sanitizeHtml()` for user-provided text
   - Use `sanitizeNumber()` for numeric inputs
   - Check input lengths and bounds

3. **Follow secure coding practices**
   - No `eval()` or `Function()` constructor
   - No `dangerouslySetInnerHTML` without DOMPurify
   - Use parameterized queries (if adding database)
   - Implement CSRF protection for state-changing operations

4. **Test security features**
   - Write tests for input validation
   - Test rate limiting
   - Verify CSP headers
   - Check error sanitization

5. **Review dependencies**
   - Audit new dependencies before adding
   - Keep dependencies up-to-date
   - Remove unused dependencies

## Security Checklist for PRs

- [ ] No hardcoded secrets or API keys
- [ ] Input validation added for new user inputs
- [ ] Rate limiting considered for new endpoints
- [ ] Error handling sanitizes sensitive information
- [ ] Dependencies reviewed and up-to-date
- [ ] Security tests added (if applicable)
- [ ] CSP headers compatible with new features
- [ ] No new `unsafe-eval` or `unsafe-inline` usage

## Known Limitations

1. **Authentication**: Not implemented (client-side only app)
2. **Rate Limiting**: In-memory (not suitable for multi-instance deployments without Redis)
3. **CSP**: Requires `unsafe-inline` for styles (Next.js limitation)

## Future Security Enhancements

- [ ] Implement nonce-based CSP for stricter security
- [ ] Add CSRF protection when server-side mutations are added
- [ ] Implement distributed rate limiting with Redis
- [ ] Add authentication/authorization framework
- [ ] Implement security event monitoring and alerting
- [ ] Add API request signing
- [ ] Implement Content Security Policy reporting

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [npm Security Best Practices](https://docs.npmjs.com/about-security-best-practices)

## Contact

For security-related questions or concerns:
- Email: [your-security-email@example.com]
- Security Advisory: Create a security advisory on GitHub

---

Last Updated: 2025-10-03
