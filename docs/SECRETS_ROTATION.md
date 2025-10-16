# Secrets Rotation Policy

## Overview
This document defines the policy and procedures for rotating sensitive credentials and secrets used in the SAP Implementation Cockpit application.

## Rotation Schedule

| Secret Type | Rotation Frequency | Responsible Team | Method |
|-------------|-------------------|------------------|---------|
| NEXTAUTH_SECRET | Every 90 days | DevOps | Manual |
| Database Password | Every 90 days | DBA Team | Automated Script |
| API Keys (Resend) | Every 180 days | DevOps | Manual |
| API Keys (Upstash Redis) | Every 180 days | DevOps | Manual |
| Admin Password Hash | Every 90 days | Security Team | Script |
| Service Account Keys | Every 90 days | DevOps | Automated |
| TLS Certificates | Before expiry (-90 days) | DevOps | Automated (Let's Encrypt) |
| WebAuthn RP Secret | Every 180 days | DevOps | Manual |

## Standard Rotation Procedure

### Phase 1: Pre-Rotation (1-2 days before)

**Checklist:**
- [ ] Schedule maintenance window if needed (off-peak hours)
- [ ] Notify team in #engineering Slack channel
- [ ] Backup current configuration to secure vault (1Password/Vault)
- [ ] Prepare rollback plan
- [ ] Test secret generation scripts
- [ ] Verify monitoring alerts are active

### Phase 2: Rotation Execution

#### A. NEXTAUTH_SECRET Rotation

```bash
# 1. Generate new 32-byte secret
NEW_SECRET=$(openssl rand -base64 32)
echo "New NEXTAUTH_SECRET generated (DO NOT LOG THIS): $NEW_SECRET"

# 2. Deploy to staging with new secret
vercel env add NEXTAUTH_SECRET staging
# Paste $NEW_SECRET when prompted

# 3. Test staging for 24-48 hours
curl https://staging.yourapp.com/api/auth/session
# Verify users can still login

# 4. Deploy to production
vercel env add NEXTAUTH_SECRET production
# Paste same $NEW_SECRET

# 5. Trigger redeployment
vercel --prod

# 6. Monitor error logs for 1 hour
vercel logs --prod --follow

# 7. After 7 days with no issues, remove old backup
# (Old secret stays in encrypted backup for disaster recovery)
```

#### B. Database Password Rotation

```bash
# 1. Generate strong password
NEW_DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-32)

# 2. Create new database user with new password
psql $DATABASE_URL -c "CREATE USER cockpit_app_new WITH PASSWORD '$NEW_DB_PASSWORD';"

# 3. Grant same permissions as old user
psql $DATABASE_URL -c "GRANT ALL PRIVILEGES ON DATABASE cockpit TO cockpit_app_new;"
psql $DATABASE_URL -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cockpit_app_new;"

# 4. Update connection string
NEW_DATABASE_URL="postgresql://cockpit_app_new:$NEW_DB_PASSWORD@host:5432/cockpit"

# 5. Deploy to staging
vercel env add DATABASE_URL staging
# Paste $NEW_DATABASE_URL

# 6. Test staging for 24 hours
# Run: pnpm test:database (from staging)

# 7. Deploy to production
vercel env add DATABASE_URL production
vercel --prod

# 8. After 7 days, drop old user
psql $DATABASE_URL -c "DROP USER cockpit_app;"
psql $DATABASE_URL -c "ALTER USER cockpit_app_new RENAME TO cockpit_app;"
```

#### C. API Keys (Resend Email)

```bash
# 1. Log into Resend dashboard
# https://resend.com/api-keys

# 2. Create new API key
#    Name: "cockpit-prod-2024-Q2" (include rotation date)
#    Permissions: Send emails only

# 3. Copy new key (only shown once!)

# 4. Update in Vercel
vercel env add RESEND_API_KEY production
# Paste new key

# 5. Trigger redeployment
vercel --prod

# 6. Test email sending
curl -X POST https://yourapp.com/api/test-email \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 7. After 7 days, delete old key from Resend dashboard
```

#### D. Upstash Redis Keys

```bash
# 1. Log into Upstash console
# https://console.upstash.com

# 2. For existing database:
#    - Go to database details
#    - Click "Reset Password"
#    - Copy new REST URL and token

# 3. Update environment variables
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# 4. Deploy and test rate limiting
vercel --prod

# 5. Monitor rate limit metrics for 24 hours
```

#### E. Admin Password Hash

```bash
# Using automated script
pnpm tsx scripts/rotate-admin-password.ts

# Script will:
# 1. Prompt for new password
# 2. Validate password strength
# 3. Generate bcrypt hash
# 4. Update ADMIN_PASSWORD_HASH in environment
# 5. Log rotation in audit_logs table
# 6. Send notification to security team
```

### Phase 3: Post-Rotation Validation

**Immediate (0-1 hour):**
- [ ] All environments connecting successfully
- [ ] No authentication errors in logs
- [ ] Monitor error rates (should be unchanged)
- [ ] Test all critical user flows

**Short-term (24 hours):**
- [ ] Rate limiting working (if Redis rotated)
- [ ] Email sending working (if Resend rotated)
- [ ] Admin login working (if admin hash rotated)
- [ ] Run automated smoke tests: `pnpm test:smoke`

**Long-term (7 days):**
- [ ] No increase in error rates
- [ ] No user-reported issues
- [ ] Monitoring shows stable metrics
- [ ] Update secrets inventory spreadsheet
- [ ] Delete/revoke old secrets

### Phase 4: Documentation

After successful rotation:

1. **Update Secrets Inventory**
   - Spreadsheet location: `1Password > Engineering Vault > Secrets Inventory`
   - Record: Secret name, rotation date, next rotation due, rotated by

2. **Log in Audit System**
   ```sql
   INSERT INTO audit_logs (id, userId, action, entity, entityId, changes, createdAt)
   VALUES (
     gen_random_uuid(),
     'security-team',
     'UPDATE',
     'secret_rotation',
     'NEXTAUTH_SECRET',
     '{"rotated_at": "2024-10-12T10:30:00Z", "next_due": "2025-01-10"}',
     NOW()
   );
   ```

3. **Set Calendar Reminder**
   - Create reminder for next rotation date
   - Assign to responsible team
   - Include link to this procedure

4. **Update Incident Response Playbook** (if process changed)

## Emergency Rotation (Compromise Detected)

**Execute within 1 hour of detection**

### Immediate Actions (0-15 minutes)

1. **Identify Scope**
   - Which secret(s) were compromised?
   - How was the compromise discovered?
   - Is active exploitation occurring?

2. **Isolate**
   - Revoke compromised credentials immediately
   - Block suspicious IP addresses
   - Disable compromised user accounts

3. **Rotate**
   ```bash
   # Emergency rotation script
   ./scripts/emergency-rotate.sh --secret=NEXTAUTH_SECRET --reason="security_incident"
   ```

4. **Verify**
   - Confirm no unauthorized access
   - Check for data exfiltration
   - Review audit logs for timeframe

### Emergency Rotation Script

```bash
#!/bin/bash
# scripts/emergency-rotate.sh

set -e

echo "⚠️  EMERGENCY SECRET ROTATION ⚠️"
echo "Incident detected at: $(date)"
echo ""

read -p "Which secret compromised? [nextauth|db|redis|admin|resend]: " SECRET_TYPE
read -p "Incident ticket ID: " TICKET_ID

case $SECRET_TYPE in
  nextauth)
    echo "Rotating NEXTAUTH_SECRET..."
    NEW_SECRET=$(openssl rand -base64 32)
    
    # Update production immediately
    echo "$NEW_SECRET" | vercel env add NEXTAUTH_SECRET production --force
    
    # Trigger immediate redeploy
    vercel --prod --force
    
    # Invalidate all existing sessions
    psql $DATABASE_URL -c "DELETE FROM sessions WHERE \"expires\" > NOW();"
    
    echo "✓ NEXTAUTH_SECRET rotated"
    echo "✓ All user sessions invalidated (users must re-login)"
    ;;

  db)
    echo "Rotating database password..."
    NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Update password immediately
    psql $DATABASE_URL -c "ALTER USER cockpit_app PASSWORD '$NEW_PASSWORD';"
    
    # Update connection string
    NEW_URL="postgresql://cockpit_app:$NEW_PASSWORD@${DB_HOST}:5432/${DB_NAME}"
    echo "$NEW_URL" | vercel env add DATABASE_URL production --force
    
    # Redeploy
    vercel --prod --force
    
    echo "✓ Database password rotated"
    ;;

  redis)
    echo "⚠️  Upstash Redis: Manual rotation required"
    echo "1. Go to https://console.upstash.com"
    echo "2. Reset password for database"
    echo "3. Run: vercel env add UPSTASH_REDIS_REST_URL production"
    echo "4. Run: vercel env add UPSTASH_REDIS_REST_TOKEN production"
    echo "5. Run: vercel --prod"
    ;;

  admin)
    echo "Rotating admin password..."
    pnpm tsx scripts/emergency-admin-reset.ts --incident=$TICKET_ID
    ;;

  resend)
    echo "⚠️  Resend API: Manual rotation required"
    echo "1. Go to https://resend.com/api-keys"
    echo "2. Delete compromised key immediately"
    echo "3. Create new key"
    echo "4. Run: vercel env add RESEND_API_KEY production"
    echo "5. Run: vercel --prod"
    ;;

  *)
    echo "Unknown secret type: $SECRET_TYPE"
    exit 1
    ;;
esac

# Log incident
echo "Logging to audit system..."
curl -X POST https://yourapp.com/api/admin/audit \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"EMERGENCY_SECRET_ROTATION\",
    \"secret\": \"$SECRET_TYPE\",
    \"incident\": \"$TICKET_ID\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }"

echo ""
echo "✓ Emergency rotation complete"
echo "Next steps:"
echo "  1. Review access logs for unauthorized activity"
echo "  2. File incident report: https://incident.yourcompany.com"
echo "  3. Notify security team: #security-incidents"
echo "  4. Schedule post-incident review"
```

### Post-Incident Actions (1-24 hours)

- [ ] Root cause analysis completed
- [ ] Incident report filed in ticketing system
- [ ] Security team debriefing conducted  
- [ ] Identify and implement preventive measures
- [ ] Review and update monitoring alerts
- [ ] Customer notification (if required by contract/regulations)

## Secrets Storage Best Practices

### Production Secrets

**Storage:** Vercel Environment Variables
- Encrypted at rest by Vercel
- Separate environments (staging/production)
- Access controlled by team permissions
- Audit log of all changes

**Backup:** 1Password Team Vault
- "Engineering Secrets" vault
- Encrypted with master password + 2FA
- Shared only with authorized team members
- Disaster recovery use only

### Development Secrets

**Storage:** `.env.local` (gitignored)
- Different values from production
- Never commit to version control
- Each developer manages their own
- Shared via secure channel only (1Password)

**Never:**
- Email secrets
- Post in Slack/Teams
- Commit to Git
- Store in plain text files

### CI/CD Secrets

**Storage:** GitHub Actions Secrets
- Encrypted by GitHub
- Scoped to specific workflows
- Masked in logs automatically
- Same rotation schedule as production

## Secrets Inventory

Maintain spreadsheet with:
- Secret name and purpose
- Owner/responsible team
- Last rotated date
- Next rotation due date
- Storage location(s)
- Dependencies (what breaks if rotated incorrectly)

**Template:** 
```
| Secret              | Owner   | Last Rotated | Next Due   | Location          |
|---------------------|---------|--------------|------------|-------------------|
| NEXTAUTH_SECRET     | DevOps  | 2024-10-12   | 2025-01-10 | Vercel Env        |
| DATABASE_URL        | DBA     | 2024-09-15   | 2024-12-14 | Vercel + 1Pass    |
| RESEND_API_KEY      | DevOps  | 2024-08-01   | 2025-02-01 | Vercel + Resend   |
```

## Compliance Requirements

### Audit Trail
- All rotations logged in `audit_logs` table
- Quarterly review of rotation compliance
- Annual security audit includes secrets management

### Retention
- Old secrets retained in encrypted backup for 30 days
- After 30 days, permanently delete (not just marked deleted)
- Rotation logs retained for 7 years (compliance requirement)

### Access Control

**Who Can Rotate Secrets:**
- `NEXTAUTH_SECRET`: DevOps Team Lead only
- `DATABASE_URL`: DBA Team only  
- `API Keys`: DevOps team members (with approval)
- `ADMIN_PASSWORD_HASH`: Security Team + CTO

**MFA Required:** Yes, for all secret rotation operations
- Vercel dashboard access requires 2FA
- Database admin access requires 2FA
- API provider dashboards require 2FA
- 1Password access requires 2FA

## Monitoring & Alerts

### Automated Alerts

Set up alerts for:
- Secret expiring within 14 days
- Failed authentication attempts spike (> 50/hour)
- Unauthorized secret access attempts
- Rotation overdue by 7+ days

### Metrics to Track

- Time since last rotation per secret
- Number of failed rotation attempts
- Mean time to rotate (MTTR) for compromises
- Percentage of on-time rotations

## Training Requirements

All team members with secret access must complete:
- [ ] Secrets management training (annual)
- [ ] Incident response training (annual)
- [ ] This rotation procedure walkthrough
- [ ] Emergency rotation drill (quarterly)

## Policy Review

- **Frequency:** Quarterly
- **Owner:** Security Team Lead
- **Approval:** CTO
- **Next Review:** 2025-01-12

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Maintained By:** Security Team (security@yourcompany.com)
