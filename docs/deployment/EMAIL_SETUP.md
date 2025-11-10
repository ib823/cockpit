# Email Setup Guide

The app now supports **two free email options** (no credit card required):

## Option 1: Gmail SMTP (Recommended - Completely Free)

**Pros:**

- ✅ Completely free (500 emails/day)
- ✅ No credit card required
- ✅ Built-in, works immediately
- ✅ Good deliverability

**Setup steps:**

1. **Enable 2-Step Verification on your Google account:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Add to `.env.local`:**

   ```bash
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

**Done!** Emails will now be sent via Gmail SMTP.

---

## Option 2: Resend API (Best deliverability)

**Pros:**

- ✅ Free tier: 3,000 emails/month, 100/day
- ✅ Excellent deliverability (rarely goes to spam)
- ✅ Professional email service

**Setup steps:**

1. **Sign up:** https://resend.com/signup
2. **Get API key:** Dashboard → API Keys → Create
3. **Add to `.env.local`:**
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com  # or use onboarding@resend.dev
   ```
4. **Restart dev server**

---

## Priority Order

The system tries providers in this order:

1. **Gmail SMTP** (if `GMAIL_USER` + `GMAIL_APP_PASSWORD` set)
2. **Resend** (if `RESEND_API_KEY` set)
3. **Dev mode** (logs code to console if no provider configured)

---

## Testing

After setup, test by:

1. Go to `/admin` (use admin code: run `npx tsx scripts/set-admin-code.ts`)
2. Add a new email
3. User tries to login → email is sent
4. Check your email for the 6-digit code

---

## Troubleshooting

**Gmail "Less secure app access" error:**

- You must use App Passwords (not regular password)
- Enable 2FA first, then generate App Password

**Resend emails going to spam:**

- Verify your domain in Resend dashboard
- Or use `onboarding@resend.dev` for testing (may still go to spam)

**No email received:**

- Check server console logs for errors
- Dev mode will log: `[DEV] Email not sent. Code: XXXXXX`
- Gmail will log: `[Gmail] Email sent to: user@example.com`
- Resend will log: `[Resend] Email sent to: user@example.com`
