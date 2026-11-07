const CACHE_NAME = 'nekocrown-v1.2.0';
const ASSETS = [
  './',
  './index.html',
  './privacy-policy.html',
  './app-ads.txt',
  './manifest.webmanifest',
  './css/styles.css',
  './js/levels-data.js',
  './js/audio-engine.js',
  './js/i18n.js',
  './js/monetization.js',
  './js/game-crown.js',
  './js/game-block.js',
  './js/game-tango.js',
  './js/app.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
