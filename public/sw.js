self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const title = payload.title || 'تنبيه جديد';
      
      const options = {
        body: payload.body || '',
        icon: '/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png',
        badge: '/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png',
        data: {
          url: payload.url || '/'
        },
        dir: 'rtl',
        lang: 'ar',
        vibrate: [100, 50, 100],
        badgeIcon: '/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png'
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('Error parsing push event data:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url ? new URL(event.notification.data.url, self.location.origin).toString() : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to find an existing window of our application
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
