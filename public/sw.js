// Bare-minimum offline-first SW for testing
self.addEventListener('install', (event) => {
  console.log('🔄 SW v11 installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open('v11').then((cache) =>
      cache.addAll([
        '/',           // Dashboard (for root route)
        '/offline.html' // Offline page (for uncached routes)
      ])
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
      (async () => {
        const cache = await caches.open('v11');

        // Step 1: Check if requested route is cached
        const cachedRoute = await cache.match(event.request);
        if (cachedRoute) {
          console.log('✅ Serving cached route:', event.request.url);
          return cachedRoute;
        }

        // Step 2: Route not cached → serve offline page
        const offlinePage = await cache.match('/offline.html');
        if (offlinePage) {
          console.log('📄 Serving offline page for:', event.request.url);
          return offlinePage;
        }

        // Step 3: Emergency fallback
        return fetch(event.request);
      })()
    );
  }
});
