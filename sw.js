const VERSION = 'cdh-btt-pwa-v5';
const CLOUDFLARE_TOKEN = 'aefb84cd8fa546bda853ceec721b8746';
const CLOUDFLARE_SNIPPET = `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${CLOUDFLARE_TOKEN}"}'></script><!-- End Cloudflare Web Analytics -->`;
const VISIT_COUNTER_SNIPPET = `<script src="/assets/visit-counter.js?v=20260913-1" defer></script>`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

function isProductionPage(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/v14/')) return false;
  if (url.pathname.startsWith('/gestion-master/')) return false;
  return true;
}

async function withProductionEnhancements(request) {
  const response = await fetch(request);
  if (!response.ok) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();

  if (!html.includes(CLOUDFLARE_TOKEN) && html.includes('</body>')) {
    html = html.replace('</body>', `${CLOUDFLARE_SNIPPET}\n</body>`);
  }

  if (!html.includes('visit-counter.js') && html.includes('</body>')) {
    html = html.replace('</body>', `${VISIT_COUNTER_SNIPPET}\n</body>`);
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate' && isProductionPage(url)) {
    event.respondWith(withProductionEnhancements(event.request));
    return;
  }

  const isDynamicAsset = url.origin === self.location.origin && (
    url.pathname.endsWith('/assets/v13.js') ||
    url.pathname.endsWith('/assets/colaboradores.js') ||
    url.pathname.endsWith('/assets/visit-counter.js') ||
    url.pathname.startsWith('/data/')
  );

  if (isDynamicAsset) {
    event.respondWith(fetch(event.request, { cache: 'reload' }));
    return;
  }

  event.respondWith(fetch(event.request));
});
