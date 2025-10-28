# Offline Testing Guide

Complete guide for testing PWA offline functionality, service workers, and data synchronization.

---

## Prerequisites

1. **Development Server Running**
   ```bash
   npm run dev
   # Server should be running on http://localhost:3002
   ```

2. **Modern Browser**
   - Chrome 90+ (recommended for DevTools)
   - Firefox 88+
   - Edge 90+
   - Safari 14+ (limited support)

3. **HTTPS or localhost**
   - Service workers require HTTPS in production
   - Works on localhost for development

---

## Quick Start Testing

### 1. Enable Service Worker

Make sure the service worker is registered. Check browser console for:
```
[ServiceWorker] Registered: /service-worker.js
```

### 2. Test Offline Mode

**Method 1: Chrome DevTools**
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Check **"Offline"** checkbox
4. Reload the page

**Method 2: Browser Settings**
- Turn on Airplane mode on your device
- Disconnect from Wi-Fi

### 3. Verify Offline Functionality

✅ **Should Work Offline:**
- Previously visited pages
- Cached static assets (JS, CSS, images)
- Estimator tool with local storage
- View cached data
- Create estimates (queued for sync)

❌ **Requires Connection:**
- Fresh API data
- User authentication (initial login)
- New page loads (first visit)
- Real-time features

---

## Chrome DevTools Testing

### Application Tab

1. **Open DevTools** → **Application** tab

2. **Service Workers**
   - Location: `Application > Service Workers`
   - Actions:
     - ✅ Verify registration
     - 🔄 Update service worker
     - ❌ Unregister for clean testing
     - ⚠️ Skip waiting (force update)

3. **Cache Storage**
   - Location: `Application > Cache Storage`
   - Caches to check:
     - `sap-cockpit-v1` - App shell and static assets
     - `sap-cockpit-runtime` - Runtime cached content
   - Actions:
     - View cached resources
     - Delete individual items
     - Clear all caches

4. **IndexedDB**
   - Location: `Application > IndexedDB > sap-cockpit-offline`
   - Databases:
     - **estimates** - Saved project estimates
     - **projects** - Project data
     - **pending-sync** - Queued requests
     - **cache** - General cached data
   - Actions:
     - Inspect stored data
     - Delete entries
     - Clear database

5. **Manifest**
   - Location: `Application > Manifest`
   - Verify:
     - ✅ Manifest loads correctly
     - ✅ Icons display
     - ✅ App name and colors correct
     - ✅ Install prompt available

---

## Testing Scenarios

### Scenario 1: Fresh Install

**Steps:**
1. Open app in incognito/private window
2. Visit `/dashboard`
3. Service worker installs automatically
4. Check DevTools for install event

**Expected:**
- Service worker registered
- Static assets cached
- App shell cached
- Ready for offline use

---

### Scenario 2: Offline Browsing

**Steps:**
1. Visit app while online
2. Navigate to `/dashboard`, `/estimator`, `/gantt-tool`
3. Go offline (DevTools or Airplane mode)
4. Navigate between visited pages

**Expected:**
- ✅ All visited pages load from cache
- ✅ No error messages
- ✅ Offline indicator shows
- ✅ UI remains functional

---

### Scenario 3: Offline Data Creation

**Steps:**
1. Go to `/estimator` while **online**
2. Configure an estimate (profile, team size)
3. Go **offline**
4. Modify the estimate
5. Create a new estimate
6. Check IndexedDB for saved data

**Expected:**
- ✅ Changes saved to IndexedDB
- ✅ Offline indicator shows pending sync count
- ✅ No data loss
- ✅ Can continue working offline

---

### Scenario 4: Sync When Online

**Steps:**
1. Create data while offline (Scenario 3)
2. Go back **online**
3. Watch sync indicator
4. Check browser console for sync logs

**Expected:**
- ✅ Automatic sync triggered
- ✅ `[SyncService] Syncing X items` in console
- ✅ Pending count decreases
- ✅ Data successfully synced to server
- ✅ IndexedDB pending queue cleared

**Console Output:**
```
[SyncService] Connection restored
[SyncService] Starting sync...
[SyncService] Syncing 3 items
[OfflineStorage] Estimate saved: abc-123
[SyncService] Sync complete: 3 succeeded, 0 failed
```

---

### Scenario 5: Service Worker Update

**Steps:**
1. Make changes to `service-worker.js`
2. Change `CACHE_NAME` version (e.g., `v1` → `v2`)
3. Reload the page
4. Check for update notification

**Expected:**
- ✅ New service worker installs
- ✅ Update available indicator shows
- ✅ Old caches cleared on activation
- ✅ Page reloads with new version

---

### Scenario 6: PWA Installation

**Steps:**
1. Open app in Chrome (desktop or mobile)
2. Look for install prompt or menu option
3. Click "Install Keystone"
4. Launch installed app

**Expected:**
- ✅ Install prompt appears
- ✅ App installs to home screen/app menu
- ✅ Launches in standalone mode
- ✅ Works offline from installed app
- ✅ App shortcuts work (if supported)

**Install Locations:**
- **Chrome Desktop**: Address bar → Install icon
- **Chrome Mobile**: Menu → "Install App" or "Add to Home Screen"
- **Edge**: Settings → Apps → Install this site as an app

---

## Testing Utilities

### 1. Offline Indicator Component

Add to any page to see offline status:

