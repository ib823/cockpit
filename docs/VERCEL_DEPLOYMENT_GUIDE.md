# Vercel Deployment Guide

Complete guide for deploying the Keystone application to Vercel with all required and optional environment variables.

## 🚀 Quick Start

### 1. Required Environment Variables

These **must** be set for the application to function:

```bash
# Database Configuration (Required)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@host:5432/database?sslmode=require&connection_limit=1"

# Authentication (Required)
NEXTAUTH_SECRET="your-super-secret-32-char-min"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="https://your-app.vercel.app"        # Your production URL
```

### 2. Optional Environment Variables (Recommended)

#### Rate Limiting & Challenge Storage (Upstash Redis)
Without these, the app uses in-memory storage (not suitable for production with multiple instances).

```bash
UPSTASH_REDIS_REST_URL="https://your-region.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

**Setup Steps:**
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Select region closest to your Vercel deployment
4. Copy REST URL and Token from database details
5. Add to Vercel environment variables

#### Email Features (Resend)
Without these, magic links and email notifications are disabled.

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

**Setup Steps:**
1. Go to [Resend](https://resend.com/)
2. Create account and verify your domain
3. Generate API key in Settings → API Keys
4. Add your verified sending email address
5. Add to Vercel environment variables

#### Passkey Authentication (WebAuthn)
Without this, passkey features may fail in production.

```bash
WEBAUTHN_RP_ID="yourdomain.com"              # Your root domain
WEBAUTHN_ORIGIN="https://your-app.vercel.app" # Your production URL
```

**Setup Steps:**
1. Set `WEBAUTHN_RP_ID` to your root domain (e.g., "example.com")
2. Set `WEBAUTHN_ORIGIN` to your full production URL
3. Add to Vercel environment variables

#### Error Tracking (Sentry)
Without this, errors are only logged to console.

```bash
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
```

**Setup Steps:**
1. Go to [Sentry](https://sentry.io/)
2. Create a new project for Next.js
3. Copy the DSN from project settings
4. Add to Vercel environment variables

#### Analytics (PostHog)
Without these, user analytics are disabled.

```bash
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxx"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

