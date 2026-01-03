// Bare-minimum offline-first SW for testing
self.addEventListener('install', (event) => {
  console.log('🔄 SW v11 installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open('v11').then((cache) =>
      cache.addAll(['/'])
    )
  );
});

self.addEventListener('activate', (event) => {
  console.log('🎯 SW v11 activating...');
  event.waitUntil(
    // Clean up old caches except current
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== 'v11') // Keep only current cache
          .map(name => {
            console.log('🗑️ Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim(); // Take control after cleanup
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((res) => res || fetch(event.request))
    );
  }
});
