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
        // Check if we're online first
        const isOnline = navigator.onLine;

        if (isOnline) {
          // Online: Try network first, no offline page
          try {
            console.log('🌐 Online request for:', event.request.url);
            return await fetch(event.request);
          } catch (error) {
            console.log('🌐 Network failed, trying cache:', event.request.url);
            // Network failed, try cache as fallback
            const cache = await caches.open('v11');
            const url = new URL(event.request.url);
            const normalizedRequest = new Request(url.pathname);
            const cachedRoute = await cache.match(normalizedRequest);
            if (cachedRoute) {
              console.log('✅ Serving cached route (fallback):', event.request.url);
              return cachedRoute;
            }
            // No cache available, show offline page
            const offlinePage = await cache.match('/offline.html');
            return offlinePage || new Response('Offline', { status: 503 });
          }
        } else {
          // Offline: Use smart visited route logic
          const cache = await caches.open('v11');
          const url = new URL(event.request.url);
          const normalizedRequest = new Request(url.pathname);
          const cachedRoute = await cache.match(normalizedRequest);

          if (cachedRoute) {
            console.log('✅ Serving cached route:', event.request.url);
            return cachedRoute;
          }

          // Check if route was visited before
          const visitedRoutes = JSON.parse(
            sessionStorage.getItem('visited_routes') || '[]'
          );

          if (visitedRoutes.includes(url.pathname)) {
            // Visited but not cached? Something wrong, show offline page
            console.log('📄 Visited but not cached, showing offline:', event.request.url);
            const offlinePage = await cache.match('/offline.html');
            return offlinePage || new Response('Offline', { status: 503 });
          } else {
            // Never visited offline route - show offline page
            console.log('📄 Unvisited offline route:', event.request.url);
            const offlinePage = await cache.match('/offline.html');
            return offlinePage || new Response('Offline', { status: 503 });
          }
        }
      })()
    );
  }
});
