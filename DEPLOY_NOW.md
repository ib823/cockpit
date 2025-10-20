# Deploy Now - Step-by-Step Instructions

The Vercel deployment needs to be run from **your local terminal** (not in this Claude Code environment) because it requires:
- Browser authentication with Vercel
- Interactive prompts
- Network access to Vercel's servers

## 🚀 Follow These Steps on Your Computer

### Prerequisites
Make sure you have the code on your local machine:
```bash
# Clone or pull latest changes
git clone https://github.com/ib823/cockpit.git
# OR if already cloned:
cd cockpit
git pull origin main
```

---

## 📝 Deployment Steps (Run on Your Machine)

### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

This will:
- Open your browser
- Ask you to login with GitHub/GitLab/Bitbucket/Email
- Authenticate your CLI

**Choose:** GitHub (recommended - easiest)

### Step 3: Deploy Preview
```bash
cd /path/to/cockpit
vercel
```

**Answer the prompts:**
```
? Set up and deploy "~/cockpit"? [Y/n] y
? Which scope do you want to deploy to? <Your Username>
? Link to existing project? [y/N] n
? What's your project's name? cockpit
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

**Result:** You'll get a preview URL like:
```
✅ Preview: https://cockpit-abc123.vercel.app
```

**Test it!** Open that URL in your browser.

---

### Step 4: Setup Database

**Option A: Vercel Postgres (Recommended - Easiest)**

1. Go to https://vercel.com/dashboard
2. Click on your **cockpit** project
3. Go to **Storage** tab
4. Click **Create Database**
5. Choose **Postgres**
6. Click **Create**

Vercel will automatically add these to your environment:
- ✅ `DATABASE_URL`
- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL`

**You need to add manually:**
- `DATABASE_URL_UNPOOLED`:
  - Copy the value of `DATABASE_URL`
  - Add `?connection_limit=1` to the end
  - Create new environment variable with this value

**Option B: Supabase (Free Tier - 500MB)**

If you prefer external database:

1. Go to https://supabase.com
2. Click **New Project**
3. Fill in:
   - Name: cockpit
   - Database Password: <strong password>
   - Region: Choose closest to you
4. Click **Create new project**
5. Wait for project to be ready (1-2 minutes)
6. Go to **Settings** → **Database**
7. Copy **Connection String** (URI format)
8. Replace `[YOUR-PASSWORD]` with your actual password

**Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

### Step 5: Add Environment Variables

Go to: https://vercel.com/dashboard

1. Click your **cockpit** project
2. Go to **Settings** → **Environment Variables**
3. Add each variable below
4. **Important:** For each variable, select **ALL** environments:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

**Variables to add:**

```bash
# Database (from Step 4)
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...?connection_limit=1

# Authentication (CRITICAL!)
NEXTAUTH_SECRET=5EuaVFYMwe1c20zBMuKhwWsT/SIyxsEqepcPtAgO9bQ=
NEXTAUTH_URL=https://your-actual-domain.vercel.app

# WebAuthn Passkeys (CRITICAL!)
WEBAUTHN_RP_ID=your-actual-domain.vercel.app
WEBAUTHN_ORIGIN=https://your-actual-domain.vercel.app

# Admin (Optional)
ADMIN_EMAIL=admin@example.com
```

