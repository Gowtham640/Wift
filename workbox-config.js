module.exports = {
  // Look in the Next.js build output directory
  globDirectory: '.next',

  // Only cache JS and CSS chunks, exclude source maps
  globPatterns: [
    'static/chunks/*.js',
    'static/chunks/*.css',
    '!static/chunks/*.map'
  ],

  // Source SW file (will be modified in-place)
  swSrc: 'public/sw.js',

  // Destination (same as source for injectManifest)
  swDest: 'public/sw.js',

  // Maximum file size to cache (5MB)
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
};
