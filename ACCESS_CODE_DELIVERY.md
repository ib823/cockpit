# Access Code Delivery Methods

The system now supports **5 professional methods** to deliver 6-digit access codes to users:

## 🎯 Quick Comparison

| Method | Cost | Setup Time | Best For | Deliverability |
|--------|------|------------|----------|----------------|
| **QR Code** | Free | 0min | In-person/screen share | Instant |
| **Copy-to-Clipboard** | Free | 0min | Any manual sharing | Instant |
| **Push Notifications** | Free | 5min | Modern browsers | Instant |
| **Gmail SMTP** | Free | 2min | Email delivery | Good |
| **Resend API** | Free tier | 5min | Email delivery | Excellent |

---

## 1. 🔲 QR Code (Recommended - Zero Setup)

**How it works:**
- Admin approves email → QR code appears in modal
- User scans QR code → auto-fills email + code
- Or download QR code image to share

**Admin flow:**
1. Go to `/admin`
2. Add user email → Click "Approve Email"
3. Modal shows QR code + 6-digit code
4. Share QR code (screenshot/download) or copy code manually

**User flow:**
1. Visit `/login`
2. Scan QR code with phone camera
3. Login auto-completes

**Pros:**
- ✅ Zero external dependencies
- ✅ Works offline
- ✅ Professional and modern
- ✅ No email/SMS costs

**Cons:**
- ❌ Requires visual access (screen share or in-person)

---

## 2. 📋 Copy-to-Clipboard (Built-in)

**How it works:**
- Admin approves email → code shown in modal
- One-click copy to clipboard
- Share via preferred method (Slack, Teams, SMS, etc.)

**Usage:**
1. Admin approves email
2. Click "Copy" button in modal
3. Paste code into chat/SMS/call

**Pros:**
- ✅ Zero setup
- ✅ Flexible sharing (any medium)
- ✅ Simple and reliable

**Cons:**
- ❌ Manual sharing required

---

## 3. 🔔 Push Notifications (Progressive Web App)

**How it works:**
- User enables push notifications on login page
- Admin approves → browser push notification sent
- User clicks notification → code appears

**Setup (5 minutes):**

### Step 1: Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

### Step 2: Add to `.env.local`
```bash
VAPID_PUBLIC_KEY=BAbCdEfG...
VAPID_PRIVATE_KEY=hIjKlMnO...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAbCdEfG...  # Same as VAPID_PUBLIC_KEY
```

### Step 3: Run database migration
```bash
npx prisma db push
```

### Step 4: Restart server
```bash
npm run dev
```

**User flow:**
1. Visit `/login`
2. Toggle "Push Notifications" ON (allows browser notifications)
3. Admin approves → instant browser notification with code

**Pros:**
- ✅ Completely free
- ✅ Instant delivery
- ✅ Works across devices
- ✅ Professional UX

**Cons:**
- ❌ Requires VAPID key setup
- ❌ User must enable notifications
- ❌ Only works on HTTPS (production)

---

## 4. 📧 Gmail SMTP (Free Email - Recommended)

**How it works:**
- Uses your Gmail account to send emails
- 500 emails/day limit (free)
- Good deliverability

**Setup (2 minutes):**

### Step 1: Enable Google 2FA
Go to: https://myaccount.google.com/security

### Step 2: Generate App Password
Go to: https://myaccount.google.com/apppasswords
- Select "Mail" and your device
- Copy 16-character password

### Step 3: Add to `.env.local`
```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcd-efgh-ijkl-mnop
```

### Step 4: Restart server
```bash
npm run dev
```

**Email is sent automatically when:**
- Admin approves a new user
- User tries to login for first time

**Pros:**
- ✅ Completely free
- ✅ No credit card required
- ✅ Good deliverability
- ✅ Professional emails

**Cons:**
- ❌ Requires Google account
- ❌ 500 emails/day limit
- ❌ May require 2FA setup

---

## 5. 📨 Resend API (Best Deliverability)

**How it works:**
- Professional email service
- Rarely goes to spam
- 3,000 emails/month free

**Setup (5 minutes):**

### Step 1: Sign up
https://resend.com/signup

### Step 2: Get API Key
Dashboard → API Keys → Create

### Step 3: Add to `.env.local`
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com  # or use onboarding@resend.dev
```

### Step 4: (Optional) Verify domain
Add DNS records in Resend dashboard for better deliverability

### Step 5: Restart server
```bash
npm run dev
```

**Pros:**
- ✅ Excellent deliverability
- ✅ Professional service
- ✅ 3,000 emails/month free
- ✅ Beautiful email templates

**Cons:**
- ❌ Requires signup
- ❌ Domain verification recommended

---

## 🔄 Priority Order

The system tries methods in this order:

1. **Gmail SMTP** (if configured)
2. **Resend API** (if configured)
3. **Push Notifications** (if user subscribed)
4. **Dev mode** (logs to console)

**QR Code & Copy-to-Clipboard** are always available in admin modal.

---

## 🚀 Quick Start (Zero Setup)

Want to start immediately without email/push setup?

1. Use **QR Code** or **Copy-to-Clipboard**
2. Admin approves email → modal shows code
3. Share via preferred method (screenshot, chat, call)

---

## 🔒 Security Features

All methods include:
- ✅ 6-digit codes (1 million combinations)
- ✅ 7-day expiration
- ✅ One-time use only
- ✅ Hashed storage (bcrypt)
- ✅ Admin audit trail

---

## 📱 Production Deployment

### For HTTPS (production):
- Push notifications work fully
- QR codes work everywhere
- Email delivery optimal

### For localhost (development):
- QR codes work
- Copy-to-clipboard works
- Gmail/Resend work
- Push notifications limited (use ngrok for testing)

---

## 🛠️ Troubleshooting

### No email received?
- Check server logs for `[Gmail]` or `[Resend]` or `[DEV]`
- Dev mode logs code: `[DEV] Email not sent. Code: XXXXXX`
- Check spam folder

### Push notifications not working?
- Ensure VAPID keys are set
- Check browser supports push (Chrome, Firefox, Edge)
- HTTPS required in production (use ngrok for local testing)

### QR code not scanning?
- Ensure good lighting
- Try uploading QR image instead
- Or use copy-to-clipboard as fallback

---

## 📊 Which Method to Use?

**For quick testing:**
→ QR Code + Copy-to-Clipboard (zero setup)

**For email delivery:**
→ Gmail SMTP (free, 2min setup)

**For best deliverability:**
→ Resend API (5min setup, excellent inbox placement)

**For modern UX:**
→ Push Notifications (5min setup, instant delivery)

**For in-person onboarding:**
→ QR Code (instant, professional)

---

## 🎉 Summary

You now have **5 professional options** to deliver access codes:

1. ✅ **QR Code** - Zero setup, instant, modern
2. ✅ **Copy-to-Clipboard** - Zero setup, flexible
3. ✅ **Push Notifications** - Free, instant, modern (5min setup)
4. ✅ **Gmail SMTP** - Free email, good delivery (2min setup)
5. ✅ **Resend API** - Best email delivery (5min setup)

Mix and match based on your needs!
