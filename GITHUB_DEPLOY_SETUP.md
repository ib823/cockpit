# GitHub Actions Automatic Deployment Setup

This guide shows you how to set up **automatic deployment to Vercel** using GitHub Actions. Once configured, every push to `main` automatically deploys your app!

## 🎯 Benefits

- ✅ **Automatic**: Push to GitHub → Automatic deployment
- ✅ **No CLI needed**: Deploys without manual commands
- ✅ **PR Previews**: Each pull request gets a preview deployment
- ✅ **CI/CD**: Integrated with your existing CI pipeline
- ✅ **Hands-free**: Set it once, forget about it

---

## 🚀 One-Time Setup (5 Minutes)

### Step 1: Create Vercel Account & Project

1. **Go to https://vercel.com**
2. **Sign up** with GitHub (easiest - links to your repos)
3. Click **Add New** → **Project**
4. **Import** your `cockpit` repository
5. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `pnpm build`
   - Output Directory: `.next` (auto-detected)
   - Install Command: `pnpm install`
6. **Don't deploy yet** - Click **Skip** (we'll configure first)

### Step 2: Get Vercel Credentials

#### A. Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: `GitHub Actions Deploy`
4. Scope: **Full Account**
5. Click **Create**
6. **Copy the token** (you won't see it again!)

#### B. Get Project ID & Org ID

1. Go to your project on Vercel
2. Settings → General
3. Copy these values:
   - **Project ID**: `prj_xxxxxxxxxxxxx`
   - **Team/Org ID**: `team_xxxxxxxxxxxxx` (or your username)

### Step 3: Add GitHub Secrets

1. **Go to your GitHub repo**: https://github.com/ib823/cockpit
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these **three secrets**:

**Secret 1:**
- Name: `VERCEL_TOKEN`
- Value: `<paste-token-from-step-2A>`

**Secret 2:**
- Name: `VERCEL_ORG_ID`
- Value: `<paste-org-id-from-step-2B>`

**Secret 3:**
- Name: `VERCEL_PROJECT_ID`
- Value: `<paste-project-id-from-step-2B>`

### Step 4: Add Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these for **Production, Preview, and Development**:

```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...?connection_limit=1

# Authentication
NEXTAUTH_SECRET=5EuaVFYMwe1c20zBMuKhwWsT/SIyxsEqepcPtAgO9bQ=
NEXTAUTH_URL=https://your-app.vercel.app

# WebAuthn
WEBAUTHN_RP_ID=your-app.vercel.app
WEBAUTHN_ORIGIN=https://your-app.vercel.app

# Optional
ADMIN_EMAIL=admin@example.com
```

**Update after first deployment:**
- Replace `your-app` with your actual Vercel domain
- Redeploy to apply changes

### Step 5: Setup Database

**Option A: Vercel Postgres**
1. Vercel Dashboard → Your Project → Storage
2. Create Database → Postgres
3. Done! (Auto-configured)

**Option B: Supabase (Free)**
1. https://supabase.com → New Project
2. Settings → Database → Connection String
3. Copy to Vercel environment variables

### Step 6: Push to Trigger Deployment

```bash
# Merge your changes to main
git checkout main
git merge claude/investigate-issue-011CUKJeVL7vSRU9PDhy1KSk
git push origin main

# Or create a PR and merge it
```

**GitHub Actions will automatically:**
1. ✅ Build your project
2. ✅ Deploy to Vercel
3. ✅ Run migrations (if configured)
4. ✅ Comment on PRs with preview URLs

### Step 7: Run Database Migrations

**One-time setup:**

```bash
# Install Vercel CLI locally
npm install -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production.local

# Run migrations
pnpm prisma migrate deploy
```

---

## 🎉 That's It!

From now on:

- **Push to `main`** → Automatic production deployment
- **Open a PR** → Automatic preview deployment
- **Merge PR** → Automatic production deployment

---

## 📱 Access Your App

Once deployed, your app will be at:
```
https://your-project-name.vercel.app
```

### Add to Phone Home Screen

**iOS:**
1. Open Safari → Your URL
2. Share → Add to Home Screen

**Android:**
1. Open Chrome → Your URL
2. Menu → Add to Home screen

Works like a native app! 📱

---

## 🔍 Monitor Deployments

### GitHub Actions
- Go to your repo → **Actions** tab
- See all deployment runs
- View logs if deployment fails

### Vercel Dashboard
- Go to https://vercel.com/dashboard
- Click your project
- See all deployments and logs

---

## 🔧 Troubleshooting

### Deployment Fails

**Check GitHub Actions logs:**
1. GitHub repo → Actions tab
2. Click the failed workflow
3. Read error messages

**Common issues:**
- Missing GitHub secrets
- Missing environment variables in Vercel
- Database connection issues

**Fix:**
- Verify all 3 GitHub secrets are set correctly
- Verify all environment variables in Vercel dashboard
- Check Vercel project is linked correctly

### Environment Variables Not Working

**Verify in Vercel:**
1. Vercel Dashboard → Settings → Environment Variables
2. Ensure variables are set for ALL environments:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

**Redeploy after changes:**
```bash
git commit --allow-empty -m "Redeploy"
git push origin main
```

### Database Connection Error

**Check connection string:**
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs (0.0.0.0/0)
- For Supabase: Use "Connection Pooling" URL, not "Direct Connection"

---

## 🎯 Workflow Summary

```
Push to GitHub
     ↓
GitHub Actions triggers
     ↓
Builds project
     ↓
Deploys to Vercel
     ↓
App live at your-app.vercel.app
     ↓
Accessible from phone 📱
```

---

## 💡 Advanced: Custom Domain

1. **Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain**: `cockpit.yourdomain.com`
3. **Configure DNS** (Vercel provides instructions)
4. **Update environment variables**:
   - `NEXTAUTH_URL=https://cockpit.yourdomain.com`
   - `WEBAUTHN_RP_ID=cockpit.yourdomain.com`
   - `WEBAUTHN_ORIGIN=https://cockpit.yourdomain.com`
5. **Redeploy** (push to GitHub)

---

## 📊 Monitoring & Logs

### Real-time Logs
```bash
vercel logs --follow
```

### Specific Deployment
```bash
vercel logs <deployment-url>
```

### GitHub Actions Logs
- Repo → Actions tab → Click workflow run

---

## 🔄 Manual Deployment (If Needed)

You can still deploy manually:

```bash
vercel --prod
```

But GitHub Actions will handle it automatically! 🎉

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Vercel Support**: https://vercel.com/support

---

## ✅ Checklist

Setup (one-time):
- [ ] Created Vercel account and project
- [ ] Got Vercel token
- [ ] Got Project ID and Org ID
- [ ] Added 3 GitHub secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] Added environment variables in Vercel dashboard
- [ ] Setup database (Vercel Postgres or Supabase)
- [ ] Pushed to main branch
- [ ] Verified deployment succeeded
- [ ] Ran database migrations
- [ ] Tested app in browser
- [ ] Tested app on phone

Ongoing:
- [ ] Push code → Auto-deploys ✅
- [ ] Open PR → Auto-preview ✅
- [ ] Merge PR → Auto-production ✅

---

## 🎯 Result

**You now have:**
- ✅ Automatic deployments on every push
- ✅ Preview deployments for PRs
- ✅ Public URL accessible from anywhere
- ✅ Mobile-friendly PWA
- ✅ Hands-free CI/CD pipeline

**No more manual deployments needed!** 🚀

---

**Your pre-generated secret:**
```
NEXTAUTH_SECRET=5EuaVFYMwe1c20zBMuKhwWsT/SIyxsEqepcPtAgO9bQ=
```

Happy deploying! 🎉
