// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Cockpit Access Code';

  // Determine actions based on whether it's a magic link or code
  const actions = data.url && data.url.includes('token=')
    ? [
        {
          action: 'magic-login',
          title: '🔓 Login Securely',
          icon: '/icon-192.png'
        },
        {
          action: 'dismiss',
          title: 'Not me? Ignore'
        }
      ]
    : [
        {
          action: 'open',
          title: 'Open Login'
        },
        {
          action: 'copy',
          title: 'Copy Code'
        }
      ];

  const options = {
    body: data.body || 'Your access code is ready',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      ...data,
      // Trust indicators visible in notification
      timestamp: Date.now(),
    },
    tag: 'access-code',
    requireInteraction: true,
    vibrate: [200, 100, 200], // Subtle vibration pattern
    actions: actions,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Handle dismiss action
  if (event.action === 'dismiss') {
    // Just close notification, no action
    return;
  }

  // Handle magic link login
  if (event.action === 'magic-login' || (event.notification.data && event.notification.data.url && event.notification.data.url.includes('token='))) {
    const url = event.notification.data.url || '/login';
    event.waitUntil(
      clients.openWindow(url)
    );
    return;
  }

  // Handle code copy
  if (event.action === 'copy') {
    if (event.notification.data && event.notification.data.code) {
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
          for (let client of clientList) {
            if ('focus' in client) {
              client.postMessage({
                type: 'COPY_CODE',
                code: event.notification.data.code
              });
              return client.focus();
            }
          }
        })
      );
    }
    return;
  }

  // Default: open URL or login page
  const defaultUrl = (event.notification.data && event.notification.data.url) || '/login';
  event.waitUntil(
    clients.openWindow(defaultUrl)
  );
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
