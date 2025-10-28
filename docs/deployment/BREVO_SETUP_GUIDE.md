# Brevo (Sendinblue) Email Setup Guide

**Quick, free, and simple email setup - No more Resend restrictions!**

## Why Brevo?

- ✅ **300 emails/day free** (plenty for development)
- ✅ **Send to ANY email** (no verification needed for recipients)
- ✅ **2-minute setup**
- ✅ **No credit card required**
- ✅ **Better than Gmail** (no app passwords, no 2FA issues)

---

## Setup Steps (2 Minutes)

### Step 1: Create Brevo Account

1. Go to: **https://www.brevo.com/**
2. Click **"Sign up free"**
3. Enter your email: `ikmal.baharudin@gmail.com` (or any email)
4. Create a password
5. Check your email and verify

### Step 2: Get SMTP Credentials

1. Login to Brevo dashboard
2. Go to: **https://app.brevo.com/settings/keys/smtp**
3. You'll see:
   ```
   SMTP server: smtp-relay.brevo.com
   Port: 587
   Login: your-email@gmail.com (the email you signed up with)
   Password: xkeysib-xxxxxxxxxxxxx (your SMTP key)
   ```

### Step 3: Update `.env` File

Open `/workspaces/cockpit/.env` and fill in:

```bash
# Email Provider - Brevo (Sendinblue) SMTP
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="ikmal.baharudin@gmail.com"  # Your Brevo login email
SMTP_PASS="xkeysib-xxxxxxxxxxxxx"      # Your SMTP key from dashboard
EMAIL_FROM="noreply@keystone-app.com"   # Can be anything!
```

**Important:**
- `SMTP_USER` = The email you used to sign up for Brevo
- `SMTP_PASS` = The SMTP key from the dashboard (starts with `xkeysib-`)
- `EMAIL_FROM` = Can be ANY email address (e.g., `noreply@keystone.com`, `admin@myapp.io`)

### Step 4: Restart Server

```bash
# Kill current server
Ctrl+C

# Restart
npm run dev
```

---

## Testing

After setup, test the magic link:

1. Go to: `http://localhost:3000/login`
2. Enter: `ikmls@hotmail.com`
3. Click: **"Send Magic Link"**
4. Check email at: `ikmls@hotmail.com` ✅ (it will actually go there now!)

---

## Benefits Over Previous Setup

| Feature | Resend | Brevo |
|---------|--------|-------|
| Send to any email | ❌ Only verified | ✅ Yes |
| Daily limit | 100 emails | 300 emails |
| Email override needed | ✅ Yes | ❌ No |
| Setup time | 5 min | 2 min |
| Credit card required | No | No |

---

## Troubleshooting

### "SMTP not configured" error

- Check that all 3 variables are set in `.env`:
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_HOST`

### "Authentication failed" error

- Double-check `SMTP_PASS` - copy it exactly from Brevo dashboard
- Make sure `SMTP_USER` matches your Brevo account email

### Emails not arriving

- Check spam folder
- Wait 1-2 minutes (sometimes delayed)
- Check Brevo dashboard > Statistics to see if email was sent

---

## Production Setup

For production, you can:

1. **Keep using Brevo free tier** (300 emails/day)
2. **Upgrade Brevo** ($25/month for 20,000 emails)
3. **Switch to another provider** (just update SMTP credentials)

---

## Quick Reference

**Brevo Dashboard:** https://app.brevo.com/
**SMTP Settings:** https://app.brevo.com/settings/keys/smtp
**Email Statistics:** https://app.brevo.com/statistics/email

---

**Need help?** Check server logs for detailed error messages:
```bash
npm run dev
```

Look for lines starting with `[Email]` or `[SMTP]`
