# Admin Account Setup

## Security Notice

⚠️ **CRITICAL**: Never commit admin credentials to version control. Always set them via environment variables in your deployment platform.

## Initial Admin Creation

### Option 1: Using Script (Recommended)

```bash
pnpm tsx scripts/set-admin-code.ts
```

This interactive script will:

1. Prompt for admin email address
2. Prompt for secure password
3. Generate bcrypt hash automatically
4. Store credentials securely

### Option 2: Manual Hash Generation

1. Generate password hash using bcryptjs:

```bash
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword123!', 10))"
```

2. Set environment variables in your hosting platform (Vercel/AWS/etc):

```env
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD_HASH=$2a$10$[your-generated-hash-here]
```

3. Deploy your application

### Option 3: Environment Variables Only (Production)

For production environments, set these variables directly in your hosting platform:

**Vercel:**

```bash
vercel env add ADMIN_EMAIL
vercel env add ADMIN_PASSWORD_HASH
```

**AWS/Other:**
Use your platform's environment variable management system.

## Password Requirements

Admin passwords **MUST** meet these minimum requirements:

- ✅ Minimum 12 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&\*()\_+-=[]{}|;:,.<>?)
- ✅ No common dictionary words
- ✅ Not previously breached (check at https://haveibeenpwned.com/Passwords)

**Example strong passwords:**

- `Tr0ub4dor&3!Xkcd`
- `correct-horse-BATTERY-staple-2024!`
- `MyC0mp@nyN@me-S3cur3-2024`

## Security Best Practices

### Never Do This

❌ **DON'T** commit credentials to Git:

```env
# .env file (DON'T COMMIT THIS)
ADMIN_PASSWORD_HASH=actual-hash-here
```

❌ **DON'T** share passwords via email or Slack

❌ **DON'T** use weak passwords like `Admin123!`

❌ **DON'T** reuse passwords from other systems

### Always Do This

✅ **DO** use environment variables in production

✅ **DO** rotate passwords every 90 days

✅ **DO** use a password manager (1Password, LastPass, Bitwarden)

✅ **DO** enable 2FA/MFA when available

✅ **DO** log all admin authentication attempts

## Password Rotation

Admin passwords should be rotated every **90 days**. See [SECRETS_ROTATION.md](./SECRETS_ROTATION.md) for the complete rotation procedure.

### Quick Rotation Steps:

1. Generate new password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('NewPassword123!', 10))"
```

2. Update environment variable in your hosting platform

3. Test login with new credentials

4. Document rotation in audit logs:

```bash
echo "Admin password rotated on $(date)" >> logs/security-audit.log
```

## Troubleshooting

### Cannot Login as Admin

**Symptom**: Admin login fails with "Invalid credentials"

**Checklist**:

1. ✅ Verify `ADMIN_EMAIL` matches exactly (case-sensitive)
2. ✅ Verify `ADMIN_PASSWORD_HASH` is set in environment
3. ✅ Check application logs for authentication errors
4. ✅ Ensure bcrypt hash was generated correctly (should start with `$2a$10$` or `$2b$10$`)
5. ✅ Confirm environment variables are loaded (restart app after changes)

**Debug Command:**

```bash
# Check if environment variables are set (don't print actual values!)
node -e "console.log('ADMIN_EMAIL set:', !!process.env.ADMIN_EMAIL)"
node -e "console.log('ADMIN_PASSWORD_HASH set:', !!process.env.ADMIN_PASSWORD_HASH)"
```

### Need to Reset Admin Password

If you've lost the admin password:

1. **If you have access to the hosting platform:**
   - Update `ADMIN_PASSWORD_HASH` environment variable
   - Redeploy application

2. **If you have database access:**
   - Run `scripts/set-admin-code.ts` directly on server
   - Or manually update users table with new hash

3. **If locked out completely:**
   - Contact database administrator
   - Follow incident response procedure
   - Document the security event

### Password Hash Validation

To verify a password hash is valid bcrypt format:

```bash
node -e "
const hash = process.env.ADMIN_PASSWORD_HASH;
if (!hash) {
  console.log('❌ ADMIN_PASSWORD_HASH not set');
} else if (!hash.startsWith('\$2a\$') && !hash.startsWith('\$2b\$')) {
  console.log('❌ Invalid hash format');
} else if (hash.length !== 60) {
  console.log('❌ Invalid hash length (should be 60 chars)');
} else {
  console.log('✅ Hash format is valid');
}
"
```

## Development vs Production

### Development (.env.local)

For local development only:

```env
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD_HASH=$2a$10$YourDevHashHere
```

**Note**: Development credentials should be different from production!

### Production (Platform Environment Variables)

Production credentials should:

- Never exist in any file in the repository
- Be set only via hosting platform's secure environment variable system
- Be rotated regularly (every 90 days minimum)
- Be documented in your team's password manager

## Compliance & Auditing

### SOC 2 / ISO 27001 Requirements

If your organization requires compliance:

1. **Access Logging**: All admin logins are automatically logged to `audit_logs` table
2. **Password Policy**: Enforced minimum requirements (see above)
3. **Rotation Policy**: 90-day maximum password age
4. **MFA**: Implement WebAuthn passkeys for admin accounts (see WebAuthn setup docs)

### Audit Log Query

To review admin authentication attempts:

```sql
SELECT
  createdAt,
  action,
  userId,
  ipAddress,
  userAgent,
  changes
FROM audit_logs
WHERE action = 'ADMIN_LOGIN'
ORDER BY createdAt DESC
LIMIT 50;
```

## Emergency Access Procedure

In case of emergency (account lockout, security incident):

1. **Immediate**: Contact on-call engineer or CTO
2. **Within 1 hour**: Reset credentials using emergency procedure
3. **Within 24 hours**: Conduct security review
4. **Within 48 hours**: Document incident and update procedures

## Support

For questions or issues:

- 📧 Email: security@yourcompany.com
- 💬 Slack: #security-team
- 📖 Docs: https://docs.yourcompany.com/security

---

**Last Updated**: 2025-10-12
**Owner**: Security Team
**Review Schedule**: Quarterly
