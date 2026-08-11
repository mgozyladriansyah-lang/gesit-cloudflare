/* ════════════════════════════════════════════════════════════════════════════
   GESIT V6 — JS 1/4: RUNTIME INTI + MODUL FASE 1
   Isi   : Ikon SVG, Store, BootGuard, API, Utilitas UI, Auth, Router, Sidebar, Dashboard, Digitamu, Manajemen User, Ganti Password, User Menu
   Urutan: file ke-1 dari 4 (WAJIB paling awal)
   Catatan: keempat file JS berbagi scope global (tanpa IIFE) agar antar-modul
   tetap saling terhubung. Muat sesuai urutan di atas.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   1. IKON — peta SVG inline (stroke, gaya lucide). Tanpa CDN = tanpa gagal.
   ══════════════════════════════════════════════════════════════════════════ */
var ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  users:     '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:      '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  usercog:   '<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><circle cx="18" cy="15" r="3"/><path d="M18 11v1m0 6v1m4-4h-1m-6 0h-1m6.5-2.5-.7.7m-4.6 4.6-.7.7m6 0-.7-.7m-4.6-4.6-.7-.7"/>',
  car:       '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10.5 15.6 6a2 2 0 0 0-1.8-1H8.2a2 2 0 0 0-1.8 1L4 10.5l-2.5.6C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  door:      '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h20"/><path d="M13 20V4a1 1 0 0 0-1.3-1L5.7 5A1 1 0 0 0 5 6v14"/><circle cx="10" cy="12" r=".8"/>',
  box:       '<path d="m7.5 4.3 9 5.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  grad:      '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
  clock:     '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  shield:    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  calendar:  '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  star:      '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z"/>',
  megaphone: '<path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  news:      '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/>',
  leaf:      '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.5 3.5-7C7 12.5 10 11 13 11"/>',
  chart:     '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 14l4-4 4 4 5-6"/>',
  activity:  '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  menu:      '<path d="M4 6h16M4 12h16M4 18h16"/>',
  chevron:   '<path d="m6 9 6 6 6-6"/>',
  logout:    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  lock:      '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye:       '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:    '<path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.2 3.2M6.6 6.6A18.5 18.5 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M2 2l20 20"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  /* V7.3d: 'cart' & 'minus' dipakai modal katalog ATK (judul, bar keranjang,
     stepper) tapi tak pernah ada di peta ini — renderIcons diam-diam jatuh ke
     ikon info (i). Terlihat jelas di HP: judul "Minta Barang ATK" beri ikon (i). */
  cart:      '<circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6"/>',
  minus:     '<path d="M5 12h14"/>',
  x:         '<path d="M18 6 6 18M6 6l12 12"/>',
  check:     '<path d="M20 6 9 17l-5-5"/>',
  refresh:   '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  search:    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  phone:     '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.6a2 2 0 0 1 1.8 2.1Z"/>',
  bell:      '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  alert:     '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  info:      '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  rocket:    '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8-.8-.7-2-.7-3 0Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.9 7.4-6 11a22.4 22.4 0 0 1-4 2Z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  key:       '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  trash:     '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  droplet:   '<path d="M12 2.7S6 9 6 14a6 6 0 0 0 12 0c0-5-6-11.3-6-11.3Z"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
  gauge:     '<path d="M3.3 15a9 9 0 1 1 17.4 0"/><path d="M12 14 8.5 9.5"/><circle cx="12" cy="14" r="1.5"/>',
  box2:      '<path d="m7.5 4.3 9 5.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"/>',
  inbox:     '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z"/>',
  send:      '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  link:      '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  download:  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  printer:   '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  file:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  camera:    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  settings:  '<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.8v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.8l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  monitor:   '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  award:     '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
  mail:      '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'
};

function iconSvg(name, cls) {
  var body = ICONS[name] || ICONS.info;
  return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
}

