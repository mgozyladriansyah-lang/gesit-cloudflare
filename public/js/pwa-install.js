(function () {
  'use strict';

  var deferredPrompt = null;
  var installBtn = null;
  var refreshing = false;
  var updateCheckTimer = null;

  function appBasePath() {
    var p = window.location.pathname || '/';
    p = p.replace(/\/index\.html$/i, '/');
    if (p.charAt(p.length - 1) !== '/') p += '/';
    return p;
  }

  function assetUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '/') return path;
    return appBasePath() + path;
  }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }

  function toastInfo(title, msg) {
    if (window.Toast && Toast.info) Toast.info(title, msg);
    else alert(title + (msg ? '\n' + msg : ''));
  }

  function setButtonState() {
    installBtn = document.getElementById('pwaInstallBtn');
    if (!installBtn) return;
    if (isStandalone()) installBtn.classList.add('hidden');
    else installBtn.classList.remove('hidden');
  }

  function svgIcon(name) {
    if (window.iconSvg) return iconSvg(name, 'pwa-update-icon');
    return '';
  }

  function ensureUpdateBanner() {
    var old = document.getElementById('pwaUpdateBanner');
    if (old) return old;
    var el = document.createElement('div');
    el.id = 'pwaUpdateBanner';
    el.className = 'pwa-update-banner hidden';
    el.innerHTML = '' +
      '<div class="pwa-update-card">' +
        '<div class="pwa-update-mark">' + svgIcon('refresh') + '</div>' +
        '<div>' +
          '<div class="pwa-update-title">Versi baru tersedia</div>' +
          '<div class="pwa-update-text">Perbarui GESIT untuk memakai tampilan dan perbaikan terbaru.</div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" id="pwaUpdateNow">Perbarui Sekarang</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="pwaUpdateLater">Nanti</button>' +
      '</div>';
    document.body.appendChild(el);
    var later = document.getElementById('pwaUpdateLater');
    if (later) later.addEventListener('click', function () { el.classList.add('hidden'); });
    return el;
  }

  function showUpdateBanner(worker) {
    var el = ensureUpdateBanner();
    el.classList.remove('hidden');
    var now = document.getElementById('pwaUpdateNow');
    if (now) {
      now.onclick = function () {
        now.disabled = true;
        now.textContent = 'Memperbarui...';
        if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
        else window.location.reload();
      };
    }
  }

  function watchRegistration(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
    reg.addEventListener('updatefound', function () {
      var newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', function () {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(newWorker);
      });
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(assetUrl('service-worker.js')).then(function (reg) {
      watchRegistration(reg);
      if (updateCheckTimer) clearInterval(updateCheckTimer);
      updateCheckTimer = setInterval(function () { reg.update().catch(function () {}); }, 30 * 60 * 1000);
    }).catch(function (err) {
      console.warn('[PWA] Service worker gagal didaftarkan:', err && err.message);
    });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    setButtonState();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    if (installBtn) installBtn.classList.add('hidden');
    toastInfo('GESIT terpasang', 'Aplikasi sudah bisa dibuka dari layar utama/perangkat Anda.');
  });

  function init() {
    installBtn = document.getElementById('pwaInstallBtn');
    setButtonState();
    if (document.readyState === 'complete') registerServiceWorker();
    else window.addEventListener('load', registerServiceWorker, { once: true });

    if (!installBtn) return;
    installBtn.addEventListener('click', function () {
      if (isStandalone()) {
        toastInfo('Aplikasi sudah terpasang', 'Buka GESIT dari ikon aplikasi di perangkat Anda.');
        return;
      }
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          deferredPrompt = null;
          setButtonState();
        });
        return;
      }
      var isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
      if (isiOS) toastInfo('Pasang dari Safari', 'Ketuk tombol Bagikan, lalu pilih Tambahkan ke Layar Utama.');
      else toastInfo('Install belum tersedia', 'Buka menu browser lalu pilih Install app atau Tambahkan ke layar utama. Pastikan situs dibuka lewat HTTPS.');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
