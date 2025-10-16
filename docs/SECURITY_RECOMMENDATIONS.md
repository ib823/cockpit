# Security Recommendations & Bot Protection

## Current Security Status

### ✅ Implemented Security Measures

1. **Rate Limiting**
   - Login endpoints: 20 attempts per 5 minutes
   - API endpoints: 60 requests per minute
   - Per-IP and per-user-agent isolation
   - Automatic blocking with Retry-After headers

2. **Authentication Security**
   - WebAuthn/Passkey support (phishing-resistant)
   - Admin code-based authentication
   - Magic link with 2-minute expiration
   - Session-based authentication (NextAuth)

3. **Security Headers**
   - Content-Security-Policy (CSP)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy
   - HSTS (production)

4. **Input Validation**
   - Email validation
   - Token expiration checks
   - SQL/NoSQL injection prevention (Prisma ORM)
   - XSS sanitization

5. **Audit Logging**
   - Admin login tracking
   - Failed login attempts
   - Access control violations

---

## 🤖 Bot Protection: CAPTCHA vs Modern Alternatives

### Traditional CAPTCHA Issues

❌ **Problems with reCAPTCHA v2/hCaptcha:**
- Poor user experience (solving puzzles)
- Accessibility issues (visual challenges)
- Privacy concerns (Google tracking)
- Can be bypassed by sophisticated bots
- Slows down legitimate users

### ✅ Recommended Modern Alternatives

## 1. **Cloudflare Turnstile** (RECOMMENDED)

**Why it's the best choice:**
- ✅ **Invisible/minimal friction** - Works without user interaction 99% of the time
- ✅ **Privacy-focused** - No tracking, GDPR compliant
- ✅ **Free tier** - 1 million verifications/month
- ✅ **Easy integration** - Simple JavaScript widget
- ✅ **Better UX** - No puzzles, no clicking fire hydrants
- ✅ **Modern detection** - Browser fingerprinting, behavioral analysis

**Implementation:**

```tsx
// app/components/TurnstileWidget.tsx
'use client';

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  siteKey: string;
}

export function TurnstileWidget({ onVerify, siteKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.turnstile && containerRef.current) {
        window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
          theme: 'light', // or 'dark'
          size: 'normal', // or 'compact'
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [siteKey, onVerify]);

  return <div ref={containerRef} />;
}
```

**Server-side verification:**

```typescript
// app/api/auth/verify-turnstile/route.ts
export async function POST(request: Request) {
  const { token } = await request.json();

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );

  const data = await response.json();

  return Response.json({
    success: data.success,
    error: data['error-codes']?.[0],
  });
}
```

**Cost:** FREE (1M verifications/month), then $0.10 per 1,000 verifications

---

## 2. **Fingerprinting + Behavioral Analysis** (Passive Protection)

**Libraries:**
- **FingerprintJS** - Browser fingerprinting
- **ProtectPlus** - Advanced bot detection

**Implementation:**

```typescript
// lib/bot-detection.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export async function detectBot(request: Request): Promise<{
  isBot: boolean;
  confidence: number;
  reason?: string;
}> {
  const headers = request.headers;
  const userAgent = headers.get('user-agent') || '';

  // 1. Known bot user agents
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return { isBot: true, confidence: 0.9, reason: 'Bot user agent' };
  }

  // 2. Missing browser headers
  const requiredHeaders = ['accept', 'accept-language', 'accept-encoding'];
  const missingHeaders = requiredHeaders.filter(h => !headers.get(h));

  if (missingHeaders.length > 0) {
    return {
      isBot: true,
      confidence: 0.7,
      reason: `Missing headers: ${missingHeaders.join(', ')}`
    };
  }

  // 3. Suspicious header order (browsers have consistent order)
  const headerOrder = Array.from(headers.keys());
  const suspiciousOrder = !headerOrder.includes('user-agent') ||
                          headerOrder.indexOf('user-agent') > 10;

  if (suspiciousOrder) {
    return { isBot: true, confidence: 0.6, reason: 'Suspicious header order' };
  }

  // 4. Request rate analysis (in middleware)
  // Already implemented in our rate limiter

  return { isBot: false, confidence: 0 };
}
```

**Client-side fingerprinting:**

```typescript
// app/hooks/useFingerprint.ts
import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    const getFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);
    };

    getFingerprint();
  }, []);

  return fingerprint;
}
```

**Cost:** FingerprintJS: $200/month for 100K identifications

---

## 3. **Multi-Factor Authentication (MFA)**

**Best practices:**
- ✅ Already have: Passkey (WebAuthn) - strongest MFA
- ✅ Already have: Magic link (email-based)
- ⭐ Add: TOTP (Time-based One-Time Password)
- ⭐ Add: SMS verification (for high-risk actions)

**TOTP Implementation (Recommended):**

```bash
npm install @levminer/speakeasy qrcode
```

```typescript
// lib/totp.ts
import speakeasy from '@levminer/speakeasy';
import QRCode from 'qrcode';

export async function generateTOTP(userId: string, email: string) {
  const secret = speakeasy.generateSecret({
    name: `Cockpit (${email})`,
    issuer: 'Cockpit',
    length: 32,
  });

  // Save secret.base32 to database for user
  await prisma.users.update({
    where: { id: userId },
    data: { totpSecret: secret.base32 },
  });

  // Generate QR code for user to scan
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return { secret: secret.base32, qrCode: qrCodeUrl };
}

export function verifyTOTP(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds)
  });
}
```

---

## 4. **Device Fingerprinting + Trust Score**

**Approach:**
- Track device fingerprints on successful login
- Build trust score based on:
  - Known device (fingerprint match)
  - Known location (IP/country)
  - Login time patterns
  - User behavior

**Implementation:**

