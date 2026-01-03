// Bare-minimum offline-first SW for testing
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('test-v1').then((cache) =>
      cache.addAll(['/'])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
