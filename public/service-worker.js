const CACHE_NAME = 'gesit-pwa-v5';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/styles-1-dasar.css',
  '/css/styles-2-komponen.css',
  '/css/styles-3-halaman.css',
  '/css/styles-4-lanjutan.css',
  '/css/styles-5-registrasi.css',
  '/css/pwa.css',
  '/js/scripts-1-inti-fase1.js',
  '/js/netlify-adapter.js',
  '/js/scripts-2-helper-fase2.js',
  '/js/scripts-3-fase3.js',
  '/js/scripts-4-fase4-app.js',
  '/js/scripts-5-registrasi.js',
  '/js/scripts-6-tour.js',
  '/js/pwa-install.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.pathname.startsWith('/.netlify/functions/')) return;
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const fromNetwork = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fromNetwork;
    })
  );
});