```tsx
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';

export default function Page() {
  return (
    <>
      <OfflineIndicator position="bottom-right" />
      {/* Your content */}
    </>
  );
}
```

### 2. Console Commands

Open browser console and run:

```javascript
// Check online status
navigator.onLine

// Check service worker status
navigator.serviceWorker.getRegistrations()

// Force sync
navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-offline-data'))

// Open IndexedDB
indexedDB.databases()
```

### 3. React Hooks for Testing

```tsx
import { useOnlineStatus, useSyncStatus } from '@/lib/offline/use-offline';

function TestComponent() {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, triggerSync } = useSyncStatus();

  return (
    <div>
      <p>Online: {isOnline ? 'Yes' : 'No'}</p>
      <p>Syncing: {isSyncing ? 'Yes' : 'No'}</p>
      <p>Pending: {pendingCount}</p>
      <button onClick={triggerSync}>Trigger Sync</button>
    </div>
  );
}
```

---

## Troubleshooting

### Service Worker Not Registering

**Problem:** Service worker doesn't register

**Solutions:**
1. Check console for errors
2. Verify file exists at `/public/service-worker.js`
3. Check HTTPS/localhost requirement
4. Clear browser cache and hard reload (Ctrl+Shift+R)
5. Check for syntax errors in service worker

### Cache Not Working

**Problem:** Pages don't load offline

**Solutions:**
1. Visit pages while online first (to cache them)
2. Check Cache Storage in DevTools
3. Verify cache names match in service worker
4. Clear old caches and reload

### IndexedDB Errors

**Problem:** Data not saving offline

**Solutions:**
1. Check IndexedDB support: `window.indexedDB`
2. Check storage quota: `navigator.storage.estimate()`
3. Verify database schema in DevTools
4. Clear IndexedDB and reinitialize

### Sync Not Working

**Problem:** Data doesn't sync when online

**Solutions:**
1. Check console for sync errors
2. Verify network is actually online
3. Check pending items in IndexedDB
4. Manually trigger sync via console
5. Check API endpoint availability

---

## Performance Testing

### Cache Hit Rate

Monitor cache effectiveness:

```javascript
// In service-worker.js, add logging
self.addEventListener('fetch', (event) => {
  caches.match(event.request).then((response) => {
    console.log(response ? '✓ Cache HIT' : '✗ Cache MISS', event.request.url);
  });
});
```

### Storage Usage

Check storage quota:

```javascript
navigator.storage.estimate().then(estimate => {
  console.log('Usage:', estimate.usage);
  console.log('Quota:', estimate.quota);
  console.log('Percentage:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
});
```

### Network Performance

Test different connection speeds:

1. DevTools → Network
2. Throttling dropdown → Add custom profile
3. Test app under various conditions:
   - Fast 3G
   - Slow 3G
   - Offline

---

## Automated Testing

### Playwright Test Example

```typescript
import { test, expect } from '@playwright/test';

test('works offline', async ({ page, context }) => {
  // Visit page while online
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Go offline
  await context.setOffline(true);

  // Navigate to another page
  await page.goto('/estimator');

  // Verify page loads
  await expect(page.locator('h1')).toContainText('Estimator');

  // Check offline indicator
  await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
});
```

---

## Best Practices

### 1. Always Test Both States
- ✅ Test online → offline transition
- ✅ Test offline → online transition
- ✅ Test fresh install offline

### 2. Clear State Between Tests
```javascript
// Clear everything for clean test
await caches.keys().then(names =>
  Promise.all(names.map(name => caches.delete(name)))
);

const dbs = await indexedDB.databases();
dbs.forEach(db => indexedDB.deleteDatabase(db.name));
```

### 3. Monitor Console
- Watch for service worker logs
- Check for sync events
- Monitor error messages

### 4. Test on Real Devices
- Desktop browser
- Mobile browser
- Installed PWA
- Different network conditions

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| White screen offline | Page not cached | Visit page online first |
| Sync never triggers | No connection | Check network status |
| Old cache persists | Version not updated | Update CACHE_NAME in SW |
| IndexedDB quota | Storage full | Clear old data or request more quota |
| Service worker fails | Syntax error | Check console for errors |

---

## Resources

### Documentation
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA auditing
- [Workbox](https://developers.google.com/web/tools/workbox) - Service worker library
- [PWA Builder](https://www.pwabuilder.com/) - PWA testing and validation

### Chrome DevTools
- [Application Panel Guide](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
- [Service Worker Debugging](https://developer.chrome.com/docs/devtools/progressive-web-apps/#service-workers)

---

## Quick Reference

### Service Worker Lifecycle

1. **Register** → Service worker file loaded
2. **Install** → Cache static assets
3. **Activate** → Clean up old caches
4. **Fetch** → Intercept network requests
5. **Sync** → Background sync when online

### Cache Strategies

- **Cache First** - Static assets (JS, CSS, images)
- **Network First** - API data, HTML pages
- **Stale While Revalidate** - Best of both worlds

### Event Listeners

```javascript
// Service worker events
self.addEventListener('install', (event) => { /* ... */ });
self.addEventListener('activate', (event) => { /* ... */ });
self.addEventListener('fetch', (event) => { /* ... */ });
self.addEventListener('sync', (event) => { /* ... */ });

// Client events
window.addEventListener('online', () => { /* ... */ });
window.addEventListener('offline', () => { /* ... */ });
```

---

**Happy Testing! 🧪**

For issues or questions, refer to the main documentation or open an issue in the repository.
