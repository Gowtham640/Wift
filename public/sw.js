// Bare-minimum offline-first SW for testing
const CORE_ROUTES = [
  '/',
  '/auth',
  '/history',
  '/analytics',
  '/routines',
  '/exercises',
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
        try {
          // CHANGED: network-first for all navigation requests
          console.log('🌐 Navigation request:', event.request.url);
          const response = await fetch(event.request);
          const cache = await caches.open('v11');
          const url = new URL(event.request.url);
          const normalizedRequest = new Request(url.pathname);
          await cache.put(normalizedRequest, response.clone());
          return response;
        } catch (error) {
          // CHANGED: app-shell fallback for any offline navigation
          const cache = await caches.open('v11');
          const appShell = await cache.match('/');
          if (appShell) return appShell;
          const offlinePage = await cache.match('/offline.html');
          return offlinePage || new Response('Offline', { status: 503 });
        }
      })()
    );
  }
});