**Setup Steps:**
1. Go to [PostHog](https://posthog.com/)
2. Create account and project
3. Copy Project API Key from Settings
4. Add to Vercel environment variables

### 3. Feature Flags (Optional)

```bash
ENABLE_PASSKEYS="true"      # Enable/disable passkey authentication
ENABLE_MAGIC_LINKS="true"   # Enable/disable magic link authentication
```

## 📋 Setting Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings → Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Your value
   - **Environment**: Select Production, Preview, and Development as needed
4. Click **Save**
5. Redeploy your application

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add DATABASE_URL production
vercel env add DATABASE_URL_UNPOOLED production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Add optional variables
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production
vercel env add WEBAUTHN_RP_ID production
vercel env add WEBAUTHN_ORIGIN production
vercel env add SENTRY_DSN production

# Redeploy
vercel --prod
```

### Method 3: Using .env.production.local (Not Recommended)

For security reasons, **do not** commit `.env` files to your repository. Use Vercel's environment variable management instead.

## 🗄️ Database Setup (Required)

### Option 1: Vercel Postgres

1. Go to **Storage** tab in your Vercel project
2. Create new **Postgres** database
3. Vercel automatically sets `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`
4. Copy these values to `DATABASE_URL` and `DATABASE_URL_UNPOOLED`

### Option 2: External PostgreSQL (Neon, Supabase, etc.)

1. Create a PostgreSQL database on your preferred provider
2. Get connection strings (pooled and direct)
3. Add to Vercel environment variables:
   - `DATABASE_URL` = Pooled connection string
   - `DATABASE_URL_UNPOOLED` = Direct connection string

### Running Migrations

After setting up the database:

```bash
# Using Vercel CLI
vercel env pull .env.local
pnpm prisma migrate deploy

# Or use Vercel deployment hooks
# The postinstall script will run migrations automatically
```

## 🔐 Security Best Practices

### NEXTAUTH_SECRET
```bash
# Generate a secure secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

⚠️ **Important:**
- Never commit secrets to version control
- Use different secrets for different environments
- Rotate secrets periodically
- Use minimum 32 characters for HS256 security

### Database Connection Strings
- Always use SSL/TLS connections (`?sslmode=require`)
- Use strong passwords
- Restrict database access by IP if possible
- Use connection pooling for better performance

## 🧪 Testing Your Deployment

### 1. Verify Environment Variables

After deployment, check the build logs:

```
✅ Environment validation passed (production mode)
⚠️  Production warnings - Missing optional environment variables:
   • UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (challenge storage will use in-memory fallback)
   • RESEND_API_KEY and EMAIL_FROM (email features disabled)
   ...
```

### 2. Test Core Features

- [ ] Homepage loads successfully
- [ ] Database connection works
- [ ] User registration/login works
- [ ] Session persistence works

### 3. Test Optional Features

With Upstash Redis:
- [ ] Rate limiting works correctly
- [ ] Passkey challenge storage works across requests

With Resend:
- [ ] Magic link emails send successfully
- [ ] Email verification works

With WebAuthn configured:
- [ ] Passkey registration works
- [ ] Passkey authentication works

With Sentry:
- [ ] Errors appear in Sentry dashboard
- [ ] Source maps work correctly

## 🐛 Troubleshooting

### Build Fails with "Environment validation failed"

**Issue:** Missing required environment variables

**Solution:**
1. Check Vercel deployment logs for specific missing variables
2. Add all required variables (DATABASE_URL, NEXTAUTH_SECRET, etc.)
3. Redeploy

### Build Succeeds but Runtime Errors

**Issue:** Environment variables not available at runtime

**Solution:**
1. Ensure variables are set for "Production" environment
2. Check variable names are exact (case-sensitive)
3. Redeploy after adding/updating variables

### Database Connection Errors

**Issue:** Cannot connect to database

**Solution:**
1. Verify connection strings are correct
2. Check database allows connections from Vercel IPs
3. Ensure SSL is enabled (`?sslmode=require`)
4. Test connection locally first

### Passkey/WebAuthn Not Working

**Issue:** WebAuthn errors in production

**Solution:**
1. Ensure `WEBAUTHN_RP_ID` matches your domain
2. Ensure `WEBAUTHN_ORIGIN` matches your production URL
3. Verify HTTPS is enabled (WebAuthn requires secure context)

### Rate Limiting Not Working Across Deployments

**Issue:** In-memory storage doesn't persist

**Solution:**
1. Add Upstash Redis environment variables
2. Redeploy application
3. Verify Redis connection in logs

## 📚 Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## 🎯 Production Checklist

Before going live:

- [ ] All required environment variables set
- [ ] Database configured and migrations run
- [ ] `NEXTAUTH_SECRET` is strong (32+ chars)
- [ ] `NEXTAUTH_URL` points to production URL
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Optional services configured (Redis, Resend, Sentry)
- [ ] Admin user created (see `scripts/setup-admin.mjs`)
- [ ] Rate limiting tested
- [ ] Email features tested (if enabled)
- [ ] Passkey authentication tested (if enabled)
- [ ] Error tracking verified (if enabled)
- [ ] Performance monitoring enabled

## 🔄 Continuous Deployment

Vercel automatically deploys on:
- **Pushes to `main` branch** → Production deployment
- **Pull requests** → Preview deployments
- **Other branches** → Preview deployments

Environment variables from "Production" environment are used for main branch deployments.

## 💡 Tips

1. **Use Preview Deployments:** Test changes in preview deployments before merging to main
2. **Separate Database:** Use different databases for production and preview
3. **Monitor Costs:** Watch usage for paid services (Upstash, Resend, Sentry)
4. **Set Up Alerts:** Configure Sentry alerts for critical errors
5. **Regular Backups:** Back up your database regularly
6. **Keep Secrets Secure:** Never share or commit production secrets

---

For additional help, see the main [README.md](../README.md) or check the [docs folder](.) for specific feature guides.
