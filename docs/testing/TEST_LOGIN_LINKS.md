# 🔐 KEYSTONE - Test Login Instructions

**Generated:** October 27, 2025
**Status:** ✅ Ready for Passkey Registration

---

## ✅ HOW TO LOGIN (Simple Steps)

### Method 1: Magic Link Registration (Recommended)

**Admin Account:**
```
http://localhost:3000/login?token=30685502f50b950117acc1a60948eb9a5a2f2b6ebba1c300e074ea3317f35c10
```

**Regular User Account:**
```
http://localhost:3000/login?token=2730d4f67d7f596e60176cdabe3926b06e65a60d03e777611c753afefef25e20
```

**Steps:**
1. Click one of the magic links above (or copy-paste into your browser)
2. The system will verify your email automatically
3. You'll be prompted to create a **Passkey** (use your fingerprint, face, or PIN)
4. Your passkey will be saved to your device
5. You're logged in!

**Next time you login:**
- Just enter your email
- Use your passkey (fingerprint/face)
- Instant secure login!

---

## 📧 Test Credentials

### Admin Account
```
Email: admin@test.com
Role:  ADMIN
```

**Magic Link:**
```
http://localhost:3000/login?token=30685502f50b950117acc1a60948eb9a5a2f2b6ebba1c300e074ea3317f35c10
```

---

### Regular User Account
```
Email: user@test.com
Role:  USER
```

**Magic Link:**
```
http://localhost:3000/login?token=2730d4f67d7f596e60176cdabe3926b06e65a60d03e777611c753afefef25e20
```

---

## 🔒 About Passkeys

**What are Passkeys?**
- Modern passwordless authentication (WebAuthn)
- Uses your fingerprint, face, or device PIN
- Phishing-resistant and ultra-secure
- No passwords to remember!

**Supported Devices:**
- 📱 iPhone/iPad (Touch ID / Face ID)
- 💻 MacBook (Touch ID)
- 🖥️ Windows Hello (Fingerprint / Face / PIN)
- 🔐 Android (Fingerprint / Face)
- 🔑 Hardware security keys (YubiKey, etc.)

---

## 🚀 Quick Start

1. **Click the magic link** for either admin or user account
2. **Create your passkey** when prompted (use fingerprint/face/PIN)
3. **You're in!** The app will redirect you to the dashboard

**That's it! No passwords needed.**

---

## 🔄 How Authentication Works

### First Time (Registration):
1. Enter email → System checks if you're approved
2. Click magic link → Email verified automatically
3. Create passkey → Biometric authentication registered
4. Logged in → Redirected to dashboard

### Every Time After (Login):
1. Enter email
2. Use passkey (fingerprint/face)
3. Logged in instantly!

---

## ✅ What's Available

- ✅ Email approvals created
- ✅ Magic links generated
- ✅ Users ready for passkey registration
- ✅ Database seeded (158 L3 items, 12 LOBs)
- ✅ Server running at http://localhost:3000
- ✅ Performance optimizations active (22x cache speedup)

---

## 📝 Notes

- **Magic links expire:** 7 days from now (November 3, 2025)
- **Passkeys are device-specific:** You'll need to register on each device
- **Admin privileges:** admin@test.com has full system access
- **Regular user:** user@test.com has standard access

---

## ❓ Troubleshooting

**"Invalid. Contact Admin"**
- Make sure you're using the magic link provided above
- Or enter your email and wait for the system to recognize you

**Passkey creation failed**
- Ensure your device supports passkeys
- Try using a different browser (Chrome/Edge/Safari recommended)
- Check browser permissions for WebAuthn

**Magic link expired**
- Run: `npx tsx scripts/create-email-approvals.ts` to generate new links

---

**Ready to test! Just click a magic link above and you're good to go! 🚀**
