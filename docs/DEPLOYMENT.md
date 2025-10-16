# 🚀 Deployment Guide - SAP Cockpit

Complete guide for deploying SAP Cockpit to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Vercel Deployment](#vercel-deployment)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring Setup](#monitoring-setup)

---

## Prerequisites

### Required Accounts
- ✅ Vercel account
- ✅ PostgreSQL database (Neon, Supabase, or AWS RDS)
- ✅ Upstash Redis account (for rate limiting)
- ✅ Email provider (SendGrid, Mailgun, or AWS SES)

### Optional Accounts
- PostHog (analytics)
- Sentry (error monitoring)

---

## Environment Setup

### 1. Copy Environment Template
```bash
cp .env.production.example .env.production
```

### 2. Configure Required Variables

**Database:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host:5432/db?sslmode=require"
```

**Authentication:**
```bash
# Generate secure secret
openssl rand -base64 32

# Add to .env.production
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<generated-secret>"
```

**Admin Access:**
```bash
# Generate admin code
openssl rand -hex 16

# Add to .env.production
ADMIN_ACCESS_CODE="<generated-code>"
```

**Email (Magic Link):**
```env
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="<your-sendgrid-api-key>"
EMAIL_FROM="noreply@your-domain.com"
```

**Upstash Redis:**
```env
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<your-upstash-token>"
```

---

## Database Migration

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Run Migrations
```bash
npx prisma migrate deploy
```

### 3. Seed L3 Catalog
```bash
npx prisma db seed
```

### 4. Verify Database
```bash
npx prisma studio
```

Expected tables:
- ✅ `users` (with WebAuthn authenticators)
- ✅ `audit_logs`
- ✅ `L3ScopeItem` (293 items)
- ✅ `Lob` (12 LOBs)

---

## Vercel Deployment

### Method 1: Vercel CLI (Recommended)

**Install Vercel CLI:**
```bash
npm install -g vercel
```

**Login:**
```bash
vercel login
```

**Deploy:**
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Method 2: GitHub Integration

1. Push code to GitHub
2. Import repository in [Vercel Dashboard](https://vercel.com/new)
3. Configure environment variables
4. Deploy

### Configure Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production |
| `NEXTAUTH_URL` | `https://your-domain.com` | Production |
| `NEXTAUTH_SECRET` | `<secret>` | Production |
| `ADMIN_ACCESS_CODE` | `<code>` | Production |
| `EMAIL_SERVER_*` | `<smtp-config>` | Production |
| `UPSTASH_REDIS_*` | `<redis-config>` | Production |

### Set Custom Domain

1. Go to **Project Settings → Domains**
2. Add custom domain
3. Configure DNS:
   - Type: `CNAME`
   - Name: `@` or `app`
   - Value: `cname.vercel-dns.com`
4. Wait for SSL certificate provisioning (~5 min)

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

Expected: `{ "status": "ok", "timestamp": "..." }`

### 2. Database Connection
Visit: `https://your-domain.com/admin`

Expected: Admin login page

### 3. Authentication Flow

**Test Passkey Login:**
1. Go to `/login`
2. Enter email
3. Register passkey
4. Verify login works

**Test Magic Link:**
1. Go to `/login`
2. Enter email
3. Check email inbox
4. Click magic link
5. Verify redirect to dashboard

### 4. L3 Catalog Verification

Visit: `https://your-domain.com/api/l3-catalog`

Expected: JSON array with 293 items

### 5. Estimator Smoke Test

1. Go to `/estimator`
2. Select L3 items
3. Adjust inputs
4. Verify calculation works
5. Click "Generate Timeline"
6. Verify timeline renders

---

## Monitoring Setup

### PostHog Analytics

**1. Create PostHog Project:**
- Go to [PostHog](https://posthog.com)
- Create new project
- Copy Project API Key

**2. Add to Vercel:**
```bash
vercel env add NEXT_PUBLIC_POSTHOG_KEY
```

**3. Verify Tracking:**
- Visit application
- Go to PostHog dashboard
- Check "Live Events" tab
- Confirm events appear

### Sentry Error Monitoring (Optional)

**1. Install Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**2. Add DSN to Vercel:**
```bash
vercel env add NEXT_PUBLIC_SENTRY_DSN
```

**3. Trigger Test Error:**
```bash
curl https://your-domain.com/api/sentry-test
```

**4. Verify in Sentry Dashboard:**
- Go to Sentry.io
- Check "Issues" tab
- Confirm test error appears

---

## Performance Optimization

### Enable Caching

**Add to `next.config.js`:**
```javascript
module.exports = {
  // ... existing config
  headers: async () => [
    {
      source: '/api/l3-catalog',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' }
      ]
    }
  ]
}
```

### Database Connection Pooling

Ensure `DATABASE_URL` includes:
```
?pgbouncer=true&connection_limit=10
```

### CDN Configuration

Vercel automatically serves static assets from CDN. No additional config needed.

---

## Security Checklist

Before going live, verify:

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Security headers configured (`vercel.json`)
- [ ] Rate limiting active (Upstash Redis)
- [ ] CSRF protection enabled (`middleware.ts`)
- [ ] Admin access code secure
- [ ] Database credentials rotated
- [ ] Environment variables not in git
- [ ] Audit logging enabled
- [ ] No hardcoded secrets in code

---

## Rollback Procedure

### Quick Rollback

**Vercel Dashboard:**
1. Go to **Deployments**
2. Find previous working deployment
3. Click **⋮** → **Promote to Production**

**Vercel CLI:**
```bash
vercel rollback
```

### Database Rollback

```bash
# Rollback last migration
npx prisma migrate rollback

# Rollback to specific migration
npx prisma migrate rollback --to 20250101000000_migration_name
```

---

## Troubleshooting

### Build Failures

**Issue:** TypeScript errors during build

**Solution:**
```bash
npm run typecheck
# Fix errors, then redeploy
```

**Issue:** Prisma client not generated

**Solution:**
```bash
npx prisma generate
vercel --prod
```

### Runtime Errors

**Issue:** Database connection timeout

**Check:**
- Database URL correct?
- Vercel IP allowed in database firewall?
- Connection pool size sufficient?

**Issue:** Rate limiting not working

**Check:**
- Upstash Redis credentials correct?
- `TRUST_PROXY=true` in production?

---

## Monitoring Dashboard

### Key Metrics to Track

**PostHog Events:**
- `estimator_calculated` - Usage frequency
- `scenario_saved` - Conversion rate
- `export_generated` - Export adoption

**Sentry Alerts:**
- Error rate > 1%
- Response time > 2s
- Failed database queries

**Vercel Analytics:**
- Page views
- Geographic distribution
- Device breakdown

---

## Support

### Need Help?

- 📖 [Next.js Documentation](https://nextjs.org/docs)
- 📖 [Prisma Documentation](https://www.prisma.io/docs)
- 📖 [Vercel Documentation](https://vercel.com/docs)

### Production Issues?

1. Check Vercel logs: `vercel logs --prod`
2. Review Sentry dashboard
3. Verify PostHog events
4. Check database performance

---

## Maintenance Schedule

### Weekly
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backup integrity

### Monthly
- [ ] Rotate secrets
- [ ] Update dependencies
- [ ] Review security audit logs
- [ ] Test disaster recovery

### Quarterly
- [ ] Penetration testing
- [ ] Performance audit
- [ ] Capacity planning review

---

**Congratulations! Your SAP Cockpit is now live! 🎉**
