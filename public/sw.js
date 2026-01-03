// Bare-minimum offline-first SW for testing
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('v11').then((cache) =>
      cache.addAll(['/'])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((res) => res || fetch(event.request))
    );
  }
});
