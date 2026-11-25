const CACHE_NAME = 'silopi-veresiye-v9';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/silopi-dijital-logo.png',
];
const NAVIGATION_TIMEOUT_MS = 2200;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL);
        // Pre-cache the current Vite entry JS/CSS so the installed shell can start offline.
        const shell = await cache.match('/');
        if (shell) {
          const html = await shell.text();
          const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
          await Promise.all(assets.map(async (asset) => {
            try {
              const response = await fetch(asset);
              if (response.ok) await cache.put(asset, response);
            } catch { /* Keep install resilient if an optional shell asset is unavailable. */ }
          }));
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('silopi-veresiye-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Customer balances, purchase history, login and admin responses must never be cached.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedShell = await cache.match('/');
      const networkRequest = fetch(request).then((response) => {
        if (response.ok) void cache.put('/', response.clone()).catch(() => undefined);
        return response;
      }).catch(() => null);

      if (cachedShell) {
        const timeout = new Promise((resolve) => {
          setTimeout(() => resolve(null), NAVIGATION_TIMEOUT_MS);
        });
        const fastResponse = await Promise.race([networkRequest, timeout]);
        return fastResponse || cachedShell;
      }

      const response = await networkRequest;
      return response || new Response('Çevrimdışısınız. İnternet bağlantınızı kontrol edin.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    })());
    return;
  }

  // Vite's hashed /assets filenames are immutable: cache-first makes repeat visits fast.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
