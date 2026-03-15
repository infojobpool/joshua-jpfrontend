/**
 * PWA runtime caching - NetworkFirst for Next.js chunks to avoid stale cached JS after deploy.
 * This helps mobile/PWA users get fresh code instead of outdated cached chunks.
 */
const defaultCache = require('next-pwa/cache');

module.exports = [
  // NetworkFirst for Next.js chunks - try network first, avoid stale JS after deploy
  {
    urlPattern: /\/_next\/static\/chunks\/.+/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'nextjs-chunks',
      expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      networkTimeoutSeconds: 5,
    },
  },
  ...defaultCache,
];
