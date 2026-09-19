/* Token-Max service worker — minimal, safe offline support.
   - Cache-first for hashed build assets (immutable filenames)
   - Network-first for /data/*.json (freshness first, cache as fallback)
   - Network-only for everything else; nothing cross-origin is cached. */
const CACHE_NAME = 'token-max-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  // Hashed build assets: cache-first
  if (url.pathname.startsWith('/assets/') || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        hit =>
          hit ??
          fetch(event.request).then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Static data JSON: network-first, cached fallback
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // index.html + everything else: network-first
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok && !res.url.includes('/data/')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
