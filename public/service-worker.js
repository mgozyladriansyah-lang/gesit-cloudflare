/* GESIT Service Worker - versioned update manager */
'use strict';

const GESIT_PWA_VERSION = '2026.08.11.12';
const CACHE_STATIC = 'gesit-static-' + GESIT_PWA_VERSION;
const CACHE_RUNTIME = 'gesit-runtime-' + GESIT_PWA_VERSION;
const CORE_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/pwa-changelog.json?v=' + GESIT_PWA_VERSION,
  '/js/pwa-version.js?v=' + GESIT_PWA_VERSION,
  '/js/pwa-install.js?v=' + GESIT_PWA_VERSION,
  '/js/mobile-navigation.js?v=5', '/js/pwa-stability.js?v=' + GESIT_PWA_VERSION, '/css/styles-1-dasar.css?v=' + GESIT_PWA_VERSION, '/css/styles-2-komponen.css?v=' + GESIT_PWA_VERSION, '/css/styles-3-halaman.css?v=' + GESIT_PWA_VERSION, '/css/styles-4-lanjutan.css?v=' + GESIT_PWA_VERSION, '/css/styles-5-registrasi.css?v=' + GESIT_PWA_VERSION, '/css/pwa.css?v=' + GESIT_PWA_VERSION, '/js/notification-center.js?v=' + GESIT_PWA_VERSION, '/js/interaction-unlock.js?v=' + GESIT_PWA_VERSION, '/js/scripts-5-registrasi.js?v=' + GESIT_PWA_VERSION, '/js/scripts-4-fase4-app.js?v=' + GESIT_PWA_VERSION, '/js/scripts-3-fase3.js?v=' + GESIT_PWA_VERSION, '/js/scripts-2-helper-fase2.js?v=' + GESIT_PWA_VERSION, '/js/scripts-1-inti-fase1.js?v=' + GESIT_PWA_VERSION, '/js/confirm-modal-fix.js?v=' + GESIT_PWA_VERSION, '/js/approval-modal-fix.js?v=' + GESIT_PWA_VERSION, '/js/compatibility-guard.js?v=' + GESIT_PWA_VERSION, '/js/role-mobile-ux.js?v=' + GESIT_PWA_VERSION, '/js/overlay-state-fix.js?v=' + GESIT_PWA_VERSION, '/js/scripts-6-tour.js?v=' + GESIT_PWA_VERSION, '/css/pwa.css',
  '/notification/notify.mp3', '/notifications/notify.mp3', '/sound/notify.mp3', '/sounds/notify.mp3'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      return cache.addAll(CORE_ASSETS.map(function(url) { return new Request(url, { cache: 'reload' }); })).catch(function() { return Promise.resolve(); });
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key.indexOf('gesit-static-') === 0 && key !== CACHE_STATIC) return caches.delete(key);
        if (key.indexOf('gesit-runtime-') === 0 && key !== CACHE_RUNTIME) return caches.delete(key);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

function isNavigation(request) { return request.mode === 'navigate' || (request.headers.get('accept') || '').indexOf('text/html') !== -1; }
function isFreshAsset(url) { return /\.(js|css|json|webmanifest)$/i.test(url.pathname) || url.pathname === '/index.html' || url.pathname === '/'; }
function networkFirst(request) {
  return fetch(request).then(function(response) {
    var clone = response.clone();
    caches.open(CACHE_RUNTIME).then(function(cache) { cache.put(request, clone).catch(function() {}); });
    return response;
  }).catch(function() { return caches.match(request); });
}
function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      var clone = response.clone();
      caches.open(CACHE_RUNTIME).then(function(cache) { cache.put(request, clone).catch(function() {}); });
      return response;
    });
  });
}

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isNavigation(request) || isFreshAsset(url)) { event.respondWith(networkFirst(request)); return; }
  if (/\.(mp3|wav|ogg|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)) { event.respondWith(cacheFirst(request)); return; }
  event.respondWith(networkFirst(request));
});

self.addEventListener('message', function(event) {
  var data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'GET_VERSION') event.source && event.source.postMessage({ type: 'PWA_VERSION', version: GESIT_PWA_VERSION });
});


self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) return client.navigate(targetUrl);
          return client;
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl || '/');
    })
  );
});

self.addEventListener('message', function(event) {
  var data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title || 'GESIT', {
      body: data.body || 'Ada notifikasi baru.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'gesit-notification',
      renotify: true,
      data: { url: data.url || '/', type: data.notifType || 'gesit' },
      vibrate: [80, 40, 80]
    });
  }
});
