(function () {
  'use strict';

  if (!window.API) {
    console.error('[API Adapter] API belum tersedia. Muat setelah scripts-1-inti-fase1.js dan sebelum scripts-4-fase4-app.js.');
    return;
  }

  var endpoint = window.GESIT_API_ENDPOINT || '/api';
  var publicBase = window.GESIT_PUBLIC_BASE_URL || window.location.origin + window.location.pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '');

  function normalizeAppInfo(action, data, res) {
    if (!res || !res.success) return res;
    if (action === 'getAppInfo' && res.data) res.data.url = publicBase;
    if (action === 'getModuleBundle' && data && data.module === 'boot' && res.data && res.data.app_info && res.data.app_info.data) {
      res.data.app_info.data.url = publicBase;
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
        body: JSON.stringify({ action: action, token: Store.get('sg_token') || '', data: data })
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
        res = normalizeAppInfo(action, data, res);
        if (res && res.sessionExpired && window.Auth && Auth.forceLogout) Auth.forceLogout('Sesi Anda berakhir. Silakan login kembali.');
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
    AppInfo.url = publicBase;
    AppInfo.publicUrl = function (page) {
      return publicBase + (publicBase.indexOf('?') === -1 ? '?' : '&') + 'page=' + encodeURIComponent(page);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchAppInfo);
  else patchAppInfo();

  console.info('[API Adapter] aktif:', endpoint);
})();
