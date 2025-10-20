# Vercel Quick Start - Deploy in 10 Minutes

This guide will get your SAP Implementation Cockpit deployed to Vercel and accessible from your phone in about 10 minutes.

## Prerequisites

- GitHub account (to login to Vercel)
- Access to a terminal

## 🚀 Automated Setup

We've created a setup script to help you:

```bash
./vercel-deploy.sh
```

This script will:
- ✓ Check Vercel CLI is installed
- ✓ Generate secure secrets (NEXTAUTH_SECRET)
- ✓ Create environment variables template
- ✓ Provide step-by-step instructions

## 📝 Manual Steps (If Preferred)

### Step 1: Login to Vercel

```bash
vercel login
```

Choose your login method (GitHub recommended).

### Step 2: Deploy Preview

```bash
vercel
```

Answer the prompts:
- **Setup and deploy?** Yes
- **Which scope?** Choose your account
- **Link to existing project?** No
- **Project name?** cockpit (or your choice)
- **In which directory?** ./
- **Override settings?** No

Your preview will be deployed to: `https://cockpit-xxx.vercel.app`

### Step 3: Setup Database

**Option A: Vercel Postgres (Recommended for Getting Started)**

1. Go to https://vercel.com/dashboard
2. Click your project
3. Storage tab → Create Database → Postgres
4. Vercel automatically adds `DATABASE_URL`
5. You need to manually add `DATABASE_URL_UNPOOLED`:
   - Copy the `DATABASE_URL` value
   - Add `?connection_limit=1` to the end
   - Save as new variable `DATABASE_URL_UNPOOLED`

**Option B: Supabase (Free Tier - 500MB)**

1. Go to https://supabase.com
2. Create new project → Choose a password
3. Settings → Database → Connection String
4. Copy the URI (connection pooling)
5. Add to Vercel as `DATABASE_URL` and `DATABASE_URL_UNPOOLED`

### Step 4: Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these (for **Production, Preview, and Development**):

```bash
# Database (from Step 3)
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...?connection_limit=1

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=<your-generated-secret>
NEXTAUTH_URL=https://your-app.vercel.app

# WebAuthn Passkeys
WEBAUTHN_RP_ID=your-app.vercel.app
WEBAUTHN_ORIGIN=https://your-app.vercel.app

# Optional: Admin email
ADMIN_EMAIL=admin@example.com
```

**Important:**
- Replace `your-app` with your actual Vercel domain
- Make sure to select ALL environments when adding variables
- `WEBAUTHN_RP_ID` should NOT include `https://`
- `WEBAUTHN_ORIGIN` SHOULD include `https://`

### Step 5: Run Database Migrations

```bash
# Pull environment variables locally
vercel env pull .env.production.local

# Run migrations
pnpm prisma migrate deploy
```

### Step 6: Deploy to Production

```bash
vercel --prod
```

Your app is now live! 🎉

## 📱 Access from Your Phone

### iOS (Safari)
1. Open Safari
2. Navigate to `https://your-app.vercel.app`
3. Tap Share icon (square with arrow)
4. Scroll down → "Add to Home Screen"
5. Tap "Add"

### Android (Chrome)
1. Open Chrome
2. Navigate to `https://your-app.vercel.app`
3. Tap menu (⋮)
4. Tap "Add to Home screen"
5. Tap "Add"

The app now works like a native app! 📱

## 🔍 Verify Deployment

1. Visit your URL: `https://your-app.vercel.app`
2. You should see the login page
3. Test passkey registration
4. Check Vercel logs: `vercel logs`

## ⚙️ Optional: Redis Setup (Recommended for Production)

For better performance with passkey challenges:

1. Go to https://upstash.com
2. Create account → Create database (Redis)
3. Copy REST URL and Token
4. Add to Vercel env:
   - `UPSTASH_REDIS_REST_URL=https://...`
   - `UPSTASH_REDIS_REST_TOKEN=...`

## 🔧 Troubleshooting

### Build Fails
```bash
# Check build logs
vercel logs

# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Database connection issues
```

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check database is running
- Ensure IP allowlist includes Vercel (0.0.0.0/0 for Vercel/Supabase)

### Auth Not Working
- Verify NEXTAUTH_URL matches your domain exactly
- Check NEXTAUTH_SECRET is set
- Ensure WEBAUTHN_RP_ID matches domain (without https://)

### Can't Access from Phone
- Make sure using https:// (not http://)
- Clear browser cache
- Try incognito/private mode

## 📊 Monitoring

### View Logs
```bash
vercel logs
vercel logs --follow  # Real-time logs
```

### View Deployment Status
```bash
vercel ls
```

### Rollback (if needed)
```bash
vercel rollback
```

## 🔄 Update Deployment

When you make changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically deploy when you push to your connected branch!

Or manually:
```bash
vercel --prod
```

## 💡 Next Steps

- [ ] Add custom domain (Settings → Domains)
- [ ] Setup monitoring (PostHog, Sentry)
- [ ] Configure email (Resend)
- [ ] Invite team members
- [ ] Review security settings

## 📚 Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Support: https://vercel.com/support

## 🎯 Summary

```bash
# One-time setup
vercel login
vercel
# Setup database + environment variables in dashboard
vercel env pull .env.production.local
pnpm prisma migrate deploy

# Deploy to production
vercel --prod

# Done! Access from anywhere:
# https://your-app.vercel.app
```

Happy deploying! 🚀
