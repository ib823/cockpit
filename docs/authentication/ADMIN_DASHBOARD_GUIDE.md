# Admin Dashboard - Complete Guide

## 🔑 Admin Access

**Email:** `admin@admin.com`
**Code:** `123456`

**Login URL:** http://localhost:3001/login

## 📊 Dashboard Features

### User Management

**✅ Add Users**
- Enter user email
- Click "Send Code"
- Code sent via email (or shown in dev mode)
- User receives 6-digit code valid for 7 days

**✅ User Status Tracking**
- **Active** - Has passkey, access not expired
- **Pending** - Code sent, awaiting passkey setup
- **Expired** - Access period ended (7 days default)

**✅ Activity Monitoring**
- First login time
- Last login time
- Timelines generated count
- Last timeline generation

**✅ Access Control**
- 7-day access by default
- Exception users (no expiry)
- Automatic expiry tracking

### Dashboard Sections

#### 1. Add User Card
- Email input with instant validation
- Send code button
- Code display (auto-copied)
- Success/error messages
- Email delivery status

#### 2. Users Table
Columns:
- Email (with exception badge)
- Status (active/pending/expired)
- First Login (date + relative)
- Last Active (date + relative)
- Timelines (count + last)
- Access Expires (date + days left)

#### 3. Statistics Panel
- Active Users count
- Pending Setup count
- Total Timelines generated

## 🔐 Security Features

### Session Management
- **Admins:** 1-hour sessions
- **Users:** 15-minute sessions
- Automatic re-authentication required
- HttpOnly cookies
- Secure in production

### Access Control
- **Admins:** Code-only login (123456)
- **Users:** Passkey required after first login
- 7-day access validity
- Single-use codes
- Email delivery for transparency

### Login Flow

**Admin:**
1. Enter email → code input shown
2. Enter 123456
3. ✓ Logged in (no passkey)

**Regular User:**
1. Enter email
2. If no passkey → enter code from email
3. Set up passkey (fingerprint/Face ID)
4. ✓ Logged in

**Invalid Attempts:**
- Subtle shake animation
- No error messages (security)
- Enumeration-safe responses

## 📧 Email Integration

### Setup (Production)

1. Get Resend API key: https://resend.com
2. Add to `.env.local`:
   ```bash
   RESEND_API_KEY=re_xxx
   FROM_EMAIL=noreply@yourdomain.com
   ```

3. Emails auto-sent with beautiful HTML template

### Dev Mode (No API Key)

- Code shown in admin dashboard
- Message: "Code generated (email disabled in dev)"
- Copy code manually to share

## 📈 User Lifecycle

### 1. Admin Adds User
```
Admin Dashboard → Enter Email → Send Code
↓
User created in database
Access expires in 7 days
Code sent via email (6 digits, expires in 7 days)
```

### 2. User First Login
```
User visits /login → Enters email
↓
Code input shown → Enters code from email
↓
Passkey setup prompt → Sets up biometric
↓
firstLoginAt recorded
lastLoginAt recorded
Redirected to app
```

### 3. User Returns
```
User visits app → Redirected to /login (if expired)
↓
Enters email → Passkey prompt
↓
Biometric authentication
↓
lastLoginAt updated
Session created (15 min)
```

### 4. Access Expires (After 7 Days)
```
User tries to login → Access denied
↓
Status: Expired
Admin must renew access (send new code)
```

## 🎨 Design Philosophy

**Minimal** - Clean, focused interface
**Professional** - Enterprise-grade aesthetics
**Intuitive** - Self-explanatory workflows
**Smart** - Automatic status detection

### Color Coding
- **Green** - Active, success, healthy
- **Yellow** - Pending, warning, waiting
- **Red** - Expired, error, blocked
- **Blue** - Exception, special, admin
- **Slate** - Neutral, text, borders

## 🔧 API Endpoints

### Admin Protected

```
GET  /api/admin/users          - List all users with status
POST /api/admin/create-access  - Generate code for email
```

### Authentication

```
POST /api/auth/check-admin     - Check if email is admin
POST /api/auth/admin-login     - Admin code-only login
POST /api/auth/begin-login     - Start passkey auth
POST /api/auth/finish-login    - Complete passkey auth
POST /api/auth/begin-register  - Start passkey registration
POST /api/auth/finish-register - Complete registration
```

## 📊 Database Schema

### User Table
```prisma
model User {
  email           String    @unique
  role            Role      @default(USER)  // ADMIN | USER
  exception       Boolean   @default(false)
  accessExpiresAt DateTime
  firstLoginAt    DateTime?
  lastLoginAt     DateTime?
  timelinesGenerated Int    @default(0)
  lastTimelineAt  DateTime?
  authenticators  Authenticator[]
}
```

### Tracking Timeline Usage

When user generates timeline (future implementation):
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    timelinesGenerated: { increment: 1 },
    lastTimelineAt: new Date(),
  },
});
```

## 🚀 Quick Start

1. **Login as admin:**
   ```
   http://localhost:3001/login
   Email: admin@admin.com
   Code: 123456
   ```

2. **Add first user:**
   ```
   Dashboard → Add User → Enter email → Send Code
   ```

3. **User sets up:**
   ```
   User opens email → Clicks login → Enters code → Sets passkey
   ```

4. **Monitor activity:**
   ```
   Dashboard shows real-time status, logins, activity
   ```

## 💡 Best Practices

✅ **Review expired users weekly**
✅ **Monitor pending setups (follow up if > 2 days)**
✅ **Track timeline usage for insights**
✅ **Use exceptions sparingly (only for VIPs)**
✅ **Renew access before expiry for active users**

## 🐛 Troubleshooting

**User can't login:**
- Check status in dashboard
- If expired → send new code
- If pending → resend code

**Email not received:**
- Check spam folder
- Verify RESEND_API_KEY
- Use dev mode (copy code from dashboard)

**Session expired quickly:**
- Normal (15 min for users, 1 hour for admins)
- Best practice for security
- User re-authenticates with passkey (quick!)

## 🎯 Future Enhancements

- [ ] Bulk user import (CSV)
- [ ] Custom expiry per user
- [ ] Usage analytics dashboard
- [ ] Email notification before expiry
- [ ] User groups/teams
- [ ] Activity audit log viewer
- [ ] Export user data (CSV/PDF)
- [ ] SSO integration (Google/Microsoft)
