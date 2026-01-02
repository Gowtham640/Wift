const { injectManifest } = require('workbox-build');

injectManifest(require('./workbox-config.js'))
  .then(() => {
    console.log('✅ Service worker manifest injected successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to inject manifest:', error);
    process.exit(1);
  });
