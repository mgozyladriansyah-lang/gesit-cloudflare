(function () {
  'use strict';

  if (!window.API) {
    console.error('[Netlify Adapter] API belum tersedia. Pastikan adapter dimuat setelah scripts-1-inti-fase1.js dan sebelum App.init berjalan.');
    return;
  }

  var netlifyBase = window.GESIT_PUBLIC_BASE_URL || window.location.origin + window.location.pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '');
  var endpoint = window.GESIT_API_ENDPOINT || '/.netlify/functions/api';
  var originalCall = API.call;

  function normalizeAppInfoResponse(action, data, res) {
    if (!res || !res.success) return res;

    if (action === 'getAppInfo' && res.data) {
      res.data.url = netlifyBase;
    }

    if (action === 'getModuleBundle' && data && data.module === 'boot' && res.data && res.data.app_info && res.data.app_info.data) {
      res.data.app_info.data.url = netlifyBase;
    }

    return res;
  }

  API.call = function (action, data, opsi) {
    data = data || {};
    API._aktif++;
    if (API._denyut) API._denyut();

    var busyBtn = null;
    if (!(opsi && opsi.latar) && API._polaTulis && API._polaTulis.test(String(action || '')) &&
        API._klik && API._klik.btn && Date.now() - API._klik.t < 1200) {
      var kandidat = API._klik.btn;
      if (!kandidat.disabled && !kandidat.classList.contains('is-busy') && document.contains(kandidat)) {
        busyBtn = kandidat;
        busyBtn.disabled = true;
        busyBtn.classList.add('is-busy', 'is-auto-busy');
      }
    }

    return new Promise(function (resolve) {
      var done = false;
      var isTulis = API._polaTulis && API._polaTulis.test(String(action || ''));
      var batasMs = isTulis ? API.TIMEOUT_TULIS_MS : API.TIMEOUT_MS;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve({ success: false, error: 'Waktu tunggu habis. Periksa koneksi Anda.' });
      }, batasMs || 45000);

      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          action: action,
          token: Store.get('sg_token') || '',
          data: data
        })
      })
      .then(function (res) {
        return res.text().then(function (text) {
          var body;
          try { body = text ? JSON.parse(text) : { success: false, error: 'Respon kosong dari server' }; }
          catch (e) { body = { success: false, error: 'Respon server bukan JSON: ' + text.substring(0, 180) }; }
          if (!res.ok && body && body.success !== false) {
            body.success = false;
            body.error = 'HTTP ' + res.status + ' dari server.';
          }
          return body;
        });
      })
      .then(function (res) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        res = normalizeAppInfoResponse(action, data, res);
        if (res && res.sessionExpired && window.Auth && Auth.forceLogout) {
          Auth.forceLogout('Sesi Anda berakhir. Silakan login kembali.');
        }
        resolve(res);
      })
      .catch(function (err) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ success: false, error: (err && err.message) || 'Gagal terhubung ke server' });
      });
    }).then(function (res) {
      API._aktif = Math.max(0, API._aktif - 1);
      if (API._denyut) API._denyut();
      if (busyBtn) {
        busyBtn.disabled = false;
        busyBtn.classList.remove('is-busy', 'is-auto-busy');
      }
      return res;
    });
  };

  function patchAppInfo() {
    if (!window.AppInfo) return;
    AppInfo.url = netlifyBase;
    AppInfo.load = function () {
      API.call('getAppInfo').then(function (r) {
        if (r && r.success && r.data) {
          AppInfo.url = netlifyBase;
          AppInfo.halaman = r.data.halaman || null;
          AppInfo.kantor = r.data.kantor || AppInfo.kantor || '';
        } else {
          AppInfo.url = netlifyBase;
        }
      }).catch(function () {
        AppInfo.url = netlifyBase;
      });
    };
    AppInfo.publicUrl = function (page) {
      return netlifyBase + (netlifyBase.indexOf('?') === -1 ? '?' : '&') + 'page=' + encodeURIComponent(page);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchAppInfo);
  else patchAppInfo();

  console.info('[Netlify Adapter] API.call aktif via Netlify Function:', endpoint);
})();