**⚠️ IMPORTANT:**
- Replace `your-actual-domain` with your ACTUAL Vercel domain from Step 3
- Example: If your URL is `https://cockpit-abc123.vercel.app`:
  - `NEXTAUTH_URL=https://cockpit-abc123.vercel.app`
  - `WEBAUTHN_RP_ID=cockpit-abc123.vercel.app` (NO https://)
  - `WEBAUTHN_ORIGIN=https://cockpit-abc123.vercel.app` (WITH https://)

**How to add each variable:**
1. Click **Add New** → **Environment Variable**
2. Name: `DATABASE_URL`
3. Value: `postgresql://...`
4. Select: **Production, Preview, Development** (all three!)
5. Click **Save**
6. Repeat for all variables

---

### Step 6: Redeploy with Environment Variables

After adding all environment variables:

```bash
vercel --prod
```

This deploys to production with all your environment variables.

---

### Step 7: Run Database Migrations

```bash
# Pull production environment variables to local
vercel env pull .env.production.local

# Run Prisma migrations
pnpm prisma migrate deploy
```

This creates all database tables.

---

### Step 8: Verify Deployment

1. **Open your production URL** (from Step 6)
   ```
   https://your-app.vercel.app
   ```

2. **You should see:**
   - Login page
   - Clean UI
   - No errors

3. **Test Registration:**
   - Click "Register" or enter an email
   - Follow passkey creation flow
   - Should work smoothly

---

### Step 9: Access from Your Phone 📱

**iOS (Safari):**
1. Open Safari on your iPhone
2. Go to `https://your-app.vercel.app`
3. Tap **Share** button (square with arrow)
4. Scroll down → **Add to Home Screen**
5. Tap **Add**
6. App icon appears on home screen!

**Android (Chrome):**
1. Open Chrome on your Android phone
2. Go to `https://your-app.vercel.app`
3. Tap **Menu** (⋮)
4. Tap **Add to Home screen**
5. Tap **Add**
6. App icon appears on home screen!

Now you can access it like a native app! 🎉

---

## ✅ Success Checklist

- [ ] Vercel CLI installed
- [ ] Logged in to Vercel
- [ ] Preview deployed (vercel)
- [ ] Database created (Vercel Postgres or Supabase)
- [ ] All environment variables added
- [ ] Production deployed (vercel --prod)
- [ ] Database migrations run
- [ ] App accessible in browser
- [ ] App accessible from phone
- [ ] Added to phone home screen

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check logs
vercel logs

# Common fixes:
# - Check all environment variables are set
# - Ensure DATABASE_URL is correct
# - Verify NEXTAUTH_SECRET is set
```

### Database Connection Error
```bash
# Verify connection string
echo $DATABASE_URL

# Test locally
pnpm prisma db push

# Check Vercel logs
vercel logs --follow
```

### "Invalid domain" Error on Passkey
```bash
# Check these match EXACTLY:
WEBAUTHN_RP_ID=your-app.vercel.app          # NO https://
WEBAUTHN_ORIGIN=https://your-app.vercel.app # WITH https://
NEXTAUTH_URL=https://your-app.vercel.app    # WITH https://
```

### App Not Loading
```bash
# Check deployment status
vercel ls

# View build logs
vercel logs

# Redeploy if needed
vercel --prod --force
```

---

## 📊 Useful Commands

```bash
# View all deployments
vercel ls

# View logs (real-time)
vercel logs --follow

# View production logs only
vercel logs --prod

# Redeploy
vercel --prod

# Rollback to previous deployment
vercel rollback

# Open dashboard
vercel dashboard
```

---

## 💡 Next Steps (Optional)

### Add Custom Domain
1. Go to Vercel Dashboard → Your Project
2. Settings → Domains
3. Add your domain (e.g., `cockpit.yourdomain.com`)
4. Follow DNS setup instructions
5. Update environment variables with new domain:
   - `NEXTAUTH_URL=https://cockpit.yourdomain.com`
   - `WEBAUTHN_RP_ID=cockpit.yourdomain.com`
   - `WEBAUTHN_ORIGIN=https://cockpit.yourdomain.com`

### Add Redis (Optional - Better Performance)
1. Go to https://upstash.com
2. Create account → Create Redis database
3. Copy REST URL and Token
4. Add to Vercel environment variables:
   - `UPSTASH_REDIS_REST_URL=https://...`
   - `UPSTASH_REDIS_REST_TOKEN=...`
5. Redeploy: `vercel --prod`

### Setup Monitoring
1. Go to Vercel Dashboard → Your Project
2. Integrations → Add Integration
3. Choose Sentry (error tracking) or similar
4. Follow setup instructions

---

## 📞 Need Help?

If you encounter issues:

1. **Check Vercel Logs:**
   ```bash
   vercel logs --follow
   ```

2. **Verify Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure all variables are set for ALL environments

3. **Common Issues:**
   - Database connection: Check DATABASE_URL format
   - Auth not working: Verify NEXTAUTH_URL matches exactly
   - Passkeys failing: Check WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN

4. **Vercel Support:**
   - https://vercel.com/docs
   - https://vercel.com/support

---

## 🎯 Quick Summary

```bash
# On your local machine:
npm install -g vercel
vercel login
vercel                    # Deploy preview
# → Setup database in Vercel dashboard
# → Add environment variables in Vercel dashboard
vercel --prod            # Deploy production
vercel env pull .env.production.local
pnpm prisma migrate deploy

# Result:
# ✅ Public URL: https://your-app.vercel.app
# ✅ Accessible from anywhere
# ✅ Works on mobile phones
# ✅ PWA support (add to home screen)
```

---

**Your NEXTAUTH_SECRET (already generated):**
```
5EuaVFYMwe1c20zBMuKhwWsT/SIyxsEqepcPtAgO9bQ=
```

Good luck! 🚀

Once you complete the deployment, you'll have a public URL accessible from any device, including your phone!