```typescript
// lib/trust-score.ts
export async function calculateTrustScore(
  userId: string,
  fingerprint: string,
  ip: string
): Promise<number> {
  // Get user's historical data
  const history = await prisma.loginHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  let score = 0;

  // Known device (+40 points)
  if (history.some(h => h.fingerprint === fingerprint)) {
    score += 40;
  }

  // Known IP (+30 points)
  if (history.some(h => h.ip === ip)) {
    score += 30;
  }

  // Typical login time (+20 points)
  const hour = new Date().getHours();
  const typicalHours = history.map(h => new Date(h.createdAt).getHours());
  if (typicalHours.some(h => Math.abs(h - hour) < 2)) {
    score += 20;
  }

  // Login frequency (+10 points if not too frequent)
  const recentLogins = history.filter(
    h => Date.now() - h.createdAt.getTime() < 24 * 60 * 60 * 1000
  );
  if (recentLogins.length < 10) {
    score += 10;
  }

  return score; // 0-100 scale
}

// Use trust score to require additional verification
export async function requireAdditionalVerification(trustScore: number): Promise<boolean> {
  if (trustScore < 50) {
    // Require email verification or TOTP
    return true;
  }
  return false;
}
```

---

## 5. **Honeypot Fields** (Free, Simple)

**How it works:**
- Add hidden fields that humans won't fill (invisible via CSS)
- Bots often fill all fields
- Reject submissions with honeypot values

**Implementation:**

```tsx
// app/components/LoginForm.tsx
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Hidden field

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // If honeypot is filled, it's a bot
    if (honeypot) {
      console.log('Bot detected via honeypot');
      return;
    }

    // Proceed with login...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      {/* Honeypot field - hidden from humans */}
      <input
        type="text"
        name="website" // Common honeypot name
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <button type="submit">Login</button>
    </form>
  );
}
```

**Cost:** FREE

---

## 📊 Comparison Table

| Solution | User Experience | Security | Privacy | Cost | Implementation |
|----------|----------------|----------|---------|------|----------------|
| **Cloudflare Turnstile** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | FREE | ⭐⭐⭐⭐⭐ |
| **reCAPTCHA v3** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | FREE | ⭐⭐⭐⭐ |
| **hCaptcha** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | FREE | ⭐⭐⭐⭐ |
| **FingerprintJS** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | $200/mo | ⭐⭐⭐ |
| **TOTP/MFA** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | FREE | ⭐⭐⭐⭐ |
| **Honeypot** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | FREE | ⭐⭐⭐⭐⭐ |
| **Behavioral Analysis** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Custom | ⭐⭐ |

---

## 🎯 Recommended Implementation Strategy

### Phase 1: Immediate (Free)
1. ✅ Already done: Rate limiting
2. ✅ Already done: Security headers
3. ⭐ **Add: Honeypot fields** (1 hour)
4. ⭐ **Add: Basic bot detection** (2 hours)

### Phase 2: Short-term (1-2 weeks)
5. ⭐ **Implement Cloudflare Turnstile** (4 hours)
   - Add on login form
   - Add on admin login
   - Server-side verification

6. ⭐ **Add TOTP/MFA for admins** (8 hours)
   - Generate secrets
   - QR code display
   - Verification flow

### Phase 3: Long-term (1-2 months)
7. ⭐ **Device fingerprinting + trust scores** (16 hours)
8. ⭐ **Advanced behavioral analysis** (24 hours)
9. ⭐ **Machine learning bot detection** (40 hours)

---

## 💰 Cost Analysis

### FREE Options
- ✅ Cloudflare Turnstile (1M/month)
- ✅ Honeypot fields
- ✅ Basic bot detection
- ✅ TOTP/MFA
- ✅ Rate limiting (current)

### Paid Options (if scaling)
- FingerprintJS Pro: $200/month (100K IDs)
- Cloudflare Bot Management: $10/month + $0.10/1K requests
- DataDome: $500+/month (enterprise)
- Castle.io: $300+/month

---

## 🔒 Enhanced Security Checklist

### Must Have (Current)
- [x] Rate limiting
- [x] WebAuthn/Passkey support
- [x] Security headers
- [x] SQL/NoSQL injection prevention
- [x] XSS protection
- [x] Session management

### Should Have (Recommended)
- [ ] Cloudflare Turnstile
- [ ] TOTP/MFA for admins
- [ ] Honeypot fields
- [ ] Device fingerprinting
- [ ] Login attempt monitoring
- [ ] Suspicious activity alerts

### Nice to Have (Advanced)
- [ ] Machine learning bot detection
- [ ] Behavioral analysis
- [ ] Real-time threat intelligence
- [ ] Anomaly detection
- [ ] Automatic IP blocking

---

## 🚀 Quick Start: Add Turnstile

```bash
# 1. Get free Turnstile keys from Cloudflare
# https://dash.cloudflare.com/?to=/:account/turnstile

# 2. Add to .env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# 3. Install (no package needed, uses CDN)

# 4. Add widget to login form (see code above)

# 5. Verify on server (see code above)
```

---

## 📚 Resources

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [FingerprintJS Docs](https://dev.fingerprint.com/docs)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [WebAuthn Guide](https://webauthn.guide/)
- [TOTP/MFA Best Practices](https://www.rfc-editor.org/rfc/rfc6238)

---

## ✅ Final Recommendation

**Best approach for this project:**

1. **Keep current security** (rate limiting, WebAuthn, security headers)
2. **Add Cloudflare Turnstile** - Best UX/security trade-off, FREE
3. **Add Honeypot** - Simple, effective, FREE
4. **Add TOTP for admins** - Extra security layer, FREE
5. **Monitor and iterate** - Use audit logs to detect patterns

**Total cost: $0/month** for excellent bot protection! 🎉
