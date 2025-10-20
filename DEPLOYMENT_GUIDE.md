# Deployment Guide - SAP Implementation Cockpit

This guide will help you deploy your application to a public URL accessible from anywhere, including your phone.

## 🚀 Quick Start - Recommended Options

### Option 1: Vercel (Easiest - Recommended)

Vercel is made by the Next.js team and offers the best Next.js deployment experience.

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Setup and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- Project name? **cockpit** (or your preferred name)
- Directory? **./** (press Enter)
- Override settings? **No**

#### Step 4: Add Environment Variables

Go to your Vercel dashboard (vercel.com) → Your Project → Settings → Environment Variables

**Required Variables:**
```bash
# Database (use Vercel Postgres or external)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_URL_UNPOOLED=postgresql://user:pass@host:5432/dbname?connection_limit=1

# NextAuth (CRITICAL!)
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app

# WebAuthn (Passkeys)
WEBAUTHN_RP_ID=your-app.vercel.app
WEBAUTHN_ORIGIN=https://your-app.vercel.app

# Admin (Optional)
ADMIN_EMAIL=admin@example.com

# Redis (Optional - for production use)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Email (Optional)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Step 5: Setup Database

**Option A: Vercel Postgres (Easiest)**
1. Go to Storage tab in Vercel
2. Create → Postgres
3. Copy connection strings to environment variables
4. Run migrations:
   ```bash
   vercel env pull .env.production.local
   pnpm prisma migrate deploy
   ```

**Option B: External Database (Recommended for Production)**
- [Supabase](https://supabase.com) - Free tier with 500MB
- [Neon](https://neon.tech) - Serverless Postgres
- [Railway](https://railway.app) - $5/month

#### Step 6: Deploy to Production
```bash
vercel --prod
```

Your app will be live at: `https://your-app.vercel.app` 🎉

---

### Option 2: Railway (Good Alternative)

Railway offers easy deployment with built-in database.

#### Step 1: Install Railway CLI
```bash
npm i -g @railway/cli
```

#### Step 2: Login
```bash
railway login
```

#### Step 3: Initialize Project
```bash
railway init
```

#### Step 4: Add PostgreSQL
```bash
railway add -d postgres
```

#### Step 5: Set Environment Variables
```bash
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=https://your-app.up.railway.app
railway variables set WEBAUTHN_RP_ID=your-app.up.railway.app
railway variables set WEBAUTHN_ORIGIN=https://your-app.up.railway.app
```

Railway automatically sets `DATABASE_URL` for you.

#### Step 6: Deploy
```bash
railway up
```

Your app will be live at: `https://your-app.up.railway.app` 🎉

---

### Option 3: Render

#### Step 1: Create Account
Go to [render.com](https://render.com) and sign up

#### Step 2: New Web Service
- Connect GitHub repository
- Name: cockpit
- Environment: Node
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`

#### Step 3: Add PostgreSQL
- Create New → PostgreSQL
- Copy Internal Database URL

#### Step 4: Environment Variables
Add all variables from `.env.example` with production values

#### Step 5: Deploy
Click "Create Web Service"

Your app will be live at: `https://your-app.onrender.com` 🎉

---

## 📱 Accessing from Your Phone

Once deployed, you can access your app from any device:

### 1. Open Browser on Phone
- iOS: Safari or Chrome
- Android: Chrome or Firefox

### 2. Navigate to Your URL
- Vercel: `https://your-app.vercel.app`
- Railway: `https://your-app.up.railway.app`
- Render: `https://your-app.onrender.com`

### 3. Add to Home Screen (Optional)

**iOS:**
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android:**
1. Open in Chrome
2. Tap menu (3 dots)
3. Tap "Add to Home screen"
4. Tap "Add"

Now it works like a native app! 📱

---

## 🔒 Security Checklist

Before going public, ensure:

- [ ] `NEXTAUTH_SECRET` is set to a secure random string (min 32 chars)
- [ ] `NEXTAUTH_URL` matches your production domain (with https://)
- [ ] `WEBAUTHN_RP_ID` matches your domain (without https://)
- [ ] `WEBAUTHN_ORIGIN` matches your domain (with https://)
- [ ] Database uses strong password
- [ ] `.env.local` is NOT committed to git
- [ ] Admin password is changed from default
- [ ] HTTPS is enabled (automatic on Vercel/Railway/Render)

---

## 🗄️ Database Migration

After first deployment, run migrations:

```bash
# If using Vercel
vercel env pull .env.production.local
pnpm prisma migrate deploy

# If using Railway
railway run pnpm prisma migrate deploy

# If using Render (use Shell from dashboard)
pnpm prisma migrate deploy
```

---

## 🔧 Troubleshooting

### Build Fails
- Check build logs in platform dashboard
- Ensure all dependencies are in `package.json`
- Verify `pnpm-lock.yaml` is committed

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check database is running
- Ensure IP whitelist includes deployment platform

### Auth Not Working
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check `NEXTAUTH_SECRET` is set
- For passkeys, `WEBAUTHN_RP_ID` must match domain

### Can't Access from Phone
- Ensure using https:// (not http://)
- Check firewall settings
- Try incognito/private mode

---

## 💰 Cost Estimates

### Free Options (Good for Testing)
- **Vercel**: Free tier (Hobby) - 100GB bandwidth/month
- **Railway**: $5 free credit/month (with credit card)
- **Render**: Free tier (with limitations - spins down after inactivity)
- **Supabase DB**: Free tier - 500MB database

### Recommended Production Setup (~$15-25/month)
- **Vercel Pro**: $20/month (or use free tier)
- **Neon/Supabase DB**: $10-15/month for dedicated database
- **Upstash Redis**: Free tier (10K commands/day) or $10/month

---

## 🎯 Next Steps

1. Choose a platform (Vercel recommended)
2. Setup database (Vercel Postgres or Supabase)
3. Deploy using steps above
4. Test on your phone
5. (Optional) Add custom domain
6. (Optional) Setup monitoring (Sentry, PostHog)

---

## 📞 Support

If you need help:
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Next.js: https://nextjs.org/docs

Good luck! 🚀
