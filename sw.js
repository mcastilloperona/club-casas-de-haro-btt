const VERSION = 'cdh-btt-pwa-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isDynamicAsset = url.origin === self.location.origin && (
    url.pathname.endsWith('/assets/v13.js') ||
    url.pathname.startsWith('/data/')
  );

  if (isDynamicAsset) {
    event.respondWith(fetch(event.request, { cache: 'reload' }));
    return;
  }

  event.respondWith(fetch(event.request));
});
