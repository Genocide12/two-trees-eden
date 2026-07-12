// Two Trees: Eden — Service Worker
// Caches app shell for offline use.

const CACHE_NAME = 'eden-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never cache API calls (TTS, bot webhook) — always go to network
  if (url.pathname.startsWith('/api/')) return;
  // Only handle GET
  if (event.request.method !== 'GET') return;

  // Cache-first for static assets, network-first for pages
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|css|js)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
          return resp;
        }).catch(() => cached),
      ),
    );
    return;
  }

  // For HTML pages: network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(event.request).then((c) => c || caches.match('/'))),
  );
});
