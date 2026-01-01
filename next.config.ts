import type { NextConfig } from "next";
// @ts-ignore
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Offline fallbacks for true offline-first experience
  fallbacks: {
    document: '/offline.html',
  },
  // Enhanced caching for offline-first functionality
  runtimeCaching: [
    {
      // Cache the app shell aggressively for offline access
      urlPattern: /^\/$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'offline-shell',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      // Cache static JavaScript files aggressively
      urlPattern: /\/_next\/static.+\.js$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-js',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    {
      // Cache CSS files
      urlPattern: /\/_next\/static.+\.css$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-css',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    {
      // Cache images and other static assets
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
})(nextConfig);
