# Vercel Deployment Troubleshooting Checklist

## Required Environment Variables in Vercel

Make sure these are set in Vercel Dashboard (Settings → Environment Variables):

### Critical Variables (Required)

- [ ] `SESSION_SECRET` - Session encryption key
- [ ] `NEXTAUTH_SECRET` - NextAuth secret
- [ ] `NEXTAUTH_URL` - Your app URL (e.g., https://yourapp.vercel.app)
- [ ] `WEBAUTHN_ORIGIN` - Same as NEXTAUTH_URL
- [ ] `WEBAUTHN_RP_ID` - Domain only (e.g., yourapp.vercel.app)

### Database (if using)

- [ ] `DATABASE_URL` - Postgres connection string
- [ ] `DATABASE_URL_UNPOOLED` - Direct connection

### Redis (if using)

- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

### Email (if using)

- [ ] `RESEND_API_KEY` - For sending emails
- [ ] `FROM_EMAIL` - Sender email address

### Optional

- [ ] `NEXT_PUBLIC_POSTHOG_KEY` - Analytics
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` - Analytics host
- [ ] `ADMIN_EMAILS` - Comma-separated admin emails

## Common Vercel Deployment Failures

### 1. Build Errors

**Check:** Build logs for compilation errors
**Fix:** Ensure `npm run build` works locally

### 2. Missing Environment Variables

**Check:** Runtime errors about undefined env vars
**Fix:** Add all required vars in Vercel dashboard

### 3. Database Connection Issues

**Check:** Error logs mentioning database/Prisma
**Fix:** Ensure DATABASE_URL is correct and accessible from Vercel

### 4. Build Size Exceeded

**Check:** "Function size exceeded" error
**Fix:** Optimize bundle size, use dynamic imports

### 5. CSP Violations

**Check:** Browser console errors about blocked resources
**Fix:** Update CSP headers in next.config.js

## How to Access Vercel Logs

### Via Dashboard:

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click on the failed deployment
4. View "Build Logs" and "Function Logs"

### Via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs
```

## Quick Fixes

### If it's environment variables:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add missing variables
3. Redeploy

### If it's build errors:

1. Run `npm run build` locally
2. Fix any errors
3. Push to git
4. Vercel auto-deploys

### If it's database:

1. Check database connection string
2. Ensure database is accessible from Vercel IPs
3. Run `npx prisma generate` in build command
