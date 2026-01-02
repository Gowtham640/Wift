// Single Service Worker - Clean offline-first implementation
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  pages: `pages-${CACHE_VERSION}`,
  staticAssets: `static-assets-${CACHE_VERSION}`,
  nextStatic: `next-static-${CACHE_VERSION}`,
  apis: `apis-${CACHE_VERSION}`
};

if (workbox) {
  workbox.setConfig({ debug: false });

  // Install event - service worker installation
  self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installing');
    self.skipWaiting();
  });

  // Activate event - clean up old caches and take control
  self.addEventListener('activate', (event) => {
    console.log('🎯 Service Worker activating');
    event.waitUntil(
      Promise.all([
        // Clean up old caches
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                console.log('🗑️ Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        }),
        // Take control of all clients
        self.clients.claim()
      ])
    );
  });

  // Message handling for updates
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // CRITICAL: Navigation strategy - NetworkFirst with cache fallback
  // This allows Next.js to handle routing properly while enabling offline access
  // Let navigation fail naturally if not cached - no offline.html hijacking
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.pages,
      networkTimeoutSeconds: 3, // Quick timeout for navigation
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        })
        // ❌ REMOVED: handlerDidError - let navigation fail if not cached
      ]
    })
  );

  // Document requests (not navigation) - NetworkFirst with offline.html fallback
  // For images/documents opened outside PWA, direct fetch requests, etc.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document' && request.mode !== 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.pages,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60
        }),
        // ✅ Fallback to offline.html for document requests (not navigation)
        {
          handlerDidError: async () => {
            const cache = await caches.open(CACHE_NAMES.pages);
            const offlineResponse = await cache.match('/offline.html');
            return offlineResponse || new Response('Offline page not available', { status: 503 });
          }
        }
      ]
    })
  );

  // Cache static assets aggressively (images, icons, etc.)
  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/,
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.staticAssets,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        })
      ]
    })
  );

  // Cache Next.js static files (JS/CSS chunks)
  workbox.routing.registerRoute(
    /\/_next\/static.+\.(?:js|css)$/,
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.nextStatic,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        })
      ]
    })
  );

  // API routes - NetworkFirst with timeout
  workbox.routing.registerRoute(
    ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.apis,
      networkTimeoutSeconds: 10,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        })
      ]
    })
  );

  console.log('✅ Service Worker loaded successfully -', CACHE_VERSION);
} else {
  console.error('❌ Workbox failed to load');
}
