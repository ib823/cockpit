# Phase E Features Setup Guide

Complete setup instructions for enabling tooltips, theme customization, analytics, and offline support.

---

## Quick Setup (5 minutes)

### 1. Environment Variables

Add to your `.env` file:

```bash
# Analytics (Phase E)
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id
NEXT_PUBLIC_HOTJAR_VERSION=6
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

**Note:** Analytics is disabled by default. Set to `false` to disable tracking.

### 2. PWA Assets

Generate icons and screenshots:

```bash
npm run pwa:setup
```

This creates:

- App icons (72px - 512px)
- Shortcut icons
- Screenshots for app stores

### 3. Verify Setup

Start the development server:

```bash
npm run dev
```

Open Chrome DevTools → Application tab:

- ✅ Manifest loads correctly
- ✅ Service worker registers
- ✅ Icons display
- ✅ Cache storage initialized

---

## Feature-by-Feature Setup

### 🛈 Tooltips

**Status:** ✅ Ready to use (no configuration needed)

**Usage:**

```tsx
import { HelpTooltip, FormFieldTooltip } from '@/components/shared/HelpTooltip';

// Basic tooltip
<HelpTooltip
  title="Feature Name"
  description="Helpful description"
/>

// Form field tooltip
<FormFieldTooltip
  label="Email Address"
  helpText="Enter your work email"
  required
  example="user@company.com"
/>
```

**Available Components:**

- `HelpTooltip` - General contextual help
- `FormFieldTooltip` - Form fields with examples
- `FeatureTooltip` - Feature descriptions
- `KeyboardShortcutTooltip` - Keyboard shortcuts

**Integrated Pages:**

- ✅ Dashboard - Statistics and quick actions
- ✅ Estimator - Profile selector, team size, advanced options
- 🔲 Add to your pages as needed

---

### 🎨 Theme Customization

**Status:** ✅ Ready to use (no configuration needed)

**User Settings Location:**

- Account page: `/account` → Theme & Appearance section

**Features:**

- **6 Accent Colors:** Blue, Purple, Green, Orange, Red, Teal
- **3 Density Modes:** Compact, Comfortable, Spacious
- **3 Theme Modes:** Light, Dark, System

**Developer Integration:**

```tsx
import { ThemeProvider } from "@/components/shared/ThemeProvider";

// Wrap your app
<ThemeProvider>{children}</ThemeProvider>;
```

**Accessing Preferences:**

```tsx
import { useAccentColor, useDensityMode } from "@/stores/preferences-store";

function MyComponent() {
  const accentColor = useAccentColor();
  const densityMode = useDensityMode();

  return <div style={{ color: `var(--accent)` }}>Themed content</div>;
}
```

---

### 📊 Analytics

**Status:** ⚠️ Requires configuration

#### Step 1: Get API Credentials

**Hotjar:**

1. Sign up at https://www.hotjar.com/
2. Create a new site
3. Copy your Site ID
4. Set version to `6`

**Mixpanel:**

1. Sign up at https://mixpanel.com/
2. Create a new project
3. Go to Settings → Project Settings
4. Copy your Project Token

#### Step 2: Configure Environment

Add to `.env`:

```bash
NEXT_PUBLIC_HOTJAR_ID=1234567
NEXT_PUBLIC_HOTJAR_VERSION=6
NEXT_PUBLIC_MIXPANEL_TOKEN=abc123xyz789
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

#### Step 3: Integrate Analytics Provider

Add to your root layout or `_app.tsx`:

```tsx
import { AnalyticsProvider } from "@/components/shared/AnalyticsProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
```

#### Step 4: Track Events

```tsx
import { useAnalytics } from "@/lib/analytics/use-analytics";

function MyComponent() {
  const { trackEvent, trackConversion } = useAnalytics();

  const handleSubmit = () => {
    trackEvent("estimate_created", {
      profile: "greenfield",
      team_size: 5,
    });

    trackConversion("estimate_completed", 1);
  };

  return <button onClick={handleSubmit}>Create Estimate</button>;
}
```

#### Step 5: Privacy Controls

Users can manage analytics in:

- `/account` → Analytics & Privacy section

Features:

- Opt-in/opt-out controls
- Do Not Track support
- Granular tracking preferences
- Data retention information

---

### 📱 Offline Support & PWA

**Status:** ✅ Ready to use (icons required)

#### Step 1: Generate Assets

```bash
# Generate all PWA assets
npm run pwa:setup

# Or individually
npm run pwa:icons
npm run pwa:screenshots
```

#### Step 2: Verify Manifest

Open `/manifest.json` in browser to verify:

- ✅ App name and description
- ✅ Icons paths correct
- ✅ Theme colors
- ✅ Start URL

#### Step 3: Test Service Worker

1. Open Chrome DevTools
2. Go to Application → Service Workers
3. Verify registration: `/service-worker.js`
4. Status should be "activated and running"

#### Step 4: Test Offline

