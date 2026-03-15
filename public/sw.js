// Bare-minimum offline-first SW for testing
const CORE_ROUTES = [
  '/',
  '/auth',
  '/history',
  '/analytics',
  '/routines',
  '/exercises',
  '/workouts',
  '/admin',
  '/offline.html',
  '/manifest.json',
  '/vercel.svg'
];

self.addEventListener('install', (event) => {
  console.log('🔄 SW v11 installing...');
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open('v11');
  
      for (const route of CORE_ROUTES) {
        try {
          const response = await fetch(route);
          if (response.ok) {
            await cache.put(route, response.clone());
          }
        } catch (err) {
          console.log('⚠️ Failed to cache route:', route);
        }
      }
    })()
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
  if (event.request.url.includes('/_next/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open('v11');
  
        const cached = await cache.match(event.request);
        if (cached) return cached;
  
        try {
          const response = await fetch(event.request);
          await cache.put(event.request, response.clone());
          return response;
        } catch (err) {
          return cached || new Response('', { status: 503 });
        }
      })()
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // Check if we're online first
        const isOnline = navigator.onLine;

        if (isOnline) {
          // Online: Try network first, no offline page
          try {
            console.log('🌐 Online request for:', event.request.url);
            const response = await fetch(event.request);
            const cache = await caches.open('v11');

            const url = new URL(event.request.url);
            const normalizedRequest = new Request(url.pathname);

            await cache.put(normalizedRequest, response.clone());

            return response;
          } catch (error) {
            console.log('🌐 Network failed, trying cache:', event.request.url);
            // Network failed, try cache as fallback
            const cache = await caches.open('v11');
            const url = new URL(event.request.url);
            const normalizedRequest = new Request(url.pathname);
            let cachedRoute = await cache.match(normalizedRequest);

            if (cachedRoute) {
              return cachedRoute;
            }

            // Handle dynamic routine routes offline
            if (url.pathname.startsWith('/routine/')) {
              const fallback = await cache.match('/routines');
              if (fallback) {
                return fallback;
              }
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
