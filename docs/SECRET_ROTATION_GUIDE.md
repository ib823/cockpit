# Secret Rotation Guide

## Overview

This guide covers the process of rotating sensitive secrets on a 90-day cycle to maintain security best practices. Regular secret rotation reduces the risk of credential compromise and limits the window of exposure if a secret is leaked.

## Rotation Policy

### Rotation Schedule
- **Interval**: Every 90 days
- **Warning Period**: 30 days before expiration
- **Grace Period**: None - rotation should happen immediately when due

### Secrets Included in Rotation
1. `NEXTAUTH_SECRET` - Session encryption key
2. `ADMIN_PASSWORD_HASH` - Emergency admin account password
3. `VAPID_PRIVATE_KEY` - Push notification signing key
4. `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token

### Secrets NOT Rotated Automatically
- `DATABASE_URL` - Managed by database provider
- `WEBAUTHN_RP_ID` - Fixed to domain, cannot change
- `RESEND_API_KEY` - Managed in Resend dashboard
- API keys for third-party services (rotate per their guidelines)

## Rotation Process

### 1. Check Rotation Status

Run the status check command:

```bash
npx tsx scripts/rotate-secrets.ts --check
```

**Sample Output:**
```
🔍 SECRET ROTATION STATUS

============================================================

✅ UP TO DATE (>30 days until rotation):

   NEXTAUTH_SECRET
   Next rotation: 2025-12-15 (75 days)

   ADMIN_PASSWORD_HASH
   Next rotation: 2025-12-20 (80 days)

⚠️  NEEDS ROTATION (Within 30 days):

   VAPID_PRIVATE_KEY
   Last rotated: 2025-08-01
   Rotate in: 15 days (2025-11-01)

============================================================

💡 RECOMMENDATION:
   Plan secret rotation soon. Run with --rotate when ready.
```

### 2. Plan Rotation Window

**Recommended Times:**
- **Low Traffic**: Early morning or late evening
- **Maintenance Window**: During scheduled maintenance
- **Avoid**: Peak business hours, holidays, critical releases

**Preparation Checklist:**
- [ ] Notify team of planned rotation
- [ ] Ensure backup systems are functional
- [ ] Have rollback plan ready
- [ ] Test in staging environment first

### 3. Perform Rotation

Run the rotation script:

```bash
npx tsx scripts/rotate-secrets.ts --rotate
```

**Output Example:**
```
🔐 SECRET ROTATION COMPLETE

============================================================

⚠️  IMPORTANT: Update these secrets in your environment:

NEXTAUTH_SECRET:
   kX7vYmZ9pQw3nLt8rKj5hGf2dSa1bVc4xWe6yUi0oMz=
   (Copy this value to your .env file)

ADMIN_PASSWORD_HASH:
   MANUAL_ACTION_REQUIRED: Hash this password with bcrypt: a9f3e7d6c2b1...

VAPID_PRIVATE_KEY:
   MANUAL_ACTION_REQUIRED: Generate new VAPID keys using: npx web-push generate-vapid-keys

UPSTASH_REDIS_REST_TOKEN:
   MANUAL_ACTION_REQUIRED: Generate new token in Upstash Console

============================================================

📝 Next Steps:

1. Update the secrets in your environment (.env, secrets manager, etc.)
2. Restart your application to use the new secrets
3. Verify everything works correctly
4. Remove old secrets from backup/recovery systems after verification
5. Update deployment pipelines with new secrets

📦 Rotation record backed up to: .secret-rotation.backup.1729594800000.json
```

### 4. Update Secrets in Environments

#### Development
```bash
# Edit .env file
nano .env

# Update the rotated secrets
NEXTAUTH_SECRET=kX7vYmZ9pQw3nLt8rKj5hGf2dSa1bVc4xWe6yUi0oMz=

# Restart development server
npm run dev
```

#### Staging/Production

**Using Environment Variables:**
```bash
# Vercel
vercel env add NEXTAUTH_SECRET production

# Railway
railway variables set NEXTAUTH_SECRET=<new-value>

# AWS/Other platforms
# Update via platform-specific CLI or console
```

**Using Secrets Manager:**
```bash
# AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id cockpit/nextauth-secret \
  --secret-string "kX7vYmZ9pQw3nLt8rKj5hGf2dSa1bVc4xWe6yUi0oMz="

# HashiCorp Vault
vault kv put secret/cockpit/nextauth-secret value="<new-value>"
```

### 5. Manual Rotation Steps

Some secrets require manual steps:

#### ADMIN_PASSWORD_HASH

1. Get the generated password from rotation output
2. Hash it with bcrypt:
   ```bash
   npx tsx -e "
     import bcrypt from 'bcryptjs';
     const hash = bcrypt.hashSync('PASSWORD_FROM_OUTPUT', 12);
     console.log(hash);
   "
   ```
3. Update `ADMIN_PASSWORD_HASH` in environment
4. Store password securely in password manager

#### VAPID_PRIVATE_KEY

1. Generate new VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Update both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
3. Update service worker with new public key
4. Existing push subscriptions will need to re-subscribe

#### UPSTASH_REDIS_REST_TOKEN

1. Login to [Upstash Console](https://console.upstash.com/)
2. Navigate to your Redis database
3. Go to "REST API" section
4. Click "Rotate Token" or "Generate New Token"
5. Copy new token and URL
6. Update `UPSTASH_REDIS_REST_TOKEN` in environment

### 6. Verification

After rotation, verify each service:

```bash
# Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Test rate limiting (Redis)
for i in {1..6}; do
  curl https://your-domain.com/api/auth/send-otp \
    -d '{"email":"test@example.com"}'
done
# Should rate limit after 3 attempts