/** Render semua <svg data-icon="…"> di dalam root */
function renderIcons(root) {
  var nodes = (root || document).querySelectorAll('svg[data-icon]');
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var name = el.getAttribute('data-icon');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', '2');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    el.innerHTML = ICONS[name] || ICONS.info;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   2. STORE — penyimpanan aman (localStorage bisa diblokir di iframe GAS)
   ══════════════════════════════════════════════════════════════════════════ */
var Store = (function () {
  var mem = {};
  function probe(s) {
    try { s.setItem('__sg_test', '1'); s.removeItem('__sg_test'); return true; }
    catch (e) { return false; }
  }
  // Urutan: localStorage → sessionStorage → memori.
  // Browser dalam-aplikasi (WhatsApp/IG) & mode privat kerap memblokir
  // localStorage di iframe GAS; sessionStorage sering masih diizinkan
  // sehingga sesi minimal bertahan selama tab terbuka.
  var okL = false, okS = false;
  try { okL = probe(localStorage); } catch (e) {}
  try { okS = probe(sessionStorage); } catch (e) {}
  return {
    get: function (k) {
      if (okL) { try { var v = localStorage.getItem(k); if (v != null) return v; } catch (e) {} }
      if (okS) { try { var w = sessionStorage.getItem(k); if (w != null) return w; } catch (e) {} }
      return mem[k] !== undefined ? mem[k] : null;
    },
    set: function (k, v) {
      mem[k] = v;
      if (okL) { try { localStorage.setItem(k, v); } catch (e) {} }
      if (okS) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    },
    remove: function (k) {
      delete mem[k];
      if (okL) { try { localStorage.removeItem(k); } catch (e) {} }
      if (okS) { try { sessionStorage.removeItem(k); } catch (e) {} }
    }
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   2a. URL TOKEN — cadangan sesi anti-Safari iOS (audit V7.0)
   AKAR MASALAH "mental ke login" di Safari iOS: HtmlService merender aplikasi
   di dalam iframe lintas-situs (*.googleusercontent.com). Safari dengan
   "Prevent Cross-Site Tracking" (bawaan iOS) MEMBLOKIR localStorage &
   sessionStorage pada iframe pihak ketiga → token sesi hanya hidup di memori.
   Begitu Safari memuat ulang halaman (tekanan memori, pindah aplikasi,
   keyboard, dsb. — hal yang sangat sering di iOS), token memori lenyap dan
   pengguna terlempar kembali ke form login.
   SOLUSI: setelah login, token disalin ke hash URL jendela ATAS lewat
   google.script.history (API resmi GAS — bekerja lintas browser). Saat boot,
   bila Store kosong, token dibaca kembali dari hash lewat google.script.url.
   Hash tidak pernah terkirim ke server pihak lain dan dibersihkan saat logout.
   ══════════════════════════════════════════════════════════════════════════ */
var UrlToken = (function () {
  function ada() {
    try {
      return typeof google !== 'undefined' && google.script &&
             !!google.script.history && !!google.script.url;
    } catch (e) { return false; }
  }
  return {
    save: function (token) {
      if (!ada() || !token) return;
      try { google.script.history.replace(null, null, 'sgt=' + encodeURIComponent(token)); } catch (e) {}
    },
    clear: function () {
      if (!ada()) return;
      try { google.script.history.replace(null, null, ''); } catch (e) {}
    },
    read: function (cb) {
      if (!ada()) { cb(null); return; }
      var selesai = false;
      var timer = setTimeout(function () { if (!selesai) { selesai = true; cb(null); } }, 1500);
      try {
        google.script.url.getLocation(function (loc) {
          if (selesai) return;
          selesai = true; clearTimeout(timer);
          var h = (loc && loc.hash) || '';
          var m = /(?:^|[&#])sgt=([^&\s]+)/.exec(h);
          var t = null;
          if (m) { try { t = decodeURIComponent(m[1]); } catch (e) { t = m[1]; } }
          cb(t);
        });
      } catch (e) {
        if (!selesai) { selesai = true; clearTimeout(timer); cb(null); }
      }
    }
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   2a½. GEO HELPER — deteksi lokasi dua tahap (audit V7.0)
   AKAR MASALAH lokasi gagal di laptop: semua pemanggil lama memaksa
   enableHighAccuracy:true dengan timeout 8–10 dtk. Laptop tidak punya GPS —
   posisinya dihitung dari Wi-Fi/IP yang butuh mode akurasi RENDAH dan waktu
   lebih longgar; mode akurasi tinggi kerap berakhir POSITION_UNAVAILABLE /
   TIMEOUT. Kini: tahap 1 akurasi tinggi (cepat, jalur HP); bila gagal,
   otomatis jatuh ke tahap 2 akurasi rendah + cache 5 mnt (jalur laptop).
   Pesan galat dibedakan per kode supaya pengguna tahu harus berbuat apa.
   ══════════════════════════════════════════════════════════════════════════ */
var GeoHelper = {
  PESAN: {
    0: 'Perangkat/browser tidak mendukung deteksi lokasi.',
    1: 'Izin lokasi ditolak. Klik ikon gembok/lokasi di bilah alamat browser \u2192 izinkan Lokasi, lalu coba lagi.',
    2: 'Posisi tidak tersedia. Di laptop: aktifkan Layanan Lokasi sistem (Windows: Settings \u2192 Privacy & Security \u2192 Location; macOS: System Settings \u2192 Privacy) dan pastikan Wi-Fi menyala.',
    3: 'Waktu deteksi habis. Coba sekali lagi \u2014 di dalam gedung, posisi dekat jendela biasanya lebih cepat terkunci.'
  },
  deteksi: function () {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        resolve({ ok: false, code: 0, pesan: GeoHelper.PESAN[0] });
        return;
      }
      var sukses = function (pos) {
        resolve({ ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude,
                  accuracy: pos.coords.accuracy || 0 });
      };
      // Tahap 1 — akurasi tinggi: cepat di HP ber-GPS
      navigator.geolocation.getCurrentPosition(sukses, function (e1) {
        if (e1 && e1.code === 1) { // izin ditolak — tahap 2 pasti ditolak juga
          resolve({ ok: false, code: 1, pesan: GeoHelper.PESAN[1] });
          return;
        }
        // Tahap 2 — akurasi rendah (Wi-Fi/IP): jalur yang berhasil di laptop
        navigator.geolocation.getCurrentPosition(sukses, function (e2) {
          var c = (e2 && e2.code) || 3;
          resolve({ ok: false, code: c, pesan: GeoHelper.PESAN[c] || 'Lokasi tidak terdeteksi.' });
        }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 });
      }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   2b. BOOT GUARD — anti "layar putih": galat apa pun saat boot ditampilkan
       sebagai panel yang bisa dibaca + tombol muat ulang, bukan layar kosong.
   ══════════════════════════════════════════════════════════════════════════ */
var BootGuard = (function () {
  var ready = false, timer = null;
  function panel() {
    var el = document.getElementById('bootFail');
    if (el) return el;
    // Cadangan bila markup statis belum ada / gagal ter-render
    el = document.createElement('div');
    el.id = 'bootFail';
    el.className = 'boot-fail';
    el.innerHTML =
      '<div class="bf-card"><div class="bf-icon">!</div>' +
      '<div class="bf-title">Aplikasi gagal dimuat</div>' +
      '<p class="bf-msg" id="bootFailMsg"></p>' +
      '<button type="button" class="bf-btn" id="bootRetry">Muat Ulang</button>' +
      '<p class="bf-hint">Jika terus terjadi di HP: buka tautan lewat Chrome/Safari langsung (bukan browser dalam WhatsApp), pastikan hanya satu akun Google aktif, lalu coba lagi.</p></div>';
    (document.body || document.documentElement).appendChild(el);
    return el;
  }
  function fail(msg) {
    if (ready) return; // aplikasi sudah tampil — jangan menimpa layar
    try {
      var el = panel();
      var m = document.getElementById('bootFailMsg');
      if (m) m.textContent = msg || 'Terjadi kesalahan tak terduga saat memuat.';
      var loading = document.getElementById('appLoading');
      if (loading) loading.classList.add('is-hidden');
      el.classList.add('is-visible');
      var btn = document.getElementById('bootRetry');
      if (btn && !btn.__wired) { btn.__wired = true; btn.addEventListener('click', function () { location.reload(); }); }
    } catch (e) { /* jalur terakhir: biarkan */ }
  }
  window.addEventListener('error', function (e) {
    // Abaikan galat pemuatan resource (font/gambar) — hanya galat skrip
    // (punya pesan) yang berarti boot benar-benar bermasalah.
    if (!e || !e.message) return;
    fail('Galat skrip: ' + e.message);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    fail('Galat proses: ' + ((r && r.message) || String(r || 'tidak diketahui')));
  });
  return {
    arm: function (ms) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        fail('Aplikasi tidak merespons setelah ' + Math.round(ms / 1000) + ' detik. Periksa koneksi internet Anda.');
      }, ms || 25000);
    },
    ready: function () {
      ready = true;
      if (timer) { clearTimeout(timer); timer = null; }
      var el = document.getElementById('bootFail');
      if (el) el.classList.remove('is-visible');
    },
    fail: fail
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   3. API — jembatan ke backend (google.script.run → Promise + timeout)
   ══════════════════════════════════════════════════════════════════════════ */
var API = {
  TIMEOUT_MS: 45000,        // aksi BACA — pantas menyerah lebih cepat
  // Audit V7 #2: server (google.script.run) TIDAK bisa dibatalkan — pada aksi
  // TULIS, menyerah di 45 dtk lalu user menekan Simpan lagi berisiko data
  // ganda. Aksi tulis diberi napas lebih panjang; kunci req_id (ReqKey) tetap
  // menjadi jaring pengaman terakhirnya di backend.
  TIMEOUT_TULIS_MS: 75000,
  _polaTulis: /^(create|update|delete|approve|reject|cancel|lepas|ambil|proses|submit|nilai|review|catat|reset|resend|send|test|generate|upload|selesai|panggil|checkin|checkout|setup|ensure|simpan|tandai)/i,
  /* V7.4: penghitung panggilan yang sedang berjalan + "denyut" event
     'gesit:sibuk' setiap kali jumlahnya berubah. Runtime 4b memakainya
     untuk memutar/menghentikan ikon tombol Refresh secara global. */
  _aktif: 0,
  _denyut: function () {
    try { document.dispatchEvent(new CustomEvent('gesit:sibuk', { detail: { aktif: API._aktif } })); }
    catch (e) { /* browser sangat lama: spinner tetap dilepas jaring waktu */ }
  },
  call: function (action, data, opsi) {
    API._aktif++; API._denyut();
    /* V7.5: AUTO-BUSY — aksi TULIS otomatis mengunci tombol pemicunya
       (spinner + disabled) bila pemanggil lupa memasang btnLoading.
       • Tombol yang SUDAH di-disable pemanggil (btnLoading/apiKlikSekali
         berjalan lebih dulu di tick yang sama) dilewati — tidak dobel.
       • Panggilan latar belakang ({latar:true}) tidak menyentuh tombol. */
    var busyBtn = null;
    if (!(opsi && opsi.latar) && API._polaTulis.test(String(action || '')) &&
        API._klik && API._klik.btn && Date.now() - API._klik.t < 1200) {
      var kandidat = API._klik.btn;
      if (!kandidat.disabled && !kandidat.classList.contains('is-busy') &&
          document.contains(kandidat)) {
        busyBtn = kandidat;
        busyBtn.disabled = true;
        busyBtn.classList.add('is-busy', 'is-auto-busy');
      }
    }
    return new Promise(function (resolve) {
      var done = false;
      var batasMs = API._polaTulis.test(String(action || '')) ? API.TIMEOUT_TULIS_MS : API.TIMEOUT_MS;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve({ success: false, error: 'Waktu tunggu habis. Periksa koneksi Anda.' });
      }, batasMs);

      var payload = {
        action: action,
        token: Store.get('sg_token') || '',
        data: data || {}
      };

      try {
        google.script.run
          .withSuccessHandler(function (res) {
            if (done) return;
            done = true; clearTimeout(timer);
            res = res || { success: false, error: 'Respon kosong dari server' };
            if (res.sessionExpired) Auth.forceLogout('Sesi Anda berakhir. Silakan login kembali.');
            resolve(res);
          })
          .withFailureHandler(function (err) {
            if (done) return;
            done = true; clearTimeout(timer);
            resolve({ success: false, error: (err && err.message) || 'Gagal terhubung ke server' });
          })
          .api(payload);
      } catch (e) {
        done = true; clearTimeout(timer);
        resolve({ success: false, error: 'google.script tidak tersedia: ' + e.message });
      }
    }).then(function (res) {
      API._aktif = Math.max(0, API._aktif - 1); API._denyut(); /* V7.4 */
      if (busyBtn) { /* V7.5: pulihkan auto-busy apa pun hasilnya */
        busyBtn.disabled = false;
        busyBtn.classList.remove('is-busy', 'is-auto-busy');
      }
      return res;
    });
  }
};

/* V7.5: pelacak tombol TERAKHIR yang diklik — dipakai auto-busy API.call.
   Fase capture agar tercatat sebelum handler modul berjalan. */
document.addEventListener('click', function (ev) {
  var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
  if (b) API._klik = { btn: b, t: Date.now() };
}, true);

/* ══════════════════════════════════════════════════════════════════════════
   4. UTILITAS UI — toast, modal, konfirmasi, helper kecil
   ══════════════════════════════════════════════════════════════════════════ */
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Toast V6.8 — bukan sekadar pemberitahuan lewat:
   • opts.action {label, onClick} → tombol aksi (mis. "Buka Pusat Persetujuan")
     sehingga toast menjadi jalan pintas, bukan hanya kabar.
   • Tombol tutup (×) di setiap toast — galat panjang bisa ditutup segera.
   • Deduplikasi: pesan identik yang datang beruntun (<2,5 dtk — mis. klik
     ganda / dua modul melapor hal sama) cukup tampil sekali.
   • opts.sticky → menetap sampai ditutup manual; opts.duration → durasi ms.
   Kompatibel penuh ke belakang: Toast.success('pesan', 'sub') tetap sama. */
var Toast = {
  _last: { key: '', t: 0 },
  show: function (msg, type, sub, opts) {
    type = type || 'info';
    opts = opts || {};
    var key = type + '|' + msg + '|' + (sub || '');
    var kini = Date.now();
    if (key === Toast._last.key && kini - Toast._last.t < 2500) return;
    Toast._last = { key: key, t: kini };

    var stack = $('#toastStack');
    if (!stack) return;
    /* V7.4: umumkan ke pembaca layar tanpa menyela (sekali saja) */
    if (!stack.getAttribute('role')) { stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite'); }

    var iconName = { success: 'check', error: 'alert', warning: 'alert', info: 'info' }[type] || 'info';
    /* Durasi ditentukan DI DEPAN agar bilah sisa waktu (CSS --toast-dur)
       sinkron persis dengan timer penutup. Galat & toast beraksi diberi
       napas lebih panjang agar sempat dibaca/diklik. */
    var durasi = opts.sticky ? 0 :
      (opts.duration || (type === 'error' ? 5500 : ((opts.action && opts.action.label) ? 7000 : 3500)));

    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    if (durasi) el.style.setProperty('--toast-dur', durasi + 'ms');
    el.innerHTML =
      '<span class="toast-chip">' + iconSvg(iconName, 'toast-icon') + '</span>' +
      '<div class="toast-body"><div class="toast-msg">' + escapeHtml(msg) + '</div>' +
      (sub ? '<div class="toast-sub">' + escapeHtml(sub) + '</div>' : '') +
      (opts.action && opts.action.label
        ? '<button type="button" class="toast-action">' + escapeHtml(opts.action.label) + '</button>'
        : '') +
      '</div>' +
      '<button type="button" class="toast-close" aria-label="Tutup">' + iconSvg('x') + '</button>' +
      (durasi ? '<span class="toast-progress" aria-hidden="true"></span>' : '');
    stack.appendChild(el);

    var hidup = true;
    var tutup = function () {
      if (!hidup) return;
      hidup = false;
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 240);
    };
    el.querySelector('.toast-close').addEventListener('click', tutup);
    var act = el.querySelector('.toast-action');
    if (act) {
      act.addEventListener('click', function () {
        tutup();
        try { if (opts.action.onClick) opts.action.onClick(); }
        catch (e) { if (window.console) console.error('Aksi toast gagal: ' + e.message); }
      });
    }

    /* Hitung mundur yang BISA DIJEDA: arahkan kursor / tahan jari untuk
       membaca — bilah waktu ikut berhenti lewat kelas .is-paused. */
    if (durasi) {
      var sisa = durasi, mulai = Date.now(), timer = setTimeout(tutup, sisa);
      var jeda = function () {
        if (!hidup || !timer) return;
        clearTimeout(timer); timer = null;
        sisa -= (Date.now() - mulai);
        el.classList.add('is-paused');
      };
      var lanjut = function () {
        if (!hidup || timer) return;
        mulai = Date.now();
        timer = setTimeout(tutup, Math.max(600, sisa));
        el.classList.remove('is-paused');
      };
      el.addEventListener('mouseenter', jeda);
      el.addEventListener('mouseleave', lanjut);
      el.addEventListener('touchstart', jeda, { passive: true });
      el.addEventListener('touchend', lanjut);
      el.addEventListener('touchcancel', lanjut);
    }
  },
  success: function (m, s, o) { Toast.show(m, 'success', s, o); },
  error:   function (m, s, o) { Toast.show(m, 'error', s, o); },
  warning: function (m, s, o) { Toast.show(m, 'warning', s, o); },
  info:    function (m, s, o) { Toast.show(m, 'info', s, o); }
};

var Modal = {
  open: function (id) {
    var m = document.getElementById(id);
    if (m) { m.classList.add('is-open'); if (id === 'modalConfirm') document.body.classList.add('confirm-modal-open'); document.body.style.overflow = 'hidden'; }
  },
  close: function (id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove('is-open'); if (id === 'modalConfirm') document.body.classList.remove('confirm-modal-open');
    if (!$('.modal-backdrop.is-open')) document.body.classList.remove('confirm-modal-open'); document.body.style.overflow = '';
  },
  closeAll: function () {
    $all('.modal-backdrop.is-open').forEach(function (m) { m.classList.remove('is-open'); });
    document.body.classList.remove('confirm-modal-open'); document.body.style.overflow = '';
  }
};

var Confirm = (function () {
  var cb = null, cbCancel = null;
  function init() {
    $('#confirmOk').addEventListener('click', function () {
      Modal.close('modalConfirm');
      cbCancel = null;
      if (cb) { var f = cb; cb = null; f(); }
    });
    $('#confirmCancel').addEventListener('click', function () {
      cb = null; Modal.close('modalConfirm');
      if (cbCancel) { var g = cbCancel; cbCancel = null; g(); }
    });
  }
  function ask(title, text, onOk, onCancel) {
    $('#confirmTitle').textContent = title || 'Yakin?';
    $('#confirmText').textContent = text || '';
    cb = onOk;
    cbCancel = onCancel || null;
    Modal.open('modalConfirm');
  }
  return { init: init, ask: ask };
})();

/** Set tombol ke mode loading (spinner) / normal */
function btnLoading(btn, textEl, loading, normalText) {
  if (loading) {
    btn.disabled = true;
    textEl.innerHTML = '<span class="spinner" style="display:inline-block;vertical-align:-2px;margin-right:7px"></span>Memproses…';
  } else {
    btn.disabled = false;
    textEl.textContent = normalText;
  }
}

/** Audit V7 #3 — aksi satu-klik anti klik-ganda: tombol dinonaktifkan + diberi
    kelas .is-busy selama API berjalan, dipulihkan apa pun hasilnya. Klik saat
    masih berjalan langsung ditolak tanpa menembak API kedua kalinya. */
function apiKlikSekali(btn, action, data) {
  if (btn && btn.disabled) return Promise.resolve({ success: false, error: 'Sedang diproses…' });
  if (btn) { btn.disabled = true; btn.classList.add('is-busy'); }
  return API.call(action, data).then(function (res) {
    if (btn) { btn.disabled = false; btn.classList.remove('is-busy'); }
    return res;
  });
}

/* V7.5 — NOTIFIKASI KEPUTUSAN DI LATAR BELAKANG:
   Backend kini hanya MENGANTREKAN notifikasi approve/reject (respons kembali
   dalam ±1–3 dtk, bukan 6–15 dtk menunggu Telegram/email). Helper ini
   dipanggil SETELAH toast sukses tampil: menembakkan prosesNotifTertunda
   tanpa mengunci UI, lalu melaporkan hasil kirim lewat toast susulan. */
function notifTundaFlush(res) {
  if (!res || !res.notif_tunda) return;
  API.call('prosesNotifTertunda', { kunci: res.notif_tunda }, { latar: true }).then(function (r) {
    if (r && r.success && r.notif && r.notif.ringkas) {
      Toast.info('Notifikasi keputusan', r.notif.ringkas);
    } else if (r && !r.success) {
      Toast.warning('Notifikasi belum terkirim',
        (r.error || 'Gangguan jaringan') + ' — sistem akan menyusulkannya otomatis, atau gunakan tombol Kirim Pesan.');
    }
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   4b. RUNTIME UX KECIL (V7.4)
   (1) --vvh : tinggi viewport yang BENAR-BENAR terlihat (visualViewport) →
       dipakai CSS modal agar footer (mis. bar keranjang & tombol Kirim di
       katalog ATK) tidak pernah terpotong address-bar HP maupun tertutup
       keyboard saat mengetik pencarian barang.
   (2) Spinner Refresh global : SEMUA tombol yang memuat ikon refresh
       otomatis berputar sejak ditekan sampai panggilan API terakhir selesai
       (event 'gesit:sibuk' dari API.call) — tanpa mengubah satu modul pun.
       Jaring pengaman ganda: 600 ms tanpa API apa pun → dilepas (handler
       non-API), dan maksimum 20 dtk → dilepas paksa (koneksi macet).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  /* (1) --vvh */
  var vv = window.visualViewport || null;
  var _pVvh = '', _pKb = ''; /* AUDIT V7.6: nilai terakhir — cegah tulis ulang identik */
  function isiVvh() {
    var h = vv ? vv.height : window.innerHeight;
    if (!h) return;
    /* --kb: bagian bawah layar yang tertutup keyboard.
       • Android me-RESIZE layout viewport → innerHeight ≈ vvh → --kb ≈ 0.
       • iOS keyboard hanya MENUMPANG (overlay) → innerHeight tetap penuh
         → --kb = tinggi keyboard; CSS memakainya untuk MENGANGKAT lembar
         modal agar bar keranjang tetap di atas keyboard saat mengetik.
       AUDIT V7.6: event visualViewport 'scroll' menembak di SETIAP tick gulir;
       menulis custom property di <html> tiap tick memaksa recalculation gaya
       satu halaman → gulir tersendat di HP. Kini hanya menulis bila nilainya
       benar-benar berubah (buka/tutup keyboard, rotasi, resize). */
    var a = Math.round(h) + 'px';
    var b = Math.max(0, Math.round((window.innerHeight || h) - h)) + 'px';
    if (a === _pVvh && b === _pKb) return;
    _pVvh = a; _pKb = b;
    var st = document.documentElement.style;
    st.setProperty('--vvh', a);
    st.setProperty('--kb', b);
  }
  if (vv) { vv.addEventListener('resize', isiVvh); vv.addEventListener('scroll', isiVvh); }
  window.addEventListener('resize', isiVvh);
  window.addEventListener('orientationchange', isiVvh);
  isiVvh();

  /* (2) spinner refresh */
  function lepasSemuaSpinner() {
    $all('.is-refreshing').forEach(function (el) {
      el.classList.remove('is-refreshing');
      if (el._segarMaks) { clearTimeout(el._segarMaks); el._segarMaks = null; }
    });
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var b = (t && t.closest) ? t.closest('button') : null;
    if (!b || b.disabled || !b.querySelector('svg[data-icon="refresh"]')) return;
    b.classList.add('is-refreshing');
    if (b._segarMaks) clearTimeout(b._segarMaks);
    b._segarMaks = setTimeout(function () {
      b.classList.remove('is-refreshing'); b._segarMaks = null;
    }, 20000);
    /* handler yang tidak menyentuh API (render ulang lokal) → lepas cepat */
    setTimeout(function () { if (!(API._aktif > 0)) lepasSemuaSpinner(); }, 600);
  });
  var reda = null;
  document.addEventListener('gesit:sibuk', function (ev) {
    var aktif = (ev && ev.detail) ? ev.detail.aktif : 0;
    if (aktif > 0) { if (reda) { clearTimeout(reda); reda = null; } return; }
    /* debounce 250 ms: modul yang memanggil API beruntun tak membuat ikon
       tersendat berhenti-putar di sela dua panggilan */
    if (reda) clearTimeout(reda);
    reda = setTimeout(function () { reda = null; lepasSemuaSpinner(); }, 250);
  });

  /* (3) V7.5: BILAH KEMAJUAN GLOBAL di tepi atas layar.
     Aturan UX yang diminta: aksi kilat TIDAK perlu isyarat, aksi lama WAJIB —
     maka bilah baru muncul bila masih ada panggilan API setelah 350 ms, dan
     hilang begitu semua panggilan selesai. Berlaku otomatis untuk SEMUA aksi
     (pindah halaman, simpan, setujui/tolak) tanpa mengubah satu modul pun. */
  var barEl = null, barTimer = null, barTampil = false;
  function pastikanBar() {
    if (barEl) return barEl;
    barEl = document.createElement('div');
    barEl.id = 'gesitProgress';
    barEl.setAttribute('aria-hidden', 'true');
    barEl.innerHTML = '<span></span>';
    document.body.appendChild(barEl);
    return barEl;
  }
  document.addEventListener('gesit:sibuk', function (ev) {
    var aktif = (ev && ev.detail) ? ev.detail.aktif : 0;
    if (aktif > 0) {
      if (barTampil || barTimer) return;
      barTimer = setTimeout(function () {
        barTimer = null;
        if (API._aktif > 0) { pastikanBar().classList.add('is-on'); barTampil = true; }
      }, 350);
    } else {
      if (barTimer) { clearTimeout(barTimer); barTimer = null; }
      if (barTampil && barEl) { barEl.classList.remove('is-on'); barTampil = false; }
    }
  });
})();

/** Audit V7 #2 — kunci idempoten per "pembukaan form": kunci yang SAMA dipakai
    ulang bila user menekan Simpan lagi setelah timeout (server mendeteksi
    duplikat lewat data.req_id), dan baru dibuang setelah server menjawab
    sukses — pengiriman form berikutnya otomatis memakai kunci baru. */
var ReqKey = {
  _k: {},
  get: function (nama) {
    if (!ReqKey._k[nama]) {
      ReqKey._k[nama] = 'RQ' + Date.now() + Math.random().toString(36).slice(2, 8);
    }
    return ReqKey._k[nama];
  },
  clear: function (nama) { delete ReqKey._k[nama]; }
};

var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
             'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function tanggalIndo(d) {
  d = d || new Date();
  return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
}

function jamSekarang() {
  var d = new Date();
  function p(n) { return n < 10 ? '0' + n : n; }
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

/* ── STANDAR PENAMAAN BAGIAN (V6.6) — selaras DAFTAR_BAGIAN backend ── */
var DAFTAR_BAGIAN = [
  { kode: 'KEPSER',      nama: 'Bagian Kepesertaan',                            jenis: 'bagian' },
  { kode: 'SDMUK',       nama: 'Bagian SDM, Umum, dan Komunikasi',              jenis: 'bagian' },
  { kode: 'PKP',         nama: 'Bagian Perencanaan, Keuangan, dan Pemeriksaan', jenis: 'bagian' },
  { kode: 'YANSER',      nama: 'Bagian Mutu Layanan Kepesertaan',               jenis: 'bagian' },
  { kode: 'YANFASKES',   nama: 'Bagian Mutu Layanan Fasilitas Kesehatan',       jenis: 'bagian' },
  { kode: 'PMU',         nama: 'Bagian Penjaminan Manfaat dan Utilisasi',       jenis: 'bagian' },
  { kode: 'KK-BENTENG',  nama: 'Kantor Kabupaten Bengkulu Tengah',              jenis: 'kantor_kabupaten' },
  { kode: 'KK-SELUMA',   nama: 'Kantor Kabupaten Seluma',                       jenis: 'kantor_kabupaten' },
  { kode: 'KK-BS',       nama: 'Kantor Kabupaten Bengkulu Selatan',             jenis: 'kantor_kabupaten' },
  { kode: 'KK-KAUR',     nama: 'Kantor Kabupaten Kaur',                         jenis: 'kantor_kabupaten' },
  { kode: 'KK-MUKOMUKO', nama: 'Kantor Kabupaten Mukomuko',                     jenis: 'kantor_kabupaten' }
];

var BAGIAN_LABEL = {
  KEPSER: 'Kepesertaan (KEPSER)', SDMUK: 'SDM, Umum & Komunikasi (SDMUK)',
  PKP: 'Perencanaan, Keu. & Pemeriksaan (PKP)', YANSER: 'Mutu Layanan Kepesertaan (YANSER)',
  YANFASKES: 'Mutu Layanan Faskes (YANFASKES)', PMU: 'Penjaminan Manfaat & Utilisasi (PMU)',
  'KK-BENTENG': 'KK Bengkulu Tengah', 'KK-SELUMA': 'KK Seluma', 'KK-BS': 'KK Bengkulu Selatan',
  'KK-KAUR': 'KK Kaur', 'KK-MUKOMUKO': 'KK Mukomuko',
  KACAB: 'Kepala Cabang',
  /* kode lama — data historis tampil dengan nama standar baru */
  MLK: 'Mutu Layanan Kepesertaan (YANSER)', MLP: 'Mutu Layanan Kepesertaan (YANSER)',
  MLFK: 'Mutu Layanan Faskes (YANFASKES)', UMUM: 'SDM, Umum & Komunikasi (SDMUK)'
};

/* Isi semua <select data-bagian> dari satu daftar. Mode:
   std = 11 unit · tamu = 11 unit + Kepala Cabang · reg = 11 unit + TAD */
function bagianOptionsHtml(mode) {
  var out = '<option value="">— Pilih —</option>';
  var grp = function (jenis, judul) {
    var isi = DAFTAR_BAGIAN.filter(function (b) { return b.jenis === jenis; })
      .map(function (b) { return '<option value="' + b.kode + '">' + b.nama + ' (' + b.kode + ')</option>'; }).join('');
    return '<optgroup label="' + judul + '">' + isi + '</optgroup>';
  };
  out += grp('bagian', 'Bagian — dipimpin KABAG');
  out += grp('kantor_kabupaten', 'Kantor Kabupaten — dipimpin KAKAB');
  if (mode === 'tamu') out += '<optgroup label="Lainnya"><option value="KACAB">Kepala Cabang</option></optgroup>';
  if (mode === 'reg') out += '<optgroup label="Lainnya"><option value="TAD">Tenaga Alih Daya (CSO/Security/Driver)</option></optgroup>';
  return out;
}

function isiSemuaDropdownBagian() {
  try {
    $all('select[data-bagian]').forEach(function (sel) {
      var v = sel.value;
      sel.innerHTML = bagianOptionsHtml(sel.getAttribute('data-bagian'));
      if (v) sel.value = v;
    });
  } catch (e) { /* lingkungan tanpa DOM (uji) */ }
}
if (typeof document !== 'undefined' && document.querySelectorAll) { isiSemuaDropdownBagian(); }

var STATUS_LABEL = {
  waiting: 'Menunggu', serving: 'Dilayani', done: 'Selesai', cancelled: 'Batal'
};

/* ══════════════════════════════════════════════════════════════════════════
   5. AUTH — login, sesi, logout
   ══════════════════════════════════════════════════════════════════════════ */
var Auth = {
  user: null,

  init: function () {
    var btn = $('#loginBtn');
    var doLogin = function () { Auth.login(); };
    btn.addEventListener('click', doLogin);
    $('#loginPassword').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    $('#loginUsername').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#loginPassword').focus(); });

    // Toggle lihat password
    $('#passToggle').addEventListener('click', function () {
      var inp = $('#loginPassword');
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      this.innerHTML = iconSvg(show ? 'eyeoff' : 'eye');
    });

    $('#menuLogout').addEventListener('click', function () {
      Confirm.ask('Keluar dari aplikasi?', 'Anda harus login kembali untuk mengakses GESIT.', function () {
        Auth.logout();
      });
    });
  },

  /** Cek sesi tersimpan saat aplikasi dibuka.
      V7.0: (1) bila Store kosong (Safari iOS memblokir storage di iframe GAS),
      token cadangan dibaca dari hash URL atas; (2) kegagalan JARINGAN tidak
      lagi membuang token yang masih sah — dulu satu timeout saja langsung
      menghapus token dan melempar pengguna ke login. */
  boot: function () {
    var token = Store.get('sg_token');
    if (token) { Auth.verifikasiSesi(token, true); return; }
    UrlToken.read(function (t) {
      if (t) {
        Store.set('sg_token', t);
        Auth.verifikasiSesi(t, true);
      } else {
        Auth.showLogin();
      }
    });
  },

  /** Validasi token ke server; bedakan "token ditolak" vs "jaringan gagal". */
  verifikasiSesi: function (token, bolehUlang) {
    /* AUDIT V7.6: token WAJIB ikut di data — handler backend membaca d.token,
       bukan payload.token. Tanpa ini setiap muat ulang halaman dianggap sesi
       tidak sah, token yang masih hidup dihapus, dan pengguna dipaksa login
       ulang (terasa sebagai "sesi tidak pernah bertahan"). */
    API.call('checkSession', { token: token }).then(function (res) {
      if (res.success && res.valid) {
        Auth.user = res.user;
        UrlToken.save(token); // segarkan cadangan token di URL atas
        Auth.showApp();
      } else if (res.valid === false) {
        // Server tegas menolak token → memang kedaluwarsa
        Store.remove('sg_token');
        UrlToken.clear();
        Auth.showLogin();
      } else if (bolehUlang) {
        // Galat jaringan/timeout — token JANGAN dibuang; coba sekali lagi
        setTimeout(function () { Auth.verifikasiSesi(token, false); }, 1500);
      } else {
        Auth.showLogin();
        Toast.warning('Tidak dapat memeriksa sesi', 'Periksa koneksi internet, lalu coba login kembali.');
      }
    });
  },

  login: function () {
    var username = $('#loginUsername').value.trim();
    var password = $('#loginPassword').value;
    var errBox = $('#loginError');
    errBox.classList.remove('is-visible');

    if (!username || !password) {
      errBox.textContent = 'Username dan password wajib diisi.';
      errBox.classList.add('is-visible');
      return;
    }

    var btn = $('#loginBtn'), txt = $('#loginBtnText');
    btnLoading(btn, txt, true);

    API.call('login', { username: username, password: password }).then(function (res) {
      btnLoading(btn, txt, false, 'Masuk');
      if (res.success) {
        Store.set('sg_token', res.token);
        UrlToken.save(res.token); // cadangan anti-Safari iOS (lihat modul UrlToken)
        Auth.user = res.user;
        $('#loginPassword').value = '';
        Auth.showApp();
        Toast.success('Selamat datang, ' + (res.user.nama || res.user.username) + '!');
      } else if (res.pendingTelegram && typeof RegisterModule !== 'undefined') {
        // Akun ada namun belum konfirmasi Telegram → terbitkan tautan baru (Fase 5.1)
        RegisterModule.resumeFromLogin(username, password);
      } else {
        errBox.textContent = res.error || 'Login gagal.';
        errBox.classList.add('is-visible');
      }
    });
  },

  logout: function () {
    var token = Store.get('sg_token');
    var uid = Auth.user ? Auth.user.id : '';
    Store.remove('sg_token');
    UrlToken.clear();
    Auth.user = null;
    API.call('logout', { token: token, user_id: uid }); // fire & forget
    Auth.showLogin();
  },

  forceLogout: function (msg) {
    if (!Auth.user) return; // sudah di login page
    Store.remove('sg_token');
    UrlToken.clear();
    Auth.user = null;
    Auth.showLogin();
    if (msg) Toast.warning(msg);
  },

  showLogin: function () {
    BootGuard.ready();
    $('#appLoading').classList.add('is-hidden');
    $('#appShell').classList.remove('is-visible');
    $('#loginPage').classList.remove('is-hidden');
    // Autofokus hanya di perangkat berpenunjuk presisi (desktop) —
    // di HP fokus otomatis memunculkan keyboard & menggeser layar.
    var fine = true;
    try { fine = !window.matchMedia || window.matchMedia('(pointer: fine)').matches; } catch (e) {}
    if (fine) setTimeout(function () { $('#loginUsername').focus(); }, 250);
  },

  showApp: function () {
    BootGuard.ready();
    $('#appLoading').classList.add('is-hidden');
    $('#loginPage').classList.add('is-hidden');
    $('#appShell').classList.add('is-visible');
    App.onUserReady();
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   6. ROUTER — perpindahan view + gating role/fase
   ══════════════════════════════════════════════════════════════════════════ */
var VIEW_META = {
  dashboard: { title: 'Pusat Data', sub: 'Tren efektivitas & ringkasan seluruh modul' },
  digitamu:  { title: 'DIGITAMU',  sub: 'Manajemen tamu & antrian digital' },
  kendaraan: { title: 'Kendaraan & BBM', sub: 'Peminjaman kendaraan & bahan bakar' },
  ruangan:   { title: 'Booking Ruangan', sub: 'Pemesanan ruang rapat & jadwal' },
  atk:       { title: 'ATK', sub: 'Stok alat tulis & permintaan barang' },
  approval:  { title: 'Pusat Persetujuan', sub: 'Pengajuan yang menunggu keputusan' },
  magang:    { title: 'Magang', sub: 'Peserta, presensi, logbook, tugas & izin magang' },
  'magang-self': { title: 'Portal Magang', sub: 'Presensi, logbook, data diri, tugas, izin/sakit & sertifikat' },
  'tad-self': { title: 'Portal TAD', sub: 'Presensi, izin/cuti, lembur/SKPD & data diri' },
  tad:       { title: 'Tenaga Alih Daya', sub: 'Presensi, izin/cuti, lembur/SKPD & personel — Security · Driver · Cleaning Service' },
  security:  { title: 'Security', sub: 'Presensi shift, jadwal, insiden & patroli' },
  agenda:    { title: 'Agenda Pimpinan', sub: 'Jadwal kegiatan pimpinan & deteksi bentrok' },
  budaya:    { title: 'Kalender Budaya', sub: 'Kegiatan rutin kantor: harian · mingguan · bulanan' },
  sosmed:    { title: 'Konten Sosmed', sub: 'Perencanaan konten & metrik performa' },
  berita:    { title: 'Monitoring Berita', sub: 'Pemantauan pemberitaan & sentimen media' },
  eco:       { title: 'Eco Office', sub: 'Checklist harian hemat energi & kerapian' },
  laporan:   { title: 'Laporan & Export', sub: 'Tarik data lintas modul — CSV & cetak' },
  users:     { title: 'Manajemen User', sub: 'Kelola akun pengguna aplikasi' },
  pengaturan: { title: 'Pengaturan Aplikasi', sub: 'Telegram, email, geofence, kalender, registrasi & dokumen' },
  'coming-soon': { title: 'Segera Hadir', sub: 'Modul dalam pengembangan' }
};

/* ── PETA AKSES VIEW (audit role V6.7) ─────────────────────────────────────
   Cermin whitelist role backend (ACTIONS di Code.gs). View yang TIDAK ada di
   peta = boleh untuk semua role login. Sebelumnya Router hanya membatasi
   role magang + halaman Pengaturan; role lain bisa membuka view apa pun dan
   staff/security dkk. hanya panen toast "Anda tidak memiliki akses" dari
   backend. Kini menu & Router konsisten dengan izin backend. */
var VIEW_ACCESS = {
  approval:      ['kabag', 'admin', 'super_admin'],
  magang:        ['kabag', 'admin', 'super_admin'],
  tad:           ['kabag', 'admin', 'super_admin'],
  agenda:        ['kabag', 'admin', 'super_admin'],
  sosmed:        ['kabag', 'admin', 'super_admin'],
  berita:        ['kabag', 'admin', 'super_admin'],
  laporan:       ['kabag', 'admin', 'super_admin'],
  users:         ['admin', 'super_admin'],
  pengaturan:    ['admin', 'super_admin'],
  security:      ['security', 'kabag', 'admin', 'super_admin'],
  'magang-self': ['magang'],
  'tad-self':    ['driver', 'cso', 'security', 'tad'] // 'tad' = data legacy, dinormalkan backend
};

/* ── LINGKUP PER-ROLE PORTAL (audit role V6.7) ─────────────────────────────
   Perbaikan bug: login role security/driver/cso dulu tetap mendapat tampilan
   staf karena hanya role magang yang diberi Router.allowed. `allowed` =
   whitelist menu, `landing` = beranda role tsb. Selaras janji tur onboarding
   ("driver hanya melihat Portal TAD & Kendaraan"). */
var ROLE_SCOPE = {
  /* V7.1: magang + eco — paritas dengan driver/cso/security (V6.9): backend
     Eco Office terdaftar auth:true tanpa pembatasan role, jadi peserta magang
     bisa ikut checklist hemat energi & mencatat temuan lingkungan. */
  magang:   { allowed: ['magang-self', 'dashboard', 'eco'],  landing: 'magang-self' },
  /* V6.9: lingkup role TAD diperluas ke view yang RELEVAN dengan tugasnya dan
     yang backend-nya memang terbuka utk semua role login (digitamu & eco
     terdaftar auth:true tanpa pembatasan role — bukan pelonggaran baru):
     • driver   + eco       → partisipasi Eco Office (checklist hemat energi/air).
     • cso      + eco       → inti tugasnya: checklist kebersihan & temuan lingkungan.
     • security + digitamu  → tugas meja depan: daftar tamu hari ini & statusnya.
     • security + eco       → temuan lingkungan/K3 saat patroli bisa langsung dicatat.
     Agenda/berita/laporan TIDAK ikut: backend-nya kabag+ (least-privilege dijaga). */
  driver:   { allowed: ['tad-self', 'kendaraan', 'eco'],      landing: 'tad-self' },
  cso:      { allowed: ['tad-self', 'eco'],                   landing: 'tad-self' },
  tad:      { allowed: ['tad-self', 'eco'],                   landing: 'tad-self' }, // jaga-jaga data lama
  security: { allowed: ['security', 'tad-self', 'digitamu', 'eco'], landing: 'security' }
};

var Router = {
  current: 'dashboard',
  allowed: null, // daftar view yang boleh dibuka (null = semua) — diisi per-role saat login

  init: function () {
    $all('.nav-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var fase = item.getAttribute('data-fase');
        var view = item.getAttribute('data-view');
        if (item.classList.contains('is-locked')) {
          Router.showComingSoon(item.querySelector('span').textContent, fase);
          Router.setActive(item);
          Sidebar.close();
          return;
        }
        Router.go(view);
        Sidebar.close();
      });
    });
  },

  /** Satu pintu pemeriksaan izin view: lingkup role (allowed) + peta backend. */
  canOpen: function (view) {
    if (view === 'coming-soon') return true;
    if (Router.allowed && Router.allowed.indexOf(view) === -1) return false;
    var need = VIEW_ACCESS[view];
    if (!need) return true; // tidak terdaftar = semua role login boleh
    var role = String(Auth.user && Auth.user.role || '').toLowerCase();
    return need.indexOf(role) !== -1;
  },

  go: function (view) {
    if (!Router.canOpen(view)) {
      var meta0 = VIEW_META[view] || { title: view };
      Toast.warning('Akses dibatasi', 'Halaman "' + meta0.title + '" tidak tersedia untuk role Anda.');
      // Fallback ke "beranda" role tsb (item pertama daftar izin).
      view = (Router.allowed && Router.allowed[0]) || 'dashboard';
    }
    var panel = $('[data-view-panel="' + view + '"]');
    if (!panel) return;
    Router.current = view;

    $all('.view').forEach(function (v) { v.classList.remove('is-active'); });
    panel.classList.add('is-active');

    var meta = VIEW_META[view] || { title: view, sub: '' };
    // Audit V7.2: setter #topbarTitle/#topbarSub legacy dihapus — elemennya
    // tidak pernah ada di markup topbar baru; Topbar.setPage satu-satunya jalur.
    if (window.Topbar && Topbar.setPage) Topbar.setPage(meta);
    // Pindah halaman selalu mulai dari atas (dulu posisi gulir halaman lama terbawa)
    window.scrollTo(0, 0);

    Router.setActive($('.nav-item[data-view="' + view + '"]'));

    /* ── PERF V7.5: muat data view SEPERLUNYA, bukan setiap kunjungan ──
       Dulu: setiap klik menu = ambil ulang seluruh data view dari server
       (1 round-trip Apps Script ±1–4 dtk) meski baru saja dibuka. Kini:
       • Data yang dimuat < FRESH_MS lalu → TIDAK diambil ulang → pindah
         halaman instan. Tombol Refresh tiap modul tetap memaksa ambil ulang.
       • Lewat dari itu → konten lama TETAP TAMPIL sementara data baru
         diambil di belakang (stale-while-revalidate) — tak ada layar kosong.
       • Kunjungan PERTAMA → strip "Memuat data halaman…" tampil di atas
         panel sampai seluruh panggilan API mereda, supaya user tahu
         aplikasinya sedang bekerja, bukan diam. */
    var muat = Router._LOADER[view];
    if (!muat) return;
    var perdana = panel.getAttribute('data-loaded') !== '1';
    var usia = Date.now() - (Router._muatTerakhir[view] || 0);
    if (!perdana && usia < Router.FRESH_MS) return; // masih segar → instan
    Router._muatTerakhir[view] = Date.now();
    if (perdana) Router._stripTunggu(view, panel);
    muat(!perdana); // argumen hanya dipakai dashboard (senyap saat revalidasi)
  },

  /* Peta pemuat data per view (menggantikan rantai if lama — perilaku sama). */
  FRESH_MS: 60000,
  _muatTerakhir: {},
  _LOADER: {
    dashboard:     function (sudah) { DashboardModule.load(!!sudah); },
    digitamu:      function () { DigitamuModule.load(); },
    kendaraan:     function () { KendaraanModule.load(); },
    ruangan:       function () { RuanganModule.load(); },
    atk:           function () { ATKModule.load(); },
    approval:      function () { ApprovalModule.load(); },
    magang:        function () { MagangModule.load(); },
    'magang-self': function () { MagangSelfModule.load(); },
    'tad-self':    function () { TadSelfModule.load(); },
    tad:           function () { TADModule.load(); },
    security:      function () { SecurityModule.load(); },
    agenda:        function () { AgendaModule.load(); },
    budaya:        function () { BudayaModule.load(); },
    sosmed:        function () { SosmedModule.load(); },
    berita:        function () { BeritaModule.load(); },
    eco:           function () { EcoModule.load(); },
    laporan:       function () { LaporanModule.load(); },
    users:         function () { UsersModule.load(); },
    pengaturan:    function () { SettingsApp.load(); }
  },

  /* Strip pemuatan kunjungan pertama — dilepas saat SEMUA panggilan API
     mereda (event gesit:sibuk, debounce 250 ms) atau jaring pengaman 15 dtk. */
  _menunggu: {},
  _stripBound: false,
  _stripTunggu: function (view, panel) {
    if (!panel.querySelector('.view-loading-strip')) {
      var s = document.createElement('div');
      s.className = 'view-loading-strip';
      s.innerHTML = '<span class="spinner dark"></span><span>Memuat data halaman…</span>';
      panel.insertBefore(s, panel.firstChild);
    }
    Router._menunggu[view] = panel;
    if (!Router._stripBound) {
      Router._stripBound = true;
      document.addEventListener('gesit:sibuk', function (ev) {
        if (ev && ev.detail && ev.detail.aktif > 0) return;
        setTimeout(function () {
          if (API._aktif > 0) return; // masih ada panggilan susulan
          Object.keys(Router._menunggu).forEach(Router._tandaiSelesai);
        }, 250);
      });
    }
    setTimeout(function () { Router._tandaiSelesai(view); }, 15000);
  },
  _tandaiSelesai: function (view) {
    var panel = Router._menunggu[view];
    if (!panel) return;
    delete Router._menunggu[view];
    panel.setAttribute('data-loaded', '1');
    var s = panel.querySelector('.view-loading-strip');
    if (s) { s.classList.add('is-done'); setTimeout(function () { s.remove(); }, 260); }
  },

  showComingSoon: function (nama, fase) {
    $all('.view').forEach(function (v) { v.classList.remove('is-active'); });
    $('[data-view-panel="coming-soon"]').classList.add('is-active');
    $('#csTitle').textContent = 'Modul ' + nama;
    $('#csFase').textContent = 'Dijadwalkan Fase ' + (fase || '2');
    if (window.Topbar && Topbar.setPage) Topbar.setPage({ title: nama });
    Router.current = 'coming-soon';
  },

  setActive: function (item) {
    $all('.nav-item').forEach(function (n) { n.classList.remove('is-active'); });
    if (item) item.classList.add('is-active');
  }
};

var Sidebar = {
  init: function () {
    $('#menuBtn').addEventListener('click', function () {
      $('#sidebar').classList.add('is-open');
      $('#sidebarOverlay').classList.add('is-visible');
    });
    $('#sidebarOverlay').addEventListener('click', Sidebar.close);
  },
  close: function () {
    $('#sidebar').classList.remove('is-open');
    $('#sidebarOverlay').classList.remove('is-visible');
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   7. MODUL: DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */
var DashboardModule = {
  _timer: null,

  /* Muat Pusat Data — SATU panggilan backend (getPusatData) untuk semua panel */
  load: function (senyap) {
    DashboardModule.injectInfoPagi(); // V6.10: markup disuntik — Index.html tak perlu diubah
    $('#dashDate').textContent = tanggalIndo();
    if (!senyap) DashboardModule.renderSkeleton();
    API.call('getPusatData').then(function (res) {
      if (res.success && res.data) {
        DashboardModule.renderAll(res.data);
        DashboardModule.autoRefresh();
      } else if (!senyap) {
        DashboardModule.renderError(res.error || 'Gagal memuat Pusat Data.');
      }
    });
    DashboardModule.loadBriefing(senyap); // V6.10: briefing pagi + ketersediaan pimpinan
  },

  /* ── V6.10: suntik markup kartu "Ketersediaan Pimpinan" + "Briefing Pagi"
     tepat setelah denyut operasional (#pdHariIni). Disuntik dari JS agar
     TIDAK ada ketergantungan pada versi Index.html. ── */
  injectInfoPagi: function () {
    if ($('#pdInfoPagi')) return;
    var pulse = $('#pdHariIni');
    if (!pulse) return;
    pulse.insertAdjacentHTML('afterend',
      '<div class="grid-2 pd-gap" id="pdInfoPagi">' +
        '<div class="card">' +
          '<div class="card-header">' +
            '<div class="card-title"><svg class="card-icon" data-icon="users"></svg> Ketersediaan Pimpinan Hari Ini</div>' +
            '<span class="text-muted" style="font-size:11.5px" id="pdKetRingkas"></span>' +
          '</div>' +
          '<div class="card-body" id="pdKetersediaan"></div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-header">' +
            '<div class="card-title"><svg class="card-icon" data-icon="megaphone"></svg> Briefing Pagi</div>' +
            '<span class="text-muted" style="font-size:11.5px" id="pdBriefTgl"></span>' +
          '</div>' +
          '<div class="card-body brief-body" id="pdBriefing"></div>' +
        '</div>' +
      '</div>');
    renderIcons($('#pdInfoPagi'));
  },

  /* ── V6.10: BRIEFING PAGI DI DASHBOARD ──────────────────────────────────
     Data lengkap hari ini (agenda, kegiatan rutin, sosmed, berita, tunggakan)
     + papan pengumuman ketersediaan pimpinan — tampil untuk SEMUA user,
     bukan hanya terkirim ke Telegram grup admin. */
  loadBriefing: function (senyap) {
    var elK = $('#pdKetersediaan'), elB = $('#pdBriefing');
    if (!elK || !elB) return;
    API.call('getBriefingHariIni').then(function (r) {
      if (!r.success || !r.data) {
        var wrap = $('#pdInfoPagi');
        if (/tidak dikenal/i.test(r.error || '')) {
          // Backend V6.10 belum ter-deploy → sembunyikan panel agar tidak membingungkan
          if (wrap) wrap.style.display = 'none';
        } else if (!senyap) {
          elK.innerHTML = elB.innerHTML =
            '<div class="pd-empty" style="padding:14px">' + escapeHtml(r.error || 'Belum bisa dimuat.') + '</div>';
        }
        return;
      }
      var wrap2 = $('#pdInfoPagi');
      if (wrap2) wrap2.style.display = '';
      DashboardModule.renderBriefing(r.data);
    });
  },

  renderBriefing: function (d) {
    /* 1) Papan ketersediaan pimpinan (pengumuman) */
    var elK = $('#pdKetersediaan');
    var ket = d.ketersediaan;
    if (ket && ket.data && ket.data.length) {
      renderKetersediaanBoard(elK, ket.data, { kontrol: false });
      $('#pdKetRingkas').textContent = ketRingkasTeks(ket.ringkas);
    } else {
      elK.innerHTML = emptyBoxHtml('users',
        'Belum ada master pimpinan — admin dapat menambahkannya lewat "Kelola Pimpinan" di halaman Agenda.');
      renderIcons(elK);
      $('#pdKetRingkas').textContent = '';
    }

    /* 2) Briefing pagi lengkap */
    $('#pdBriefTgl').textContent = (d.hari || '') + ', ' + fmtDateShort(d.tanggal);
    var h = '';
    function sec(icon, judul, isi) {
      return '<div class="brief-sec"><div class="brief-sec-title">' + iconSvg(icon) + ' ' + judul + '</div>' + isi + '</div>';
    }

    // Agenda pimpinan hari ini — LENGKAP
    if ((d.agenda || []).length) {
      h += sec('calendar', 'Agenda Pimpinan (' + d.agenda.length + ')',
        d.agenda.map(function (a) {
          return '<div class="brief-item' + (a.status === 'selesai' ? ' is-done' : '') + '">' +
            '<span class="brief-time">' + escapeHtml(a.jam_mulai) + (a.jam_selesai ? '–' + escapeHtml(a.jam_selesai) : '') + '</span>' +
            '<span class="brief-text"><b>' + escapeHtml(a.nama_kegiatan) + '</b>' +
            (a.nama_pimpinan ? ' — ' + escapeHtml(a.nama_pimpinan) : '') +
            (a.lokasi ? ' <span class="brief-mut">@ ' + escapeHtml(a.lokasi) + '</span>' : '') +
            (a.jenis && a.jenis !== 'internal' ? ' <span class="brief-tag">' + escapeHtml(a.jenis) + '</span>' : '') +
            '</span></div>';
        }).join(''));
    }

    // Kegiatan rutin/budaya hari ini
    if ((d.budaya || []).length) {
      h += sec('star', 'Kegiatan Rutin (' + d.budaya.length + ')',
        d.budaya.map(function (k) {
          return '<div class="brief-item">' +
            '<span class="brief-time">' + escapeHtml(k.jam || '—') + '</span>' +
            '<span class="brief-text">' + escapeHtml(k.nama) +
            (k.lokasi ? ' <span class="brief-mut">@ ' + escapeHtml(k.lokasi) + '</span>' : '') +
            (k.pj ? ' <span class="brief-mut">· PJ: ' + escapeHtml(k.pj) + '</span>' : '') +
            '</span></div>';
        }).join(''));
    }

    // Konten sosmed jatuh tempo hari ini + terlambat
    var sm = d.sosmed || {};
    if ((sm.due || []).length || sm.terlambat) {
      var isi = (sm.due || []).map(function (k) {
        return '<div class="brief-item">' +
          '<span class="brief-time">' + escapeHtml(k.jam || '—') + '</span>' +
          '<span class="brief-text">[' + escapeHtml(k.platform) + '] ' + escapeHtml(k.caption) + '</span></div>';
      }).join('');
      if (sm.terlambat) isi += '<div class="brief-warn">' + iconSvg('alert') + ' <b>' + sm.terlambat +
        ' konten TERLAMBAT</b> belum tayang — buka modul Sosmed.</div>';
      h += sec('megaphone', 'Konten Sosmed', isi);
    }

    // Perlu perhatian: berita negatif, tunggakan approval, insiden, stok ATK
    var perhatian = [];
    if (d.berita_negatif) perhatian.push('<div class="brief-warn">' + iconSvg('news') + ' <b>' + d.berita_negatif +
      ' pemberitaan negatif</b> belum selesai ditindaklanjuti.</div>');
    if (d.pending_approval) perhatian.push('<div class="brief-warn">' + iconSvg('inbox') + ' <b>' + d.pending_approval +
      ' pengajuan</b> menunggu keputusan di Pusat Persetujuan.</div>');
    if (d.insiden_open) perhatian.push('<div class="brief-warn is-danger">' + iconSvg('shield') + ' <b>' + d.insiden_open +
      ' insiden</b> masih terbuka/diproses.</div>');
    if (d.atk_reorder) perhatian.push('<div class="brief-warn">' + iconSvg('box') + ' <b>' + d.atk_reorder +
      ' item ATK</b> stoknya menipis (≤ minimum).</div>');
    if (perhatian.length) h += sec('alert', 'Perlu Perhatian', perhatian.join(''));

    if (!h) {
      h = '<div class="brief-kosong">' + iconSvg('check') +
        '<div><b>Tidak ada agenda maupun tunggakan tercatat hari ini.</b>' +
        '<div class="brief-mut">Selamat bekerja! Data diperbarui otomatis dari seluruh modul.</div></div></div>';
    }
    var elB = $('#pdBriefing');
    elB.innerHTML = h;
    renderIcons(elB);
    renderIcons(elK);
  },

  /* Segarkan otomatis tiap 3 menit — hanya saat view ini aktif & tab terlihat */
  autoRefresh: function () {
    if (DashboardModule._timer) clearTimeout(DashboardModule._timer);
    DashboardModule._timer = setTimeout(function () {
      if (Router.current === 'dashboard' && !document.hidden && Auth.user) {
        DashboardModule.load(true);
      } else {
        DashboardModule.autoRefresh();
      }
    }, 180000);
  },

  /* ── util format angka (lokal Indonesia) ── */
  fmtInt: function (n) { return (Number(n) || 0).toLocaleString('id-ID'); },
  fmt1: function (n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('id-ID', { maximumFractionDigits: 1 });
  },
  fmtRp: function (n) {
    n = Number(n) || 0;
    if (n >= 1e9) return 'Rp ' + DashboardModule.fmt1(n / 1e9) + ' M';
    if (n >= 1e6) return 'Rp ' + DashboardModule.fmt1(n / 1e6) + ' jt';
    if (n >= 1e3) return 'Rp ' + DashboardModule.fmt1(n / 1e3) + ' rb';
    return 'Rp ' + DashboardModule.fmtInt(n);
  },

  /* Chip delta: naikBaik=true → kenaikan hijau; false → penurunan hijau (waktu) */
  deltaChip: function (delta, naikBaik, satuan) {
    if (delta == null || isNaN(delta)) return '<span class="pd-delta flat">baru</span>';
    delta = Math.round(delta);
    if (delta === 0) return '<span class="pd-delta flat">0' + (satuan || '%') + '</span>';
    var baik = (delta > 0) === !!naikBaik;
    var panah = delta > 0 ? '&#9650;' : '&#9660;';
    return '<span class="pd-delta ' + (baik ? 'good' : 'bad') + '">' + panah + ' ' +
      Math.abs(delta) + (satuan || '%') + '</span>';
  },

  /* ── kerangka & error ── */
  renderSkeleton: function () {
    var pill = '<span class="pd-pill"><span class="skeleton" style="width:90px;height:13px"></span></span>';
    $('#pdHariIni').innerHTML = pill + pill + pill + pill + pill;
    var kpi = '';
    for (var i = 0; i < 4; i++) {
      kpi += '<div class="pd-skel-card"><div class="skeleton" style="width:110px;height:11px;margin-bottom:12px"></div>' +
        '<div class="skeleton" style="width:80px;height:26px;margin-bottom:10px"></div>' +
        '<div class="skeleton" style="width:130px;height:12px"></div></div>';
    }
    $('#pdKpi').innerHTML = kpi;
    ['#pdTren', '#pdEfektif'].forEach(function (s) {
      $(s).innerHTML = '<div class="skeleton" style="width:100%;height:190px"></div>';
    });
    ['#pdDonutBagian', '#pdDonutApproval'].forEach(function (s) {
      $(s).innerHTML = '<div class="skeleton" style="width:130px;height:130px;border-radius:50%"></div>' +
        '<div style="flex:1"><div class="skeleton" style="height:12px;margin-bottom:9px"></div>' +
        '<div class="skeleton" style="height:12px;width:80%;margin-bottom:9px"></div>' +
        '<div class="skeleton" style="height:12px;width:60%"></div></div>';
    });
    ['#pdKetersediaan', '#pdBriefing'].forEach(function (s) {
      var el = $(s);
      if (el) el.innerHTML = '<div class="skeleton" style="height:14px;margin-bottom:11px"></div>' +
        '<div class="skeleton" style="height:14px;width:85%;margin-bottom:11px"></div>' +
        '<div class="skeleton" style="height:14px;width:70%"></div>';
    });
    $('#pdGauges').innerHTML = '';
    $('#pdTrenLegend').innerHTML = '';
    $('#pdTabelModul').innerHTML = '<tr><td class="pd-empty">Memuat…</td></tr>';
    $('#pdInsight').innerHTML = '<div class="skeleton" style="height:14px;margin-bottom:11px"></div>' +
      '<div class="skeleton" style="height:14px;width:85%;margin-bottom:11px"></div>' +
      '<div class="skeleton" style="height:14px;width:70%"></div>';
    $('#pdAktivitas').innerHTML = '<div class="pd-empty">Memuat…</div>';
  },

  renderError: function (pesan) {
    $('#pdKpi').innerHTML =
      '<div class="pd-error" style="grid-column:1/-1">' +
      '<b>Pusat Data belum bisa dimuat.</b><br>' + escapeHtml(pesan) +
      '<br><span style="color:#7f1d1d">Bila pesan menyebut aksi "getPusatData" tidak dikenal, ' +
      'pastikan file <b>Code.gs</b> versi 6.2 sudah ter-deploy, lalu klik Muat Ulang.</span></div>';
    $('#pdHariIni').innerHTML = '';
  },

  /* ── orkestrasi render ── */
  renderAll: function (d) {
    DashboardModule.renderHariIni(d.hari_ini || {});
    DashboardModule.renderKpi(d.kpi || {});
    DashboardModule.renderTren(d.tren14 || {});
    DashboardModule.renderDonutBagian(d.donut_bagian || []);
    DashboardModule.renderEfektif(d.efektif6 || {});
    DashboardModule.renderDonutApproval(d.donut_approval || []);
    DashboardModule.renderGauges(d);
    DashboardModule.renderModulTabel(d.modul_tabel || []);
    DashboardModule.renderInsight(d);
    DashboardModule.renderAktivitas(d.aktivitas || []);
  },

  /* ── 1. Denyut hari ini (chips) ── */
  renderHariIni: function (h) {
    var f = DashboardModule.fmtInt;
    var items = [
      { lbl: 'Tamu hari ini', val: f(h.tamu), cls: '' },
      { lbl: 'Antrian aktif', val: f(h.antrian_aktif), cls: h.antrian_aktif > 0 ? 'warn' : '' },
      { lbl: 'Presensi masuk', val: f(h.presensi), cls: '' },
      { lbl: 'Menunggu persetujuan', val: f(h.approval_pending), cls: h.approval_pending > 0 ? 'warn' : '' },
      { lbl: 'Insiden terbuka', val: f(h.insiden_open), cls: h.insiden_open > 0 ? 'danger' : '' },
      { lbl: 'Stok ATK menipis', val: f(h.atk_reorder), cls: h.atk_reorder > 0 ? 'warn' : '' }
    ];
    $('#pdHariIni').innerHTML = items.map(function (it) {
      return '<span class="pd-pill ' + it.cls + '"><span class="pd-dot"></span>' +
        it.lbl + ' <b>' + it.val + '</b></span>';
    }).join('');
  },

  /* ── 2. KPI efektivitas ── */
  renderKpi: function (k) {
    var M = DashboardModule;
    var t = k.transaksi || {}, kj = k.keputusan_jam || {}, tm = k.tunggu_menit || {}, sl = k.antrian_selesai || {};
    var cards = [
      { accent: '#14b8a6', icon: 'rocket', label: 'Transaksi Digital',
        val: M.fmtInt(t.ini), unit: '', chip: M.deltaChip(t.delta, true),
        sub: 'bulan lalu: ' + M.fmtInt(t.lalu) },
      { accent: '#0e7490', icon: 'inbox', label: 'Kecepatan Keputusan',
        val: kj.ini != null ? M.fmt1(kj.ini) : '—', unit: kj.ini != null ? 'jam' : '',
        chip: M.deltaChip(kj.delta, false),
        sub: kj.lalu != null ? 'bulan lalu: ' + M.fmt1(kj.lalu) + ' jam' : 'pengajuan → keputusan' },
      { accent: '#0f766e', icon: 'clock', label: 'Waktu Tunggu Antrian',
        val: tm.ini != null ? M.fmt1(tm.ini) : '—', unit: tm.ini != null ? 'mnt' : '',
        chip: M.deltaChip(tm.delta, false),
        sub: tm.lalu != null ? 'bulan lalu: ' + M.fmt1(tm.lalu) + ' mnt' : 'daftar → dipanggil' },
      { accent: '#16a34a', icon: 'check', label: 'Antrian Terselesaikan',
        val: sl.ini != null ? M.fmtInt(sl.ini) : '—', unit: sl.ini != null ? '%' : '',
        chip: M.deltaChip(sl.delta, true, ' poin'),
        sub: sl.lalu != null ? 'bulan lalu: ' + M.fmtInt(sl.lalu) + '%' : 'status selesai / total tamu' }
    ];
    $('#pdKpi').innerHTML = cards.map(function (c) {
      return '<div class="pd-kpi" style="--pd-accent:' + c.accent + '">' +
        '<div class="pd-kpi-top"><span class="pd-kpi-label">' + c.label + '</span>' +
        '<span class="pd-kpi-ic">' + iconSvg(c.icon) + '</span></div>' +
        '<div class="pd-kpi-val">' + c.val + (c.unit ? '<small>' + c.unit + '</small>' : '') + '</div>' +
        '<div class="pd-kpi-foot">' + c.chip + '<span class="pd-kpi-sub">' + c.sub + '</span></div>' +
        '</div>';
    }).join('');
  },

  /* ── mesin grafik garis SVG (multi-seri, tahan nilai null) ── */
  lineChart: function (el, cfg) {
    var labels = cfg.labels || [], series = cfg.series || [];
    var W = 720, H = cfg.h || 240, pL = 40, pR = 12, pT = 14, pB = 30;
    var iw = W - pL - pR, ih = H - pT - pB;
    var vals = [];
    series.forEach(function (s) { (s.values || []).forEach(function (v) { if (v != null) vals.push(Number(v)); }); });
    if (!vals.length || !labels.length) {
      el.innerHTML = '<div class="pd-empty">Belum ada data untuk ditampilkan — grafik akan hidup seiring aplikasi digunakan.</div>';
      return;
    }
    var maxRaw = Math.max.apply(null, vals.concat([1]));
    // pembulatan sumbu-Y yang enak dibaca
    var step = Math.pow(10, Math.floor(Math.log(maxRaw) / Math.LN10));
    var max = Math.ceil(maxRaw / step) * step;
    if (max / maxRaw > 2) max = Math.ceil(maxRaw / (step / 2)) * (step / 2);
    if (max <= 0) max = 1;

    var X = function (i) { return labels.length === 1 ? pL + iw / 2 : pL + (i / (labels.length - 1)) * iw; };
    var Y = function (v) { return pT + ih - (v / max) * ih; };
    var fmtY = cfg.yFmt || function (v) { return DashboardModule.fmt1(v); };

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img">';
    /* V7.8: area di bawah garis memakai GRADASI vertikal (pekat → lenyap),
       bukan blok opacity datar — id unik per render agar tak bentrok saat
       beberapa grafik tampil bersamaan di satu halaman. */
    var gidBase = 'pdlg' + (DashboardModule._gid = (DashboardModule._gid || 0) + 1) + '_';
    var defs = '';
    series.forEach(function (s, si) {
      if (!s.fill) return;
      defs += '<linearGradient id="' + gidBase + si + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + s.color + '" stop-opacity="0.32"/>' +
        '<stop offset="1" stop-color="' + s.color + '" stop-opacity="0.02"/></linearGradient>';
    });
    if (defs) svg += '<defs>' + defs + '</defs>';
    /* V7.8: pemulus kurva Catmull-Rom → Bezier; kontrol-Y dijepit ke area
       gambar agar kurva tidak melampaui grid atas/bawah. <3 titik = garis lurus. */
    var jepitY = function (y) { return Math.max(pT, Math.min(pT + ih, y)); };
    var jalurMulus = function (pts) {
      if (pts.length < 3) {
        return pts.map(function (p, idx) { return (idx ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
      }
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var q = 0; q < pts.length - 1; q++) {
        var p0 = pts[q - 1] || pts[q], p1 = pts[q], p2 = pts[q + 1], p3 = pts[q + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = jepitY(p1[1] + (p2[1] - p0[1]) / 6);
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = jepitY(p2[1] - (p3[1] - p1[1]) / 6);
        d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' +
          c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      return d;
    };
    // grid + label Y
    for (var g = 0; g <= 4; g++) {
      var vy = (max / 4) * g, yy = Y(vy);
      svg += '<line x1="' + pL + '" y1="' + yy + '" x2="' + (W - pR) + '" y2="' + yy +
        '" stroke="#e2e8f0" stroke-width="1"' + (g === 0 ? '' : ' stroke-dasharray="3 4"') + '/>';
      svg += '<text x="' + (pL - 7) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="10" fill="#94a3b8">' +
        fmtY(vy) + '</text>';
    }
    // label X (maks ±7 label agar tidak bertumpuk)
    var lompat = Math.max(1, Math.ceil(labels.length / 7));
    labels.forEach(function (lb, i) {
      if (i % lompat !== 0 && i !== labels.length - 1) return;
      svg += '<text x="' + X(i) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="10" fill="#94a3b8">' +
        escapeHtml(String(lb)) + '</text>';
    });
    // seri: area gradasi (opsional) + kurva mulus + titik (V7.8)
    series.forEach(function (s, si) {
      var v = s.values || [], seg = [], cur = [];
      for (var i = 0; i < v.length; i++) {
        if (v[i] == null) { if (cur.length) { seg.push(cur); cur = []; } }
        else cur.push([X(i), Y(Number(v[i])), i]);
      }
      if (cur.length) seg.push(cur);
      var titikAkhir = null;
      seg.forEach(function (pts) {
        if (pts.length > 1) {
          var dGaris = jalurMulus(pts);
          if (s.fill) {
            svg += '<path d="' + dGaris + 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (pT + ih) +
              'L' + pts[0][0].toFixed(1) + ' ' + (pT + ih) + 'Z" fill="url(#' + gidBase + si + ')"/>';
          }
          svg += '<path d="' + dGaris + '" fill="none" stroke="' + s.color +
            '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
        }
        pts.forEach(function (p) {
          svg += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.1" fill="#fff" stroke="' +
            s.color + '" stroke-width="2"><title>' + escapeHtml(String(labels[p[2]])) + ' — ' +
            escapeHtml(s.name) + ': ' + fmtY(v[p[2]]) + '</title></circle>';
        });
        if (pts.length) titikAkhir = pts[pts.length - 1];
      });
      // Titik data TERBARU diberi lingkar pendar lembut — mata langsung tertuju
      if (titikAkhir) {
        svg += '<circle cx="' + titikAkhir[0].toFixed(1) + '" cy="' + titikAkhir[1].toFixed(1) +
          '" r="7" fill="' + s.color + '" opacity="0.16"/>';
      }
    });
    svg += '</svg>';
    el.innerHTML = svg;
  },

  legendHtml: function (series) {
    return series.map(function (s) {
      return '<span class="lg"><span class="sw" style="background:' + s.color + '"></span>' + escapeHtml(s.name) + '</span>';
    }).join('');
  },

  /* ── 3. Tren aktivitas 14 hari ── */
  renderTren: function (t) {
    var series = [
      { name: 'Tamu', color: '#14b8a6', values: t.tamu || [], fill: true },
      { name: 'Layanan kantor', color: '#0e7490', values: t.layanan || [] },
      { name: 'Presensi', color: '#16a34a', values: t.presensi || [] }
    ];
    $('#pdTrenLegend').innerHTML = DashboardModule.legendHtml(series);
    DashboardModule.lineChart($('#pdTren'), {
      labels: t.labels || [], series: series, h: 240,
      yFmt: function (v) { return DashboardModule.fmtInt(Math.round(v)); }
    });
  },

  /* ── 4. Tren efektivitas 6 bulan (dua skala → dua grafik ringkas) ── */
  renderEfektif: function (e) {
    var el = $('#pdEfektif');
    var punyaData = (e.keputusan_jam || []).some(function (v) { return v != null; }) ||
                    (e.tunggu_menit || []).some(function (v) { return v != null; });
    if (!punyaData) {
      el.innerHTML = '<div class="pd-empty">Tren efektivitas akan terbentuk setelah ada pengajuan yang diputus ' +
        'dan antrian yang dipanggil — biarkan aplikasi bekerja beberapa hari.</div>';
      return;
    }
    el.innerHTML =
      '<div class="pd-chart-title">Rata-rata keputusan persetujuan (jam) — makin rendah makin baik</div>' +
      '<div class="pd-chart" id="pdEfChart1"></div>' +
      '<div class="pd-chart-title" style="margin-top:12px">Rata-rata tunggu antrian (menit) — makin rendah makin baik</div>' +
      '<div class="pd-chart" id="pdEfChart2"></div>';
    DashboardModule.lineChart($('#pdEfChart1'), {
      labels: e.labels || [], h: 130,
      series: [{ name: 'Keputusan (jam)', color: '#0e7490', values: e.keputusan_jam || [], fill: true }]
    });
    DashboardModule.lineChart($('#pdEfChart2'), {
      labels: e.labels || [], h: 130,
      series: [{ name: 'Tunggu antrian (mnt)', color: '#14b8a6', values: e.tunggu_menit || [], fill: true }]
    });
  },

  /* ── mesin donat SVG ── */
  donut: function (el, segs, opts) {
    opts = opts || {};
    var total = segs.reduce(function (t, s) { return t + (Number(s.value) || 0); }, 0);
    if (!total) {
      el.innerHTML = '<div class="pd-empty" style="width:100%">' +
        escapeHtml(opts.kosong || 'Belum ada data bulan ini.') + '</div>';
      return;
    }
    var PAL = ['#0f766e', '#14b8a6', '#2dd4bf', '#0e7490', '#16a34a', '#5eead4', '#86efac', '#94a3b8']; // V7.9: tangga brand teal→hijau (bukan pelangi); slate = kategori sisa
    var size = opts.size || 148, sw = opts.stroke || 21;
    var r = (size - sw) / 2, C = 2 * Math.PI * r, cx = size / 2;
    /* V7.8: donat modern — celah putih tipis antar segmen (bila >1 segmen)
       + kelas .pd-seg untuk efek hover CSS (segmen lain meredup, yang
       disorot menebal). Matematika busur tetap: dash = panjang busur - celah,
       offset digeser setengah celah agar tiap segmen berada di tengah slotnya. */
    var terlihat = segs.filter(function (s) { return (Number(s.value) || 0) > 0; }).length;
    var celah = terlihat > 1 ? Math.min(3, C / (terlihat * 6)) : 0;
    var svg = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" class="pd-donut">' +
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="#f8fafc" stroke-width="' + sw + '"/>' +
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + (r - sw / 2 - 1.5) + '" fill="none" stroke="#eef2f7" stroke-width="1"/>';
    var acc = 0;
    segs.forEach(function (s, i) {
      var frac = (Number(s.value) || 0) / total;
      if (frac <= 0) return;
      var warna = s.color || PAL[i % PAL.length];
      s._color = warna;
      var busur = Math.max(frac * C - celah, 0.9);
      svg += '<circle class="pd-seg" style="--sw:' + sw + 'px" cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + warna +
        '" stroke-width="' + sw + '" stroke-linecap="butt"' +
        ' stroke-dasharray="' + busur.toFixed(2) + ' ' + C.toFixed(2) + '"' +
        ' stroke-dashoffset="' + (-(acc * C + celah / 2)).toFixed(2) + '"' +
        ' transform="rotate(-90 ' + cx + ' ' + cx + ')">' +
        '<title>' + escapeHtml(s.label) + ': ' + DashboardModule.fmtInt(s.value) +
        ' (' + Math.round(frac * 100) + '%)</title></circle>';
      acc += frac;
    });
    svg += '<text x="' + cx + '" y="' + (cx - 2) + '" text-anchor="middle" font-size="' + (size / 5.4) +
      '" font-weight="800" fill="#0f172a">' + DashboardModule.fmtInt(total) + '</text>' +
      '<text x="' + cx + '" y="' + (cx + 15) + '" text-anchor="middle" font-size="10" fill="#94a3b8">' +
      escapeHtml(opts.centerLabel || 'total') + '</text></svg>';
    var legend = '<div class="pd-dlegend">' + segs.map(function (s, i) {
      var v = Number(s.value) || 0;
      var wr = (s._color || PAL[i % PAL.length]);
      var pct = Math.round((v / total) * 100);
      return '<div class="row"><span class="sw" style="background:' + wr + '"></span>' +
        '<span class="lb" title="' + escapeHtml(s.label) + '">' + escapeHtml(s.label) + '</span>' +
        '<span class="vl">' + DashboardModule.fmtInt(v) + '</span>' +
        '<span class="pc">' + pct + '%</span>' +
        '<span class="meter"><i style="width:' + Math.max(pct, 2) + '%;background:' + wr + '"></i></span></div>';
    }).join('') + '</div>';
    el.innerHTML = svg + legend;
  },

  renderDonutBagian: function (segs) {
    DashboardModule.donut($('#pdDonutBagian'), segs, {
      centerLabel: 'tamu', kosong: 'Belum ada kunjungan tamu bulan ini.'
    });
  },

  renderDonutApproval: function (segs) {
    var WARNA = { approved: '#22c55e', selesai: '#14b8a6', pending: '#f59e0b',
      rejected: '#ef4444', cancelled: '#94a3b8' };
    segs = (segs || []).map(function (s) { s.color = WARNA[s.key] || undefined; return s; });
    DashboardModule.donut($('#pdDonutApproval'), segs, {
      size: 132, stroke: 19, centerLabel: 'pengajuan',
      kosong: 'Belum ada pengajuan (kendaraan · ruangan · ATK) bulan ini.'
    });
  },

  /* ── 5. Gauge BBM, Eco & sentimen berita ── */
  renderGauges: function (d) {
    var M = DashboardModule, html = '';
    var bbm = d.bbm || {};
    if (bbm.budget > 0) {
      var p = Math.min(bbm.persen || 0, 100);
      var cls = (bbm.persen >= 100) ? 'danger' : (bbm.persen >= 80 ? 'warn' : '');
      html += '<div class="pd-gauge"><div class="top"><span>Anggaran BBM bulan ini</span>' +
        '<span><b>' + M.fmtRp(bbm.total) + '</b> / ' + M.fmtRp(bbm.budget) +
        ' · <b>' + (bbm.persen || 0) + '%</b></span></div>' +
        '<div class="pd-track"><div class="pd-fill ' + cls + '" style="width:' + p + '%"></div></div></div>';
    }
    var eco = d.eco || {};
    if (eco.ini != null) {
      var chipEco = M.deltaChip(eco.lalu != null ? (eco.ini - eco.lalu) : null, true, ' poin');
      html += '<div class="pd-gauge"><div class="top"><span>Skor Eco Office (rata bulan ini)</span>' +
        '<span><b>' + M.fmtInt(eco.ini) + '</b>/100 ' + chipEco + '</span></div>' +
        '<div class="pd-track"><div class="pd-fill" style="width:' + Math.min(eco.ini, 100) + '%"></div></div></div>';
    }
    var s = d.sentimen;
    if (s) {
      var tot = s.positif + s.netral + s.negatif;
      var w = function (v) { return tot ? (v / tot) * 100 : 0; };
      html += '<div class="pd-gauge"><div class="top"><span>Citra pemberitaan bulan ini</span>' +
        '<span><b style="color:#15803d">' + s.positif + '</b> positif · ' +
        '<b style="color:#64748b">' + s.netral + '</b> netral · ' +
        '<b style="color:#b91c1c">' + s.negatif + '</b> negatif</span></div>' +
        '<div class="pd-track">' +
        '<div class="pd-fill seg" style="width:' + w(s.positif) + '%;background:#22c55e"></div>' +
        '<div class="pd-fill seg" style="width:' + w(s.netral) + '%;background:#94a3b8"></div>' +
        '<div class="pd-fill seg" style="width:' + w(s.negatif) + '%;background:#ef4444"></div>' +
        '</div></div>';
    }
    $('#pdGauges').innerHTML = html;
  },

  /* ── 6. Tabel ringkasan modul ── */
  renderModulTabel: function (rows) {
    var M = DashboardModule;
    var el = $('#pdTabelModul');
    if (!rows.length) {
      el.innerHTML = '<tr><td class="pd-empty">Belum ada transaksi tercatat.</td></tr>';
      return;
    }
    var maxIni = Math.max.apply(null, rows.map(function (r) { return r.ini; }).concat([1]));
    var totIni = 0, totLalu = 0;
    var body = rows.map(function (r) {
      totIni += r.ini; totLalu += r.lalu;
      var lebar = Math.max(Math.round((r.ini / maxIni) * 100), r.ini > 0 ? 4 : 0);
      return '<tr><td>' + escapeHtml(r.label) + '</td>' +
        '<td class="num">' + M.fmtInt(r.ini) + '</td>' +
        '<td class="num mut">' + M.fmtInt(r.lalu) + '</td>' +
        '<td style="text-align:center">' + M.deltaChip(r.delta, true) + '</td>' +
        '<td style="width:26%"><div class="pd-minibar"><i style="width:' + lebar + '%"></i></div></td></tr>';
    }).join('');
    el.innerHTML =
      '<thead><tr><th>Modul</th><th class="num">Bulan Ini</th><th class="num">Bulan Lalu</th>' +
      '<th style="text-align:center">Δ</th><th>Porsi</th></tr></thead>' +
      '<tbody>' + body +
      '<tr class="pd-total"><td>Total transaksi</td><td class="num">' + M.fmtInt(totIni) +
      '</td><td class="num mut">' + M.fmtInt(totLalu) + '</td>' +
      '<td style="text-align:center">' + M.deltaChip(totLalu ? Math.round(((totIni - totLalu) / totLalu) * 100) : null, true) +
      '</td><td></td></tr></tbody>';
  },

  /* ── 7. Insight otomatis (dihitung dari angka nyata, jujur dua arah) ── */
  renderInsight: function (d) {
    var M = DashboardModule, out = [];
    var kj = (d.kpi || {}).keputusan_jam || {};
    var tm = (d.kpi || {}).tunggu_menit || {};
    var tr = (d.kpi || {}).transaksi || {};
    var sl = (d.kpi || {}).antrian_selesai || {};
    var h = d.hari_ini || {};

    if (kj.ini != null && kj.delta != null && kj.delta !== 0) {
      out.push(kj.delta < 0
        ? { t: 'pos', ic: 'inbox', html: 'Keputusan persetujuan rata-rata <b>' + M.fmt1(kj.ini) + ' jam</b> — <b>' + Math.abs(kj.delta) + '% lebih cepat</b> dari bulan lalu. Alur satu pintu berjalan efektif.' }
        : { t: 'neg', ic: 'inbox', html: 'Keputusan persetujuan melambat <b>' + kj.delta + '%</b> (rata ' + M.fmt1(kj.ini) + ' jam) — cek antrean di Pusat Persetujuan.' });
    } else if (kj.ini != null) {
      out.push({ t: 'net', ic: 'inbox', html: 'Pengajuan diputus rata-rata <b>' + M.fmt1(kj.ini) + ' jam</b> sejak diajukan.' });
    }

    if (tm.ini != null && tm.delta != null && tm.delta !== 0) {
      out.push(tm.delta < 0
        ? { t: 'pos', ic: 'clock', html: 'Tamu kini menunggu rata-rata <b>' + M.fmt1(tm.ini) + ' menit</b> sebelum dipanggil — <b>' + Math.abs(tm.delta) + '% lebih singkat</b> dari bulan lalu.' }
        : { t: 'neg', ic: 'clock', html: 'Waktu tunggu antrian naik <b>' + tm.delta + '%</b> (rata ' + M.fmt1(tm.ini) + ' menit) — pertimbangkan menambah petugas pemanggil.' });
    }

    if (tr.delta != null && Math.abs(tr.delta) >= 5) {
      out.push(tr.delta > 0
        ? { t: 'pos', ic: 'rocket', html: 'Adopsi digital tumbuh: <b>' + M.fmtInt(tr.ini) + ' transaksi</b> tercatat bulan ini, naik <b>' + tr.delta + '%</b> — makin sedikit proses manual/kertas.' }
        : { t: 'neg', ic: 'rocket', html: 'Transaksi digital turun <b>' + Math.abs(tr.delta) + '%</b> menjadi ' + M.fmtInt(tr.ini) + ' — dorong kembali pemakaian modul.' });
    } else if (tr.ini > 0) {
      out.push({ t: 'net', ic: 'rocket', html: '<b>' + M.fmtInt(tr.ini) + ' transaksi</b> tercatat digital bulan ini di seluruh modul.' });
    }

    if (sl.ini != null && sl.ini >= 90) {
      out.push({ t: 'pos', ic: 'check', html: '<b>' + sl.ini + '%</b> tamu terlayani sampai selesai bulan ini — pelayanan tuntas.' });
    } else if (sl.ini != null && sl.ini < 60) {
      out.push({ t: 'neg', ic: 'check', html: 'Baru <b>' + sl.ini + '%</b> antrian berstatus selesai — pastikan petugas menekan <b>Selesai</b> setiap layanan tuntas agar data efektivitas akurat.' });
    }

    if (d.sentimen && d.sentimen.negatif > 0) {
      out.push({ t: 'neg', ic: 'news', html: 'Ada <b>' + d.sentimen.negatif + ' pemberitaan negatif</b> bulan ini — pantau tindak lanjutnya di Monitoring Berita.' });
    }
    if (h.insiden_open > 0) {
      out.push({ t: 'neg', ic: 'alert', html: '<b>' + h.insiden_open + ' insiden</b> masih berstatus terbuka/proses — perlu tindak lanjut Security.' });
    }
    if (h.atk_reorder > 0) {
      out.push({ t: 'neg', ic: 'box', html: '<b>' + h.atk_reorder + ' barang ATK</b> di bawah stok minimum — waktunya pengadaan.' });
    }

    var bbm = d.bbm || {};
    if (bbm.persen >= 100) {
      out.push({ t: 'neg', ic: 'droplet', html: 'Realisasi BBM <b>melampaui anggaran</b> (' + bbm.persen + '%) — tinjau di modul Kendaraan &amp; BBM.' });
    } else if (bbm.persen >= 80) {
      out.push({ t: 'neg', ic: 'droplet', html: 'Realisasi BBM sudah <b>' + bbm.persen + '%</b> dari anggaran bulan ini.' });
    }

    var eco = d.eco || {};
    if (eco.ini != null && eco.lalu != null && eco.ini > eco.lalu) {
      out.push({ t: 'pos', ic: 'leaf', html: 'Skor Eco Office naik ke <b>' + eco.ini + '</b> (bulan lalu ' + eco.lalu + ') — kepatuhan hemat energi membaik.' });
    }

    var t14 = d.tren14 || {};
    if (t14.labels && t14.labels.length) {
      var best = -1, bv = 0;
      for (var i = 0; i < t14.labels.length; i++) {
        var v = (t14.tamu[i] || 0) + (t14.layanan[i] || 0) + (t14.presensi[i] || 0);
        if (v > bv) { bv = v; best = i; }
      }
      if (best >= 0 && bv > 0) {
        out.push({ t: 'net', ic: 'activity', html: 'Hari teramai 2 pekan terakhir: <b>' + escapeHtml(t14.labels[best]) + '</b> (' + M.fmtInt(bv) + ' aktivitas tercatat).' });
      }
    }

    if (!out.length) {
      out.push({ t: 'net', ic: 'info', html: 'Belum cukup data untuk insight. Gunakan modul-modul aplikasi — angka dan tren akan terbentuk otomatis di sini.' });
    }

    $('#pdInsight').innerHTML = out.slice(0, 6).map(function (n) {
      return '<div class="pd-insight ' + n.t + '"><span class="ic">' + iconSvg(n.ic) + '</span><div>' + n.html + '</div></div>';
    }).join('');
  },

  /* ── 8. Aktivitas terbaru (tabel) ── */
  /* V7.9: log aktivitas TANPA tabel — LINIMASA ringkas: rel vertikal dengan
     titik berwarna per JENIS aksi (warna keluarga brand; merah hanya untuk
     aksi destruktif — semantik, bukan hiasan), isi berbentuk kartu ber-hover.
     Pengguna yang butuh tampilan tabel/Excel cukup mengunduh datanya. */
  renderAktivitas: function (list) {
    var el = $('#pdAktivitas');
    if (!list.length) {
      el.innerHTML = '<div class="pd-empty">Belum ada aktivitas — log kejadian sistem akan tampil di sini.</div>';
      return;
    }
    var kelasAksi = function (aksi) {
      var a = String(aksi || '').toUpperCase();
      if (a.indexOf('DELETE') === 0 || a.indexOf('HAPUS') === 0 || a.indexOf('REJECT') === 0 || a.indexOf('TOLAK') === 0) return 'is-del';
      if (a.indexOf('CREATE') === 0 || a.indexOf('TAMBAH') === 0) return 'is-new';
      if (a.indexOf('APPROVE') === 0 || a.indexOf('SETUJU') === 0) return 'is-ok';
      if (a.indexOf('LOGIN') === 0 || a.indexOf('LOGOUT') === 0) return 'is-sys';
      return 'is-upd';
    };
    el.innerHTML = list.map(function (l) {
      var tgl = String(l.tanggal || '').substring(5); // MM-dd — hemat lebar
      return '<div class="feed-item ' + kelasAksi(l.aksi) + '">' +
        '<span class="feed-rail"><span class="feed-dot"></span></span>' +
        '<div class="feed-body">' +
          '<div class="feed-head">' +
            '<b class="feed-user">' + escapeHtml(l.username || 'System') + '</b>' +
            (l.modul ? '<span class="feed-mod">' + escapeHtml(l.modul) + '</span>' : '') +
            '<span class="feed-time">' + escapeHtml(tgl + ' ' + (l.waktu || '')) + '</span>' +
          '</div>' +
          '<div class="feed-text">' + escapeHtml(l.detail || l.aksi || '') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
};

/* ── V7.9: SOROTAN KURSOR + KEMIRINGAN 3D KARTU KPI & STATISTIK ─────────────
   Kartu memantulkan pendar teal yang MENGIKUTI kursor sekaligus MIRING halus
   ke arahnya (perspektif 3D, maks ±4°) — satu listener terdelegasi +
   requestAnimationFrame, transform-only (murah di GPU), hanya aktif di
   perangkat berkursor presisi (desktop). Layar sentuh & preferensi gerak
   minim sama sekali tidak tersentuh. Pasangan CSS-nya di Styles_4 §25.9. */
(function () {
  try {
    if (!window.matchMedia || !matchMedia('(pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var MIRING_MAKS = 8; // derajat total (±4°)
    var kartuAktif = null, evAkhir = null, sedang = false;
    var bersihkan = function (el) {
      ['--mx', '--my', '--rx', '--ry'].forEach(function (v) { el.style.removeProperty(v); });
    };
    document.addEventListener('pointermove', function (e) {
      evAkhir = e;
      if (sedang) return;
      sedang = true;
      requestAnimationFrame(function () {
        sedang = false;
        var t = evAkhir.target && evAkhir.target.closest
          ? evAkhir.target.closest('.pd-kpi, .stat-card') : null;
        if (kartuAktif && kartuAktif !== t) bersihkan(kartuAktif);
        kartuAktif = t;
        if (!t) return;
        var r = t.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = (evAkhir.clientX - r.left) / r.width;   // 0..1
        var py = (evAkhir.clientY - r.top) / r.height;   // 0..1
        t.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        t.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        t.style.setProperty('--ry', ((px - 0.5) * MIRING_MAKS).toFixed(2) + 'deg');
        t.style.setProperty('--rx', ((0.5 - py) * MIRING_MAKS).toFixed(2) + 'deg');
      });
    }, { passive: true });
    // kursor keluar dari kartu → kembali datar mulus (transisi di CSS)
    document.addEventListener('pointerout', function (e) {
      if (!kartuAktif) return;
      var ke = e.relatedTarget;
      if (!ke || !kartuAktif.contains(ke)) { bersihkan(kartuAktif); kartuAktif = null; }
    }, { passive: true });
  } catch (e) { /* hiasan — tak boleh mengganggu aplikasi */ }
})();

/* ══════════════════════════════════════════════════════════════════════════
   8. MODUL: DIGITAMU
   ══════════════════════════════════════════════════════════════════════════ */
var DigitamuModule = {
  data: [],
  pollTimer: null,

  init: function () {
    $('#tamuAddBtn').addEventListener('click', function () {
      DigitamuModule.resetForm();
      Modal.open('modalTamu');
      setTimeout(function () { $('#fNama').focus(); }, 250);
    });
    $('#tamuRefreshBtn').addEventListener('click', function () { DigitamuModule.load(true); });
    $('#fSubmitTamu').addEventListener('click', DigitamuModule.submit);
    $('#tamuSearch').addEventListener('input', function () {
      DigitamuModule.renderTable();
    });
  },

  load: function (showToast) {
    // SATU round-trip untuk stats + daftar tamu (bundel V6.6) — jatuh mulus
    // ke dua panggilan lama bila backend belum ter-deploy.
    API.call('getModuleBundle', { module: 'digitamu' }).then(function (r) {
      if (r.success && r.data) {
        var d = r.data;
        if (d.stats && d.stats.success) DigitamuModule.renderStats(d.stats.data);
        if (d.tamu && d.tamu.success) {
          DigitamuModule.data = d.tamu.data || [];
          DigitamuModule.renderAntrian();
          DigitamuModule.renderTable();
          if (showToast) Toast.info('Data tamu diperbarui');
        } else if (d.tamu) {
          Toast.error('Gagal memuat tamu', d.tamu.error);
        }
      } else {
        DigitamuModule.loadLegacy(showToast);
      }
    });
    DigitamuModule.startPolling();
  },

  loadLegacy: function (showToast) {
    API.call('getTamuStats').then(function (res) {
      if (res.success) DigitamuModule.renderStats(res.data);
    });
    API.call('getTamuHariIni').then(function (res) {
      if (res.success) {
        DigitamuModule.data = res.data || [];
        DigitamuModule.renderAntrian();
        DigitamuModule.renderTable();
        if (showToast) Toast.info('Data tamu diperbarui');
      } else {
        Toast.error('Gagal memuat tamu', res.error);
      }
    });
  },

  /** Auto-refresh setiap 45 detik selama view DIGITAMU aktif */
  startPolling: function () {
    if (DigitamuModule.pollTimer) clearInterval(DigitamuModule.pollTimer);
    DigitamuModule.pollTimer = setInterval(function () {
      if (Router.current !== 'digitamu' || document.hidden) return;
      API.call('getModuleBundle', { module: 'digitamu' }).then(function (r) {
        if (r.success && r.data) {
          var d = r.data;
          if (d.tamu && d.tamu.success) {
            DigitamuModule.data = d.tamu.data || [];
            DigitamuModule.renderAntrian();
            DigitamuModule.renderTable();
          }
          if (d.stats && d.stats.success) DigitamuModule.renderStats(d.stats.data);
        } else {
          DigitamuModule.loadLegacy();
        }
      });
    }, 45000);
  },

  renderStats: function (d) {
    var cards = [
      { icon: 'users', cls: 'stat-teal',  val: d.total_hari_ini, label: 'Total Hari Ini' },
      { icon: 'clock', cls: 'stat-amber', val: d.waiting,        label: 'Menunggu' },
      { icon: 'bell',  cls: 'stat-blue',  val: d.serving,        label: 'Dilayani' },
      { icon: 'check', cls: 'stat-green', val: d.done,           label: 'Selesai' }
    ];
    $('#tamuStats').innerHTML = cards.map(function (c) {
      return '<div class="stat-card ' + c.cls + '">' +
        '<div class="stat-icon">' + iconSvg(c.icon) + '</div>' +
        '<div class="stat-value">' + (c.val || 0) + '</div>' +
        '<div class="stat-label">' + c.label + '</div></div>';
    }).join('');
  },

  renderAntrian: function () {
    var waiting = DigitamuModule.data.filter(function (t) { return t.status === 'waiting'; });
    var serving = DigitamuModule.data.filter(function (t) { return t.status === 'serving'; });

    // urutkan menunggu berdasar nomor antrian
    waiting.sort(function (a, b) {
      return String(a.no_antrian).localeCompare(String(b.no_antrian));
    });

    $('#countWaiting').textContent = waiting.length + ' antrian';
    $('#countServing').textContent = serving.length + ' tamu';

    // Tombol Teruskan (V6.7): kabag+ meneruskan tamu ke pegawai yang dituju
    // via Telegram — pengganti alur "tamu memantau layar TV" yang dipensiunkan.
    var bolehTerus = (typeof isApprover === 'function') && isApprover();
    var btnTerus = function (t) {
      if (!bolehTerus) return '';
      return '<button class="btn btn-outline btn-sm" data-terus="' + escapeHtml(t.id) + '" ' +
        'title="Kabari pegawai yang dituju via Telegram">' + iconSvg('send', 'btn-icon') + '</button>';
    };

    $('#listWaiting').innerHTML = waiting.length ? waiting.map(function (t) {
      return '<div class="antrian-item">' +
        '<div class="antrian-no">' + escapeHtml(t.no_antrian) + '</div>' +
        '<div class="antrian-info">' +
          '<div class="antrian-nama">' + escapeHtml(t.nama) + '</div>' +
          '<div class="antrian-tujuan">' + escapeHtml(BAGIAN_LABEL[t.tujuan_bagian] || t.tujuan_bagian) + ' · ' + escapeHtml(fmtTime(t.waktu_masuk)) + (t.pic ? ' · PIC: ' + escapeHtml(t.pic) : '') + '</div>' +
        '</div>' +
        btnTerus(t) +
        '<button class="btn btn-primary btn-sm" data-panggil="' + escapeHtml(t.id) + '">' +
          iconSvg('bell', 'btn-icon') + ' Panggil</button>' +
      '</div>';
    }).join('') : DigitamuModule.emptyBox('Tidak ada antrian menunggu');

    $('#listServing').innerHTML = serving.length ? serving.map(function (t) {
      return '<div class="antrian-item is-serving">' +
        '<div class="antrian-no">' + escapeHtml(t.no_antrian) + '</div>' +
        '<div class="antrian-info">' +
          '<div class="antrian-nama">' + escapeHtml(t.nama) + '</div>' +
          '<div class="antrian-tujuan">' + escapeHtml(BAGIAN_LABEL[t.tujuan_bagian] || t.tujuan_bagian) + (t.pic ? ' · PIC: ' + escapeHtml(t.pic) : '') + '</div>' +
        '</div>' +
        btnTerus(t) +
        '<button class="btn btn-success btn-sm" data-selesai="' + escapeHtml(t.id) + '">' +
          iconSvg('check', 'btn-icon') + ' Selesai</button>' +
      '</div>';
    }).join('') : DigitamuModule.emptyBox('Belum ada tamu yang dilayani');

    DigitamuModule.bindActions($('#listWaiting'));
    DigitamuModule.bindActions($('#listServing'));
  },

  emptyBox: function (text) {
    return '<div class="empty-state" style="padding:26px 12px">' +
      '<div class="empty-icon">' + iconSvg('users') + '</div>' +
      '<div class="empty-text">' + escapeHtml(text) + '</div></div>';
  },

  renderTable: function () {
    var q = ($('#tamuSearch').value || '').toLowerCase();
    var rows = DigitamuModule.data.filter(function (t) {
      if (!q) return true;
      return String(t.nama).toLowerCase().indexOf(q) !== -1 ||
             String(t.instansi).toLowerCase().indexOf(q) !== -1 ||
             String(t.no_antrian).toLowerCase().indexOf(q) !== -1;
    });

    if (!rows.length) {
      $('#tamuTableBody').innerHTML =
        '<tr><td colspan="7"><div class="empty-state">' +
        '<div class="empty-icon">' + iconSvg('users') + '</div>' +
        '<div class="empty-title">Belum ada tamu hari ini</div>' +
        '<div class="empty-text">Klik "Daftarkan Tamu" untuk memulai.</div></div></td></tr>';
      return;
    }

    $('#tamuTableBody').innerHTML = rows.map(function (t) {
      var st = t.status || 'waiting';
      var boleh = (typeof isApprover === 'function') && isApprover();
      var terus = boleh && (st === 'waiting' || st === 'serving')
        ? '<button class="btn btn-outline btn-sm" data-terus="' + escapeHtml(t.id) + '" title="Kabari pegawai yang dituju via Telegram">' + iconSvg('send', 'btn-icon') + '</button>'
        : '';
      var actions = '';
      if (st === 'waiting') {
        actions = terus +
                  '<button class="btn btn-primary btn-sm" data-panggil="' + escapeHtml(t.id) + '">Panggil</button>' +
                  '<button class="btn btn-ghost btn-sm" data-batal="' + escapeHtml(t.id) + '">Batal</button>';
      } else if (st === 'serving') {
        actions = terus +
                  '<button class="btn btn-success btn-sm" data-selesai="' + escapeHtml(t.id) + '">Selesai</button>';
      } else {
        actions = '<span class="text-muted" style="font-size:11.5px">' + escapeHtml(fmtTime(t.waktu_selesai)) + '</span>';
      }
      return '<tr>' +
        '<td class="cell-mono">' + escapeHtml(t.no_antrian || '—') + '</td>' +
        '<td><div class="cell-primary">' + escapeHtml(t.nama) + '</div>' +
            '<div class="cell-sub">' + escapeHtml(t.instansi || '—') + '</div></td>' +
        '<td style="max-width:220px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + escapeHtml(t.keperluan) + '">' + escapeHtml(t.keperluan) + '</div></td>' +
        '<td>' + escapeHtml(BAGIAN_LABEL[t.tujuan_bagian] || t.tujuan_bagian || '—') + '</td>' +
        '<td>' + escapeHtml(fmtTime(t.waktu_masuk)) + '</td>' +
        '<td><span class="badge badge-' + st + '">' + (STATUS_LABEL[st] || st) + '</span></td>' +
        '<td><div class="cell-actions">' + actions + '</div></td>' +
      '</tr>';
    }).join('');

    DigitamuModule.bindActions($('#tamuTableBody'));
  },

  bindActions: function (root) {
    $all('[data-panggil]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        DigitamuModule.doAction('panggilAntrian', b.getAttribute('data-panggil'), b);
      });
    });
    $all('[data-selesai]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        DigitamuModule.doAction('selesaiAntrian', b.getAttribute('data-selesai'), b);
      });
    });
    $all('[data-batal]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-batal');
        Confirm.ask('Batalkan tamu ini?', 'Antrian akan dibatalkan dan tidak dipanggil.', function () {
          apiKlikSekali(b, 'updateTamuStatus', { id: id, status: 'cancelled' }).then(function (res) {
            if (res.success) { Toast.success('Antrian dibatalkan'); DigitamuModule.load(); }
            else Toast.error(res.error || 'Gagal membatalkan');
          });
        });
      });
    });
    $all('[data-terus]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        DigitamuModule.openTerus(b.getAttribute('data-terus'));
      });
    });
  },

  /* ── V6.7: Teruskan tamu ke pegawai yang dituju (Telegram/email) ──
     Modal dibangun dinamis agar tidak menyentuh markup Index.html. */
  _terusSiap: false,
  _pastikanModalTerus: function () {
    if (DigitamuModule._terusSiap) return;
    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.id = 'modalTerusTamu';
    wrap.innerHTML =
      '<div class="modal modal-sm">' +
        '<div class="modal-header">' +
          '<div class="modal-title">' + iconSvg('send') + ' Teruskan ke Pegawai</div>' +
          '<button class="modal-close" id="ttClose">' + iconSvg('x') + '</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div id="ttInfo" class="alert alert-info mb-2" style="font-size:12.5px"></div>' +
          '<div class="form-group mb-2">' +
            '<label class="form-label">Nama pegawai yang dituju <span class="req">*</span></label>' +
            '<input type="text" class="form-control" id="ttPic" placeholder="Tulis nama sesuai akun GESIT">' +
            '<div class="form-hint">Dicari di Telegram pribadi pegawai; bila belum terhubung, jatuh ke email akunnya.</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Catatan tambahan (opsional)</label>' +
            '<textarea class="form-control" id="ttPesan" rows="2" placeholder="mis. tamu menunggu di lobi lantai 1"></textarea>' +
          '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-outline" id="ttBatal">Batal</button>' +
          '<button class="btn btn-primary" id="ttKirim">' + iconSvg('send', 'btn-icon') + ' <span id="ttKirimText">Kirim Pemberitahuan</span></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    $('#ttClose').addEventListener('click', function () { Modal.close('modalTerusTamu'); });
    $('#ttBatal').addEventListener('click', function () { Modal.close('modalTerusTamu'); });
    $('#ttKirim').addEventListener('click', DigitamuModule.submitTerus);
    DigitamuModule._terusSiap = true;
  },
  _terusId: null,
  openTerus: function (id) {
    DigitamuModule._pastikanModalTerus();
    var t = DigitamuModule.data.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!t) { Toast.error('Data tamu tidak ditemukan — muat ulang halaman'); return; }
    DigitamuModule._terusId = id;
    $('#ttInfo').innerHTML = '<b>' + escapeHtml(t.nama) + '</b>' +
      (t.instansi ? ' — ' + escapeHtml(t.instansi) : '') +
      '<br>Antrian <b>' + escapeHtml(t.no_antrian || '—') + '</b> · ' +
      escapeHtml(BAGIAN_LABEL[t.tujuan_bagian] || t.tujuan_bagian || '—') +
      '<br>' + escapeHtml(t.keperluan || '');
    $('#ttPic').value = t.pic || '';
    $('#ttPesan').value = '';
    Modal.open('modalTerusTamu');
    setTimeout(function () { $('#ttPic').focus(); }, 250);
  },
  submitTerus: function () {
    var pic = $('#ttPic').value.trim();
    if (!pic) { $('#ttPic').classList.add('is-invalid'); Toast.warning('Isi nama pegawai yang dituju'); return; }
    $('#ttPic').classList.remove('is-invalid');
    var btn = $('#ttKirim'), txt = $('#ttKirimText');
    btnLoading(btn, txt, true);
    API.call('teruskanTamu', {
      id: DigitamuModule._terusId, pic: pic, pesan: $('#ttPesan').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Kirim Pemberitahuan');
      if (res.success) {
        Modal.close('modalTerusTamu');
        if (res.sent) Toast.success('Pemberitahuan terkirim', res.message);
        else Toast.warning('Belum terkirim', res.message);
        DigitamuModule.load();
      } else {
        Toast.error(res.error || 'Gagal meneruskan');
      }
    });
  },

  doAction: function (action, id, btn) {
    btn.disabled = true;
    API.call(action, { id: id }).then(function (res) {
      btn.disabled = false;
      if (res.success) {
        Toast.success(res.message || 'Berhasil');
        DigitamuModule.load();
      } else {
        Toast.error(res.error || 'Gagal memproses');
      }
    });
  },

  resetForm: function () {
    ['fNama', 'fNik', 'fHp', 'fInstansi', 'fKeperluan', 'fPic'].forEach(function (id) {
      $('#' + id).value = '';
    });
    $('#fTujuan').value = '';
    $all('#modalTamu .form-control').forEach(function (el) { el.classList.remove('is-invalid'); });
  },

  submit: function () {
    var nama = $('#fNama').value.trim();
    var keperluan = $('#fKeperluan').value.trim();
    var tujuan = $('#fTujuan').value;

    var valid = true;
    [['fNama', nama], ['fKeperluan', keperluan], ['fTujuan', tujuan]].forEach(function (pair) {
      var el = $('#' + pair[0]);
      if (!pair[1]) { el.classList.add('is-invalid'); valid = false; }
      else el.classList.remove('is-invalid');
    });
    if (!valid) { Toast.warning('Lengkapi kolom bertanda *'); return; }

    var btn = $('#fSubmitTamu'), txt = $('#fSubmitTamuText');
    btnLoading(btn, txt, true);

    API.call('createTamu', {
      req_id: ReqKey.get('tamu'), // Audit #2: kunci idempoten anti dobel-kirim
      nama: nama,
      nik: $('#fNik').value.trim(),
      no_hp: $('#fHp').value.trim(),
      instansi: $('#fInstansi').value.trim(),
      keperluan: keperluan,
      tujuan_bagian: tujuan,
      pic: $('#fPic').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Daftarkan & Cetak Antrian');
      if (res.success) {
        ReqKey.clear('tamu'); // sukses → form berikutnya memakai kunci baru
        Modal.close('modalTamu');
        $('#antrianOkNo').textContent = res.no_antrian;
        $('#antrianOkNama').textContent = nama;
        Modal.open('modalAntrianOk');
        DigitamuModule.load();
      } else {
        Toast.error(res.error || 'Gagal mendaftarkan tamu');
      }
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   9. MODUL: MANAJEMEN USER (ADMIN)
   ══════════════════════════════════════════════════════════════════════════ */
var UsersModule = {
  init: function () {
    $('#userAddBtn').addEventListener('click', function () {
      ['uUsername', 'uPassword', 'uNama', 'uEmail', 'uHp'].forEach(function (id) { $('#' + id).value = ''; });
      $('#uRole').value = 'staff';
      $('#uBagian').value = '';
      Modal.open('modalUser');
    });
    $('#uSubmit').addEventListener('click', UsersModule.submit);
  },

  load: function () {
    $('#userTableBody').innerHTML =
      '<tr><td colspan="6" style="padding:20px"><div class="skeleton" style="height:16px;margin-bottom:10px"></div>' +
      '<div class="skeleton" style="height:16px;width:70%"></div></td></tr>';
    API.call('getUsers').then(function (res) {
      if (!res.success) { Toast.error(res.error || 'Gagal memuat user'); return; }
      UsersModule.render(res.data || []);
    });
  },

  render: function (users) {
    if (!users.length) {
      $('#userTableBody').innerHTML = '<tr><td colspan="6"><div class="empty-state">' +
        '<div class="empty-title">Belum ada user</div></div></td></tr>';
      return;
    }
    var actorSuper = Auth.user && String(Auth.user.role) === 'super_admin';
    $('#userTableBody').innerHTML = users.map(function (u) {
      var isSelf = Auth.user && String(u.id) === String(Auth.user.id);
      var targetSuper = String(u.role) === 'super_admin';
      // Kewenangan: admin biasa tidak bisa menyentuh akun super_admin (backend
      // juga menolak — UI menyembunyikan agar batasnya jelas).
      var bolehKelola = !targetSuper || actorSuper;
      var st = String(u.status || '').toLowerCase();
      var stBadge =
        st === 'active' ? '<span class="badge badge-done">Aktif</span>' :
        st === 'pending_telegram' ? '<span class="badge badge-waiting">Menunggu Telegram</span>' :
        st === 'pending_admin' ? '<span class="badge badge-serving">Menunggu Persetujuan</span>' :
        '<span class="badge badge-cancelled">Nonaktif</span>';
      var aksi = [];
      var roleCell;
      if (bolehKelola && !isSelf) {
        // Ganti role langsung dari tabel — tidak perlu ubah manual di database.
        // Opsi super_admin hanya tersedia bagi aktor super_admin (backend juga menolak).
        var ROLES = [['staff', 'Staff'], ['kabag', 'Kepala Bagian'], ['admin', 'Administrator'],
                     ['magang', 'Magang'], ['driver', 'Driver'], ['security', 'Security'], ['cso', 'CSO']];
        if (actorSuper) ROLES.push(['super_admin', 'Super Admin']);
        var curRole = String(u.role || '').toLowerCase();
        roleCell = '<select class="form-control shift-select" data-rolesel="' + escapeHtml(u.id) + '"' +
          ' data-uname="' + escapeHtml(u.username) + '" data-cur="' + escapeHtml(curRole) + '" style="min-width:118px;font-size:12px">' +
          ROLES.map(function (r) {
            return '<option value="' + r[0] + '"' + (r[0] === curRole ? ' selected' : '') + '>' + r[1] + '</option>';
          }).join('') +
          (ROLES.some(function (r) { return r[0] === curRole; }) ? '' :
            '<option value="' + escapeHtml(curRole) + '" selected>' + escapeHtml(curRole) + '</option>') +
          '</select>';
      } else {
        roleCell = '<span class="badge badge-neutral">' + escapeHtml(u.role) + '</span>';
      }
      if (bolehKelola) {
        // Aktifkan: berlaku utk pending_admin DAN pending_telegram (jalan keluar
        // saat bot Telegram tidak merespons) serta akun nonaktif.
        if (st === 'pending_admin' || st === 'pending_telegram' || st === 'inactive' || st === 'nonaktif') {
          aksi.push('<button class="btn btn-success btn-sm" data-activateuser="' + escapeHtml(u.id) + '" data-uname="' + escapeHtml(u.username) + '">' +
            iconSvg('check', 'btn-icon') + ' Aktifkan</button>');
        } else if (st === 'active' && !isSelf) {
          aksi.push('<button class="btn btn-outline btn-sm" data-deactuser="' + escapeHtml(u.id) + '" data-uname="' + escapeHtml(u.username) + '">' +
            iconSvg('x', 'btn-icon') + ' Nonaktifkan</button>');
        }
        aksi.push('<button class="btn btn-outline btn-sm" data-resetpass="' + escapeHtml(u.id) + '" data-uname="' + escapeHtml(u.username) + '">' +
          iconSvg('key', 'btn-icon') + ' Reset</button>');
        if (!isSelf && actorSuper) {
          aksi.push('<button class="btn btn-ghost btn-sm" data-deluser="' + escapeHtml(u.id) + '" data-uname="' + escapeHtml(u.username) + '" style="color:var(--danger)">' +
            iconSvg('trash', 'btn-icon') + ' Hapus</button>');
        }
      } else {
        aksi.push('<span class="form-hint" title="Hanya super admin yang dapat mengelola akun super admin">' + iconSvg('lock','btn-icon') + ' Super admin</span>');
      }
      return '<tr>' +
        '<td><div class="cell-primary">' + escapeHtml(u.nama_lengkap) + '</div>' +
            '<div class="cell-sub">@' + escapeHtml(u.username) + '</div></td>' +
        '<td>' + roleCell + '</td>' +
        '<td>' + escapeHtml(u.bagian || '—') + '</td>' +
        '<td>' + stBadge + '</td>' +
        '<td style="font-size:12px;color:var(--text-secondary)">' + escapeHtml(u.last_login || 'Belum pernah') + '</td>' +
        '<td><div class="cell-actions" style="flex-wrap:wrap">' + aksi.join('') + '</div></td>' +
      '</tr>';
    }).join('');

    $all('[data-rolesel]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-rolesel');
        var uname = sel.getAttribute('data-uname');
        var cur = sel.getAttribute('data-cur');
        var baru = sel.value;
        if (baru === cur) return;
        Confirm.ask('Ubah role @' + uname + '?',
          'Dari "' + cur + '" menjadi "' + baru + '". Hak akses berlaku pada login berikutnya.', function () {
          apiKlikSekali(sel, 'updateUser', { id: id, role: baru }).then(function (res) {
            if (res.success) { Toast.success('Role @' + uname + ' → ' + baru); UsersModule.load(); }
            else { Toast.error(res.error || 'Gagal mengubah role'); sel.value = cur; }
          });
        }, function () { sel.value = cur; });
      });
    });

    $all('[data-activateuser]').forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Aktifkan @' + b.getAttribute('data-uname') + '?',
          'User langsung bisa login — termasuk yang tersangkut konfirmasi Telegram. Kabar dikirim via Telegram/email bila tersedia.', function () {
          apiKlikSekali(b, 'updateUser', { id: b.getAttribute('data-activateuser'), status: 'active' }).then(function (res) {
            if (res.success) { Toast.success('Akun diaktifkan'); UsersModule.load(); }
            else Toast.error(res.error || 'Gagal mengaktifkan');
          });
        });
      });
    });

    $all('[data-deactuser]').forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Nonaktifkan @' + b.getAttribute('data-uname') + '?',
          'User tidak bisa login sampai diaktifkan lagi. Data & riwayatnya tetap tersimpan.', function () {
          apiKlikSekali(b, 'updateUser', { id: b.getAttribute('data-deactuser'), status: 'inactive' }).then(function (res) {
            if (res.success) { Toast.success('Akun dinonaktifkan'); UsersModule.load(); }
            else Toast.error(res.error || 'Gagal menonaktifkan');
          });
        });
      });
    });

    $all('[data-resetpass]').forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Reset password @' + b.getAttribute('data-uname') + '?', 'Password baru acak akan dibuat, kunci login juga dibuka.', function () {
          apiKlikSekali(b, 'resetUserPassword', { id: b.getAttribute('data-resetpass') }).then(function (res) {
            if (res.success) Toast.success('Password baru: ' + res.newPassword, 'Catat & sampaikan ke user sekarang.');
            else Toast.error(res.error || 'Gagal reset password');
          });
        });
      });
    });

    $all('[data-deluser]').forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Hapus user @' + b.getAttribute('data-uname') + '?',
          'Akun akan dihapus permanen dari sistem.', function () {
          apiKlikSekali(b, 'deleteUser', { id: b.getAttribute('data-deluser') }).then(function (res) {
            if (res.success) { Toast.success('User dihapus'); UsersModule.load(); }
            else Toast.error(res.error || 'Gagal menghapus');
          });
        });
      });
    });
  },

  submit: function () {
    var payload = {
      username: $('#uUsername').value.trim(),
      password: $('#uPassword').value,
      nama_lengkap: $('#uNama').value.trim(),
      email: $('#uEmail').value.trim(),
      no_hp: $('#uHp').value.trim(),
      role: $('#uRole').value,
      bagian: $('#uBagian').value
    };
    if (!payload.username || !payload.password || !payload.nama_lengkap) {
      Toast.warning('Username, password, dan nama wajib diisi');
      return;
    }
    var btn = $('#uSubmit'), txt = $('#uSubmitText');
    btnLoading(btn, txt, true);
    API.call('createUser', payload).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan User');
      if (res.success) {
        Modal.close('modalUser');
        Toast.success('User berhasil dibuat');
        UsersModule.load();
      } else {
        Toast.error(res.error || 'Gagal membuat user');
      }
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   10. GANTI PASSWORD (semua user)
   ══════════════════════════════════════════════════════════════════════════ */
var PasswordModule = {
  init: function () {
    $('#menuChangePass').addEventListener('click', function () {
      UserMenu.close();
      ['pOld', 'pNew', 'pNew2'].forEach(function (id) { $('#' + id).value = ''; });
      Modal.open('modalPass');
    });
    $('#pSubmit').addEventListener('click', PasswordModule.submit);
  },
  submit: function () {
    var oldP = $('#pOld').value, newP = $('#pNew').value, newP2 = $('#pNew2').value;
    if (!oldP || !newP) { Toast.warning('Semua kolom wajib diisi'); return; }
    if (newP !== newP2) { Toast.warning('Konfirmasi password baru tidak sama'); return; }
    var btn = $('#pSubmit'), txt = $('#pSubmitText');
    btnLoading(btn, txt, true);
    API.call('changePassword', { old_password: oldP, new_password: newP }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan');
      if (res.success) { Modal.close('modalPass'); Toast.success('Password berhasil diubah'); }
      else Toast.error(res.error || 'Gagal mengubah password');
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   11. USER MENU (dropdown topbar)
   ══════════════════════════════════════════════════════════════════════════ */
var UserMenu = {
  init: function () {
    $('#userChip').addEventListener('click', function (e) {
      e.stopPropagation();
      $('#userMenu').classList.toggle('is-open');
    });
    document.addEventListener('click', UserMenu.close);
  },
  close: function () { $('#userMenu').classList.remove('is-open'); }
};
