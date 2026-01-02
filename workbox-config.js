module.exports = {
  // Look in the Next.js build output directory
  globDirectory: '.next',

  // Only cache JS and CSS chunks needed for offline boot, exclude source maps
  globPatterns: [
    'static/chunks/**/*.js',   // Framework, main, app router client chunks
    'static/chunks/**/*.css',  // CSS chunks
    'static/css/**/*.css',     // Additional CSS files
    '!**/*.map'                // Exclude source maps
  ],

  // Source SW file (will be modified in-place)
  swSrc: 'public/sw.js',

  // Destination (same as source for injectManifest)
  swDest: 'public/sw.js',

  // Maximum file size to cache (5MB)
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
};