# Test push notifications
curl -X POST https://your-domain.com/api/notifications/test

# Check application logs for errors
tail -f /var/log/app.log
```

### 7. Rollback Procedure

If issues occur after rotation:

1. **Immediate Rollback:**
   ```bash
   # Restore previous secrets from backup
   cp .secret-rotation.backup.TIMESTAMP.json .secret-rotation.json

   # Update environment with old values (stored in backup)
   # Restart application
   ```

2. **Investigate Issue:**
   - Check application logs
   - Verify secret format and encoding
   - Test individual services

3. **Fix and Retry:**
   - Fix identified issues
   - Run rotation again with `--force` if needed

## Automation

### GitHub Actions Workflow

A weekly workflow checks rotation status:

```yaml
# .github/workflows/secret-rotation-check.yml
name: Secret Rotation Check
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
```

**Actions Taken:**
- ✅ Creates GitHub Issue if secrets are overdue
- ✅ Sends Slack notification (if configured)
- ✅ Uploads rotation status as artifact

### Manual Trigger

Trigger the check manually:

```bash
# GitHub CLI
gh workflow run secret-rotation-check.yml

# Or via GitHub Actions UI
# Actions → Secret Rotation Check → Run workflow
```

### Calendar Reminders

Set up calendar reminders for rotation:

```bash
# Add to team calendar (adjust date)
# Title: Secret Rotation Due
# Description: Run: npx tsx scripts/rotate-secrets.ts --check
# Recurrence: Every 90 days
# Reminder: 30 days before
```

## Best Practices

### 1. Never Commit Secrets
- ❌ Never commit `.env` files
- ❌ Never hardcode secrets in code
- ✅ Use environment variables
- ✅ Use secrets managers (Vault, AWS Secrets Manager, etc.)

### 2. Rotation Hygiene
- Rotate during low-traffic periods
- Test in staging first
- Have rollback plan ready
- Verify after rotation
- Update all environments simultaneously

### 3. Secret Storage
- Use different secrets per environment (dev/staging/prod)
- Store in secure password manager (1Password, LastPass, etc.)
- Limit access to secrets on need-to-know basis
- Audit who has access to secrets regularly

### 4. Documentation
- Document rotation in change log
- Update runbooks with new procedures
- Notify team of completed rotation
- Keep rotation records backed up

### 5. Monitoring
- Set up alerts for failed authentication after rotation
- Monitor application errors post-rotation
- Check rate limiting functionality
- Verify push notifications working

## Troubleshooting

### Issue: Application won't start after rotation

**Symptoms:** 500 errors, "Invalid secret" messages

**Solutions:**
1. Check secret format (base64, hex, etc.)
2. Verify no extra whitespace in `.env`
3. Ensure secrets are properly escaped
4. Check environment variables loaded correctly:
   ```bash
   npx tsx -e "console.log(process.env.NEXTAUTH_SECRET?.length)"
   ```

### Issue: Sessions invalidated after NEXTAUTH_SECRET rotation

**Expected Behavior:** This is normal. All users will need to re-login.

**Solutions:**
1. Notify users in advance of rotation
2. Add banner: "You will be logged out for maintenance"
3. Consider gradual rollout if using multiple instances

### Issue: Redis connection failing after token rotation

**Symptoms:** Rate limiting not working, Redis errors in logs

**Solutions:**
1. Verify new token in Upstash console
2. Check URL hasn't changed
3. Test connection:
   ```bash
   curl https://YOUR_REDIS_URL/ping \
     -H "Authorization: Bearer NEW_TOKEN"
   ```
4. Restart application to pick up new token

### Issue: Push notifications not sending after VAPID rotation

**Symptoms:** Push subscription errors, "Invalid VAPID key"

**Solutions:**
1. Verify both public AND private keys updated
2. Update service worker with new public key
3. Users need to re-subscribe to notifications
4. Clear service worker cache:
   ```javascript
   navigator.serviceWorker.getRegistrations()
     .then(regs => regs.forEach(reg => reg.unregister()));
   ```

## Compliance and Auditing

### Security Standards

This rotation policy helps meet:
- **SOC 2**: Regular credential rotation requirement
- **PCI DSS**: 90-day password rotation (for admin accounts)
- **ISO 27001**: Access control and key management
- **NIST**: Cryptographic key management guidelines

### Audit Trail

The rotation script maintains an audit trail:

```json
{
  "secretName": "NEXTAUTH_SECRET",
  "lastRotated": "2025-10-22T10:00:00.000Z",
  "nextRotation": "2026-01-20T10:00:00.000Z",
  "rotationInterval": 90
}
```

**Audit Questions:**
- When was each secret last rotated?
- Are any secrets overdue?
- Who performed the rotation?
- Were any issues encountered?

**Export audit log:**
```bash
cat .secret-rotation.json | jq '.' > audit-report.json
```

## Emergency Rotation

If a secret is compromised:

1. **Immediate Action:**
   ```bash
   # Force immediate rotation
   npx tsx scripts/rotate-secrets.ts --force
   ```

2. **Update all environments immediately** (no staging testing)

3. **Revoke compromised credentials** in external services

4. **Investigate breach:**
   - How was secret exposed?
   - What data was accessed?
   - Update security measures

5. **Document incident:**
   - Create incident report
   - Update security procedures
   - Notify stakeholders if required

## References

- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [NIST Cryptographic Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [AWS Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [HashiCorp Vault Dynamic Secrets](https://www.vaultproject.io/docs/secrets)

## Support

For questions or issues with secret rotation:

1. Check this documentation
2. Review troubleshooting section
3. Contact security team: security@your-company.com
4. Create GitHub issue with label `security`

---

**Last Updated:** 2025-10-22
**Next Review:** 2026-01-20