See [OFFLINE_TESTING_GUIDE.md](./OFFLINE_TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Test:**

1. Visit `/dashboard` while online
2. Open DevTools → Network
3. Check "Offline" checkbox
4. Reload page
5. ✅ Page should load from cache

#### Step 5: Add Offline Indicator

```tsx
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <OfflineIndicator position="bottom-right" />
    </>
  );
}
```

#### Step 6: Enable Background Sync

The sync service starts automatically. To manually trigger:

```tsx
import { useSyncStatus } from "@/lib/offline/use-offline";

function SyncButton() {
  const { isSyncing, pendingCount, triggerSync } = useSyncStatus();

  return (
    <button onClick={triggerSync} disabled={isSyncing}>
      Sync {pendingCount} items
    </button>
  );
}
```

---

## Production Checklist

### Analytics

- [ ] Set `NEXT_PUBLIC_ANALYTICS_ENABLED=true`
- [ ] Add production Hotjar ID
- [ ] Add production Mixpanel token
- [ ] Test event tracking in production
- [ ] Verify Do Not Track respect
- [ ] Review privacy policy

### PWA

- [ ] Replace placeholder icons with branded icons
- [ ] Take actual screenshots for app stores
- [ ] Update manifest.json with production URLs
- [ ] Test installation on multiple devices
- [ ] Verify HTTPS in production
- [ ] Test offline functionality
- [ ] Validate manifest with Lighthouse

### Theme

- [ ] Test all accent colors
- [ ] Test all density modes
- [ ] Verify dark mode throughout app
- [ ] Check mobile responsiveness
- [ ] Test theme persistence

### Tooltips

- [ ] Add tooltips to all complex features
- [ ] Review tooltip content for clarity
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Check mobile tooltip behavior

---

## Testing Commands

```bash
# Run development server
npm run dev

# Generate PWA assets
npm run pwa:setup

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Browser Support

### Full Support

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Partial Support

- ⚠️ Safari iOS 14+ (limited service worker support)
- ⚠️ Samsung Internet 14+

### Not Supported

- ❌ Internet Explorer (all versions)
- ❌ Opera Mini

---

## Troubleshooting

### Analytics Not Working

**Problem:** Events not appearing in Hotjar/Mixpanel

**Solutions:**

1. Check browser console for errors
2. Verify environment variables are set
3. Check `NEXT_PUBLIC_ANALYTICS_ENABLED=true`
4. Disable ad blockers
5. Check Do Not Track setting
6. Verify API keys are correct

### Service Worker Not Registering

**Problem:** Service worker fails to register

**Solutions:**

1. Verify HTTPS or localhost
2. Check service-worker.js syntax
3. Clear browser cache
4. Check browser console for errors
5. Verify file exists at `/public/service-worker.js`

### Icons Not Displaying

**Problem:** App icons don't show in manifest

**Solutions:**

1. Run `npm run pwa:icons` to regenerate
2. Verify files exist in `/public/icons/`
3. Check manifest.json icon paths
4. Hard refresh browser (Ctrl+Shift+R)
5. Check browser console for 404 errors

### Theme Not Applying

**Problem:** Theme changes don't take effect

**Solutions:**

1. Hard refresh browser
2. Clear localStorage
3. Check browser console for errors
4. Verify CSS variables in DevTools
5. Check ThemeProvider is wrapping app

---

## Performance Impact

| Feature        | Bundle Size | Runtime Impact | Notes            |
| -------------- | ----------- | -------------- | ---------------- |
| Tooltips       | ~5KB        | Negligible     | Lazy loaded      |
| Theme          | ~10KB       | Instant        | CSS variables    |
| Analytics      | ~20KB       | Async          | Non-blocking     |
| Service Worker | ~15KB       | Background     | One-time install |
| IndexedDB      | ~8KB        | Negligible     | Async operations |

**Total Phase E Impact:** ~58KB (~2% of typical Next.js app)

---

## Security Considerations

### Analytics

- ✅ Respects Do Not Track
- ✅ User opt-in required
- ✅ Data anonymized
- ✅ No PII tracked by default
- ✅ GDPR compliant (with proper config)

### Offline Storage

- ✅ Same-origin policy enforced
- ✅ No sensitive data cached
- ✅ Encrypted in transit (HTTPS)
- ✅ User can clear data
- ✅ Automatic data expiry

### Service Worker

- ✅ Scoped to origin
- ✅ HTTPS required (production)
- ✅ No eval() or inline scripts
- ✅ Content Security Policy compatible

---

## Support & Resources

### Documentation

- [Phase E Implementation Summary](./PHASE_E_IMPLEMENTATION_SUMMARY.md)
- [Offline Testing Guide](./OFFLINE_TESTING_GUIDE.md)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://web.dev/add-manifest/)

### Tools

- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA audit
- [PWA Builder](https://www.pwabuilder.com/) - PWA testing
- [Workbox](https://developers.google.com/web/tools/workbox) - Service worker library

### Debugging

- Chrome DevTools → Application tab
- Firefox DevTools → Application → Service Workers
- Safari → Develop → Service Workers

---

## Next Steps

After completing Phase E setup:

1. **Test Everything**
   - Run through all testing scenarios
   - Test on multiple devices
   - Verify analytics tracking
   - Test offline functionality

2. **Customize for Your Needs**
   - Replace placeholder icons
   - Customize theme colors
   - Add more tooltips
   - Configure analytics events

3. **Deploy to Production**
   - Update environment variables
   - Enable analytics
   - Test on production domain
   - Monitor performance

4. **User Training**
   - Document new features
   - Create user guides
   - Demonstrate offline capabilities
   - Explain privacy controls

---

## Quick Reference

```bash
# Environment Variables
NEXT_PUBLIC_HOTJAR_ID=your_id
NEXT_PUBLIC_HOTJAR_VERSION=6
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# NPM Scripts
npm run pwa:setup        # Generate all PWA assets
npm run pwa:icons        # Generate app icons only
npm run pwa:screenshots  # Generate screenshots only
npm run pwa:test         # Show testing instructions

# Files Created
/public/manifest.json              # PWA manifest
/public/service-worker.js          # Service worker
/public/icons/*                    # App icons
/public/screenshots/*              # App screenshots
/src/components/shared/HelpTooltip.tsx
/src/components/shared/ThemeProvider.tsx
/src/components/shared/ThemeSettings.tsx
/src/lib/analytics/analytics-service.ts
/src/lib/offline/offline-storage.ts
```

---

**Phase E Setup Complete!** 🎉

All features are now ready to use. Refer to individual documentation for detailed implementation guides.
