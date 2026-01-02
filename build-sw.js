const { injectManifest } = require('workbox-build');
const fs = require('fs');
const path = require('path');

// Clean injection point before injecting manifest
const swPath = path.join(__dirname, 'public', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace any injected manifest array with placeholder
swContent = swContent.replace(
  /self\.__WB_MANIFEST\s*=?\s*\[.*?\]/s,
  'self.__WB_MANIFEST'
);

// Also handle cases where it's just the array without assignment
swContent = swContent.replace(
  /^\s*\[.*?\]\s*$/m,
  'self.__WB_MANIFEST'
);

fs.writeFileSync(swPath, swContent);

injectManifest(require('./workbox-config.js'))
  .then(() => {
    console.log('✅ Service worker manifest injected successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to inject manifest:', error);
    process.exit(1);
  });
