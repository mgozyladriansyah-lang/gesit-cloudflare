/* ════════════════════════════════════════════════════════════════════════════
   GESIT V6 — JS 2/4: HELPER BERSAMA + MODUL FASE 2
   Isi   : Helper bersama Fase 2 & 4 (status, format, master data, tab, foto, CSV, kalender, tautan publik, kirim pesan, pengaturan), Kendaraan & BBM, Booking Ruangan, ATK, Pusat Persetujuan
   Urutan: file ke-2 dari 4
   Catatan: keempat file JS berbagi scope global (tanpa IIFE) agar antar-modul
   tetap saling terhubung. Muat sesuai urutan di atas.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   FASE 2 — HELPER BERSAMA (status, format, master data, tab, penolakan, foto)
   ══════════════════════════════════════════════════════════════════════════ */
var STATUS_LABEL_2 = {
  pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
  selesai: 'Selesai', diambil: 'Diambil', cancelled: 'Dibatalkan',
  active: 'Aktif', aktif: 'Aktif', alumni: 'Alumni', nonaktif: 'Nonaktif',
  hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa',
  open: 'Terbuka', proses: 'Ditindaklanjuti', closed: 'Selesai',
  revisi: 'Perlu Revisi', dinilai: 'Dinilai',
  terjadwal: 'Terjadwal', batal: 'Batal', draft: 'Draft',
  dijadwalkan: 'Dijadwalkan', tayang: 'Tayang', tercatat: 'Tercatat'
};

/* Status di luar set Fase 1–2 dipetakan ke kelas badge yang sudah ada */
var BADGE_CLASS = {
  active: 'approved', aktif: 'approved', hadir: 'approved',
  izin: 'waiting', sakit: 'waiting', alpa: 'cancelled',
  open: 'waiting', proses: 'serving', closed: 'done',
  alumni: 'neutral', nonaktif: 'cancelled', revisi: 'waiting', dinilai: 'done',
  terjadwal: 'approved', batal: 'cancelled', draft: 'neutral',
  dijadwalkan: 'waiting', tayang: 'done', tercatat: 'neutral'
};

function statusBadge(status) {
  var s = String(status || 'pending');
  var label = STATUS_LABEL_2[s] || STATUS_LABEL[s] || s;
  var cls = BADGE_CLASS[s] || s;
  return '<span class="badge badge-' + cls + '">' + escapeHtml(label) + '</span>';
}

/* Shift Security 8 jam × 3 (serah terima 23.00 / 07.00 / 15.00).
   Kunci data lama 'siang' dipertahankan — label tampil "Sore". */
var SHIFT_LABEL = { pagi: 'Pagi', siang: 'Sore', malam: 'Malam', libur: 'Libur' };
var SHIFT_JAM   = { pagi: '07.00–15.00', siang: '15.00–23.00', malam: '23.00–07.00' };
function shiftLabelJam(sh) {
  return (SHIFT_LABEL[sh] || sh) + (SHIFT_JAM[sh] ? ' (' + SHIFT_JAM[sh] + ')' : '');
}
var KONDISI_LABEL = { normal: 'Normal', perlu_perhatian: 'Perlu Perhatian', bahaya: 'Masalah' };

function rupiahFmt(n) {
  var num = Math.round(Number(n) || 0);
  return 'Rp ' + String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function isApprover() {
  return ['kabag', 'admin', 'super_admin'].indexOf(String(Auth.user && Auth.user.role).toLowerCase()) !== -1;
}
function isRoleSecurity() {
  return String(Auth.user && Auth.user.role).toLowerCase() === 'security';
}
function isAdmin2() {
  return ['admin', 'super_admin'].indexOf(String(Auth.user && Auth.user.role).toLowerCase()) !== -1;
}

function todayISO() {
  var d = new Date();
  function p(n) { return n < 10 ? '0' + n : n; }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

/* Ambil "HH:mm" dari nilai apa pun (aman utk data lama "1899-12-30 16:50:00") */
function fmtTime(v) {
  if (!v) return '—';
  var m = String(v).match(/(\d{1,2}):(\d{2})/);
  if (!m) return String(v);
  return (m[1].length < 2 ? '0' + m[1] : m[1]) + ':' + m[2];
}

function fmtDateShort(v) {
  if (!v) return '—';
  var s = String(v);
  var m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    var y = parseInt(m[1], 10);
    if (y < 1902) return fmtTime(s); // sel lama berisi jam saja
    var d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    return d.getDate() + ' ' + BULAN[d.getMonth()].substring(0, 3) + ' ' + d.getFullYear();
  }
  return s;
}

/* Tautan chip: koordinat "lat,lng" → Google Maps; URL → buka */
function lokasiChip(v, label) {
  var s = String(v || '').trim();
  if (!s) return '<span class="text-muted" style="font-size:11px">—</span>';
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(s)) {
    return '<a class="chip" target="_blank" rel="noopener" href="https://maps.google.com/?q=' +
      encodeURIComponent(s) + '">' + escapeHtml(label || 'Peta') + '</a>';
  }
  return '<span style="font-size:11.5px">' + escapeHtml(s) + '</span>';
}

/** URL yang BISA dirender <img> dari nilai foto apa pun yang tersimpan:
    tautan Drive (file/d/…/view, uc?id=, open?id=) → thumbnail resmi Drive
    (ringan, ukuran sesuai kebutuhan); data-URI → apa adanya; marker/kosong → ''. */
function driveImgSrc(url, w) {
  var s = String(url || '').trim();
  if (!s) return '';
  if (/^data:image\//i.test(s)) return s;
  if (/^\[FOTO/i.test(s)) return '';
  if (!/^https?:\/\//i.test(s)) return '';
  if (/drive\.google\.com|docs\.google\.com/i.test(s)) {
    var m = s.match(/[-\w]{25,}/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[0] + '&sz=w' + (w || 400);
  }
  return s;
}

/** Chip foto → kini THUMBNAIL asli yang tampil di tabel/detail (bukan sekadar
    tautan). Ringan: thumbnail Drive w120 + loading="lazy"; klik = pratinjau
    besar di aplikasi + tautan buka di Drive. Bila thumbnail gagal dimuat
    (berkas lama belum publik), otomatis berubah jadi tautan "Lihat". */
function fotoChip(url, label) {
  if (!url) return '<span class="text-muted" style="font-size:11px">—</span>';
  var s = String(url);
  if (/^\[FOTO/i.test(s) || (!/^https?:\/\//i.test(s) && !/^data:image\//i.test(s))) {
    return '<span class="chip" style="opacity:.6;cursor:help" ' +
      'title="Foto tidak ikut tersimpan saat pengambilan (data versi lama)">Foto tidak tersimpan</span>';
  }
  // PDF/berkas non-gambar → tetap tautan buka tab baru
  if (/\.pdf(\?|$)/i.test(s)) {
    return '<a class="chip" target="_blank" rel="noopener" href="' + escapeHtml(s) + '">' +
      escapeHtml(label || 'Lihat PDF') + '</a>';
  }
  var kecil = driveImgSrc(s, 120);
  var besar = driveImgSrc(s, 1600);
  return '<button type="button" class="chip-foto foto-thumb-wrap" title="' + escapeHtml(label || 'Lihat foto') + '"' +
    ' data-foto-view="' + escapeHtml(besar) + '" data-foto-full="' + escapeHtml(s) + '">' +
    '<img class="foto-thumb" loading="lazy" alt="" src="' + escapeHtml(kecil) + '"' +
    ' data-tw="120" onerror="fotoTunnelCoba(this,\'link\')">' +
    '</button>';
}

/** Thumbnail gagal dimuat (berkas lama belum publik / offline) →
    ganti jadi tautan "Lihat" ke Drive agar tetap bisa diakses. */
function fotoThumbGagal(img) {
  var wrap = img.parentNode; if (!wrap) return;
  var full = wrap.getAttribute('data-foto-full') || '';
  var a = document.createElement('a');
  a.className = 'chip'; a.target = '_blank'; a.rel = 'noopener';
  a.href = full || '#'; a.textContent = 'Lihat';
  a.title = 'Pratinjau tidak tersedia — berkas lama belum dibuka aksesnya. ' +
    'Admin: jalankan menu spreadsheet "Perbaiki Akses Foto Lama".';
  wrap.parentNode.replaceChild(a, wrap);
}

/** Audit V7.2 — gambar gagal dimuat → ganti IKON aplikasi (bukan ikon rusak
    bawaan browser). Dipakai kartu katalog ATK, tabel stok, foto profil, dsb.
    Penyebab umum: berkas Drive lama belum publik (menu spreadsheet
    "Perbaiki Akses Foto Lama" memperbaikinya permanen). */
function imgGagalIkon(img, icon) {
  var wrap = img.parentNode; if (!wrap) { img.style.display = 'none'; return; }
  wrap.innerHTML = '<svg data-icon="' + (icon || 'box') + '"></svg>';
  if (typeof renderIcons === 'function') renderIcons(wrap);
}

/* ── TEROWONGAN FOTO (Audit V7.2) ─────────────────────────────────────────
   Jaringan kantor yang memblokir/mencegat drive.google.com (browser menolak:
   ERR_CERT_AUTHORITY_INVALID) membuat SEMUA thumbnail Drive gagal walau
   berkasnya publik. Saat <img> gagal, helper ini meminta gambar lewat aksi
   backend getFotoDataUrl — server mengambil berkas via jalur internal Google
   lalu mengirim data-URI melalui kanal aplikasi yang jelas bisa diakses.
   Antrean maks 2 permintaan paralel + cache per-sesi agar hemat kuota;
   backend juga men-cache 6 jam. Gagal total → fallback semula. */
var FotoTunnel = {
  cache: {},        // "id_w" -> dataUrl | 'GAGAL'
  antre: [],        // { key, id, w, imgs: [] }
  aktif: 0,
  MAX_PARALEL: 2,
  idDari: function (src) {
    var m = String(src || '').match(/[a-zA-Z0-9_-]{20,}/);
    return m ? m[0] : '';
  },
  coba: function (img, fallback) {
    img.onerror = null;                              // cegah loop error
    if (typeof fallback === 'function') { img._fbFn = fallback; fallback = 'fn'; }
    fallback = fallback || 'ikon';
    var id = FotoTunnel.idDari(img.getAttribute('src'));
    var bolehTunnel = id && window.API && window.Auth && Auth.user &&
      /drive\.google\.com|googleusercontent\.com/i.test(String(img.getAttribute('src') || ''));
    if (!bolehTunnel) return FotoTunnel.gagal(img, fallback);
    var w = parseInt(img.getAttribute('data-tw'), 10) || 300;
    var key = id + '_' + w;
    var c = FotoTunnel.cache[key];
    if (c === 'GAGAL') return FotoTunnel.gagal(img, fallback);
    if (c) { img.src = c; return; }
    img.setAttribute('data-fb', fallback);
    for (var i = 0; i < FotoTunnel.antre.length; i++) {
      if (FotoTunnel.antre[i].key === key) { FotoTunnel.antre[i].imgs.push(img); return; }
    }
    FotoTunnel.antre.push({ key: key, id: id, w: w, imgs: [img] });
    FotoTunnel.proses();
  },
  proses: function () {
    if (FotoTunnel.aktif >= FotoTunnel.MAX_PARALEL) return;
    var job = FotoTunnel.antre.shift();
    if (!job) return;
    FotoTunnel.aktif++;
    API.call('getFotoDataUrl', { id: job.id, w: job.w }).then(function (r) {
      FotoTunnel.aktif--;
      var ok = !!(r && r.success && r.data);
      FotoTunnel.cache[job.key] = ok ? r.data : 'GAGAL';
      job.imgs.forEach(function (im) {
        if (!im || !im.parentNode) return;           // elemen sudah dirender ulang
        if (ok) im.src = r.data;
        else FotoTunnel.gagal(im, im.getAttribute('data-fb'));
      });
      FotoTunnel.proses();
    });
  },
  gagal: function (img, fallback) {
    if (fallback === 'fn' && typeof img._fbFn === 'function') { return img._fbFn(img); }
    if (fallback === 'sembunyi') { img.style.display = 'none'; return; }
    if (fallback === 'link')     { return fotoThumbGagal(img); }
    if (fallback === 'inisial') {
      var p = img.parentNode;
      if (p) { p.classList.add('avatar-inisial'); p.textContent = img.getAttribute('data-inisial') || '?'; }
      else img.style.display = 'none';
      return;
    }
    imgGagalIkon(img);
  }
};
/** Pintu satu baris untuk atribut onerror — aman dari error apa pun. */
function fotoTunnelCoba(img, fallback) {
  try { FotoTunnel.coba(img, fallback); }
  catch (e) { try { imgGagalIkon(img); } catch (e2) { img.style.display = 'none'; } }
}

/** Avatar bulat kecil untuk tabel: foto asli bila ada, inisial bila tidak. */
function avatarHtml(fotoUrl, nama, size) {
  size = size || 34;
  var src = driveImgSrc(fotoUrl, 120);
  var inisial = String(nama || '?').trim().split(/\s+/).slice(0, 2)
    .map(function (x) { return x.charAt(0).toUpperCase(); }).join('') || '?';
  if (src) {
    return '<span class="avatar-foto" style="width:' + size + 'px;height:' + size + 'px">' +
      '<img loading="lazy" alt="" src="' + escapeHtml(src) + '"' +
      ' data-tw="120" data-inisial="' + escapeHtml(inisial) + '"' +
      ' onerror="fotoTunnelCoba(this,\'inisial\')"></span>';
  }
  return '<span class="avatar-foto avatar-inisial" style="width:' + size + 'px;height:' + size + 'px">' +
    escapeHtml(inisial) + '</span>';
}

/* ── PAPAN KETERSEDIAAN PIMPINAN (V6.10) — helper global ──────────────────
   Dipakai Dashboard (pengumuman semua user) & halaman Agenda (dengan kontrol
   set-manual utk kabag/admin). Data dari aksi getKetersediaanPimpinan. */
var KET_META = {
  di_kantor:   { cls: 'st-kantor',   label: 'Di Kantor' },
  kegiatan:    { cls: 'st-kegiatan', label: 'Rapat / Kegiatan' },
  dinas_luar:  { cls: 'st-luar',     label: 'Dinas Luar' },
  cuti:        { cls: 'st-cuti',     label: 'Cuti / Izin' },
  tidak_hadir: { cls: 'st-absen',    label: 'Tidak di Kantor' }
};
function ketStatusMeta(status) {
  return KET_META[status] || { cls: 'st-kantor', label: status || '—' };
}

/** Ringkasan satu baris: "3 di kantor · 1 dinas luar · 1 cuti" */
function ketRingkasTeks(ringkas) {
  if (!ringkas) return '';
  var urut = ['di_kantor', 'kegiatan', 'dinas_luar', 'cuti', 'tidak_hadir'];
  return urut.filter(function (k) { return ringkas[k] > 0; })
    .map(function (k) { return ringkas[k] + ' ' + ketStatusMeta(k).label.toLowerCase(); })
    .join(' · ');
}

/**
 * Render papan ketersediaan ke elemen.
 * @param {Element} el
 * @param {Array} rows hasil getKetersediaanPimpinan().data
 * @param {Object} opts {kontrol:boolean} — true = tampilkan select set-manual
 */
function renderKetersediaanBoard(el, rows, opts) {
  opts = opts || {};
  if (!el) return;
  if (!rows || !rows.length) {
    el.innerHTML = emptyBoxHtml('users',
      'Belum ada master pimpinan — admin dapat menambahkannya lewat "Kelola Pimpinan" di halaman Agenda.');
    renderIcons(el);
    return;
  }
  el.innerHTML = '<div class="ket-grid">' + rows.map(function (p) {
    var m = ketStatusMeta(p.status);
    var subLabel = p.catatan ? '' : (p.agenda_sekarang ? 'Sedang: ' : (p.agenda_berikut ? 'Berikutnya: ' : ''));
    var sub = p.catatan || p.agenda_sekarang || p.agenda_berikut || '';
    var kontrol = '';
    if (opts.kontrol) {
      kontrol = '<div class="ket-kontrol">' +
        '<select class="ket-set" data-ketset="' + escapeHtml(p.id) + '" title="Set status manual (berlaku hari ini)">' +
          '<option value="">Otomatis — ikuti agenda</option>' +
          Object.keys(KET_META).map(function (st) {
            return '<option value="' + st + '"' +
              (p.sumber === 'manual' && p.status === st ? ' selected' : '') + '>' +
              KET_META[st].label + '</option>';
          }).join('') +
        '</select>' +
        '<input type="text" class="ket-note-input' + (p.sumber === 'manual' ? '' : ' hidden') + '"' +
          ' data-ketnote="' + escapeHtml(p.id) + '" maxlength="120"' +
          ' placeholder="Catatan — mis. Dinas ke Kanwil s.d. 15.00"' +
          ' value="' + escapeHtml(p.catatan || '') + '">' +
        '</div>';
    }
    return '<div class="ket-card">' +
      avatarHtml(p.foto_thumb || p.foto, p.nama, 44) +
      '<div class="ket-info">' +
        '<div class="ket-nama">' + escapeHtml(p.nama) + '</div>' +
        (p.jabatan ? '<div class="ket-jab">' + escapeHtml(p.jabatan) + '</div>' : '') +
        '<span class="ket-status ' + m.cls + '"><span class="dot"></span>' + escapeHtml(m.label) +
          (p.sumber === 'manual' ? '<i title="Di-set manual, berlaku hari ini"> ✎</i>' : '') + '</span>' +
        (sub ? '<div class="ket-sub" title="' + escapeHtml(sub) + '">' + escapeHtml(subLabel + sub) + '</div>' : '') +
        kontrol +
      '</div></div>';
  }).join('') + '</div>';
}

/* Penampil foto — delegasi klik untuk semua .chip-foto di tabel/detail.
   Mendukung data-foto (data-URI lama) & data-foto-view/full (thumbnail Drive). */
document.addEventListener('click', function (e) {
  var t = e.target;
  while (t && t !== document && !(t.classList && t.classList.contains('chip-foto'))) t = t.parentNode;
  if (!t || t === document) return;
  var img = $('#fotoViewImg');
  var view = t.getAttribute('data-foto-view') || t.getAttribute('data-foto') || '';
  var full = t.getAttribute('data-foto-full') || '';
  var err = $('#fotoViewErr');
  if (err) err.classList.add('hidden');
  if (img) {
    img.style.display = '';
    img.onerror = function () {
      // Audit V7.2: coba terowongan foto dulu (jaringan yang memblokir Drive);
      // gagal total → sembunyikan + tampilkan pesan seperti semula.
      img.setAttribute('data-tw', '800');
      fotoTunnelCoba(img, function () {
        img.style.display = 'none';
        if (err) err.classList.remove('hidden');
      });
    };
    img.src = view;
  }
  var link = $('#fotoViewLink');
  if (link) {
    if (/^https?:\/\//i.test(full)) { link.href = full; link.classList.remove('hidden'); }
    else link.classList.add('hidden');
  }
  Modal.open('modalFoto');
});

/* Chip peringatan kanal pada panel notifikasi → admin langsung menuju
   halaman Pengaturan untuk memperbaikinya (bukan sekadar tulisan). */
document.addEventListener('click', function (e) {
  var t = e.target;
  while (t && t !== document && !(t.classList && t.classList.contains('np-goset'))) t = t.parentNode;
  if (!t || t === document) return;
  e.preventDefault();
  if (!isAdmin2()) { Toast.info('Minta admin melengkapi ini di halaman Pengaturan'); return; }
  Modal.closeAll();
  Router.go('pengaturan');
});

/* Apakah baris pengajuan milik user yang sedang login? */
function isOwn(row) {
  var me = (Auth.user && (Auth.user.nama || Auth.user.username)) || '';
  return String(row.pemohon) === String(me);
}

/* ── Modal detail generik (dipakai semua modul) ── */
var DetailView = {
  /** pairs: [label, value] atau [label, html, {html:true}] */
  show: function (title, pairs) {
    $('#dtTitle').textContent = title || 'Detail';
    var html = '<dl class="detail-list">';
    pairs.forEach(function (p) {
      if (!p) return;
      var val = p[1];
      var isHtml = p[2] && p[2].html;
      if (val === undefined || val === null || String(val) === '') val = '—';
      html += '<dt>' + escapeHtml(p[0]) + '</dt><dd>' + (isHtml ? val : escapeHtml(val)) + '</dd>';
    });
    html += '</dl>';
    $('#dtBody').innerHTML = html;
    Modal.open('modalDetail');
  }
};

function statCardHtml(c) {
  return '<div class="stat-card ' + (c.cls || 'stat-teal') + '">' +
    '<div class="stat-icon">' + iconSvg(c.icon) + '</div>' +
    '<div class="stat-value">' + (c.val || 0) + '</div>' +
    '<div class="stat-label">' + escapeHtml(c.label) + '</div></div>';
}

function emptyRow(colspan, icon, title, text) {
  return '<tr><td colspan="' + colspan + '"><div class="empty-state">' +
    '<div class="empty-icon">' + iconSvg(icon) + '</div>' +
    '<div class="empty-title">' + escapeHtml(title) + '</div>' +
    (text ? '<div class="empty-text">' + escapeHtml(text) + '</div>' : '') +
    '</div></td></tr>';
}

function emptyBoxHtml(icon, text) {
  return '<div class="empty-state" style="padding:26px 12px">' +
    '<div class="empty-icon">' + iconSvg(icon) + '</div>' +
    '<div class="empty-text">' + escapeHtml(text) + '</div></div>';
}

function onlyActive(x) {
  var s = String(x.status == null ? 'active' : x.status).toLowerCase();
  return s === '' || s === 'active' || s === 'aktif' || s === 'tersedia' || s === 'available';
}

/* Master data (kendaraan, driver, ruangan) — dimuat sekali, dipakai ulang */
var MasterData = {
  kendaraan: [], drivers: [], ruangan: [], loaded: false,
  /** Terima daftar master dari bundel modul (V6.6) — tanpa panggilan tambahan.
   *  loaded hanya ditandai bila KETIGA daftar sukses, agar ensure() tetap
   *  bisa melengkapi yang kurang bila salah satu bagian bundel gagal. */
  absorb: function (m) {
    if (!m) return;
    if (m.kendaraan && m.kendaraan.success) MasterData.kendaraan = m.kendaraan.data || [];
    if (m.drivers && m.drivers.success) MasterData.drivers = m.drivers.data || [];
    if (m.ruangan && m.ruangan.success) MasterData.ruangan = m.ruangan.data || [];
    if (m.kendaraan && m.kendaraan.success &&
        m.drivers && m.drivers.success &&
        m.ruangan && m.ruangan.success) {
      MasterData.loaded = true;
    }
  },
  ensure: function (cb) {
    if (MasterData.loaded) { if (cb) cb(); return; }
    var pending = 3;
    var done = function () { pending--; if (pending === 0) { MasterData.loaded = true; if (cb) cb(); } };
    API.call('getKendaraanList').then(function (r) { if (r.success) MasterData.kendaraan = r.data || []; done(); });
    API.call('getDriversList').then(function (r) { if (r.success) MasterData.drivers = r.data || []; done(); });
    API.call('getRuanganList').then(function (r) { if (r.success) MasterData.ruangan = r.data || []; done(); });
  }
};

function fillSelect(sel, items, placeholder, labelFn, valueKey) {
  if (!sel) return;
  var opts = '<option value="">' + escapeHtml(placeholder || '— Pilih —') + '</option>';
  items.forEach(function (it) {
    opts += '<option value="' + escapeHtml(it[valueKey || 'id']) + '">' + escapeHtml(labelFn(it)) + '</option>';
  });
  sel.innerHTML = opts;
}

/* Tab generik: aktifkan container .tabs + panel [data-tab-panel] dalam scope */
function initTabs(containerSel, scopeSel) {
  var cont = $(containerSel);
  if (!cont) return;
  var scope = scopeSel ? $(scopeSel) : cont.parentNode;
  $all('.tab', cont).forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-tab');
      $all('.tab', cont).forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      $all('[data-tab-panel]', scope).forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-tab-panel') === name);
      });
      /* V7.10: track tab kini dapat digulir (terutama HP) — tab yang dipilih
         otomatis DITENGAHKAN agar tab tetangga ikut terlihat (isyarat bahwa
         masih ada tab lain). block:'nearest' menjaga halaman tidak ikut
         tergulir vertikal; preferensi gerak minim dihormati. */
      try {
        if (cont.scrollWidth > cont.clientWidth + 4 && tab.scrollIntoView) {
          var halus = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
          tab.scrollIntoView({ behavior: halus ? 'smooth' : 'auto', inline: 'center', block: 'nearest' });
        }
      } catch (e) { /* hiasan — jangan ganggu pindah tab */ }
    });
  });
}

/* Kompres gambar sebelum kirim (foto kamera bisa besar) → dataURL JPEG */
function compressImage(file, maxDim, quality) {
  return new Promise(function (resolve) {
    if (!file) { resolve(''); return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        var scale = Math.min(1, (maxDim || 1280) / Math.max(w, h));
        var cw = Math.round(w * scale), ch = Math.round(h * scale);
        var canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
        try { resolve(canvas.toDataURL('image/jpeg', quality || 0.8)); }
        catch (err) { resolve(e.target.result); }
      };
      img.onerror = function () { resolve(e.target.result); };
      img.src = e.target.result;
    };
    reader.onerror = function () { resolve(''); };
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   PANEL NOTIFIKASI KEPUTUSAN — satu komponen untuk modal Setujui & Tolak.
   Menjawab "notifikasi terkirim ke mana?": panel menampilkan penerima + kanal
   SEBELUM tombol ditekan, memberi kendali kirim/tidak per tujuan, kolom pesan
   tambahan (menggantikan tombol Pesan terpisah), dan pratinjau isi pesan yang
   PERSIS sama dengan yang disusun backend. Hasil kirim dilaporkan balik.
   ══════════════════════════════════════════════════════════════════════════ */

/* Format tanggal klien == backend fmtTgl ("7 Jul 2026") agar pratinjau identik */
function fmtTglID(v) {
  if (!v) return '-';
  var m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(v);
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return parseInt(m[3], 10) + ' ' + BLN[parseInt(m[2], 10) - 1] + ' ' + m[1];
}
function namaSaya() { return (Auth.user && (Auth.user.nama || Auth.user.username)) || 'Approver'; }

var NotifPanel = {
  _s: {},   // slotId → { opts, info }

  /** Pasang panel ke slot.
   *  opts: { grup:'driver'|null, grupLabel, info|null, preview:fn(pesanTambahan)→teks,
   *          watch:[el…] (elemen modal yang mengubah isi pesan),
   *          submitTextSel, submitBase ('Setujui'/'Tolak') } */
  mount: function (slotId, opts) {
    var slot = $('#' + slotId);
    if (!slot) return;
    NotifPanel._s[slotId] = { opts: opts || {}, info: (opts && opts.info) || null };
    NotifPanel._render(slotId);
    (opts && opts.watch || []).forEach(function (el) {
      if (!el) return;
      ['input', 'change'].forEach(function (ev) {
        el.addEventListener(ev, function () { NotifPanel._refreshPreview(slotId); });
      });
    });
  },

  /** Isi/tukar info kanal (dipakai saat data datang menyusul, mis. modal Tolak) */
  setInfo: function (slotId, info) {
    var st = NotifPanel._s[slotId];
    if (!st) return;
    st.info = info || null;
    NotifPanel._render(slotId);
  },

  /** Ambil pilihan approver → dikirim sebagai data.notif */
  collect: function (slotId) {
    var slot = $('#' + slotId);
    var chkP = slot && slot.querySelector('[data-np="pemohon"]');
    var chkG = slot && slot.querySelector('[data-np="grup"]');
    var txt = slot && slot.querySelector('.np-pesan');
    return {
      pemohon: chkP ? chkP.checked : true,
      grup: chkG ? chkG.checked : false,
      pesan: txt ? txt.value.trim() : ''
    };
  },

  /** Label tombol submit sesuai pilihan saat ini */
  label: function (slotId) {
    var st = NotifPanel._s[slotId];
    var base = (st && st.opts.submitBase) || 'Simpan';
    var k = NotifPanel.collect(slotId);
    return (k.pemohon || k.grup) ? base + ' & Kirim' : base + ' (tanpa notifikasi)';
  },

  _chipKanal: function (info) {
    if (!info) return '<span class="np-chip mut">memeriksa kanal…</span>';
    if (info.telegram && info.token_ada) {
      return '<span class="np-chip ok">Telegram terhubung</span>' +
        (info.email ? '<span class="np-chip mut">cadangan: ' + escapeHtml(info.email) + '</span>' : '');
    }
    if (info.telegram && !info.token_ada) {
      return '<span class="np-chip warn">Telegram tertaut, Bot Token belum diisi</span>' +
        (info.email ? '<span class="np-chip em">akan via email: ' + escapeHtml(info.email) + '</span>' : '');
    }
    if (info.email) return '<span class="np-chip em">via email: ' + escapeHtml(info.email) + '</span>';
    return '<span class="np-chip warn">belum ada kanal — hanya tercatat di Log Notifikasi</span>';
  },

  _render: function (slotId) {
    var st = NotifPanel._s[slotId];
    var slot = $('#' + slotId);
    if (!st || !slot) return;
    var o = st.opts, info = st.info;
    var auto = !info || info.auto_aktif !== false;      // centang bawaan ikut Pengaturan
    var grupSiap = !!(info && info.grup_driver && info.token_ada);
    var pemohonNama = (info && info.pemohon) || o.pemohon || '';

    var html =
      '<div class="notif-panel">' +
        '<div class="np-head">' + iconSvg('bell') + '<span>Notifikasi keputusan ini</span>' +
          '<span class="np-count" data-np-count></span></div>' +
        '<label class="np-row">' +
          '<input type="checkbox" class="np-chk" data-np="pemohon"' + (auto ? ' checked' : '') + '>' +
          '<span class="np-main"><span class="np-who">Pemohon' + (pemohonNama ? ': <b>' + escapeHtml(pemohonNama) + '</b>' : '') + '</span>' +
          NotifPanel._chipKanal(info) + '</span>' +
        '</label>' +
        (o.grup
          ? '<label class="np-row' + (grupSiap ? '' : ' is-off') + '">' +
              '<input type="checkbox" class="np-chk" data-np="grup"' +
                (grupSiap ? (auto ? ' checked' : '') : ' disabled') + '>' +
              '<span class="np-main"><span class="np-who">' + escapeHtml(o.grupLabel || ('Grup ' + o.grup)) + '</span>' +
              (info
                ? (grupSiap ? '<span class="np-chip ok">terhubung</span>'
                            : '<button type="button" class="np-chip warn np-goset" title="Buka halaman Pengaturan (admin)">' +
                              (info.token_ada ? 'Chat ID belum diatur' : 'Bot Token belum diisi') + ' \u2192 Pengaturan</button>')
                : '<span class="np-chip mut">memeriksa…</span>') +
              '</span>' +
            '</label>'
          : '') +
        '<div class="np-field">' +
          '<textarea class="np-pesan" rows="2" placeholder="Pesan tambahan untuk pemohon (opsional) — ikut terkirim di notifikasi ini"></textarea>' +
        '</div>' +
        '<details class="np-preview"><summary>' + iconSvg('eye') + ' Lihat isi pesan yang akan terkirim</summary>' +
          '<pre class="np-prev-text"></pre></details>' +
      '</div>';
    slot.innerHTML = html;

    var sync = function () { NotifPanel._refreshPreview(slotId); NotifPanel._syncLabel(slotId); };
    $all('.np-chk', slot).forEach(function (c) { c.addEventListener('change', sync); });
    slot.querySelector('.np-pesan').addEventListener('input', function () { NotifPanel._refreshPreview(slotId); });
    slot.querySelector('.np-preview').addEventListener('toggle', function () { NotifPanel._refreshPreview(slotId); });
    sync();
  },

  _refreshPreview: function (slotId) {
    var st = NotifPanel._s[slotId];
    var slot = $('#' + slotId);
    if (!st || !slot) return;
    // hitung jumlah tujuan aktif
    var k = NotifPanel.collect(slotId);
    var n = (k.pemohon ? 1 : 0) + (k.grup ? 1 : 0);
    var cnt = slot.querySelector('[data-np-count]');
    if (cnt) cnt.textContent = n ? n + ' tujuan aktif' : 'tidak ada yang dikirim';
    // pratinjau isi
    var pre = slot.querySelector('.np-prev-text');
    if (pre && st.opts.preview) {
      var extra = k.pesan ? '\n\nPesan dari ' + namaSaya() + ':\n' + k.pesan : '';
      pre.textContent = st.opts.preview(k.pesan) + extra +
        '\n\n' + '—' + ' GESIT · BPJS Kesehatan KC Bengkulu';
    }
    NotifPanel._syncLabel(slotId);
  },

  _syncLabel: function (slotId) {
    var st = NotifPanel._s[slotId];
    if (!st || !st.opts.submitTextSel) return;
    var el = $(st.opts.submitTextSel);
    if (el && !el.closest('button').disabled) el.textContent = NotifPanel.label(slotId);
  }
};

/* Penolakan pengajuan — modal alasan + panel notifikasi (bersama semua modul) */
var Reject = (function () {
  var onDone = null;
  var ctx = null;   // baris pengajuan dari Pusat Persetujuan (pemohon, tanggal, info…)
  var ACTION = { kendaraan: 'rejectBookingKendaraan', ruangan: 'rejectBookingRuangan', atk: 'rejectATKPermintaan' };

  /* Pratinjau DITOLAK — cermin persis template backend per tipe */
  function previewTolak() {
    if (!ctx) return '';
    var me = namaSaya();
    var alasan = $('#rejAlasan').value.trim();
    var ekor = alasan ? '\n\nAlasan: ' + alasan : '';
    if (ctx.tipe === 'kendaraan') {
      return 'Pengajuan Kendaraan DITOLAK\n\nHalo ' + ctx.pemohon + ', pengajuan kendaraan Anda (' +
        fmtTglID(ctx.tanggal) + ', tujuan ' + ((ctx.info && ctx.info['Tujuan']) || '-') + ') DITOLAK oleh ' + me + '.' + ekor;
    }
    if (ctx.tipe === 'ruangan') {
      var nama = String(ctx.judul || '').replace('Ruangan → ', '');
      var jam = (ctx.info && ctx.info['Waktu']) || '';
      return 'Booking Ruangan DITOLAK\n\nHalo ' + ctx.pemohon + ', booking ruangan ' + nama + ' (' +
        fmtTglID(ctx.tanggal) + (jam ? ' ' + jam : '') + ') DITOLAK oleh ' + me + '.' + ekor;
    }
    return 'Permintaan ATK DITOLAK\n\nHalo ' + ctx.pemohon + ', permintaan ATK Anda tanggal ' +
      fmtTglID(ctx.tanggal) + ' DITOLAK oleh ' + me + '.' + ekor;
  }

  function init() {
    $('#rejSubmit').addEventListener('click', function () {
      var id = $('#rejId').value, tipe = $('#rejTipe').value;
      var action = ACTION[tipe];
      if (!action) { Modal.close('modalReject'); return; }
      var btn = $('#rejSubmit'), txt = $('#rejSubmitText');
      btnLoading(btn, txt, true);
      API.call(action, {
        id: id,
        alasan: $('#rejAlasan').value.trim(),
        notif: NotifPanel.collect('rejNotif')
      }).then(function (res) {
        btnLoading(btn, txt, false, NotifPanel.label('rejNotif'));
        if (res.success) {
          Modal.close('modalReject');
          Toast.success(res.message || 'Pengajuan ditolak',
            (res.notif && res.notif.ringkas) || '');
          if (window.ApprovalModule && ApprovalModule.remove) ApprovalModule.remove(id); // V7.5
          notifTundaFlush(res);                                                          // V7.5
          if (onDone) onDone();
        } else Toast.error(res.error || 'Gagal menolak');
      });
    });
  }

  /** ask(tipe, id, info, cb, row) — row = item Pusat Persetujuan (untuk panel notif) */
  function ask(tipe, id, info, cb, row) {
    $('#rejId').value = id; $('#rejTipe').value = tipe;
    $('#rejAlasan').value = '';
    $('#rejInfo').textContent = info || 'Berikan alasan penolakan.';
    onDone = cb;
    ctx = row ? Object.assign({ tipe: tipe }, row) : null;

    NotifPanel.mount('rejNotif', {
      grup: null,
      pemohon: ctx ? ctx.pemohon : '',
      info: null,                       // kanal diperiksa menyusul di bawah
      preview: previewTolak,
      watch: [$('#rejAlasan')],
      submitTextSel: '#rejSubmitText',
      submitBase: 'Tolak'
    });
    if (ctx && ctx.pemohon) {
      API.call('getNotifTarget', { pemohon: ctx.pemohon }).then(function (r) {
        if (r.success) NotifPanel.setInfo('rejNotif', r.data);
      });
    }
    Modal.open('modalReject');
  }
  return { init: init, ask: ask };
})();


/* ══════════════════════════════════════════════════════════════════════════
   HELPER BERSAMA FASE 4 — tautan publik, kirim pesan, pengaturan, kalender, CSV
   ══════════════════════════════════════════════════════════════════════════ */

/** Info aplikasi (URL web app) — dimuat sekali setelah login */
var AppInfo = {
  url: '',
  halaman: null, // V6.8: status buka/tutup tiap halaman publik (dari getAppInfo)
  load: function () {
    API.call('getAppInfo').then(function (r) {
      if (r.success && r.data) {
        AppInfo.url = r.data.url || '';
        AppInfo.halaman = r.data.halaman || null;
      }
    }).catch(function () { /* abaikan */ });
  },
  publicUrl: function (page) {
    if (!AppInfo.url) return '';
    return AppInfo.url + (AppInfo.url.indexOf('?') === -1 ? '?' : '&') + 'page=' + page;
  }
};

/** Salin teks ke clipboard dengan fallback lama */
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return copyTextFallback(text); });
  }
  return Promise.resolve(copyTextFallback(text));
}
function copyTextFallback(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

/** V7.11 — Unduh EXCEL BERGAYA (.xls berbasis HTML yang dibaca Excel dengan
 *  format utuh): kop merek GESIT, judul & periode, kartu ringkasan, tabel
 *  berkepala teal dengan baris selang-seling, kolom angka rata kanan otomatis.
 *  Catatan: Excel mungkin menampilkan konfirmasi format saat membuka — klik
 *  Yes/Ya; ini perilaku normal file .xls berbasis HTML. CSV polos tetap
 *  tersedia untuk kebutuhan olah data mentah. */
function downloadExcel(filename, opsi, header, rows) {
  opsi = opsi || {};
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  // Kolom angka murni (≥70% sel terisi) → rata kanan, format teks utk sisanya
  var numerik = header.map(function (_, ci) {
    var isi = 0, angka = 0;
    rows.forEach(function (r) {
      var v = String(r[ci] == null ? '' : r[ci]).trim();
      if (!v) return;
      isi++;
      if (/^-?[\d.,]+$/.test(v)) angka++;
    });
    return isi > 0 && angka / isi >= 0.7;
  });
  var kini = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  var ring = (opsi.ringkasan || []).map(function (x) {
    return '<td style="border:1px solid #99f6e4;background:#f0fdfa;padding:6px 12px">' +
      '<b style="color:#0f766e;font-size:14px">' + esc(x.val) + '</b>' +
      ' <span style="color:#64748b;font-size:10px">' + esc(x.label) + '</span></td>';
  }).join('');
  var kepala = header.map(function (h) {
    return '<th style="background:#0d9488;color:#ffffff;border:1px solid #0f766e;padding:6px 8px;' +
      'font-size:10px;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap">' +
      esc(String(h).replace(/_/g, ' ')) + '</th>';
  }).join('');
  var badan = rows.map(function (r, ri) {
    return '<tr>' + r.map(function (c, ci) {
      return '<td style="border:1px solid #cbd5e1;padding:4px 8px;font-size:11px;' +
        (ri % 2 ? 'background:#f0fdfa;' : 'background:#ffffff;') +
        (numerik[ci] ? 'text-align:right;' : 'mso-number-format:\'\\@\';') + // teks: NIM/HP tidak dipangkas Excel
        'vertical-align:top">' + esc(c) + '</td>';
    }).join('') + '</tr>';
  }).join('');
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
    '<x:Name>' + esc((opsi.judul || 'Laporan').substring(0, 28)) + '</x:Name>' +
    '<x:WorksheetOptions><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal>' +
    '<x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane>' +
    '</x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>' +
    '<table style="border-collapse:collapse">' +
    '<tr><td colspan="' + header.length + '" style="font-size:17px;font-weight:800;color:#0f766e;letter-spacing:1px;padding:2px 0">GESIT</td></tr>' +
    '<tr><td colspan="' + header.length + '" style="font-size:10px;color:#64748b;padding-bottom:6px">' +
      'Gerbang Elektronik Sistem Informasi Terpadu — BPJS Kesehatan KC Bengkulu</td></tr>' +
    '<tr><td colspan="' + header.length + '" style="font-size:13px;font-weight:700;color:#0f172a">' + esc(opsi.judul || 'Laporan') + '</td></tr>' +
    (opsi.sub ? '<tr><td colspan="' + header.length + '" style="font-size:11px;color:#475569">' + esc(opsi.sub) + '</td></tr>' : '') +
    '<tr><td colspan="' + header.length + '" style="font-size:10px;color:#94a3b8;padding-bottom:8px">Dihasilkan otomatis · ' + esc(kini) + '</td></tr>' +
    (ring ? '<tr>' + ring + '</tr><tr><td colspan="' + header.length + '" style="padding:3px 0"></td></tr>' : '') +
    '</table>' +
    '<table style="border-collapse:collapse"><thead><tr>' + kepala + '</tr></thead><tbody>' + badan + '</tbody></table>' +
    '</body></html>';
  var blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
}

/** Unduh CSV (BOM agar Excel membaca UTF-8 dengan benar) */
function downloadCSV(filename, header, rows) {
  function cell(v) {
    v = String(v == null ? '' : v);
    if (/[",;\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  var lines = [header.map(cell).join(';')];
  rows.forEach(function (r) { lines.push(r.map(cell).join(';')); });
  var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
}

function thisMonthISO() { return todayISO().substring(0, 7); }

function isStatusAktifJs(status) {
  var s = String(status == null ? 'active' : status).toLowerCase();
  return s === '' || s === 'active' || s === 'aktif';
}

var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/**
 * Render kalender bulanan generik ke sebuah container.
 * opts: { el, bulan:'YYYY-MM', days:{tgl:[{nama,jam,warna,sub,lokasi}]}, onNav(bulanBaru), onDayClick(tgl, items) }
 */
function renderMonthCalendar(opts) {
  var el = typeof opts.el === 'string' ? $(opts.el) : opts.el;
  if (!el) return;
  var parts = opts.bulan.split('-');
  var tahun = parseInt(parts[0], 10), bln = parseInt(parts[1], 10);
  var jumlahHari = new Date(tahun, bln, 0).getDate();
  var firstDow = new Date(tahun, bln - 1, 1).getDay(); // 0=Min
  var offset = (firstDow + 6) % 7; // mulai Senin
  var hariIni = todayISO();
  var days = opts.days || {};

  var html = '<div class="cal-head">' +
    '<div class="cal-title">' + NAMA_BULAN[bln - 1] + ' ' + tahun + '</div>' +
    '<div style="display:flex;gap:7px">' +
      '<button class="btn btn-outline btn-sm" data-calnav="-1">‹ Sebelumnya</button>' +
      '<button class="btn btn-outline btn-sm" data-calnav="0">Bulan Ini</button>' +
      '<button class="btn btn-outline btn-sm" data-calnav="1">Berikutnya ›</button>' +
    '</div></div>';
  html += '<div class="cal-grid">';
  ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].forEach(function (d) {
    html += '<div class="cal-dow">' + d + '</div>';
  });
  for (var i = 0; i < offset; i++) html += '<div class="cal-cell is-out"></div>';
  for (var d = 1; d <= jumlahHari; d++) {
    var tgl = opts.bulan + '-' + (d < 10 ? '0' + d : d);
    var items = days[tgl] || [];
    html += '<div class="cal-cell' + (tgl === hariIni ? ' is-today' : '') + '" data-caldate="' + tgl + '">' +
      '<div class="cal-date">' + d + '</div>';
    items.slice(0, 3).forEach(function (ev) {
      var cls = ev.warna && ev.warna !== 'teal' ? ' ev-' + escapeHtml(ev.warna) : '';
      html += '<div class="cal-ev' + cls + '" title="' + escapeHtml((ev.jam ? ev.jam + ' · ' : '') + ev.nama + (ev.lokasi ? ' @ ' + ev.lokasi : '')) + '">' +
        (ev.jam ? '<b>' + escapeHtml(ev.jam) + '</b> ' : '') + escapeHtml(ev.nama) + '</div>';
    });
    if (items.length > 3) html += '<div class="cal-more">+' + (items.length - 3) + ' lainnya</div>';
    html += '</div>';
  }
  html += '</div>';
  el.innerHTML = html;

  $all('[data-calnav]', el).forEach(function (b) {
    b.addEventListener('click', function () {
      var step = parseInt(b.getAttribute('data-calnav'), 10);
      var baru;
      if (step === 0) baru = thisMonthISO();
      else {
        var m2 = bln - 1 + step, t2 = tahun;
        if (m2 < 0) { m2 = 11; t2--; }
        if (m2 > 11) { m2 = 0; t2++; }
        baru = t2 + '-' + (m2 + 1 < 10 ? '0' + (m2 + 1) : (m2 + 1));
      }
      if (opts.onNav) opts.onNav(baru);
    });
  });
  if (opts.onDayClick) {
    $all('[data-caldate]', el).forEach(function (c) {
      c.addEventListener('click', function () {
        var tgl = c.getAttribute('data-caldate');
        opts.onDayClick(tgl, days[tgl] || []);
      });
    });
  }
}

/* ── Tautan halaman publik (tombol [data-publink] di header modul) ── */
var PublicLink = {
  // per view: daftar halaman publik yang relevan
  // V6.7: 'antrian' & 'commandcenter' dihapus — halaman TV dipensiunkan,
  // digantikan notifikasi Telegram check-in tamu + tombol Teruskan di DIGITAMU.
  MAP: {
    dashboard: ['checkin', 'checkin-bbm', 'lamaran-magang', 'presensi-magang', 'checkin-tad'],
    digitamu:  ['checkin'],
    kendaraan: ['checkin-bbm'],
    magang:    ['lamaran-magang', 'presensi-magang'],
    tad:       ['checkin-tad']
  },
  LABEL: {
    'checkin':        { icon: 'users',   title: 'Check-in Tamu',        desc: 'Form registrasi mandiri tamu — tablet di meja resepsionis. Setiap check-in otomatis dikabarkan ke grup Telegram admin.' },
    'checkin-bbm':    { icon: 'droplet', title: 'Input BBM Driver',     desc: 'Form pengisian BBM oleh driver dari HP, tanpa login.' },
    'lamaran-magang': { icon: 'grad',    title: 'Lamaran Magang',       desc: 'Form lamaran magang publik + unggah CV — sebarkan ke calon peserta (tautan lama ?page=checkin-magang tetap berfungsi).' },
    'checkin-tad':    { icon: 'clock',   title: 'Presensi TAD',         desc: 'Halaman absen tenaga alih daya (security, driver, CS).' },
    'presensi-magang': { icon: 'clock',  title: 'Presensi Magang',      desc: 'Absen masuk/pulang peserta magang tanpa login (selfie + lokasi). Jalur utama tetap portal login — halaman ini cadangan bersaklar.' }
  },
  init: function () {
    $all('[data-publink]').forEach(function (b) {
      b.addEventListener('click', function () {
        PublicLink.open(b.getAttribute('data-publink'));
      });
    });
  },
  open: function (view) {
    var pages = PublicLink.MAP[view] || [];
    var box = $('#plList');
    if (!AppInfo.url) {
      box.innerHTML = '<div class="alert alert-warning">URL aplikasi belum terbaca — pastikan aplikasi diakses lewat tautan deployment (/exec), lalu muat ulang.</div>';
    } else {
      box.innerHTML = pages.map(function (p) {
        var meta = PublicLink.LABEL[p] || { icon: 'link', title: p, desc: '' };
        var url = AppInfo.publicUrl(p);
        // V6.8: lencana status — tautan mati tidak lagi dibagikan tanpa sadar
        var st = AppInfo.halaman ? AppInfo.halaman[p] : null;
        var lencana = '';
        var barisAlasan = '';
        if (st) {
          lencana = st.buka
            ? '<span class="lk-status is-on">Aktif</span>'
            : '<span class="lk-status is-off">Nonaktif</span>';
          if (!st.buka) {
            barisAlasan = '<div class="lk-off-note">Pengunjung melihat: &ldquo;' +
              escapeHtml(st.alasan || 'Halaman ini sedang dinonaktifkan sementara oleh admin.') +
              '&rdquo; lalu dialihkan ke GESIT.</div>';
          }
        }
        return '<div class="link-item' + (st && !st.buka ? ' is-off' : '') + '">' +
          '<div class="lk-title">' + iconSvg(meta.icon) + escapeHtml(meta.title) + lencana + '</div>' +
          '<div class="lk-desc">' + escapeHtml(meta.desc) + '</div>' +
          barisAlasan +
          '<div class="lk-row">' +
            '<input type="text" class="form-control" readonly value="' + escapeHtml(url) + '">' +
            '<button class="btn btn-outline btn-sm" data-plcopy="' + escapeHtml(url) + '">Salin</button>' +
            '<a class="btn btn-primary btn-sm" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Buka</a>' +
          '</div></div>';
      }).join('');
      // Jalan pintas kelola saklar — hanya utk role yang boleh membuka Pengaturan
      if (Router.canOpen('pengaturan')) {
        box.innerHTML += '<div class="lk-manage"><button class="btn btn-ghost btn-sm" id="plKelolaSaklar">' +
          iconSvg('settings', 'btn-icon') + ' Kelola saklar aktif/nonaktif halaman…</button></div>';
      }
    }
    Modal.open('modalPublicLink');
    var kelola = $('#plKelolaSaklar');
    if (kelola) {
      kelola.addEventListener('click', function () {
        Modal.close('modalPublicLink');
        Router.go('pengaturan');
        var tabHal = document.querySelector('#setTabs .tab[data-tab="halaman"]');
        if (tabHal) tabHal.click();
      });
    }
    $all('[data-plcopy]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        copyText(b.getAttribute('data-plcopy')).then(function (ok) {
          if (ok) { Toast.success('Tautan disalin'); } else { Toast.error('Gagal menyalin — salin manual dari kotak.'); }
        });
      });
    });
  }
};

/* ── Kirim Pesan manual (Telegram/Email) — kabag+ dari Pusat Persetujuan ── */
var KirimPesan = {
  subsLoaded: false,
  recipientsLoaded: false,
  recipients: [],
  /* Template pesan siap pakai — mempercepat komunikasi rutin */
  TEMPLATES: [
    { v: '', label: '— Tanpa template (tulis bebas) —', judul: '', pesan: '' },
    { v: 'lengkapi', label: 'Minta kelengkapan data pengajuan',
      judul: 'Mohon Lengkapi Data Pengajuan',
      pesan: 'Pengajuan Anda sudah kami terima, namun ada data yang perlu dilengkapi:\n- (tuliskan yang kurang)\n\nMohon segera diperbarui agar dapat kami proses. Terima kasih.' },
    { v: 'panggil', label: 'Panggilan menghadap',
      judul: 'Mohon Menghadap',
      pesan: 'Mohon kesediaannya untuk menghadap ke ruang (sebutkan ruangan) pada (hari/jam) terkait (perihal). Terima kasih.' },
    { v: 'ambil', label: 'Barang/dokumen siap diambil',
      judul: 'Siap Diambil',
      pesan: 'Barang/dokumen yang Anda ajukan sudah siap. Silakan diambil di (lokasi) pada jam kerja. Terima kasih.' },
    { v: 'jadwal', label: 'Pengingat jadwal/penugasan',
      judul: 'Pengingat Jadwal',
      pesan: 'Mengingatkan jadwal/penugasan Anda pada (hari, tanggal, jam) di (lokasi). Mohon hadir tepat waktu. Terima kasih.' },
    { v: 'umum', label: 'Pengumuman umum',
      judul: 'Pengumuman',
      pesan: 'Diberitahukan kepada seluruh rekan bahwa (isi pengumuman). Demikian disampaikan, terima kasih.' }
  ],
  init: function () {
    $('#kpTarget').addEventListener('change', KirimPesan.onTargetChange);
    $('#kpSubmit').addEventListener('click', KirimPesan.submit);
    var srch = $('#kpUserSearch');
    if (srch) srch.addEventListener('input', function () { KirimPesan.renderUserOptions(srch.value); });
    var tpl = $('#kpTemplate');
    if (tpl) {
      tpl.innerHTML = KirimPesan.TEMPLATES.map(function (t) {
        return '<option value="' + t.v + '">' + escapeHtml(t.label) + '</option>';
      }).join('');
      tpl.addEventListener('change', function () {
        var t = KirimPesan.TEMPLATES.find(function (x) { return x.v === tpl.value; });
        if (!t || !t.v) return;
        $('#kpJudul').value = t.judul;
        $('#kpPesan').value = t.pesan;
        KirimPesan.hitung();
        $('#kpPesan').focus();
      });
    }
    var ta = $('#kpPesan');
    if (ta) ta.addEventListener('input', KirimPesan.hitung);
  },
  hitung: function () {
    var c = $('#kpCount'); if (!c) return;
    var n = ($('#kpPesan').value || '').length;
    c.textContent = n + ' karakter';
    c.style.color = n > 3500 ? 'var(--danger, #dc2626)' : 'var(--slate-400, #94a3b8)';
  },
  /** ctx: { pemohon, ref_modul, ref_id, judul } */
  open: function (ctx) {
    ctx = ctx || {};
    $('#kpPemohon').value = ctx.pemohon || '';
    $('#kpRefModul').value = ctx.ref_modul || '';
    $('#kpRefId').value = ctx.ref_id || '';
    $('#kpJudul').value = ctx.judul || '';
    $('#kpPesan').value = '';
    if ($('#kpTemplate')) $('#kpTemplate').value = '';
    KirimPesan.hitung();
    if ($('#kpUserSearch')) $('#kpUserSearch').value = '';
    var opsi = '';
    if (ctx.pemohon) opsi += '<option value="pemohon">Pemohon: ' + escapeHtml(ctx.pemohon) + '</option>';
    opsi += '<option value="user">Penerima terdaftar (dari database)…</option>' +
            '<option value="grup_admin">Grup Telegram Admin/Approver</option>' +
            '<option value="grup_driver">Grup Telegram Driver</option>' +
            '<option value="grup_security">Grup Telegram Security</option>' +
            '<option value="subscriber">Pengguna Telegram terdaftar…</option>' +
            '<option value="email">Alamat email…</option>';
    $('#kpTarget').innerHTML = opsi;
    KirimPesan.onTargetChange();
    Modal.open('modalKirimPesan');
  },
  onTargetChange: function () {
    var t = $('#kpTarget').value;
    $('#kpUserWrap').style.display = t === 'user' ? '' : 'none';
    $('#kpSubscriberWrap').style.display = t === 'subscriber' ? '' : 'none';
    $('#kpEmailWrap').style.display = t === 'email' ? '' : 'none';
    $('#kpTargetHint').textContent =
      t === 'pemohon' ? 'Dikirim ke Telegram pribadi pemohon; jika belum tertaut, otomatis dicoba ke email user.' :
      t === 'user' ? 'Penerima diambil dari data Users & Telegram. Sistem otomatis memilih Telegram lalu email.' :
      t.indexOf('grup_') === 0 ? 'Pastikan Chat ID grup sudah diisi di Pengaturan Aplikasi.' : '';
    if (t === 'user') KirimPesan.loadRecipients();
    if (t === 'subscriber' && !KirimPesan.subsLoaded) {
      API.call('getSubscribersList').then(function (r) {
        if (r.success) {
          KirimPesan.subsLoaded = true;
          $('#kpSubscriber').innerHTML = (r.data || []).map(function (s) {
            return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.nama) + (s.role ? ' · ' + escapeHtml(s.role) : '') + '</option>';
          }).join('') || '<option value="">(belum ada yang terhubung ke bot)</option>';
        }
      });
    }
  },
  loadRecipients: function () {
    if (KirimPesan.recipientsLoaded) { KirimPesan.renderUserOptions(''); return; }
    $('#kpUserHint').textContent = 'Memuat daftar penerima…';
    API.call('getRecipientsList').then(function (r) {
      KirimPesan.recipientsLoaded = true;
      KirimPesan.recipients = (r.success && r.data) ? r.data : [];
      KirimPesan.renderUserOptions('');
    });
  },
  renderUserOptions: function (filter) {
    var q = String(filter || '').toLowerCase().trim();
    var list = KirimPesan.recipients.filter(function (u) {
      return !q || (u.nama + ' ' + (u.role || '') + ' ' + (u.bagian || '')).toLowerCase().indexOf(q) !== -1;
    });
    var sel = $('#kpUser');
    sel.innerHTML = list.length
      ? list.map(function (u) {
          var kanal = (u.telegram ? ' Telegram' : '') + (u.email_ada ? ' Email' : '');
          var meta = [u.role, u.bagian].filter(Boolean).join(' · ');
          return '<option value="' + escapeHtml(u.nama) + '">' + escapeHtml(u.nama) +
            (meta ? ' — ' + escapeHtml(meta) : '') + kanal + '</option>';
        }).join('')
      : '<option value="">(tidak ada penerima cocok)</option>';
    $('#kpUserHint').textContent = list.length
      ? list.length + ' penerima · Telegram = terhubung Telegram, Email = punya email'
      : (KirimPesan.recipients.length ? 'Tidak ada yang cocok dengan pencarian.' : 'Belum ada user/subscriber di database.');
  },
  submit: function () {
    var pesan = $('#kpPesan').value.trim();
    if (!pesan) { Toast.warning('Isi pesan terlebih dahulu'); return; }
    var payload = {
      target: $('#kpTarget').value,
      pemohon: $('#kpPemohon').value,
      subscriber_id: $('#kpSubscriber').value,
      email: $('#kpEmail').value.trim(),
      judul: $('#kpJudul').value.trim(),
      pesan: pesan,
      ref_modul: $('#kpRefModul').value,
      ref_id: $('#kpRefId').value
    };
    // "Penerima dari database" memakai jalur backend 'pemohon' (Telegram→email) berdasarkan nama.
    if (payload.target === 'user') {
      var nama = $('#kpUser').value;
      if (!nama) { Toast.warning('Pilih penerima dari daftar terlebih dahulu'); return; }
      payload.target = 'pemohon';
      payload.pemohon = nama;
    }
    if (payload.target === 'email' && !payload.email) { Toast.warning('Isi alamat email tujuan'); return; }
    btnLoading($('#kpSubmit'), $('#kpSubmitText'), true);
    API.call('sendPesan', payload).then(function (r) {
      btnLoading($('#kpSubmit'), $('#kpSubmitText'), false, 'Kirim Pesan');
      if (r.success) { Toast.success(r.message || 'Pesan terkirim'); Modal.close('modalKirimPesan'); }
      else Toast.error('Gagal mengirim', r.error);
    });
  }
};

/* ── PENGATURAN APLIKASI — HALAMAN PENUH (admin) ──────────────────────────
   Dipindah dari modal ke view 'pengaturan'. Fitur: Telegram & bot (token
   tersamar + tes per grup), email (saklar + tes kirim), geofence presensi
   (isi otomatis dari GPS), hari libur tambahan (pratinjau format), registrasi,
   dokumen/surat, serta Diagnosa Komunikasi + Log Notifikasi.
   ID lama dipertahankan (setAktifkanBot, setCekBot, setBotStatus, payload)
   sehingga modul bot Fase 5 tetap bekerja tanpa perubahan. */
var SettingsApp = {
  _cache: null,   // peta pengaturan terakhir — halaman tampil instan
  _dimuat: false, // penanda data segar sudah tiba (kunci Simpan sebelum itu)

  init: function () {
    function on(sel, ev, fn) { var el = $(sel); if (el) el.addEventListener(ev, fn); }
    // Menu pengguna → langsung buka HALAMAN pengaturan
    on('#menuSettings', 'click', function () { UserMenu.close(); Router.go('pengaturan'); });

    on('#setSubmit', 'click', SettingsApp.submit);
    on('#setReloadBtn', 'click', function () { SettingsApp.load(true); });
    on('#setTesEmail', 'click', SettingsApp.tesEmail);
    on('#setDiagnosaBtn', 'click', SettingsApp.diagnosa);
    on('#setLogRefresh', 'click', SettingsApp.loadLog);
    on('#setLogFilter', 'change', SettingsApp.loadLog);
    // V7.7: tab Komunikasi Magang/TAD — broadcast pengumuman & log laporan/balasan.
    // Log dimuat malas (lazy) saat tab pertama kali dibuka, bukan setiap buka Pengaturan.
    on('#komKirimBtn', 'click', SettingsApp.komKirim);
    on('#komLogRefresh', 'click', function () { SettingsApp.komLoadLog(true); });
    on('#komLogJalur', 'change', function () { SettingsApp.komLoadLog(true); });
    var komTab = document.querySelector('#setTabs [data-tab="komunikasi"]');
    if (komTab) komTab.addEventListener('click', function () { SettingsApp.komLoadLog(false); });
    on('#setLokasiSaya', 'click', SettingsApp.lokasiSaya);
    on('#setTokenLihat', 'click', function () {
      var t = $('#setBotToken');
      t.type = t.type === 'password' ? 'text' : 'password';
      this.textContent = t.type === 'password' ? 'Lihat' : 'Tutup';
    });
    on('#setTokenHapus', 'click', SettingsApp.hapusToken);
    // V7.14: unggah aset branding (logo instansi & ttd Kepala Cabang) — langsung
    // tersimpan ke Drive + Settings begitu berkas dipilih.
    SettingsApp.ikatUnggahAset_('#setLogoFile', 'logo', '#setLogoPrev', '#setLogoPrevImg', '#setLogoUrl');
    SettingsApp.ikatUnggahAset_('#setTtdKacabFile', 'ttd_kacab', '#setTtdKacabPrev', '#setTtdKacabPrevImg', null);
    // V6.8: tab Halaman Publik — pratinjau tautan langsung dari sini
    on('#setHalLihatTautan', 'click', function () { PublicLink.open('dashboard'); });
    on('#setHariLibur', 'input', SettingsApp.previewLibur);
    ['#setPresensiLat', '#setPresensiLng'].forEach(function (sel) {
      on(sel, 'input', SettingsApp.updatePetaLink);
    });
    // Tombol Tes per grup Telegram
    $all('[data-tesgrup]').forEach(function (b) {
      b.addEventListener('click', function () { SettingsApp.tesGrup(b, b.getAttribute('data-tesgrup')); });
    });
    initTabs('#setTabs', '[data-view-panel="pengaturan"]');
  },

  fill: function (map) {
    map = map || {};
    // Token TIDAK pernah dikirim balik oleh server — kolom selalu kosong;
    // placeholder memberi tahu bahwa token sudah tersimpan.
    var tok = $('#setBotToken');
    tok.value = '';
    tok.placeholder = map.telegram_bot_token_ada === '1'
      ? '•••••••• (token tersimpan — kosongkan untuk tetap memakainya)'
      : '123456:ABC-DEF… (dari @BotFather)';
    $('#setGrupAdmin').value = map.telegram_group_admin || '';
    $('#setGrupDriver').value = map.telegram_group_driver || '';
    $('#setGrupSecurity').value = map.telegram_group_security || '';
    $('#setNotifAuto').value = map.notif_auto === '0' ? '0' : '1';
    $('#setNotifEmail').value = map.notif_email === '0' ? '0' : '1';
    $('#setRegistrasiAktif').value = map.registrasi_aktif === '0' ? '0' : '1';
    $('#setRegistrasiApproval').value = map.registrasi_perlu_persetujuan === '1' ? '1' : '0';
    // Audit V7.2: dua kunci ini sudah lama dibaca backend (acuan terlambat
    // presensi & role akun baru) namun belum punya jalur edit di UI.
    var isiAman = function (sel, v) { var el = $(sel); if (el) el.value = v; };
    isiAman('#setJamKerjaMulai', (map.jam_kerja_mulai || '08:00').substring(0, 5));
    isiAman('#setRegistrasiRole', map.registrasi_role_default || 'staff');
    $('#setLamaranBuka').value = map.lamaran_magang_buka === '0' ? '0' : '1';
    // V6.8: saklar & alasan halaman publik (tab "Halaman Publik") —
    // setter berpengaman agar markup lama (tanpa tab ini) tidak mematikan fill.
    var isi = function (sel, v) { var el = $(sel); if (el) el.value = v; };
    isi('#setLamaranAlasan',    map.lamaran_magang_alasan || '');
    isi('#setHalCheckinBuka',   map.halaman_checkin_buka === '0' ? '0' : '1');
    isi('#setHalCheckinAlasan', map.halaman_checkin_alasan || '');
    isi('#setHalBbmBuka',       map.halaman_bbm_buka === '0' ? '0' : '1');
    isi('#setHalBbmAlasan',     map.halaman_bbm_alasan || '');
    isi('#setHalTadBuka',       map.halaman_tad_buka === '0' ? '0' : '1');
    isi('#setHalTadAlasan',     map.halaman_tad_alasan || '');
    isi('#setHalPresMagangBuka',   map.halaman_presensi_magang_buka === '0' ? '0' : '1');
    isi('#setHalPresMagangAlasan', map.halaman_presensi_magang_alasan || '');
    $('#setKacabNama').value = map.kacab_nama || '';
    $('#setKacabNip').value = map.kacab_nip || '';
    $('#setInstansiNama').value = map.instansi_nama || '';
    var elLogo = $('#setLogoUrl'); if (elLogo) elLogo.value = map.logo_url || ''; // V7.13
    // V7.14: pratinjau logo & tanda tangan Kepala Cabang
    SettingsApp.tampilAset_('#setLogoPrev', '#setLogoPrevImg', map.logo_url);
    SettingsApp.tampilAset_('#setTtdKacabPrev', '#setTtdKacabPrevImg', map.kacab_ttd_url);
    $('#setPresensiLat').value = map.presensi_lat || '';
    $('#setPresensiLng').value = map.presensi_lng || '';
    $('#setPresensiRadius').value = map.presensi_radius_m || '150';
    $('#setPresensiGeofence').value = map.presensi_geofence === '0' ? '0' : '1';
    $('#setHariLibur').value = map.hari_libur_tambahan || '';
    SettingsApp.previewLibur();
    SettingsApp.updatePetaLink();
  },

  load: function (paksa) {
    if (SettingsApp._cache && !paksa) SettingsApp.fill(SettingsApp._cache);
    SettingsApp._dimuat = false;
    btnLoading($('#setSubmit'), $('#setSubmitText'), true);
    API.call('getSettings').then(function (r) {
      btnLoading($('#setSubmit'), $('#setSubmitText'), false, 'Simpan Pengaturan');
      if (!r.success) { Toast.error('Gagal memuat pengaturan', r.error); return; }
      SettingsApp._cache = r.data || {};
      SettingsApp._dimuat = true;
      SettingsApp.fill(SettingsApp._cache);
    });
    SettingsApp.loadLog();
  },

  payload: function () {
    // updateSettings backend menyimpan tiap key (whitelist + validasi).
    // Token dikirim HANYA bila admin mengetik nilai baru.
    var nilai = function (sel, fallback) {
      var el = $(sel);
      return el ? el.value.trim() : (fallback || '');
    };
    var p = {
      telegram_group_admin: $('#setGrupAdmin').value.trim(),
      telegram_group_driver: $('#setGrupDriver').value.trim(),
      telegram_group_security: $('#setGrupSecurity').value.trim(),
      notif_auto: $('#setNotifAuto').value,
      notif_email: $('#setNotifEmail').value,
      registrasi_aktif: $('#setRegistrasiAktif').value,
      registrasi_perlu_persetujuan: $('#setRegistrasiApproval').value,
      registrasi_role_default: nilai('#setRegistrasiRole', 'staff') || 'staff',
      jam_kerja_mulai: nilai('#setJamKerjaMulai', '08:00') || '08:00',
      lamaran_magang_buka: $('#setLamaranBuka').value,
      lamaran_magang_alasan: nilai('#setLamaranAlasan'),
      halaman_checkin_buka:   nilai('#setHalCheckinBuka', '1'),
      halaman_checkin_alasan: nilai('#setHalCheckinAlasan'),
      halaman_bbm_buka:       nilai('#setHalBbmBuka', '1'),
      halaman_bbm_alasan:     nilai('#setHalBbmAlasan'),
      halaman_tad_buka:       nilai('#setHalTadBuka', '1'),
      halaman_tad_alasan:     nilai('#setHalTadAlasan'),
      halaman_presensi_magang_buka:   nilai('#setHalPresMagangBuka', '1'),
      halaman_presensi_magang_alasan: nilai('#setHalPresMagangAlasan'),
      kacab_nama: $('#setKacabNama').value.trim(),
      kacab_nip: $('#setKacabNip').value.trim(),
      instansi_nama: $('#setInstansiNama').value.trim(),
      logo_url: nilai('#setLogoUrl'), // V7.13: logo sertifikat & dokumen resmi
      presensi_lat: $('#setPresensiLat').value.trim(),
      presensi_lng: $('#setPresensiLng').value.trim(),
      presensi_radius_m: $('#setPresensiRadius').value.trim() || '150',
      presensi_geofence: $('#setPresensiGeofence').value,
      hari_libur_tambahan: $('#setHariLibur').value.trim()
    };
    var tok = $('#setBotToken').value.trim();
    if (tok) p.telegram_bot_token = tok;
    return p;
  },

  submit: function () {
    if (!SettingsApp._dimuat) { Toast.warning('Tunggu sebentar', 'Data pengaturan masih dimuat.'); return; }
    btnLoading($('#setSubmit'), $('#setSubmitText'), true);
    API.call('updateSettings', SettingsApp.payload()).then(function (r) {
      btnLoading($('#setSubmit'), $('#setSubmitText'), false, 'Simpan Pengaturan');
      if (r.success) {
        Toast.success(r.message || 'Pengaturan tersimpan');
        $('#setBotToken').value = '';
        SettingsApp.load(true);
      } else {
        Toast.error('Ada isian yang ditolak', r.error);
        if (r.tersimpan) Toast.info(r.tersimpan);
      }
    });
  },

  hapusToken: function () {
    if (!confirm('Hapus Bot Token tersimpan? Seluruh notifikasi Telegram akan berhenti sampai token baru diisi.')) return;
    API.call('updateSettings', { hapus_bot_token: '1' }).then(function (r) {
      if (r.success) { Toast.success('Token dihapus'); SettingsApp.load(true); }
      else Toast.error('Gagal menghapus token', r.error);
    });
  },

  /* Tes kirim ke grup tertentu — pengaturan disimpan dulu agar nilai terbaru yang diuji */
  tesGrup: function (btn, grup) {
    btn.disabled = true; var lama = btn.textContent; btn.textContent = '…';
    API.call('updateSettings', SettingsApp.payload()).then(function () {
      return API.call('testTelegram', { grup: grup });
    }).then(function (r) {
      btn.disabled = false; btn.textContent = lama;
      if (r.success) Toast.success(r.message || 'Pesan tes terkirim');
      else Toast.error('Tes grup ' + grup + ' gagal', r.error);
    });
  },

  tesEmail: function () {
    btnLoading($('#setTesEmail'), $('#setTesEmailText'), true);
    API.call('updateSettings', SettingsApp.payload()).then(function () {
      return API.call('testEmail', {});
    }).then(function (r) {
      btnLoading($('#setTesEmail'), $('#setTesEmailText'), false, 'Kirim Email Tes ke Akun Saya');
      if (r.success) Toast.success(r.message || 'Email tes terkirim');
      else Toast.error('Tes email gagal', r.error);
    });
  },

  /* Isi koordinat geofence dari GPS perangkat admin (berdiri di kantor) */
  lokasiSaya: function () {
    // V7.0: pakai GeoHelper dua tahap — di laptop (tanpa GPS) mode akurasi
    // tinggi kerap gagal; fallback akurasi rendah + timeout longgar berhasil.
    btnLoading($('#setLokasiSaya'), $('#setLokasiSayaText'), true);
    GeoHelper.deteksi().then(function (g) {
      btnLoading($('#setLokasiSaya'), $('#setLokasiSayaText'), false, 'Gunakan Lokasi Saya Sekarang');
      if (!g.ok) { Toast.error('Lokasi tidak terdeteksi', g.pesan); return; }
      $('#setPresensiLat').value = g.lat.toFixed(6);
      $('#setPresensiLng').value = g.lng.toFixed(6);
      SettingsApp.updatePetaLink();
      Toast.success('Koordinat terisi (akurasi ±' + Math.round(g.accuracy) + ' m)',
        'Periksa titik lewat "Lihat di Google Maps" lalu Simpan.');
    });
  },

  updatePetaLink: function () {
    var a = $('#setLihatPeta'); if (!a) return;
    var lat = $('#setPresensiLat').value.trim(), lng = $('#setPresensiLng').value.trim();
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      a.href = 'https://maps.google.com/?q=' + lat + ',' + lng;
      a.classList.remove('hidden');
    } else a.classList.add('hidden');
  },

  /* Pratinjau langsung isian hari libur — kesalahan format terlihat sebelum disimpan */
  previewLibur: function () {
    var box = $('#setHariLiburPrev'); if (!box) return;
    var v = ($('#setHariLibur') ? $('#setHariLibur').value : '').trim();
    if (!v) { box.classList.add('hidden'); return; }
    var ok = [], salah = [];
    v.split(';').forEach(function (b) {
      b = b.trim(); if (!b) return;
      var m = b.match(/^(\d{4}-\d{2}-\d{2})(?::(.*))?$/);
      if (m && !isNaN(Date.parse(m[1] + 'T00:00:00Z'))) ok.push(m[1] + (m[2] ? ' — ' + m[2] : ''));
      else salah.push(b);
    });
    box.classList.remove('hidden');
    box.className = 'alert ' + (salah.length ? 'alert-warning' : 'alert-info') + ' mt-1';
    box.innerHTML = (ok.length ? '\u2705 ' + ok.length + ' tanggal terbaca: ' +
        ok.slice(0, 4).map(escapeHtml).join(' · ') + (ok.length > 4 ? ' …' : '') : '') +
      (salah.length ? (ok.length ? '<br>' : '') + '\u26A0 Format salah (akan ditolak saat Simpan): ' +
        salah.slice(0, 3).map(escapeHtml).join(' · ') : '');
  },

  /* ── Diagnosa Komunikasi ── */
  diagnosa: function () {
    btnLoading($('#setDiagnosaBtn'), $('#setDiagnosaText'), true);
    var box = $('#setDiagnosaHasil');
    box.innerHTML = 'Memeriksa jalur komunikasi…';
    API.call('diagnosaKomunikasi', {}).then(function (r) {
      btnLoading($('#setDiagnosaBtn'), $('#setDiagnosaText'), false, 'Jalankan Diagnosa');
      if (!r.success) { box.innerHTML = '\u274C ' + escapeHtml(r.error || 'Diagnosa gagal'); return; }
      var d = r.data || {};
      var item = function (ok, label, saran) {
        return '<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px dashed var(--border)">' +
          '<span>' + (ok ? '\u2705' : '\u26A0\uFE0F') + '</span><div><b>' + label + '</b>' +
          (saran ? '<br><span class="text-muted" style="font-size:12px">' + saran + '</span>' : '') + '</div></div>';
      };
      var html = '';
      html += item(d.token_ada, 'Bot Token ' + (d.token_ada ? 'tersimpan' + (d.bot_username ? ' (@' + escapeHtml(d.bot_username) + ')' : '') : 'BELUM diisi'),
        d.token_ada ? '' : 'Isi token dari @BotFather di tab Telegram &amp; Bot lalu Simpan.');
      html += item(d.webhook && d.webhook.terpasang, 'Webhook bot ' + (d.webhook && d.webhook.terpasang ? 'terpasang' : 'belum terpasang'),
        (d.webhook && d.webhook.error ? 'Error terakhir: ' + escapeHtml(d.webhook.error) + ' — ' : '') +
        (d.webhook && d.webhook.terpasang ? '' : 'Tekan "Aktifkan Bot" di tab Telegram &amp; Bot.'));
      html += item(d.grup && d.grup.admin, 'Chat ID grup Admin ' + (d.grup && d.grup.admin ? 'terisi' : 'kosong'),
        d.grup && d.grup.admin ? '' : 'Tanpa ini, notifikasi persetujuan tidak terkirim ke approver.');
      html += item(d.grup && d.grup.driver, 'Chat ID grup Driver ' + (d.grup && d.grup.driver ? 'terisi' : 'kosong'), '');
      html += item(d.grup && d.grup.security, 'Chat ID grup Security ' + (d.grup && d.grup.security ? 'terisi' : 'kosong'),
        d.grup && d.grup.security ? '' : 'Laporan presensi/insiden/patroli security butuh grup ini.');
      html += item(d.notif_auto, 'Notifikasi otomatis ' + (d.notif_auto ? 'aktif' : 'NONAKTIF'), '');
      html += item(d.notif_email, 'Fallback email ' + (d.notif_email ? 'aktif' : 'nonaktif'),
        d.email_quota >= 0 ? 'Sisa kuota email hari ini: ' + d.email_quota
          : 'Kuota tak terbaca — kemungkinan izin MailApp belum diotorisasi (lihat tab Email).');
      var okKirim = !d.gagal_7hari;
      html += item(okKirim, 'Pengiriman 7 hari terakhir: ' + (d.terkirim_7hari || 0) + ' terkirim, ' + (d.gagal_7hari || 0) + ' gagal',
        d.error_terakhir ? 'Gagal terakhir (' + escapeHtml(d.error_terakhir.tanggal + ' ' + (d.error_terakhir.waktu || '')) + ') ke ' +
          escapeHtml(d.error_terakhir.penerima || '-') + ': ' + escapeHtml(d.error_terakhir.error || '-') +
          ' — rincian di Log Notifikasi di bawah.' : '');
      box.innerHTML = html;
    });
  },

  /* ── Log Notifikasi — V7.9: LINIMASA, bukan tabel ──
     Titik berwarna per status (brand=terkirim, merah=gagal, kuning=tersimpan),
     penerima + chip kanal + waktu di kepala, judul sebagai isi, penyebab
     kegagalan berwarna merah, dan tombol Kirim Ulang tetap di tempatnya. */
  loadLog: function () {
    var wadah = $('#setLogBody'); if (!wadah) return;
    API.call('getNotifikasiLog', { limit: 80 }).then(function (r) {
      if (!r.success) { wadah.innerHTML = emptyBoxHtml('alert', 'Gagal memuat log: ' + (r.error || '')); renderIcons(wadah); return; }
      var f = $('#setLogFilter') ? $('#setLogFilter').value : '';
      var rows = (r.data || []).filter(function (n) { return !f || String(n.status) === f; });
      if (!rows.length) {
        wadah.innerHTML = emptyBoxHtml('info',
          'Belum ada catatan — setiap notifikasi Telegram/email tercatat di sini beserta status & penyebab kegagalannya.');
        renderIcons(wadah);
        return;
      }
      wadah.innerHTML = rows.map(function (n) {
        var st = String(n.status || '');
        var kelas = st === 'terkirim' ? 'is-ok' : st === 'gagal' ? 'is-del' : 'is-sys';
        var badge = st === 'terkirim' ? 'badge-done' : (st === 'gagal' ? 'badge-cancelled' : 'badge-waiting');
        return '<div class="feed-item ' + kelas + '">' +
          '<span class="feed-rail"><span class="feed-dot"></span></span>' +
          '<div class="feed-body">' +
            '<div class="feed-head">' +
              '<b class="feed-user" title="' + escapeHtml(n.penerima || '') + '">' + escapeHtml(n.penerima || '-') + '</b>' +
              '<span class="feed-mod">' + escapeHtml(n.jenis || '-') + '</span>' +
              '<span class="badge ' + badge + '">' + escapeHtml(st || '-') + '</span>' +
              '<span class="feed-time">' + escapeHtml(String(n.tanggal || '').substring(0, 10)) + ' ' + escapeHtml(n.waktu || '') + '</span>' +
            '</div>' +
            '<div class="feed-text">' + escapeHtml(n.judul || '-') + '</div>' +
            (n.error ? '<div class="feed-err">' + escapeHtml(n.error) + '</div>' : '') +
            (st === 'gagal' && n.id
              ? '<div class="feed-act"><button class="btn btn-outline btn-sm" data-resend="' + escapeHtml(n.id) + '">Kirim Ulang</button></div>'
              : '') +
          '</div>' +
        '</div>';
      }).join('');
      $all('[data-resend]', wadah).forEach(function (b) {
        b.addEventListener('click', function () {
          b.disabled = true; b.textContent = 'Mengirim…';
          API.call('resendNotifikasi', { id: b.getAttribute('data-resend') }).then(function (r) {
            if (r.success) { Toast.success(r.message || 'Terkirim ulang'); SettingsApp.loadLog(); }
            else { b.disabled = false; b.textContent = 'Kirim Ulang'; Toast.error('Gagal kirim ulang', r.error); }
          });
        });
      });
    });
  },

  /* ── V7.7: Komunikasi Magang/TAD (broadcast & log) ─────────────────────────
     Aksi kirimPengumumanKomunikasi & getKomunikasiLog didaftarkan server oleh
     Patch_Server_Komunikasi.gs. Bila patch BELUM terpasang, server menjawab
     'Aksi … tidak dikenal' — UI menampilkannya sebagai petunjuk pemasangan,
     bukan error mentah; bagian Pengaturan lain tetap bekerja normal. */
  _komDimuat: false,
  komPatchAbsen_: function (err) { return /tidak dikenal/i.test(String(err || '')); },

  /* ── V7.14: aset branding (logo & ttd Kepala Cabang) ── */
  tampilAset_: function (prevSel, imgSel, url) {
    var prev = $(prevSel), img = $(imgSel);
    if (!prev || !img) return;
    if (!url) { prev.classList.remove('is-visible'); return; }
    img.src = driveImgSrc(url, 240) || url;
    img.onerror = function () { prev.classList.remove('is-visible'); };
    prev.classList.add('is-visible');
  },
  ikatUnggahAset_: function (inputSel, jenis, prevSel, imgSel, urlSel) {
    var el = $(inputSel); if (!el) return;
    el.addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) { Toast.warning('Berkas terlalu besar', 'Maksimum 3 MB.'); this.value = ''; return; }
      var input = this;
      input.disabled = true;
      Toast.info('Mengunggah…', jenis === 'logo' ? 'Logo instansi sedang disimpan.' : 'Tanda tangan sedang disimpan.');
      compressImage(f, 900, 0.92).then(function (d) {
        API.call('uploadAsetBranding', { jenis: jenis, file: d }).then(function (r) {
          input.disabled = false; input.value = '';
          if (!r.success) { Toast.error('Gagal mengunggah', r.error); return; }
          Toast.success(r.message || 'Tersimpan');
          SettingsApp.tampilAset_(prevSel, imgSel, r.url);
          if (urlSel) { var u = $(urlSel); if (u) u.value = r.url; }
          if (SettingsApp._cache) {
            SettingsApp._cache[jenis === 'logo' ? 'logo_url' : 'kacab_ttd_url'] = r.url;
          }
        });
      });
    });
  },

  komLoadLog: function (paksa) {
    var wadah = $('#komLogBody'); if (!wadah) return;
    if (SettingsApp._komDimuat && !paksa) return; // lazy: sekali per sesi, kecuali Muat Ulang/filter
    SettingsApp._komDimuat = true;
    wadah.innerHTML = emptyBoxHtml('info', 'Memuat log komunikasi…');
    renderIcons(wadah);
    var jalur = $('#komLogJalur') ? $('#komLogJalur').value : '';
    API.call('getKomunikasiLog', { jalur: jalur, limit: 100 }).then(function (r) {
      if (!r.success) {
        var absen = SettingsApp.komPatchAbsen_(r.error);
        SettingsApp._komDimuat = false; // boleh dicoba lagi setelah patch dipasang
        wadah.innerHTML = emptyBoxHtml('alert',
          absen
            ? 'Patch komunikasi belum terpasang — tambahkan file Patch_Server_Komunikasi.gs di posisi PALING BAWAH daftar file Apps Script, deploy ulang, lalu buka tab ini kembali.'
            : 'Gagal memuat log: ' + (r.error || ''));
        renderIcons(wadah); return;
      }
      var rows = r.data || [];
      if (!rows.length) {
        wadah.innerHTML = emptyBoxHtml('info',
          'Belum ada catatan komunikasi — laporan peserta (/lapor), balasan pengelola, dan pengumuman (/umumkan atau formulir di atas) tercatat di sini.');
        renderIcons(wadah); return;
      }
      /* V7.9: LINIMASA — jalur menentukan jenis titik (laporan=masuk baru,
         balasan=biru laut, pengumuman=brand; gagal selalu merah), kepala berisi
         nama + chip jalur/audiens + badge status + waktu, isi = pesan +
         lampiran + rujukan + statistik broadcast. */
      var labelJalur = { lapor: 'Laporan', balas: 'Balasan', pengumuman: 'Pengumuman' };
      var labelAud   = { mg: 'Magang', tad: 'TAD', all: 'Magang+TAD' };
      wadah.innerHTML = rows.map(function (n) {
        var st = String(n.status || '');
        var kelas = st === 'gagal' ? 'is-del'
                  : String(n.jalur) === 'lapor' ? 'is-new'
                  : String(n.jalur) === 'balas' ? 'is-upd' : 'is-ok';
        var badge = st === 'terkirim' ? 'badge-done'
                  : st === 'dibalas'  ? 'badge-approved'
                  : st === 'gagal'    ? 'badge-cancelled' : 'badge-waiting';
        var statistik = String(n.jalur) === 'pengumuman' && String(n.terkirim || '') !== ''
          ? '<div class="feed-sub">' + escapeHtml(String(n.terkirim)) + ' terkirim' +
            (Number(n.gagal) ? ' · ' + escapeHtml(String(n.gagal)) + ' gagal' : '') + '</div>' : '';
        return '<div class="feed-item ' + kelas + '">' +
          '<span class="feed-rail"><span class="feed-dot"></span></span>' +
          '<div class="feed-body">' +
            '<div class="feed-head">' +
              '<b class="feed-user" title="' + escapeHtml(n.dari_nama || '') + '">' + escapeHtml(n.dari_nama || '-') + '</b>' +
              '<span class="feed-mod">' + escapeHtml(labelJalur[n.jalur] || n.jalur || '-') + '</span>' +
              '<span class="feed-mod">' + escapeHtml(labelAud[n.audiens] || n.audiens || '-') + '</span>' +
              '<span class="badge ' + badge + '">' + escapeHtml(st || '-') + '</span>' +
              '<span class="feed-time">' + escapeHtml(String(n.created_at || '').replace('T', ' ').substring(0, 16)) + '</span>' +
            '</div>' +
            '<div class="feed-text">' + escapeHtml(n.pesan || '—') +
              (n.lampiran_url ? ' <a href="' + escapeHtml(n.lampiran_url) + '" target="_blank" rel="noopener">\uD83D\uDCCE lampiran</a>' : '') +
            '</div>' +
            (n.ref_id ? '<div class="feed-sub">\u21A9 atas laporan ' + escapeHtml(n.ref_id) + '</div>' : '') +
            statistik +
          '</div>' +
        '</div>';
      }).join('');
    });
  },

  komKirim: function () {
    var teksEl = $('#komTeks'), audEl = $('#komAud'), hasil = $('#komKirimHasil');
    var teks = teksEl ? teksEl.value.trim() : '';
    if (teks.length < 10) {
      Toast.warning('Isi terlalu pendek', 'Pengumuman minimal 10 karakter.');
      if (teksEl) teksEl.focus(); return;
    }
    var aud = audEl ? audEl.value : 'all';
    var labelAud = { mg: 'Peserta Magang', tad: 'Personel TAD', all: 'Magang + TAD' };
    if (!confirm('Kirim pengumuman ini ke ' + (labelAud[aud] || aud) + ' sekarang?\n\nTeks dikirim apa adanya ke seluruh penerima aktif yang tertaut.')) return;
    btnLoading($('#komKirimBtn'), $('#komKirimText'), true);
    if (hasil) hasil.classList.add('hidden');
    API.call('kirimPengumumanKomunikasi', { aud: aud, teks: teks }).then(function (r) {
      btnLoading($('#komKirimBtn'), $('#komKirimText'), false, 'Kirim Pengumuman');
      if (r.success) {
        if (teksEl) teksEl.value = '';
        Toast.success('Pengumuman terkirim', r.terkirim + '/' + r.total + ' penerima');
        if (hasil) {
          hasil.className = 'alert alert-info mt-1';
          hasil.innerHTML = '\u2705 Terkirim ke <b>' + r.terkirim + '/' + r.total + '</b> penerima (' +
            escapeHtml(labelAud[aud] || aud) + ').' +
            (r.gagal ? '<br>\u26A0\uFE0F ' + r.gagal + ' penerima belum terjangkau' +
              (r.takSampai && r.takSampai.length
                ? ': ' + escapeHtml(r.takSampai.join(', ')) + (r.gagal > r.takSampai.length ? ', …' : '') : '') +
              ' — belum tertaut Telegram/email.' : '') +
            (r.terpotong ? '<br>\u2139\uFE0F Daftar penerima melebihi batas satu kali kirim (80) — kirim ulang untuk sisanya.' : '');
          hasil.classList.remove('hidden');
        }
        SettingsApp.komLoadLog(true);
      } else {
        Toast.error('Broadcast gagal', r.error);
        if (hasil) {
          hasil.className = 'alert alert-warning mt-1';
          hasil.innerHTML = '\u26A0\uFE0F ' + escapeHtml(r.error || 'Broadcast gagal.') +
            (SettingsApp.komPatchAbsen_(r.error)
              ? '<br>Pasang file <b>Patch_Server_Komunikasi.gs</b> di posisi paling bawah daftar file Apps Script lalu deploy ulang.' : '');
          hasil.classList.remove('hidden');
        }
      }
    });
  }
};


/* ══════════════════════════════════════════════════════════════════════════
   MODUL: KENDARAAN & BBM (Fase 2)
   ══════════════════════════════════════════════════════════════════════════ */
var KendaraanModule = {
  booking: [], bbm: [], strukData: '',

  init: function () {
    $('#kndAddBtn').addEventListener('click', KendaraanModule.openBookingForm);
    $('#kndRefreshBtn').addEventListener('click', function () { KendaraanModule.load(true); });
    $('#kndFilterStatus').addEventListener('change', KendaraanModule.renderBookingTable);
    $('#kndFSubmit').addEventListener('click', KendaraanModule.submitBooking);
    $('#tripSubmit').addEventListener('click', KendaraanModule.submitTrip);

    $('#bbmAddBtn').addEventListener('click', KendaraanModule.openBBMForm);
    $('#bbmFSubmit').addEventListener('click', KendaraanModule.submitBBM);
    var recalc = function () {
      var liter = parseFloat($('#bbmFLiter').value) || 0;
      var harga = parseFloat($('#bbmFHarga').value) || 0;
      if (liter && harga && !$('#bbmFTotal').dataset.touched) $('#bbmFTotal').value = Math.round(liter * harga);
    };
    $('#bbmFLiter').addEventListener('input', recalc);
    $('#bbmFHarga').addEventListener('input', recalc);
    $('#bbmFTotal').addEventListener('input', function () { this.dataset.touched = '1'; });
    $('#bbmFStruk').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) { KendaraanModule.strukData = ''; $('#bbmStrukPreview').classList.remove('is-visible'); return; }
      compressImage(f, 1280, 0.8).then(function (dataUrl) {
        KendaraanModule.strukData = dataUrl;
        $('#bbmStrukImg').src = dataUrl;
        $('#bbmStrukPreview').classList.add('is-visible');
      });
    });

    var svc = document.getElementById('svcSubmit');
    if (svc) svc.addEventListener('click', KendaraanModule.submitServis);

    initTabs('#kndTabs', '[data-view-panel="kendaraan"]');
  },

  load: function (showToast) {
    // SATU round-trip untuk master + stats + booking + BBM + servis (bundel
    // V6.6) — dulu 7–8 panggilan terpisah. Fallback mulus ke jalur lama.
    API.call('getModuleBundle', { module: 'kendaraan' }).then(function (r) {
      if (r.success && r.data) {
        var d = r.data;
        MasterData.absorb(d.master);
        if (!MasterData.loaded) MasterData.ensure(); // lengkapi bila bundel master parsial
        if (d.stats && d.stats.success) KendaraanModule.renderStats(d.stats.data);
        if (d.booking && d.booking.success) {
          KendaraanModule.booking = d.booking.data || [];
          KendaraanModule.renderBookingTable();
        } else if (d.booking) {
          Toast.error('Gagal memuat booking', d.booking.error);
        }
        if (d.bbm_stats && d.bbm_stats.success) KendaraanModule.renderBBMStats(d.bbm_stats.data);
        if (d.bbm && d.bbm.success) { KendaraanModule.bbm = d.bbm.data || []; KendaraanModule.renderBBMTable(); }
        KendaraanModule.applyServis(d.servis);
        // Audit V7 #5: toast "diperbarui" HANYA di cabang sukses
        if (showToast) Toast.info('Data kendaraan diperbarui');
      } else {
        KendaraanModule.loadLegacy();
        if (showToast) Toast.warning('Gagal menyegarkan data kendaraan', r.error || 'Mencoba jalur muat lama…');
      }
    });
  },

  loadLegacy: function () {
    MasterData.ensure();
    API.call('getBookingKendaraanStats').then(function (r) { if (r.success) KendaraanModule.renderStats(r.data); });
    API.call('getBookingKendaraan', {}).then(function (r) {
      if (r.success) { KendaraanModule.booking = r.data || []; KendaraanModule.renderBookingTable(); }
      else Toast.error('Gagal memuat booking', r.error);
    });
    KendaraanModule.loadBBM();
    KendaraanModule.loadServis();
  },

  /* ── V6.5: JADWAL SERVIS BERKALA — dirakit dari laporan KM driver ── */
  servis: [],
  loadServis: function () {
    API.call('getJadwalServis').then(function (r) { KendaraanModule.applyServis(r); });
    KendaraanModule.loadDokJatuhTempo();
  },

  /* Otomasi V7.15: peringatan STNK/pajak/SIM menjelang atau lewat jatuh tempo. */
  loadDokJatuhTempo: function () {
    var host = document.getElementById('kndDokJatuhTempo');
    if (!host) return;
    API.call('getDokumenJatuhTempo', {}).then(function (r) {
      if (!r || !r.success || !r.total) { host.innerHTML = ''; return; }
      var grp = { lewat: [], segera: [] };
      (r.data || []).forEach(function (d) { (grp[d.status] || grp.segera).push(d); });

      function chip(d) {
        var teks = d.jenis + ' · ' + d.subjek;
        var sisa = d.status === 'lewat'
          ? 'lewat ' + Math.abs(d.sisa_hari) + ' hari'
          : (d.sisa_hari === 0 ? 'hari ini' : d.sisa_hari + ' hari lagi');
        return '<div class="dok-item"><div class="dok-item-main">' +
          '<span class="dok-jenis dok-' + d.jenis.toLowerCase() + '">' + escapeHtml(d.jenis) + '</span>' +
          '<span class="dok-subjek">' + escapeHtml(d.subjek) + '</span></div>' +
          '<div class="dok-item-meta"><span class="dok-tgl">' + fmtDateShort(d.tanggal) + '</span>' +
          '<span class="dok-sisa">' + escapeHtml(sisa) + '</span></div></div>';
      }

      var html = '<div class="dok-card">';
      html += '<div class="dok-head"><svg data-icon="alert" style="width:17px;height:17px"></svg>' +
              '<span>Dokumen Perlu Perhatian</span>' +
              '<span class="dok-count">' + r.total + '</span></div>';
      if (grp.lewat.length) {
        html += '<div class="dok-group is-lewat"><div class="dok-group-title">' + iconSvg('alert') + ' Sudah terlewat (' + grp.lewat.length + ')</div>' +
                grp.lewat.map(chip).join('') + '</div>';
      }
      if (grp.segera.length) {
        html += '<div class="dok-group is-segera"><div class="dok-group-title">' + iconSvg('file') + ' Akan jatuh tempo dalam ' + r.ambang + ' hari (' + grp.segera.length + ')</div>' +
                grp.segera.map(chip).join('') + '</div>';
      }
      html += '<div class="dok-foot">Perbarui STNK, pajak kendaraan, atau SIM driver sebelum jatuh tempo. Data diambil dari master Kendaraan &amp; Drivers.</div>';
      html += '</div>';
      host.innerHTML = html;
      renderIcons(host);
    });
  },

  /** Terapkan hasil getJadwalServis (dipakai load bundel & loadServis) */
  applyServis: function (r) {
    if (!r || !r.success) return;
    KendaraanModule.servis = r.data || [];
    var badge = document.getElementById('kndServisBadge');
    if (badge) {
      var n = (r.due || 0) + (r.warn || 0);
      badge.textContent = n || '';
      badge.style.display = n ? '' : 'none';
    }
    var info = document.getElementById('kndServisInfo');
    if (info && r.interval) info.textContent = 'Interval: tiap ' + r.interval.km.toLocaleString('id-ID') + ' km atau ' + r.interval.bulan + ' bulan — mana yang lebih dulu';
    KendaraanModule.renderServis();
  },

  renderServis: function () {
    var tbody = document.getElementById('kndServisBody');
    if (!tbody) return;
    var rows = KendaraanModule.servis;
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'car', 'Belum ada kendaraan aktif',
        'Tambahkan kendaraan lewat menu master kendaraan.');
      renderIcons(tbody);
      return;
    }
    var CH = { due: '<span class="badge badge-cancelled">Jatuh Tempo</span>',
               warn: '<span class="badge badge-pending">Segera</span>',
               ok: '<span class="badge badge-done">Aman</span>',
               baru: '<span class="badge badge-neutral">Data Kurang</span>' };
    var bolehCatat = isApprover() || (Auth.user && String(Auth.user.role) === 'driver');
    tbody.innerHTML = rows.map(function (k) {
      return '<tr>' +
        '<td><div style="font-weight:700">' + escapeHtml(k.nopol || '—') + '</div>' +
        '<div class="text-muted" style="font-size:11px">' + escapeHtml((k.merk || '').trim()) + '</div></td>' +
        '<td style="font-size:12.5px">' + (k.km_sekarang ? k.km_sekarang.toLocaleString('id-ID') + ' km' : '—') + '</td>' +
        '<td style="font-size:12.5px">' + (k.tgl_servis
          ? fmtDateShort(k.tgl_servis) + '<div class="text-muted" style="font-size:11px">' +
            (k.km_servis ? k.km_servis.toLocaleString('id-ID') + ' km' : '') +
            (k.jenis_servis ? ' · ' + escapeHtml(k.jenis_servis) : '') + '</div>'
          : '<span class="text-muted">belum tercatat</span>') + '</td>' +
        '<td style="font-size:12.5px">' + (k.pemakaian != null ? '+' + k.pemakaian.toLocaleString('id-ID') + ' km' : '—') + '</td>' +
        '<td>' + (CH[k.status] || '') +
        '<div class="text-muted" style="font-size:11px;max-width:260px">' + escapeHtml(k.alasan || '') + '</div></td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          (bolehCatat ? '<button class="btn btn-outline btn-sm" data-svc="' + escapeHtml(k.id) + '">Catat Servis</button>' : '') +
        '</td></tr>';
    }).join('');
    $all('[data-svc]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = KendaraanModule.servis.find(function (x) { return String(x.id) === b.getAttribute('data-svc'); });
        if (k) KendaraanModule.openServis(k);
      });
    });
  },

  openServis: function (k) {
    $('#svcKendaraanId').value = k.id;
    $('#svcInfo').innerHTML = '<span class="ic">' + iconSvg('car') + '</span><div><b>' + escapeHtml(k.nopol) + '</b> ' +
      escapeHtml((k.merk || '').trim()) +
      '<br><span style="color:var(--text-secondary)">KM saat ini tercatat: ' +
      (k.km_sekarang ? k.km_sekarang.toLocaleString('id-ID') : '—') + ' km</span></div>';
    $('#svcTanggal').value = todayISO();
    $('#svcKm').value = k.km_sekarang || '';
    $('#svcJenis').value = 'rutin';
    $('#svcBiaya').value = '';
    $('#svcBengkel').value = '';
    $('#svcCatatan').value = '';
    renderIcons($('#svcInfo'));
    Modal.open('modalServis');
  },

  submitServis: function () {
    var payload = {
      kendaraan_id: $('#svcKendaraanId').value,
      tanggal: $('#svcTanggal').value,
      km: $('#svcKm').value,
      jenis: $('#svcJenis').value,
      biaya: $('#svcBiaya').value,
      bengkel: $('#svcBengkel').value.trim(),
      catatan: $('#svcCatatan').value.trim()
    };
    if (!payload.tanggal || !payload.km) { Toast.warning('Tanggal & KM saat servis wajib diisi'); return; }
    btnLoading($('#svcSubmit'), $('#svcSubmitText'), true);
    API.call('catatServis', payload).then(function (r) {
      btnLoading($('#svcSubmit'), $('#svcSubmitText'), false, 'Simpan Servis');
      if (r.success) {
        Modal.close('modalServis');
        Toast.success(r.message || 'Servis tercatat');
        KendaraanModule.loadServis();
      } else Toast.error('Gagal menyimpan', r.error);
    });
  },

  loadBBM: function () {
    API.call('getBBMStats', {}).then(function (r) { if (r.success) KendaraanModule.renderBBMStats(r.data); });
    API.call('getBBM', {}).then(function (r) { if (r.success) { KendaraanModule.bbm = r.data || []; KendaraanModule.renderBBMTable(); } });
  },

  renderStats: function (d) {
    $('#kndStats').innerHTML = [
      { icon: 'car', cls: 'stat-blue', val: d.total, label: 'Total Pengajuan' },
      { icon: 'clock', cls: 'stat-amber', val: d.pending, label: 'Menunggu' },
      { icon: 'check', cls: 'stat-green', val: d.approved, label: 'Disetujui' },
      { icon: 'activity', cls: 'stat-teal', val: d.selesai, label: 'Selesai' }
    ].map(statCardHtml).join('');
  },

  renderBookingTable: function () {
    var f = $('#kndFilterStatus').value;
    var rows = KendaraanModule.booking.filter(function (b) { return !f || String(b.status) === f; });
    if (!rows.length) {
      $('#kndTableBody').innerHTML = emptyRow(7, 'car', 'Belum ada pengajuan kendaraan', 'Klik "Ajukan Kendaraan" untuk memulai.');
      return;
    }
    $('#kndTableBody').innerHTML = rows.map(function (b) {
      // Persetujuan HANYA lewat Pusat Persetujuan — di modul cukup Detail,
      // Batalkan (pemohon), dan Trip/KM setelah disetujui.
      var actions = '<button class="btn btn-ghost btn-sm" data-detail="' + escapeHtml(b.id) + '">Detail</button>';
      if (b.status === 'pending' && (isOwn(b) || isAdmin2())) {
        actions += '<button class="btn btn-outline btn-sm" data-cancel="' + escapeHtml(b.id) + '">Batalkan</button>';
      } else if (b.status === 'approved') {
        actions += '<button class="btn btn-primary btn-sm" data-trip="' + escapeHtml(b.id) + '">Trip / KM</button>';
        // V7 (Bagian 3.2): booking DISETUJUI kini bisa dibatalkan pemohon/admin
        // (lepasBookingKendaraan) — dulu slot terkunci sampai kedaluwarsa.
        if (isOwn(b) || isAdmin2()) {
          actions += '<button class="btn btn-outline btn-sm" data-lepas="' + escapeHtml(b.id) + '">Batalkan</button>';
        }
      }
      var waktu = escapeHtml(fmtTime(b.jam_berangkat)) + (b.jam_kembali ? '–' + escapeHtml(fmtTime(b.jam_kembali)) : '');
      var tglCell = fmtDateShort(b.tanggal_pakai);
      if (b.tanggal_selesai && String(b.tanggal_selesai).substring(0, 10) !== String(b.tanggal_pakai).substring(0, 10)) {
        tglCell += ' <span style="color:var(--text-secondary)">s.d.</span> ' + fmtDateShort(b.tanggal_selesai);
      }
      if (String(b.luar_kota) === '1') {
        tglCell += ' <span class="badge badge-serving" style="margin-left:4px">Luar Kota</span>';
      }
      return '<tr>' +
        '<td style="white-space:nowrap">' + tglCell + '</td>' +
        '<td><div class="cell-primary">' + escapeHtml(b.pemohon) + '</div><div class="cell-sub">' + escapeHtml(b.bagian || '') + '</div></td>' +
        '<td style="max-width:200px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + escapeHtml(b.tujuan) + '">' + escapeHtml(b.tujuan) + '</div></td>' +
        '<td>' + escapeHtml(b.nopol || '—') + '</td>' +
        '<td>' + waktu + '</td>' +
        '<td>' + statusBadge(b.status) + '</td>' +
        '<td><div class="cell-actions">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
    KendaraanModule.bindBookingActions();
  },

  bindBookingActions: function () {
    var root = $('#kndTableBody');
    $all('[data-detail]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var bk = KendaraanModule.booking.filter(function (x) { return String(x.id) === String(b.getAttribute('data-detail')); })[0];
        if (bk) KendaraanModule.showDetail(bk);
      });
    });
    $all('[data-cancel]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Batalkan pengajuan kendaraan?', 'Pengajuan yang dibatalkan tidak diproses persetujuan.', function () {
          KendaraanModule.doSimple('cancelBookingKendaraan', b.getAttribute('data-cancel'), b);
        });
      });
    });
    $all('[data-lepas]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Batalkan booking yang sudah disetujui?',
          'Slot kendaraan langsung dibebaskan; grup driver diberi tahu.', function () {
          KendaraanModule.doSimple('lepasBookingKendaraan', b.getAttribute('data-lepas'), b);
        });
      });
    });
    $all('[data-trip]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-trip');
        var bk = KendaraanModule.booking.filter(function (x) { return String(x.id) === String(id); })[0];
        KendaraanModule.openTrip(bk);
      });
    });
  },

  showDetail: function (b) {
    var multiHari = b.tanggal_selesai && String(b.tanggal_selesai).substring(0, 10) !== String(b.tanggal_pakai).substring(0, 10);
    var pairs = [
      ['Status', statusBadge(b.status), { html: true }],
      ['Pemohon', b.pemohon + (b.bagian ? ' · ' + b.bagian : '')],
      ['Tanggal pakai', fmtDateShort(b.tanggal_pakai) + (multiHari ? ' s.d. ' + fmtDateShort(b.tanggal_selesai) : '')],
      ['Lingkup', String(b.luar_kota) === '1' ? 'Kegiatan luar kota' : 'Dalam kota'],
      ['Waktu', fmtTime(b.jam_berangkat) + (b.jam_kembali ? '–' + fmtTime(b.jam_kembali) : '')],
      ['Tujuan', b.tujuan],
      ['Keperluan', b.keperluan],
      ['Kendaraan', b.nopol || '(diserahkan pengelola)'],
      ['Driver', b.nama_driver],
      ['Penumpang', b.jumlah_penumpang],
      ['KM berangkat', b.km_berangkat],
      ['KM kembali', b.km_kembali],
      ['Catatan', b.catatan]
    ];
    if (b.status === 'rejected') pairs.push(['Alasan ditolak', b.alasan_tolak]);
    if (b.approved_by) pairs.push(['Diproses oleh', b.approved_by]);
    if (b.status === 'pending' && isApprover()) {
      pairs.push(['Persetujuan', 'Proses melalui menu <b>Pusat Persetujuan</b>.', { html: true }]);
    }
    DetailView.show('Detail Peminjaman Kendaraan', pairs);
  },

  doSimple: function (action, id, btn) {
    // Audit V7 #3: tombol dinonaktifkan selama proses (anti klik-ganda)
    apiKlikSekali(btn, action, { id: id }).then(function (res) {
      if (res.success) { Toast.success(res.message || 'Berhasil'); KendaraanModule.load(); ApprovalModule.softRefresh(); }
      else Toast.error(res.error || 'Gagal memproses');
    });
  },

  openBookingForm: function () {
    MasterData.ensure(function () {
      fillSelect($('#kndFKendaraan'), MasterData.kendaraan.filter(onlyActive), '— Pilih kendaraan —',
        function (k) { return (k.nopol || '') + ' · ' + (k.merk || '') + ' ' + (k.type || ''); });
      fillSelect($('#kndFDriver'), MasterData.drivers.filter(onlyActive), '— Tanpa driver —',
        function (d) { return d.nama + (d.no_hp ? ' (' + d.no_hp + ')' : ''); });
    });
    ['kndFTujuan', 'kndFKeperluan', 'kndFCatatan'].forEach(function (id) { $('#' + id).value = ''; });
    $('#kndFTanggal').value = todayISO();
    var ts = $('#kndFTanggalSelesai'); if (ts) ts.value = '';
    var lk = $('#kndFLuarKota'); if (lk) lk.checked = false;
    $('#kndFBerangkat').value = '08:00';
    $('#kndFKembali').value = '';
    $('#kndFPenumpang').value = '1';
    // Smart Engine: reset state saran & pasang pemicu auto-fill (sekali saja).
    KendaraanModule._saran = null;
    KendaraanModule._saranManualKnd = false;   // user sudah menyentuh dropdown kendaraan?
    KendaraanModule._saranManualDrv = false;    // ...driver?
    KendaraanModule.resetSaranPanel();
    var kp = $('#kndKonflikPanel'); if (kp) { kp.style.display = 'none'; kp.innerHTML = ''; }
    KendaraanModule.bindSmartFill();
    Modal.open('modalKendaraan');
  },

  /* ── SMART ENGINE (sisi pemohon) ─────────────────────────────────────────
     Begitu user mengisi Tujuan + Penumpang (dan tanggal/jam), minta saran ke
     server lalu ISI OTOMATIS kendaraan & driver terbaik dari pola trip user.
     Sesuai nama "GESIT": user tak perlu membaca catatan/menimbang manual. */

  _saran: null, _saranManualKnd: false, _saranManualDrv: false, _saranTimer: null, _saranSeq: 0,

  bindSmartFill: function () {
    if (KendaraanModule._smartBound) return;   // pasang listener sekali utk seumur hidup modal
    KendaraanModule._smartBound = true;
    var pemicu = ['kndFTujuan', 'kndFPenumpang', 'kndFTanggal', 'kndFBerangkat', 'kndFKembali'];
    pemicu.forEach(function (id) {
      var el = $('#' + id);
      if (!el) return;
      var ev = (id === 'kndFTujuan') ? 'input' : 'change';
      el.addEventListener(ev, function () { KendaraanModule.mintaSaranDebounced(); });
    });
    // Jika user memilih kendaraan/driver sendiri, hormati pilihannya —
    // jangan ditimpa saran berikutnya (tetap boleh diganti manual kapan saja).
    var selK = $('#kndFKendaraan');
    if (selK) selK.addEventListener('change', function () {
      KendaraanModule._saranManualKnd = true;
      KendaraanModule.tandaiPanelManual();
      KendaraanModule.cekKonflikPilihan();   // Otomasi C: peringatan bentrok langsung
    });
    var selD = $('#kndFDriver');
    if (selD) selD.addEventListener('change', function () {
      KendaraanModule._saranManualDrv = true;
      KendaraanModule.tandaiPanelManual();
      KendaraanModule.cekKonflikPilihan();
    });
  },

  mintaSaranDebounced: function () {
    clearTimeout(KendaraanModule._saranTimer);
    KendaraanModule._saranTimer = setTimeout(function () { KendaraanModule.mintaSaran(); }, 450);
  },

  mintaSaran: function () {
    var tujuan = ($('#kndFTujuan').value || '').trim();
    var penumpang = $('#kndFPenumpang').value;
    var tgl = $('#kndFTanggal').value;
    var jamB = $('#kndFBerangkat').value;
    // Butuh minimal tujuan agar saran relevan; tanpa itu, jangan tampilkan apa-apa.
    if (!tujuan || !tgl || !jamB) { KendaraanModule.resetSaranPanel(); return; }

    var seq = ++KendaraanModule._saranSeq;   // anti balapan: hanya respons terbaru dipakai
    KendaraanModule.tampilSaranMemuat();
    API.call('getSaranBookingKendaraan', {
      tujuan: tujuan, jumlah_penumpang: penumpang,
      tanggal_pakai: tgl, tanggal_selesai: $('#kndFTanggalSelesai') ? $('#kndFTanggalSelesai').value : '',
      jam_berangkat: jamB, jam_kembali: $('#kndFKembali').value
    }).then(function (res) {
      if (seq !== KendaraanModule._saranSeq) return;         // sudah usang, abaikan
      if (!res || !res.success) { KendaraanModule.resetSaranPanel(); return; }
      KendaraanModule._saran = res.data;
      KendaraanModule.terapkanSaran(res.data);
    });
  },

  /* Terapkan saran ke form: auto-isi HANYA field yang belum disentuh user. */
  terapkanSaran: function (d) {
    var u = d.usulan || {};
    if (!KendaraanModule._saranManualKnd && u.kendaraan_id) {
      var selK = $('#kndFKendaraan');
      if (selK) selK.value = u.kendaraan_id;
    }
    if (!KendaraanModule._saranManualDrv && u.driver_id) {
      var selD = $('#kndFDriver');
      if (selD) selD.value = u.driver_id;
    }
    KendaraanModule.renderSaranPanel(d);
    KendaraanModule.cekKonflikPilihan();   // Otomasi C: cek pilihan aktif thd data bentrok
  },

  /* ── OTOMASI C: PERINGATAN KONFLIK JADWAL PROAKTIF ───────────────────────
     Data saran (_saran.kendaraan[] & .drivers[]) sudah membawa flag bentrok/
     sibuk + keterangannya. Bila kendaraan/driver yang SEDANG DIPILIH user
     ternyata bentrok, tampilkan banner merah SEBELUM submit — hemat bolak-balik
     ditolak server. */
  cekKonflikPilihan: function () {
    var host = KendaraanModule.ensureKonflikPanel();
    if (!host) return;
    var d = KendaraanModule._saran;
    if (!d) { host.style.display = 'none'; host.innerHTML = ''; return; }

    var kndId = ($('#kndFKendaraan') && $('#kndFKendaraan').value) || '';
    var drvId = ($('#kndFDriver') && $('#kndFDriver').value) || '';
    var pesan = [];

    if (kndId) {
      var k = (d.kendaraan || []).filter(function (x) { return String(x.id) === String(kndId); })[0];
      if (k && k.bentrok) {
        pesan.push({ ic: iconSvg('car'), teks: 'Kendaraan ini sudah dibooking' + (k.ket ? ' (' + k.ket + ')' : '') +
          ' pada waktu tersebut. Pilih kendaraan lain atau ubah jadwal.' });
      } else if (k && k.muat === false) {
        pesan.push({ ic: iconSvg('alert'), teks: 'Kapasitas kendaraan ini mungkin kurang untuk ' +
          (d.penumpang || '') + ' penumpang.', warn: true });
      }
    }
    if (drvId) {
      var dr = (d.drivers || []).filter(function (x) { return String(x.id) === String(drvId); })[0];
      if (dr && dr.sibuk) {
        pesan.push({ ic: iconSvg('user'), teks: 'Driver ini sedang bertugas' + (dr.ket ? ' (' + dr.ket + ')' : '') +
          ' pada waktu tersebut. Pilih driver lain atau ubah jadwal.' });
      }
    }

    if (!pesan.length) { host.style.display = 'none'; host.innerHTML = ''; return; }
    var adaBentrok = pesan.some(function (p) { return !p.warn; });
    host.style.display = '';
    host.className = 'knd-konflik full' + (adaBentrok ? ' is-bentrok' : ' is-warn');
    host.innerHTML = '<div class="knd-konflik-head">' + (adaBentrok ? iconSvg('alert') + ' Perhatian: jadwal bentrok' : iconSvg('alert') + ' Perhatian') + '</div>' +
      pesan.map(function (p) {
        return '<div class="knd-konflik-item"><span>' + p.ic + '</span><span>' + escapeHtml(p.teks) + '</span></div>';
      }).join('');
  },

  ensureKonflikPanel: function () {
    var host = $('#kndKonflikPanel');
    if (host) return host;
    // Sisipkan setelah panel saran (atau sebelum grup kendaraan bila panel saran belum ada).
    var anchor = $('#kndSaranPanel') || (($('#kndFKendaraan') && $('#kndFKendaraan').closest('.form-group')) || null);
    if (!anchor || !anchor.parentNode) return null;
    host = document.createElement('div');
    host.id = 'kndKonflikPanel';
    host.className = 'knd-konflik full';
    host.style.display = 'none';
    anchor.parentNode.insertBefore(host, anchor.nextSibling);
    return host;
  },
  ensureSaranPanel: function () {
    var host = $('#kndSaranPanel');
    if (host) return host;
    // Sisipkan tepat sebelum grup "Kendaraan" agar konteksnya jelas.
    var selK = $('#kndFKendaraan');
    if (!selK) return null;
    var grpKnd = selK.closest('.form-group');
    if (!grpKnd) return null;
    host = document.createElement('div');
    host.id = 'kndSaranPanel';
    host.className = 'knd-saran full';
    host.style.display = 'none';
    grpKnd.parentNode.insertBefore(host, grpKnd);
    return host;
  },

  resetSaranPanel: function () {
    var host = $('#kndSaranPanel');
    if (host) { host.style.display = 'none'; host.innerHTML = ''; }
  },

  tampilSaranMemuat: function () {
    var host = KendaraanModule.ensureSaranPanel();
    if (!host) return;
    host.style.display = '';
    host.innerHTML = '<div class="knd-saran-row"><span class="knd-saran-spin"></span>' +
      '<span class="knd-saran-txt">Mencari kendaraan &amp; driver terbaik dari riwayat Anda…</span></div>';
  },

  tandaiPanelManual: function () {
    var badge = $('#kndSaranManualBadge');
    if (badge) badge.style.display = '';
  },

  renderSaranPanel: function (d) {
    var host = KendaraanModule.ensureSaranPanel();
    if (!host) return;
    var u = d.usulan || {};
    if (!u.kendaraan_id && !u.driver_id) {
      // Tak ada kandidat sama sekali (mis. semua bentrok / belum ada master).
      host.style.display = '';
      host.innerHTML = '<div class="knd-saran-row"><span class="knd-saran-ic">ℹ️</span>' +
        '<span class="knd-saran-txt">Belum ada usulan otomatis — silakan pilih kendaraan &amp; driver secara manual.</span></div>';
      return;
    }
    var judul = d.ada_riwayat
      ? '✨ Diisi otomatis dari pola trip Anda'
      : '✨ Diisi otomatis (belum ada riwayat — dipilih dari ketersediaan &amp; kapasitas)';

    var baris = '';
    if (u.kendaraan_id) {
      baris += '<div class="knd-saran-item">' +
        '<span class="knd-saran-ic">' + iconSvg('car') + '</span>' +
        '<div class="knd-saran-body"><b>' + escapeHtml(u.kendaraan_label || u.nopol || 'Kendaraan') + '</b>' +
        (u.alasan_kendaraan ? '<div class="knd-saran-why' + (u.kendaraan_kurang ? ' is-warn' : '') + '">' +
          escapeHtml(u.alasan_kendaraan) + '</div>' : '') + '</div>' +
        '<button type="button" class="knd-saran-ganti" data-ganti="kendaraan">Ganti</button>' +
      '</div>';
    }
    if (u.driver_id) {
      baris += '<div class="knd-saran-item">' +
        '<span class="knd-saran-ic">' + iconSvg('user') + '</span>' +
        '<div class="knd-saran-body"><b>' + escapeHtml(u.driver_nama || 'Driver') + '</b>' +
        (u.alasan_driver ? '<div class="knd-saran-why">' + escapeHtml(u.alasan_driver) + '</div>' : '') + '</div>' +
        '<button type="button" class="knd-saran-ganti" data-ganti="driver">Ganti</button>' +
      '</div>';
    }

    host.style.display = '';
    host.innerHTML =
      '<div class="knd-saran-head"><span>' + judul + '</span>' +
        '<span id="kndSaranManualBadge" class="knd-saran-manual" style="display:' +
          ((KendaraanModule._saranManualKnd || KendaraanModule._saranManualDrv) ? '' : 'none') +
          '">disesuaikan manual</span></div>' +
      baris;

    // Tombol "Ganti" = fokuskan + buka dropdown terkait (satu klik pindah pilihan).
    $all('[data-ganti]', host).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-ganti') === 'driver' ? $('#kndFDriver') : $('#kndFKendaraan');
        if (!target) return;
        if (btn.getAttribute('data-ganti') === 'driver') KendaraanModule._saranManualDrv = true;
        else KendaraanModule._saranManualKnd = true;
        KendaraanModule.tandaiPanelManual();
        target.focus();
        // Buka daftar opsi bila browser mendukung (Chromium).
        if (typeof target.showPicker === 'function') { try { target.showPicker(); } catch (e) {} }
      });
    });
  },

  submitBooking: function () {
    var tgl = $('#kndFTanggal').value, jamB = $('#kndFBerangkat').value, tujuan = $('#kndFTujuan').value.trim();
    if (!tgl || !jamB || !tujuan) { Toast.warning('Tanggal, jam berangkat, dan tujuan wajib diisi'); return; }
    var tsEl = $('#kndFTanggalSelesai');
    var tglSelesai = tsEl ? tsEl.value : '';
    if (tglSelesai) {
      if (tglSelesai < tgl) { Toast.warning('Tanggal selesai harus setelah tanggal pakai'); return; }
      if ((new Date(tglSelesai) - new Date(tgl)) / 86400000 > 14) { Toast.warning('Rentang peminjaman maksimum 14 hari'); return; }
    }
    var lkEl = $('#kndFLuarKota');
    var btn = $('#kndFSubmit'), txt = $('#kndFSubmitText');
    btnLoading(btn, txt, true);
    API.call('createBookingKendaraan', {
      req_id: ReqKey.get('knd'), // Audit #2: kunci idempoten anti dobel-kirim
      tanggal_pakai: tgl, tanggal_selesai: tglSelesai,
      luar_kota: (lkEl && lkEl.checked) ? '1' : '',
      jam_berangkat: jamB, jam_kembali: $('#kndFKembali').value,
      tujuan: tujuan, keperluan: $('#kndFKeperluan').value.trim(),
      jumlah_penumpang: $('#kndFPenumpang').value,
      kendaraan_id: $('#kndFKendaraan').value, driver_id: $('#kndFDriver').value,
      catatan: $('#kndFCatatan').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Kirim Pengajuan');
      if (res.success) { ReqKey.clear('knd'); Modal.close('modalKendaraan'); Toast.success(res.message || 'Pengajuan terkirim'); KendaraanModule.load(); }
      else Toast.error(res.error || 'Gagal mengirim pengajuan');
    });
  },

  /* V7.8: siapa yang mengisi KM? Driver yang ditugaskan, admin, atau pemohon
     yang menyetir sendiri (booking tanpa driver). Pemohon yang perjalanannya
     memakai driver TIDAK mengisi KM — cukup menandai selesai. */
  bolehIsiKm: function (b) {
    var me = (Auth.user && (Auth.user.nama || Auth.user.username)) || '';
    var adaDriver = !!String(b.nama_driver || '').trim();
    if (!adaDriver) return isOwn(b) || isAdmin2();
    return String(b.nama_driver) === String(me) || isAdmin2();
  },

  _tripModeKm: true,
  openTrip: function (bk) {
    if (!bk) return;
    $('#tripId').value = bk.id;
    $('#tripInfoTujuan').textContent = bk.tujuan || '—';
    $('#tripInfoMeta').textContent = (bk.nopol || 'Kendaraan') + ' · ' + fmtDateShort(bk.tanggal_pakai) +
      (bk.nama_driver ? ' · Driver: ' + bk.nama_driver : '');
    $('#tripKmBerangkat').value = bk.km_berangkat || '';
    $('#tripKmKembali').value = bk.km_kembali || '';
    // Otomasi V7.15: bila KM berangkat masih kosong, isi otomatis dari odometer
    // terakhir kendaraan — driver tak perlu menghafal/mengetik ulang.
    var hint = $('#tripKmBerangkatHint');
    if (hint) { hint.style.display = 'none'; hint.textContent = ''; }
    if (!bk.km_berangkat && bk.kendaraan_id) {
      API.call('getKmKendaraanTerakhir', { kendaraan_id: bk.kendaraan_id }).then(function (r) {
        // Hanya isi bila field masih kosong (user belum sempat mengetik) & masih trip yang sama.
        if (!r || !r.success || !r.ada) return;
        if ($('#tripId').value !== String(bk.id)) return;
        var inp = $('#tripKmBerangkat');
        if (inp && !inp.value) {
          inp.value = r.km_terakhir;
          if (hint) {
            hint.style.display = '';
            hint.innerHTML = '✨ Terisi otomatis dari odometer terakhir kendaraan (' +
              Number(r.km_terakhir).toLocaleString('id-ID') + ' km). Ubah bila berbeda.';
          }
        }
      });
    }

    /* V7.8: modal beradaptasi dengan peran — pemohon yang perjalanannya
       memakai driver hanya melihat tombol "Tandai Selesai"; kolom KM
       disembunyikan (KM porsi driver). Elemen #tripKmWrap/#tripSelesaiInfo
       ada di Index baru; pada Index lama modal berperilaku seperti dulu. */
    var modeKm = KendaraanModule.bolehIsiKm(bk);
    KendaraanModule._tripModeKm = modeKm;
    var wrap = $('#tripKmWrap'), info = $('#tripSelesaiInfo');
    if (wrap) wrap.classList.toggle('hidden', !modeKm);
    if (info) {
      info.classList.toggle('hidden', modeKm);
      info.textContent = 'KM perjalanan akan diisi oleh driver ' + (bk.nama_driver || '') +
        '. Anda cukup menandai perjalanan selesai — driver otomatis diberi tahu untuk melengkapi KM.';
    }
    var txt = $('#tripSubmitText');
    if (txt) txt.textContent = modeKm ? 'Simpan' : 'Tandai Selesai';
    Modal.open('modalTripLog');
  },

  submitTrip: function () {
    var id = $('#tripId').value;
    var btn = $('#tripSubmit'), txt = $('#tripSubmitText');
    /* V7.8: mode pemohon — cukup tandai selesai, tanpa KM */
    if (!KendaraanModule._tripModeKm) {
      btnLoading(btn, txt, true);
      API.call('updateTripLog', { id: id, tandai_selesai: 1 }).then(function (res) {
        btnLoading(btn, txt, false, 'Tandai Selesai');
        if (res.success) { Modal.close('modalTripLog'); Toast.success(res.message || 'Perjalanan selesai'); KendaraanModule.load(); }
        else Toast.error(res.error || 'Gagal menandai selesai');
      });
      return;
    }
    var kmB = $('#tripKmBerangkat').value, kmK = $('#tripKmKembali').value;
    if (!kmB && !kmK) { Toast.warning('Isi KM berangkat atau KM kembali'); return; }
    btnLoading(btn, txt, true);
    API.call('updateTripLog', { id: id, km_berangkat: kmB, km_kembali: kmK }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan');
      if (res.success) { Modal.close('modalTripLog'); Toast.success(res.message || 'Trip log tersimpan'); KendaraanModule.load(); }
      else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  renderBBMStats: function (d) {
    var persen = d.persen_budget || 0, over = d.over_budget;
    $('#bbmBudgetVal').textContent = rupiahFmt(d.total_biaya);
    var badge = $('#bbmBudgetBadge');
    badge.textContent = persen + '% terpakai';
    badge.className = 'badge ' + (over ? 'badge-cancelled' : (persen >= 80 ? 'badge-waiting' : 'badge-done'));
    var bar = $('#bbmBudgetBar');
    bar.style.width = Math.min(100, persen) + '%';
    bar.className = 'progress-bar' + (over ? ' is-danger' : (persen >= 80 ? ' is-warning' : ''));
    var card = $('#bbmBudgetVal').closest('.stat-accent-card');
    if (card) card.classList.toggle('is-over', !!over);
    $('#bbmBudgetSub').textContent = 'dari ' + rupiahFmt(d.budget) + ' · sisa ' + rupiahFmt(d.sisa_budget) +
      ' · ' + (d.total_liter || 0) + ' L (' + (d.total_pengisian || 0) + '×)';

    var eff = d.per_kendaraan || [];
    $('#bbmEfisiensi').innerHTML = eff.length ? '<div class="mini-list">' + eff.map(function (e) {
      return '<div class="mini-item"><div><div class="mini-main">' + escapeHtml(e.nopol) + '</div>' +
        '<div class="mini-sub">' + (e.liter || 0) + ' L · ' + rupiahFmt(e.biaya) + '</div></div>' +
        '<div class="mini-val">' + (e.efisiensi ? e.efisiensi + ' km/L' : '—') + '</div></div>';
    }).join('') + '</div>' : emptyBoxHtml('droplet', 'Belum ada data BBM bulan ini');
  },

  renderBBMTable: function () {
    var rows = KendaraanModule.bbm;
    if (!rows.length) {
      $('#bbmTableBody').innerHTML = emptyRow(6, 'droplet', 'Belum ada pengisian BBM', 'Klik "Catat Pengisian" untuk mencatat.');
      return;
    }
    $('#bbmTableBody').innerHTML = rows.map(function (b) {
      var bukti = b.ada_bukti
        ? fotoChip(b.bukti_url, 'Struk / bukti')
        : '<span class="text-muted" style="font-size:11px">—</span>';
      return '<tr>' +
        '<td>' + fmtDateShort(b.tanggal) + '</td>' +
        '<td class="cell-primary">' + escapeHtml(b.nopol || '—') + '</td>' +
        '<td>' + (b.jumlah_liter || 0) + ' L</td>' +
        '<td>' + rupiahFmt(b.total_biaya) + '</td>' +
        '<td>' + escapeHtml(b.spbu || '—') + '</td>' +
        '<td>' + bukti + '</td>' +
      '</tr>';
    }).join('');
  },

  openBBMForm: function () {
    MasterData.ensure(function () {
      fillSelect($('#bbmFKendaraan'), MasterData.kendaraan, '— Pilih kendaraan —', function (k) { return (k.nopol || '') + ' · ' + (k.merk || ''); });
      fillSelect($('#bbmFDriver'), MasterData.drivers, '— Tanpa driver —', function (d) { return d.nama; });
    });
    ['bbmFOdometer', 'bbmFLiter', 'bbmFSpbu', 'bbmFCatatan'].forEach(function (id) { $('#' + id).value = ''; });
    $('#bbmFTanggal').value = todayISO();
    $('#bbmFHarga').value = '10000';
    $('#bbmFTotal').value = ''; $('#bbmFTotal').dataset.touched = '';
    $('#bbmFStruk').value = ''; KendaraanModule.strukData = '';
    $('#bbmStrukPreview').classList.remove('is-visible');
    Modal.open('modalBBM');
  },

  submitBBM: function () {
    var kid = $('#bbmFKendaraan').value, liter = $('#bbmFLiter').value;
    if (!kid) { Toast.warning('Pilih kendaraan'); return; }
    if (!liter || parseFloat(liter) <= 0) { Toast.warning('Jumlah liter wajib diisi'); return; }
    var btn = $('#bbmFSubmit'), txt = $('#bbmFSubmitText');
    btnLoading(btn, txt, true);
    API.call('createBBM', {
      req_id: ReqKey.get('bbm'), // Audit #2
      kendaraan_id: kid, driver_id: $('#bbmFDriver').value,
      tanggal: $('#bbmFTanggal').value, odometer: $('#bbmFOdometer').value,
      jumlah_liter: liter, harga_per_liter: $('#bbmFHarga').value,
      total_biaya: $('#bbmFTotal').value, jenis_bbm: $('#bbmFJenis').value,
      spbu: $('#bbmFSpbu').value.trim(), bukti_struk: KendaraanModule.strukData,
      catatan: $('#bbmFCatatan').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan Pengisian');
      if (res.success) {
        ReqKey.clear('bbm');
        Modal.close('modalBBM');
        Toast.success(res.message || 'Pengisian tercatat');
        if (res.over_budget) Toast.warning('Perhatian: anggaran BBM bulan ini terlampaui');
        KendaraanModule.loadBBM();
      } else Toast.error(res.error || 'Gagal menyimpan');
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: BOOKING RUANGAN (Fase 2)
   ══════════════════════════════════════════════════════════════════════════ */
var RuanganModule = {
  booking: [],
  init: function () {
    $('#rgnAddBtn').addEventListener('click', RuanganModule.openForm);
    $('#rgnRefreshBtn').addEventListener('click', function () { RuanganModule.load(true); });
    $('#rgnFilterStatus').addEventListener('change', RuanganModule.renderTable);
    $('#rgnJadwalTgl').addEventListener('change', RuanganModule.loadJadwal);
    $('#rgnFSubmit').addEventListener('click', RuanganModule.submit);
  },
  load: function (showToast) {
    if (!$('#rgnJadwalTgl').value) $('#rgnJadwalTgl').value = todayISO();
    var tgl = $('#rgnJadwalTgl').value || todayISO();
    // SATU round-trip untuk master + booking + jadwal (bundel V6.6) — dulu
    // 5 panggilan terpisah. Fallback mulus ke jalur lama.
    API.call('getModuleBundle', { module: 'ruangan', filter: { tanggal: tgl } }).then(function (r) {
      if (r.success && r.data) {
        var d = r.data;
        MasterData.absorb(d.master);
        if (MasterData.loaded) RuanganModule.renderDaftar();
        else MasterData.ensure(function () { RuanganModule.renderDaftar(); });
        if (d.booking && d.booking.success) { RuanganModule.booking = d.booking.data || []; RuanganModule.renderTable(); }
        else if (d.booking) Toast.error('Gagal memuat pengajuan', d.booking.error);
        RuanganModule.applyJadwal(d.jadwal);
      } else {
        RuanganModule.loadLegacy();
      }
      if (showToast) Toast.info('Data ruangan diperbarui');
    });
  },
  loadLegacy: function () {
    MasterData.ensure(function () { RuanganModule.renderDaftar(); });
    RuanganModule.loadJadwal();
    API.call('getBookingRuangan', {}).then(function (r) {
      if (r.success) { RuanganModule.booking = r.data || []; RuanganModule.renderTable(); }
      else Toast.error('Gagal memuat pengajuan', r.error);
    });
  },
  loadJadwal: function () {
    var tgl = $('#rgnJadwalTgl').value || todayISO();
    API.call('getJadwalRuangan', { tanggal: tgl }).then(function (r) { RuanganModule.applyJadwal(r); });
  },
  /** Terapkan hasil getJadwalRuangan (dipakai load bundel & loadJadwal) */
  applyJadwal: function (r) {
    if (!r || !r.success) return;
    var rows = r.data || [];
    $('#rgnJadwal').innerHTML = rows.length ? rows.map(function (j) {
      return '<div class="jadwal-item"><div class="jadwal-time">' + escapeHtml(j.jam_mulai) + '–' + escapeHtml(j.jam_selesai) + '</div>' +
        '<div class="jadwal-body"><div class="j-title">' + escapeHtml(j.nama_ruangan) + '</div>' +
        '<div class="j-sub">' + escapeHtml(j.pemohon) + (j.keperluan ? ' · ' + escapeHtml(j.keperluan) : '') + '</div></div></div>';
    }).join('') : emptyBoxHtml('calendar', 'Belum ada jadwal disetujui pada tanggal ini');
  },
  renderDaftar: function () {
    var rows = MasterData.ruangan;
    $('#rgnDaftar').innerHTML = rows.length ? '<div class="mini-list">' + rows.map(function (r) {
      var avail = onlyActive(r);
      return '<div class="mini-item"><div><div class="mini-main">' + escapeHtml(r.nama_ruangan) + '</div>' +
        '<div class="mini-sub">' + (r.lantai ? 'Lt. ' + escapeHtml(r.lantai) + ' · ' : '') + 'Kapasitas ' + escapeHtml(r.kapasitas || '—') + '</div></div>' +
        '<span class="chip' + (avail ? '' : ' is-danger') + '">' + (avail ? 'Tersedia' : 'Nonaktif') + '</span></div>';
    }).join('') + '</div>' : emptyBoxHtml('door', 'Belum ada data ruangan');
  },
  renderTable: function () {
    var f = $('#rgnFilterStatus').value;
    var rows = RuanganModule.booking.filter(function (b) { return !f || String(b.status) === f; });
    if (!rows.length) { $('#rgnTableBody').innerHTML = emptyRow(7, 'door', 'Belum ada pengajuan ruangan', 'Klik "Ajukan Ruangan" untuk memulai.'); return; }
    $('#rgnTableBody').innerHTML = rows.map(function (b) {
      var actions = '<button class="btn btn-ghost btn-sm" data-detail="' + escapeHtml(b.id) + '">Detail</button>';
      if (b.status === 'pending' && (isOwn(b) || isAdmin2())) {
        actions += '<button class="btn btn-outline btn-sm" data-cancel="' + escapeHtml(b.id) + '">Batalkan</button>';
      } else if (b.status === 'approved' && (isOwn(b) || isAdmin2())) {
        // V7 (Bagian 3.2): lepaskan ruangan yang sudah disetujui — slot langsung bebas
        actions += '<button class="btn btn-outline btn-sm" data-lepas="' + escapeHtml(b.id) + '">Batalkan</button>';
      }
      return '<tr>' +
        '<td>' + fmtDateShort(b.tanggal_pakai) + '</td>' +
        '<td class="cell-primary">' + escapeHtml(b.nama_ruangan) + '</td>' +
        '<td><div>' + escapeHtml(b.pemohon) + '</div><div class="cell-sub">' + escapeHtml(b.bagian || '') + '</div></td>' +
        '<td>' + escapeHtml(fmtTime(b.jam_mulai)) + '–' + escapeHtml(fmtTime(b.jam_selesai)) + '</td>' +
        '<td style="max-width:180px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + escapeHtml(b.keperluan || '') + '">' + escapeHtml(b.keperluan || '—') + '</div></td>' +
        '<td>' + statusBadge(b.status) + '</td>' +
        '<td><div class="cell-actions">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
    RuanganModule.bindActions();
  },
  bindActions: function () {
    var root = $('#rgnTableBody');
    $all('[data-detail]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var bk = RuanganModule.booking.filter(function (x) { return String(x.id) === String(b.getAttribute('data-detail')); })[0];
        if (bk) RuanganModule.showDetail(bk);
      });
    });
    $all('[data-cancel]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Batalkan pengajuan ruangan?', 'Pengajuan yang dibatalkan tidak diproses persetujuan.', function () {
          apiKlikSekali(b, 'cancelBookingRuangan', { id: b.getAttribute('data-cancel') }).then(function (res) {
            // Catatan audit: segarkan badge Pusat Persetujuan agar tidak basi
            if (res.success) { Toast.success(res.message || 'Dibatalkan'); RuanganModule.load(); ApprovalModule.softRefresh(); }
            else Toast.error(res.error || 'Gagal membatalkan');
          });
        });
      });
    });
    $all('[data-lepas]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Batalkan booking yang sudah disetujui?',
          'Slot ruangan langsung dibebaskan; grup admin diberi tahu.', function () {
          apiKlikSekali(b, 'lepasBookingRuangan', { id: b.getAttribute('data-lepas') }).then(function (res) {
            if (res.success) { Toast.success(res.message || 'Dibatalkan'); RuanganModule.load(); ApprovalModule.softRefresh(); }
            else Toast.error(res.error || 'Gagal membatalkan');
          });
        });
      });
    });
  },

  showDetail: function (b) {
    var pairs = [
      ['Status', statusBadge(b.status), { html: true }],
      ['Pemohon', b.pemohon + (b.bagian ? ' · ' + b.bagian : '')],
      ['Ruangan', b.nama_ruangan],
      ['Tanggal pakai', fmtDateShort(b.tanggal_pakai)],
      ['Waktu', fmtTime(b.jam_mulai) + '–' + fmtTime(b.jam_selesai)],
      ['Keperluan', b.keperluan],
      ['Peserta', b.jumlah_peserta],
      ['Peralatan', b.peralatan],
      ['Konsumsi', b.konsumsi],
      ['Catatan', b.catatan]
    ];
    if (b.status === 'rejected') pairs.push(['Alasan ditolak', b.alasan_tolak]);
    if (b.approved_by) pairs.push(['Diproses oleh', b.approved_by]);
    if (b.status === 'pending' && isApprover()) {
      pairs.push(['Persetujuan', 'Proses melalui menu <b>Pusat Persetujuan</b>.', { html: true }]);
    }
    DetailView.show('Detail Booking Ruangan', pairs);
  },
  openForm: function () {
    MasterData.ensure(function () {
      fillSelect($('#rgnFRuangan'), MasterData.ruangan.filter(onlyActive), '— Pilih ruangan —',
        function (r) { return r.nama_ruangan + (r.kapasitas ? ' (kap. ' + r.kapasitas + ')' : ''); });
    });
    ['rgnFKeperluan', 'rgnFPeralatan', 'rgnFKonsumsi', 'rgnFCatatan'].forEach(function (id) { $('#' + id).value = ''; });
    $('#rgnFTanggal').value = todayISO();
    $('#rgnFMulai').value = '09:00'; $('#rgnFSelesai').value = '10:00';
    $('#rgnFPeserta').value = '1';
    Modal.open('modalRuangan');
  },
  submit: function () {
    var rid = $('#rgnFRuangan').value, tgl = $('#rgnFTanggal').value, m = $('#rgnFMulai').value, s = $('#rgnFSelesai').value;
    if (!rid || !tgl || !m || !s) { Toast.warning('Ruangan, tanggal, jam mulai & selesai wajib diisi'); return; }
    var btn = $('#rgnFSubmit'), txt = $('#rgnFSubmitText');
    btnLoading(btn, txt, true);
    API.call('createBookingRuangan', {
      req_id: ReqKey.get('rng'), // Audit #2
      ruangan_id: rid, tanggal_pakai: tgl, jam_mulai: m, jam_selesai: s,
      keperluan: $('#rgnFKeperluan').value.trim(), jumlah_peserta: $('#rgnFPeserta').value,
      peralatan: $('#rgnFPeralatan').value.trim(), konsumsi: $('#rgnFKonsumsi').value.trim(),
      catatan: $('#rgnFCatatan').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Kirim Pengajuan');
      if (res.success) { ReqKey.clear('rng'); Modal.close('modalRuangan'); Toast.success(res.message || 'Pengajuan terkirim'); RuanganModule.load(); }
      else Toast.error(res.error || 'Gagal mengirim');
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: ATK (STOK & PERMINTAAN) (Fase 2)
   ══════════════════════════════════════════════════════════════════════════ */
var ATKModule = {
  stock: [], permintaan: [], cart: [], catFilter: '', fotoBaru: '', fotoHapus: false,
  init: function () {
    $('#atkRequestBtn').addEventListener('click', ATKModule.openRequest);
    $('#atkRefreshBtn').addEventListener('click', function () { ATKModule.load(true); });
    $('#atkSearch').addEventListener('input', ATKModule.renderStock);
    $('#atkFilterStatus').addEventListener('change', ATKModule.renderPermintaan);
    // Katalog permintaan (V6.9 — gaya belanja daring)
    $('#atkShopSearch').addEventListener('input', function () { ATKModule.renderShop(); });
    $('#atkShopNext').addEventListener('click', function () { ATKModule.gotoStep(2); });
    $('#atkShopBack').addEventListener('click', function () { ATKModule.gotoStep(1); });
    $('#atkFSubmit').addEventListener('click', ATKModule.submitRequest);
    // Satu listener terdelegasi untuk tombol +/− di grid katalog & keranjang
    ['atkShopGrid', 'atkCartList'].forEach(function (idBox) {
      var box = document.getElementById(idBox);
      if (!box) return;
      box.addEventListener('click', function (e) {
        var t = e.target && e.target.closest
          ? e.target.closest('[data-add],[data-plus],[data-minus],[data-rm]') : null;
        if (!t || t.disabled) return;
        if (t.hasAttribute('data-add'))        ATKModule.cartSet(t.getAttribute('data-add'), 1);
        else if (t.hasAttribute('data-plus'))  ATKModule.cartDelta(t.getAttribute('data-plus'), 1);
        else if (t.hasAttribute('data-minus')) ATKModule.cartDelta(t.getAttribute('data-minus'), -1);
        else ATKModule.cartRemove(t.getAttribute('data-rm'));
      });
    });
    $('#atkAddStockBtn').addEventListener('click', function () { ATKModule.openStock(null); });
    $('#asFSubmit').addEventListener('click', ATKModule.submitStock);
    // Foto barang (admin, V6.10) — input file polos diganti tombol
    // "Ambil dari Kamera" (capture="environment" → di HP/tablet langsung
    // membuka KAMERA perangkat) + "Pilih dari Galeri" + "Hapus Foto".
    // UI disuntik dari JS sehingga Index.html TIDAK perlu diubah.
    var fFoto = $('#asFFoto');
    if (fFoto && !$('#asFFotoKamera')) {
      fFoto.style.display = 'none';
      fFoto.insertAdjacentHTML('afterend',
        '<input type="file" id="asFFotoKamera" accept="image/*" capture="environment" style="display:none">' +
        '<div class="pmp-foto-btns" id="asFotoBtns">' +
          '<button type="button" class="btn btn-outline btn-sm" id="asFotoKameraBtn">' +
            '<svg class="btn-icon" data-icon="camera"></svg> Ambil dari Kamera</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="asFotoGaleriBtn">' +
            '<svg class="btn-icon" data-icon="file"></svg> Pilih dari Galeri</button>' +
          '<button type="button" class="btn btn-ghost btn-sm hidden" id="asFotoHapusBtn">' +
            '<svg class="btn-icon" data-icon="trash"></svg> Hapus Foto</button>' +
        '</div>');
      renderIcons($('#asFotoBtns'));
      $('#asFotoKameraBtn').addEventListener('click', function () { $('#asFFotoKamera').click(); });
      $('#asFotoGaleriBtn').addEventListener('click', function () { fFoto.click(); });
      $('#asFotoHapusBtn').addEventListener('click', function () { ATKModule.hapusFotoBarang(); });
      fFoto.addEventListener('change', function () { ATKModule.onFotoBarang(this); });
      $('#asFFotoKamera').addEventListener('change', function () { ATKModule.onFotoBarang(this); });
    }
    initTabs('#atkTabs', '[data-view-panel="atk"]');
    // Tab Analisis dimuat malas saat pertama dibuka.
    // CATATAN: visibilitas TIDAK diputuskan di init() — init berjalan saat boot
    // SEBELUM login (Auth.user masih null) sehingga cek role di sini selalu
    // false dan tab tersembunyi permanen, bahkan untuk admin. Visibilitas
    // ditentukan di load() yang berjalan setelah user siap.
    var tabAn = $('#atkTabAnalisis');
    if (tabAn) tabAn.addEventListener('click', function () { ATKModule.loadAnalisis(); });
  },
  load: function (showToast) {
    // Visibilitas tab Analisis diputuskan di sini (Auth.user sudah pasti terisi)
    var tabAn = $('#atkTabAnalisis');
    if (tabAn) {
      var role = String(Auth.user && Auth.user.role).toLowerCase();
      tabAn.style.display = (['kabag', 'admin', 'super_admin'].indexOf(role) !== -1) ? '' : 'none';
    }
    // SATU round-trip untuk stats + stok + permintaan (bundel V6.6)
    API.call('getModuleBundle', { module: 'atk' }).then(function (r) {
      if (r.success && r.data) {
        var d = r.data;
        if (d.stats && d.stats.success) ATKModule.renderStats(d.stats.data);
        if (d.stock && d.stock.success) { ATKModule.stock = d.stock.data || []; ATKModule.renderStock(); }
        if (d.permintaan && d.permintaan.success) { ATKModule.permintaan = d.permintaan.data || []; ATKModule.renderPermintaan(); }
        // Audit V7 #5: toast "diperbarui" HANYA di cabang sukses
        if (showToast) Toast.info('Data ATK diperbarui');
      } else {
        ATKModule.loadLegacy();
        if (showToast) Toast.warning('Gagal menyegarkan data ATK', r.error || 'Mencoba jalur muat lama…');
      }
      // Bila tab Analisis pernah dibuka, ikut disegarkan
      if (ATKModule._analisisLoaded) ATKModule.loadAnalisis(true);
    });
  },
  loadLegacy: function () {
    API.call('getATKStats').then(function (r) { if (r.success) ATKModule.renderStats(r.data); });
    API.call('getATKStock').then(function (r) { if (r.success) { ATKModule.stock = r.data || []; ATKModule.renderStock(); } });
    API.call('getATKPermintaan', {}).then(function (r) { if (r.success) { ATKModule.permintaan = r.data || []; ATKModule.renderPermintaan(); } });
  },
  renderStats: function (d) {
    $('#atkStats').innerHTML = [
      { icon: 'box', cls: 'stat-teal', val: d.total_barang, label: 'Jenis Barang' },
      { icon: 'alert', cls: 'stat-rose', val: d.perlu_reorder, label: 'Perlu Restok' },
      { icon: 'clock', cls: 'stat-amber', val: d.permintaan_pending, label: 'Permintaan Menunggu' },
      { icon: 'check', cls: 'stat-green', val: d.permintaan_approved, label: 'Siap Diambil' }
    ].map(statCardHtml).join('');
  },
  renderStock: function () {
    var q = ($('#atkSearch').value || '').toLowerCase();
    var admin = isAdmin2();
    var rows = ATKModule.stock.filter(function (a) {
      if (!q) return true;
      return String(a.nama_barang).toLowerCase().indexOf(q) !== -1 ||
             String(a.kode_barang).toLowerCase().indexOf(q) !== -1 ||
             String(a.kategori).toLowerCase().indexOf(q) !== -1;
    });
    var colspan = admin ? 7 : 6;
    if (!rows.length) { $('#atkStockBody').innerHTML = emptyRow(colspan, 'box', 'Belum ada barang', admin ? 'Klik "Barang" untuk menambah stok.' : ''); return; }
    $('#atkStockBody').innerHTML = rows.map(function (a) {
      var adminCol = admin ? '<td><div class="cell-actions">' +
        '<button class="btn btn-ghost btn-sm" data-edit="' + escapeHtml(a.id) + '">Edit</button>' +
        '<button class="btn btn-ghost btn-sm" data-del="' + escapeHtml(a.id) + '">Hapus</button></div></td>' : '';
      return '<tr>' +
        '<td class="cell-mono">' + escapeHtml(a.kode_barang || '—') + '</td>' +
        '<td><div style="display:flex;align-items:center;gap:9px">' +
          (driveImgSrc(a.foto, 80) ? '<img src="' + escapeHtml(driveImgSrc(a.foto, 80)) + '" alt="" loading="lazy" data-tw="80" onerror="fotoTunnelCoba(this,\'sembunyi\')" style="width:34px;height:34px;object-fit:cover;border-radius:8px;border:1px solid var(--border);flex:none">' : '') +
          '<div style="min-width:0"><div class="cell-primary">' + escapeHtml(a.nama_barang) + '</div><div class="cell-sub">' + escapeHtml(a.lokasi || '') + '</div></div></div></td>' +
        '<td>' + escapeHtml(a.kategori || '—') + '</td>' +
        '<td class="fw-bold">' + (a.stok || 0) + ' ' + escapeHtml(a.satuan || '') + '</td>' +
        '<td>' + (a.stok_minimum || 0) + '</td>' +
        '<td>' + (a.perlu_reorder ? '<span class="chip is-danger">Restok</span>' : '<span class="chip">Aman</span>') + '</td>' +
        adminCol +
      '</tr>';
    }).join('');
    if (admin) ATKModule.bindStockActions();
  },
  bindStockActions: function () {
    var root = $('#atkStockBody');
    $all('[data-edit]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = ATKModule.stock.filter(function (x) { return String(x.id) === String(b.getAttribute('data-edit')); })[0];
        ATKModule.openStock(a);
      });
    });
    $all('[data-del]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-del');
        Confirm.ask('Hapus barang ini?', 'Data barang akan dihapus dari daftar stok.', function () {
          apiKlikSekali(b, 'deleteATKStock', { id: id }).then(function (res) {
            if (res.success) { Toast.success('Barang dihapus'); ATKModule.load(); } else Toast.error(res.error || 'Gagal menghapus');
          });
        });
      });
    });
  },
  renderPermintaan: function () {
    var f = $('#atkFilterStatus').value;
    var rows = ATKModule.permintaan.filter(function (p) { return !f || String(p.status) === f; });
    if (!rows.length) { $('#atkRequestBody').innerHTML = emptyRow(6, 'clipboard', 'Belum ada permintaan', 'Klik "Minta Barang" untuk mengajukan.'); return; }
    var admin = isAdmin2();
    $('#atkRequestBody').innerHTML = rows.map(function (p) {
      var items = p.items || [];
      var barangText = items.map(function (i) { return i.nama_barang + ' (' + i.jumlah + ')'; }).join(', ');
      var barangCell = escapeHtml(items.length ? items[0].nama_barang + ' (' + items[0].jumlah + ')' : '—') +
        (items.length > 1 ? ' <span class="chip">+' + (items.length - 1) + ' barang lain</span>' : '');
      var actions = '<button class="btn btn-ghost btn-sm" data-detail="' + escapeHtml(p.id) + '">Detail</button>';
      if (p.status === 'pending' && (isOwn(p) || admin)) {
        actions += '<button class="btn btn-outline btn-sm" data-cancel="' + escapeHtml(p.id) + '">Batalkan</button>';
      } else if (p.status === 'approved' && admin) {
        actions += '<button class="btn btn-primary btn-sm" data-ambil="' + escapeHtml(p.id) + '">Konfirmasi Ambil</button>';
      }
      return '<tr>' +
        '<td>' + fmtDateShort(p.tanggal) + '</td>' +
        '<td><div class="cell-primary">' + escapeHtml(p.pemohon) + '</div><div class="cell-sub">' + escapeHtml(p.bagian || '') + '</div></td>' +
        '<td style="max-width:240px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + escapeHtml(barangText) + '">' + barangCell + '</div></td>' +
        '<td style="max-width:150px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + escapeHtml(p.keperluan || '') + '">' + escapeHtml(p.keperluan || '—') + '</div></td>' +
        '<td>' + statusBadge(p.status) + '</td>' +
        '<td><div class="cell-actions">' + actions + '</div></td>' +
      '</tr>';
    }).join('');
    ATKModule.bindPermintaanActions();
  },
  bindPermintaanActions: function () {
    var root = $('#atkRequestBody');
    $all('[data-detail]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = ATKModule.permintaan.filter(function (x) { return String(x.id) === String(b.getAttribute('data-detail')); })[0];
        if (p) ATKModule.showDetail(p);
      });
    });
    $all('[data-cancel]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Batalkan permintaan ATK?', 'Permintaan yang dibatalkan tidak diproses persetujuan.', function () {
          apiKlikSekali(b, 'cancelATKPermintaan', { id: b.getAttribute('data-cancel') }).then(function (res) {
            // Catatan audit: segarkan badge Pusat Persetujuan agar tidak basi
            if (res.success) { Toast.success(res.message || 'Dibatalkan'); ATKModule.load(); ApprovalModule.softRefresh(); }
            else Toast.error(res.error || 'Gagal membatalkan');
          });
        });
      });
    });
    $all('[data-ambil]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Konfirmasi pengambilan?', 'Stok barang akan dikurangi sesuai jumlah permintaan.', function () {
          apiKlikSekali(b, 'ambilATKPermintaan', { id: b.getAttribute('data-ambil') }).then(function (res) {
            if (res.success) { Toast.success(res.message || 'Pengambilan dikonfirmasi'); ATKModule.load(); }
            else Toast.error(res.error || 'Gagal');
          });
        });
      });
    });
  },
  showDetail: function (p) {
    var items = p.items || [];
    var itemsHtml = items.length
      ? items.map(function (i) {
          return '<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px dashed var(--border)">' +
            '<span>' + escapeHtml(i.nama_barang || '-') + '</span><b>× ' + escapeHtml(i.jumlah) + '</b></div>';
        }).join('')
      : '—';
    var pairs = [
      ['Status', statusBadge(p.status), { html: true }],
      ['Pemohon', p.pemohon + (p.bagian ? ' · ' + p.bagian : '')],
      ['Tanggal', fmtDateShort(p.tanggal)],
      ['Barang (' + items.length + ')', itemsHtml, { html: true }],
      ['Keperluan', p.keperluan],
      ['Catatan', p.catatan]
    ];
    if (p.approved_by) pairs.push(['Diproses oleh', p.approved_by]);
    if (p.tgl_diambil) pairs.push(['Diambil', fmtDateShort(p.tgl_diambil)]);
    if (p.status === 'pending' && isApprover()) {
      pairs.push(['Persetujuan', 'Proses melalui menu <b>Pusat Persetujuan</b>.', { html: true }]);
    }
    DetailView.show('Detail Permintaan ATK', pairs);
  },

  /* ── Permintaan barang — katalog gaya belanja daring (V6.9) ─────────────
     Langkah 1: jelajah katalog (kartu bergambar, cari, filter kategori,
     tombol +/− langsung di kartu). Langkah 2: tinjau keranjang + keperluan. */
  openRequest: function () {
    ATKModule.cart = [];
    ATKModule.catFilter = '';
    var s = $('#atkShopSearch'); if (s) s.value = '';
    var k = $('#atkFKeperluan'); if (k) k.value = '';
    ATKModule.renderShopCats();
    ATKModule.gotoStep(1);
    Modal.open('modalAtkRequest');
    renderIcons($('#modalAtkRequest'));
  },
  shopItems: function () {
    // Barang non-inactive; stok habis tetap tampil (ditandai) agar user tahu barangnya memang ada
    return ATKModule.stock.filter(function (a) {
      return String(a.status || 'active').toLowerCase() !== 'inactive';
    });
  },
  cartItem: function (id) {
    return ATKModule.cart.filter(function (c) { return String(c.atk_id) === String(id); })[0] || null;
  },
  cartSet: function (id, jml) {
    var brg = ATKModule.stock.filter(function (a) { return String(a.id) === String(id); })[0];
    if (!brg) return;
    var it = ATKModule.cartItem(id);
    if (it) it.jumlah = jml;
    else ATKModule.cart.push({ atk_id: brg.id, nama_barang: brg.nama_barang,
      satuan: brg.satuan || '', stok: parseFloat(brg.stok) || 0, jumlah: jml });
    ATKModule.refreshShopUi();
  },
  cartDelta: function (id, d) {
    var it = ATKModule.cartItem(id);
    if (!it) { if (d > 0) ATKModule.cartSet(id, 1); return; }
    it.jumlah = (parseInt(it.jumlah, 10) || 0) + d;
    if (it.jumlah > it.stok) { it.jumlah = it.stok; Toast.warning('Maksimum stok tersedia (' + it.stok + ')'); }
    if (it.jumlah <= 0) return ATKModule.cartRemove(id);
    ATKModule.refreshShopUi();
  },
  cartRemove: function (id) {
    ATKModule.cart = ATKModule.cart.filter(function (c) { return String(c.atk_id) !== String(id); });
    ATKModule.refreshShopUi();
  },
  refreshShopUi: function () {
    var s2 = $('#atkShopStep2');
    if (s2 && !s2.classList.contains('hidden')) ATKModule.renderCartList();
    else ATKModule.renderShop();
    ATKModule.updateCartBar();
  },
  updateCartBar: function () {
    var jenis = ATKModule.cart.length;
    var total = ATKModule.cart.reduce(function (s, c) { return s + (parseInt(c.jumlah, 10) || 0); }, 0);
    var t = $('#atkCartInfoText');
    if (t) t.textContent = jenis ? (jenis + ' jenis \u00b7 ' + total + ' item') : 'Keranjang kosong';
    var next = $('#atkShopNext'); if (next) next.disabled = !jenis;
    var kirim = $('#atkFSubmit'); if (kirim) kirim.disabled = !jenis;
  },
  gotoStep: function (n) {
    var s1 = $('#atkShopStep1'), s2 = $('#atkShopStep2');
    var back = $('#atkShopBack'), next = $('#atkShopNext'), kirim = $('#atkFSubmit');
    var judul = $('#atkShopTitle');
    var ke2 = n === 2;
    if (s1) s1.classList.toggle('hidden', ke2);
    if (s2) s2.classList.toggle('hidden', !ke2);
    if (back) back.classList.toggle('hidden', !ke2);
    if (kirim) kirim.classList.toggle('hidden', !ke2);
    if (next) next.classList.toggle('hidden', ke2);
    if (judul) judul.textContent = ke2 ? 'Keranjang Permintaan' : 'Minta Barang ATK';
    if (ke2) ATKModule.renderCartList(); else ATKModule.renderShop();
    ATKModule.updateCartBar();
  },
  renderShopCats: function () {
    var box = $('#atkShopCats'); if (!box) return;
    var cats = [];
    ATKModule.shopItems().forEach(function (a) {
      var c = String(a.kategori || '').trim();
      if (c && cats.indexOf(c) === -1) cats.push(c);
    });
    cats.sort(function (x, y) { return x.localeCompare(y); });
    box.innerHTML =
      '<button class="atk-cat-chip' + (!ATKModule.catFilter ? ' is-active' : '') + '" data-cat="">Semua</button>' +
      cats.map(function (c) {
        return '<button class="atk-cat-chip' + (ATKModule.catFilter === c ? ' is-active' : '') +
          '" data-cat="' + escapeHtml(c) + '">' + escapeHtml(c) + '</button>';
      }).join('');
    $all('[data-cat]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        ATKModule.catFilter = b.getAttribute('data-cat') || '';
        ATKModule.renderShopCats();
        ATKModule.renderShop();
      });
    });
  },
  renderShop: function () {
    var grid = $('#atkShopGrid'); if (!grid) return;
    var q = (($('#atkShopSearch') && $('#atkShopSearch').value) || '').toLowerCase();
    var rows = ATKModule.shopItems().filter(function (a) {
      if (ATKModule.catFilter && String(a.kategori || '').trim() !== ATKModule.catFilter) return false;
      if (!q) return true;
      return String(a.nama_barang).toLowerCase().indexOf(q) !== -1 ||
             String(a.kode_barang).toLowerCase().indexOf(q) !== -1;
    });
    if (!rows.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' +
        '<div class="empty-icon"><svg data-icon="box" style="width:22px;height:22px"></svg></div>' +
        '<div class="empty-title">Tidak ada barang yang cocok</div>' +
        '<div class="empty-text">Coba kata kunci atau kategori lain.</div></div>';
      renderIcons(grid);
      return;
    }
    grid.innerHTML = rows.map(function (a) {
      var stok = parseFloat(a.stok) || 0;
      var habis = stok <= 0;
      var rendah = !habis && a.perlu_reorder;
      var inCart = ATKModule.cartItem(a.id);
      // Audit V7.2: dulu dicek a.foto (truthy) — nilai marker/lama non-URL membuat
      // src="" → ikon gambar rusak; thumbnail Drive yang ditolak (berkas belum
      // publik) juga tampil rusak karena tanpa onerror. Kini: cek hasil
      // driveImgSrc + fallback onerror ke ikon box.
      var fotoSrc = driveImgSrc(a.foto, 300);
      var img = fotoSrc
        ? '<img src="' + escapeHtml(fotoSrc) + '" alt="" loading="lazy" data-tw="300" onerror="fotoTunnelCoba(this)">'
        : '<svg data-icon="box"></svg>';
      var stokTxt = habis ? 'Stok habis'
        : (rendah ? 'Sisa ' : 'Stok ') + stok + ' ' + escapeHtml(a.satuan || '');
      var aksi;
      if (habis) {
        aksi = '<button class="btn btn-outline btn-sm btn-block" disabled>Habis</button>';
      } else if (!inCart) {
        aksi = '<button class="btn btn-primary btn-sm btn-block" data-add="' + escapeHtml(a.id) + '">' +
          '<svg class="btn-icon" data-icon="plus"></svg> Tambah</button>';
      } else {
        aksi = '<div class="atk-qty">' +
          '<button class="atk-qty-btn" data-minus="' + escapeHtml(a.id) + '" aria-label="Kurangi"><svg data-icon="minus"></svg></button>' +
          '<span class="atk-qty-num">' + inCart.jumlah + '</span>' +
          '<button class="atk-qty-btn" data-plus="' + escapeHtml(a.id) + '" aria-label="Tambah"' +
            (inCart.jumlah >= stok ? ' disabled' : '') + '><svg data-icon="plus"></svg></button></div>';
      }
      return '<div class="atk-card' + (habis ? ' is-habis' : '') + '">' +
        '<div class="atk-card-img">' + img + '</div>' +
        '<div class="atk-card-body">' +
          '<div class="atk-card-name" title="' + escapeHtml(a.nama_barang) + '">' + escapeHtml(a.nama_barang) + '</div>' +
          '<div class="atk-card-meta">' + escapeHtml(a.kode_barang || '') +
            (a.kategori ? ' \u00b7 ' + escapeHtml(a.kategori) : '') + '</div>' +
          (a.catatan ? '<div class="atk-card-desc" title="' + escapeHtml(a.catatan) + '">' + escapeHtml(a.catatan) + '</div>' : '') +
          '<div class="atk-card-stok' + ((habis || rendah) ? ' is-low' : '') + '">' + stokTxt +
            (a.lokasi ? ' \u00b7 ' + escapeHtml(a.lokasi) : '') + '</div>' +
          aksi +
        '</div></div>';
    }).join('');
    renderIcons(grid);
    ATKModule.updateCartBar();
  },
  renderCartList: function () {
    var box = $('#atkCartList'); if (!box) return;
    if (!ATKModule.cart.length) {
      box.innerHTML = '<div class="text-muted" style="font-size:12.5px;text-align:center;padding:14px">' +
        'Keranjang kosong \u2014 kembali ke katalog untuk memilih barang.</div>';
      return;
    }
    box.innerHTML = ATKModule.cart.map(function (c) {
      return '<div class="atk-item-row">' +
        '<span class="ai-name">' + escapeHtml(c.nama_barang) +
          '<span class="cell-sub" style="display:block;white-space:normal">Maks ' + c.stok + ' ' + escapeHtml(c.satuan || '') + '</span></span>' +
        '<div class="atk-qty">' +
          '<button class="atk-qty-btn" data-minus="' + escapeHtml(c.atk_id) + '" aria-label="Kurangi"><svg data-icon="minus"></svg></button>' +
          '<span class="atk-qty-num">' + c.jumlah + '</span>' +
          '<button class="atk-qty-btn" data-plus="' + escapeHtml(c.atk_id) + '" aria-label="Tambah"' +
            (c.jumlah >= c.stok ? ' disabled' : '') + '><svg data-icon="plus"></svg></button>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" data-rm="' + escapeHtml(c.atk_id) + '" aria-label="Hapus dari keranjang">' +
          '<svg class="btn-icon" data-icon="trash"></svg></button>' +
      '</div>';
    }).join('');
    renderIcons(box);
  },
  submitRequest: function () {
    if (!ATKModule.cart.length) { Toast.warning('Pilih minimal satu barang dari katalog'); return; }
    var btn = $('#atkFSubmit'), txt = $('#atkFSubmitText');
    btnLoading(btn, txt, true);
    API.call('createATKPermintaan', {
      req_id: ReqKey.get('atk'), // Audit #2
      items: ATKModule.cart.map(function (c) {
        return { atk_id: c.atk_id, nama_barang: c.nama_barang, jumlah: c.jumlah };
      }),
      keperluan: $('#atkFKeperluan').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Kirim Permintaan');
      if (res.success) {
        ReqKey.clear('atk');
        Modal.close('modalAtkRequest');
        Toast.success(res.message || 'Permintaan terkirim');
        ATKModule.cart = [];
        ATKModule.load();
      } else Toast.error(res.error || 'Gagal mengirim');
    });
  },
  openStock: function (a) {
    $('#atkStockTitle').textContent = a ? 'Edit Barang' : 'Tambah Barang';
    $('#asFId').value = a ? a.id : '';
    $('#asFNama').value = a ? a.nama_barang : '';
    $('#asFKode').value = a ? a.kode_barang : '';
    $('#asFKategori').value = a ? a.kategori : '';
    $('#asFSatuan').value = a ? a.satuan : '';
    $('#asFLokasi').value = a ? a.lokasi : '';
    $('#asFStok').value = a ? a.stok : '0';
    $('#asFMin').value = a ? a.stok_minimum : '0';
    $('#asFHarga').value = a ? a.harga_satuan : '0';
    $('#asFCatatan').value = a ? (a.catatan || '') : '';
    // Foto barang: pratinjau foto lama (bila ada); unggahan baru menggantikannya
    ATKModule.fotoBaru = '';
    ATKModule.fotoHapus = false;
    var fi = $('#asFFoto'); if (fi) fi.value = '';
    var fk = $('#asFFotoKamera'); if (fk) fk.value = '';
    var prev = $('#asFotoPrev'), img = $('#asFotoPrevImg'), hps = $('#asFotoHapusBtn');
    if (a && a.foto) {
      if (img) img.src = driveImgSrc(a.foto_thumb || a.foto, 300);
      if (prev) prev.classList.add('is-visible');
      if (hps) hps.classList.remove('hidden');
    } else {
      if (prev) prev.classList.remove('is-visible');
      if (hps) hps.classList.add('hidden');
    }
    Modal.open('modalAtkStock');
  },
  /* V6.10: satu handler untuk input kamera & galeri foto barang */
  onFotoBarang: function (inp) {
    var f = inp.files && inp.files[0];
    inp.value = ''; // agar memilih berkas yang sama memicu ulang event change
    if (!f) return;
    if (f.type.indexOf('image') !== 0) { Toast.warning('Pilih berkas gambar'); return; }
    compressImage(f, 800, 0.85).then(function (d) {
      if (!d) { Toast.error('Gagal membaca gambar. Coba foto/berkas lain.'); return; }
      ATKModule.fotoBaru = d;
      ATKModule.fotoHapus = false;
      var img = $('#asFotoPrevImg'), prev = $('#asFotoPrev'), hps = $('#asFotoHapusBtn');
      if (img) img.src = d;
      if (prev) prev.classList.add('is-visible');
      if (hps) hps.classList.remove('hidden');
    });
  },
  hapusFotoBarang: function () {
    ATKModule.fotoBaru = '';
    ATKModule.fotoHapus = true;
    var prev = $('#asFotoPrev'), hps = $('#asFotoHapusBtn');
    if (prev) prev.classList.remove('is-visible');
    if (hps) hps.classList.add('hidden');
  },
  submitStock: function () {
    var nama = $('#asFNama').value.trim();
    if (!nama) { Toast.warning('Nama barang wajib diisi'); return; }
    var id = $('#asFId').value;
    var payload = {
      nama_barang: nama, kode_barang: $('#asFKode').value.trim(),
      kategori: $('#asFKategori').value.trim(), satuan: $('#asFSatuan').value.trim(),
      lokasi: $('#asFLokasi').value.trim(), stok: $('#asFStok').value,
      stok_minimum: $('#asFMin').value, harga_satuan: $('#asFHarga').value,
      catatan: $('#asFCatatan').value.trim()
    };
    if (ATKModule.fotoBaru) payload.foto = ATKModule.fotoBaru;
    else if (ATKModule.fotoHapus && id) payload.hapus_foto = '1';
    var action = id ? 'updateATKStock' : 'createATKStock';
    if (id) payload.id = id;
    var btn = $('#asFSubmit'), txt = $('#asFSubmitText');
    btnLoading(btn, txt, true);
    API.call(action, payload).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan Barang');
      if (res.success) { Modal.close('modalAtkStock'); Toast.success(res.message || 'Tersimpan'); ATKModule.load(); }
      else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  /* ── Analisis kebutuhan & nilai rupiah (tab Analisis) ── */
  _analisisLoaded: false,
  loadAnalisis: function (force) {
    if (ATKModule._analisisLoaded && !force) return;
    var body = $('#atkAnBody');
    if (body) body.innerHTML = '<tr><td colspan="6" style="padding:20px"><div class="skeleton" style="height:16px;margin-bottom:10px"></div><div class="skeleton" style="height:16px;width:60%"></div></td></tr>';
    API.call('getATKAnalisis').then(function (r) {
      if (!r.success) { Toast.error('Gagal memuat analisis', r.error); return; }
      ATKModule._analisisLoaded = true;
      ATKModule.renderAnalisis(r.data);
    });
  },
  renderAnalisis: function (d) {
    var rp = function (n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); };
    var s = d.ringkasan || {};
    var st = $('#atkAnStats');
    if (st) st.innerHTML = [
      { icon: 'box',   cls: 'stat-teal',   val: rp(s.nilai_stok),      label: 'Nilai Stok Saat Ini' },
      { icon: 'chart', cls: 'stat-blue',   val: rp(s.nilai_bulan_ini), label: 'Pengeluaran Bulan Ini' },
      { icon: 'star',  cls: 'stat-amber',  val: s.primer,              label: 'Barang Primer' },
      { icon: 'info',  cls: 'stat-violet', val: (s.sekunder + ' / ' + s.tersier), label: 'Sekunder / Tersier' }
    ].map(statCardHtml).join('');

    // Grafik batang CSS (pola .mini-chart yang sudah ada)
    var bulan = d.bulan || [];
    var chart = function (elId, key, fmt) {
      var el = $('#' + elId); if (!el) return;
      var maxV = Math.max.apply(null, bulan.map(function (b) { return b[key]; }).concat([1]));
      el.innerHTML = bulan.map(function (b) {
        var h = Math.round((b[key] / maxV) * 100);
        return '<div class="bar-col">' +
          '<div class="bar-value">' + fmt(b[key]) + '</div>' +
          '<div class="bar" style="height:' + Math.max(h, 3) + '%"></div>' +
          '<div class="bar-label">' + escapeHtml(b.label) + '</div></div>';
      }).join('');
    };
    chart('atkAnChart', 'qty', function (v) { return v; });
    chart('atkAnChartNilai', 'nilai', function (v) { return v >= 1000 ? Math.round(v / 1000) + 'rb' : v; });

    var KELAS = {
      primer:   '<span class="badge badge-done">Primer</span>',
      sekunder: '<span class="badge badge-waiting">Sekunder</span>',
      tersier:  '<span class="badge badge-neutral">Tersier</span>'
    };
    var body = $('#atkAnBody');
    if (body) {
      var rows = d.barang || [];
      body.innerHTML = rows.length ? rows.map(function (b) {
        return '<tr>' +
          '<td class="cell-primary">' + escapeHtml(b.nama) + '</td>' +
          '<td>' + (KELAS[b.kelas] || b.kelas) + '</td>' +
          '<td class="cell-mono">' + b.qty + '</td>' +
          '<td>' + b.frek + '×</td>' +
          '<td>' + b.pangsa + '%</td>' +
          '<td class="cell-mono">' + rp(b.nilai) + '</td></tr>';
      }).join('') : emptyRow(6, 'chart', 'Belum ada data permintaan', 'Analisis muncul setelah ada permintaan barang.');
    }
    var hint = $('#atkAnHint');
    if (hint) hint.textContent = s.tanpa_harga
      ? 'Perhatian: ' + s.tanpa_harga + ' barang belum punya harga satuan — nilai rupiahnya terhitung 0. Lengkapi via Edit barang agar akumulasi akurat.'
      : 'Gunakan kelas Primer sebagai prioritas belanja triwulan; Tersier bisa dibeli sesuai sisa anggaran.';
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: PUSAT PERSETUJUAN (Fase 2)
   ══════════════════════════════════════════════════════════════════════════ */
var ApprovalModule = {
  data: [],
  view: [],
  filter: '',
  ICON: { kendaraan: 'car', ruangan: 'door', atk: 'clipboard' },
  TIPE_LABEL: { kendaraan: 'Kendaraan', ruangan: 'Ruangan', atk: 'ATK' },
  MODUL_REF: { kendaraan: 'BOOKING_KENDARAAN', ruangan: 'BOOKING_RUANGAN', atk: 'ATK' },

  init: function () {
    $('#apvRefreshBtn').addEventListener('click', function () { ApprovalModule.load(true); });
    var pb = $('#apvPesanBtn');
    if (pb) pb.addEventListener('click', function () { KirimPesan.open({}); });
    $all('#apvFilter .tab').forEach(function (t) {
      t.addEventListener('click', function () {
        ApprovalModule.filter = t.getAttribute('data-apv') || '';
        $all('#apvFilter .tab').forEach(function (x) { x.classList.toggle('is-active', x === t); });
        ApprovalModule.render();
      });
    });
    $('#apkSubmit').addEventListener('click', ApprovalModule.submitKnd);
    $('#aprSubmit').addEventListener('click', ApprovalModule.submitRng);
    $('#apaSubmit').addEventListener('click', ApprovalModule.submitAtk);
  },

  load: function (showToast) {
    if (!isApprover()) return;
    API.call('getApprovalCenter').then(function (r) {
      ApprovalModule.apply(r, showToast);
    });
  },
  _n: null, // hitungan terakhir — pembanding utk pemberitahuan proaktif (V6.8)
  /** Terapkan hasil getApprovalCenter (dipakai load & bundel boot V6.6) */
  apply: function (r, showToast) {
    if (r && r.success) {
      var lama = ApprovalModule._n;
      ApprovalModule.data = r.data || [];
      var baru = ApprovalModule.data.length;
      ApprovalModule._n = baru;
      ApprovalModule.updateBadge();
      ApprovalModule.render();
      if (showToast) Toast.info('Daftar persetujuan diperbarui');
      // V6.8: toast beraksi saat jumlah BERTAMBAH setelah muat awal —
      // kabag/admin yang sedang di halaman lain tak perlu bolak-balik mengecek.
      else if (lama != null && baru > lama && Router.current !== 'approval') {
        Toast.info((baru - lama) + ' pengajuan baru menunggu persetujuan', '', {
          action: { label: 'Buka Pusat Persetujuan', onClick: function () { Router.go('approval'); } }
        });
      }
    } else if (r) Toast.error('Gagal memuat', r.error);
  },
  softRefresh: function () { if (isApprover()) ApprovalModule.load(); },

  /* V7.5: keluarkan item dari daftar SEGERA setelah keputusan sukses —
     approver melihat kartunya lenyap seketika, tanpa menunggu round-trip
     muat ulang; load() susulan tetap berjalan untuk menyelaraskan. */
  remove: function (id) {
    var n0 = ApprovalModule.data.length;
    ApprovalModule.data = ApprovalModule.data.filter(function (a) { return String(a.id) !== String(id); });
    if (ApprovalModule.data.length !== n0) {
      ApprovalModule._n = ApprovalModule.data.length;
      ApprovalModule.updateBadge();
      ApprovalModule.render();
    }
  },

  updateBadge: function () {
    var n = ApprovalModule.data.length;
    var badge = $('#approvalNavBadge');
    if (badge) {
      badge.textContent = n;
      badge.style.display = n ? '' : 'none';
    }
    // V6.7: angka yang sama juga tampil sebagai chip di topbar (kabag/admin)
    if (window.Topbar && Topbar.setApproval) Topbar.setApproval(n);
  },

  render: function () {
    var rows = ApprovalModule.data.filter(function (a) {
      return !ApprovalModule.filter || a.tipe === ApprovalModule.filter;
    });
    ApprovalModule.view = rows;
    if (!rows.length) {
      $('#apvList').innerHTML = '<div class="empty-state" style="padding:48px 20px"><div class="empty-icon">' + iconSvg('check') + '</div>' +
        '<div class="empty-title">Tidak ada yang menunggu persetujuan</div>' +
        '<div class="empty-text">' + (ApprovalModule.filter ? 'Tidak ada pengajuan ' + (ApprovalModule.TIPE_LABEL[ApprovalModule.filter] || '') + ' yang menunggu.' : 'Semua pengajuan sudah diproses.') + '</div></div>';
      return;
    }
    $('#apvList').innerHTML = rows.map(function (a, i) {
      return '<div class="approval-item apv-' + escapeHtml(a.tipe) + '">' +
        '<div class="apv-icon">' + iconSvg(ApprovalModule.ICON[a.tipe] || 'info') + '</div>' +
        '<div class="apv-body">' +
          '<div class="apv-title">' + escapeHtml(a.judul) + '</div>' +
          '<div class="apv-meta">' + escapeHtml(a.pemohon) + (a.bagian ? ' · ' + escapeHtml(a.bagian) : '') + ' · ' + fmtDateShort(a.tanggal) + '</div>' +
          '<div class="apv-detail">' + escapeHtml(a.detail || '') + '</div>' +
        '</div>' +
        '<div class="apv-actions">' +
          '<button class="btn btn-ghost btn-sm" data-info="' + i + '">Detail</button>' +
          '<button class="btn btn-success btn-sm" data-approve="' + i + '">Setujui</button>' +
          '<button class="btn btn-danger btn-sm" data-reject="' + i + '">Tolak</button>' +
        '</div>' +
      '</div>';
    }).join('');
    ApprovalModule.bindActions();
  },

  showInfo: function (a) {
    var pairs = [
      ['Jenis', ApprovalModule.TIPE_LABEL[a.tipe] || a.tipe],
      ['Pemohon', a.pemohon + (a.bagian ? ' · ' + a.bagian : '')],
      ['Tanggal', fmtDateShort(a.tanggal)]
    ];
    if (a.items && a.items.length) {
      var itemsHtml = a.items.map(function (i) {
        return '<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px dashed var(--border)">' +
          '<span>' + escapeHtml(i.nama_barang || '-') + '</span><b>× ' + escapeHtml(i.jumlah) + '</b></div>';
      }).join('');
      pairs.push(['Barang (' + a.items.length + ')', itemsHtml, { html: true }]);
    }
    if (a.info) {
      Object.keys(a.info).forEach(function (k) { pairs.push([k, a.info[k]]); });
    }
    DetailView.show(a.judul, pairs);
  },

  bindActions: function () {
    var root = $('#apvList');
    $all('[data-info]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = ApprovalModule.view[parseInt(b.getAttribute('data-info'), 10)];
        if (a) ApprovalModule.showInfo(a);
      });
    });
    $all('[data-approve]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = ApprovalModule.view[parseInt(b.getAttribute('data-approve'), 10)];
        if (a) ApprovalModule.openApprove(a, b);
      });
    });
    $all('[data-reject]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = ApprovalModule.view[parseInt(b.getAttribute('data-reject'), 10)];
        if (a) Reject.ask(a.tipe, a.id,
          'Tolak ' + (ApprovalModule.TIPE_LABEL[a.tipe] || '') + ' dari ' + a.pemohon + '?',
          function () { ApprovalModule.load(); }, a);
      });
    });
  },

  /* ── Persetujuan satu pintu: buka modal berisi seluruh keputusan ── */
  openApprove: function (a, btn) {
    // Loading NYATA di tombol: user tahu proses berjalan (getApprovalDetail bisa
    // beberapa detik di Apps Script). Tanpa ini tombol tampak diam dan modal
    // "menyusul" muncul di halaman lain.
    var asli = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:13px;height:13px"></span> Memuat…';
    API.call('getApprovalDetail', { tipe: a.tipe, id: a.id }).then(function (r) {
      btn.disabled = false;
      btn.innerHTML = asli;
      // Guard: bila user sudah pindah halaman, jangan munculkan modal "nyasar"
      var panel = document.querySelector('.view[data-view-panel="approval"]');
      if (!panel || !panel.classList.contains('is-active')) return;
      if (!r.success) { Toast.error('Gagal memuat detail', r.error); return; }
      var d = r.data;
      if (a.tipe === 'kendaraan') ApprovalModule.openKnd(d);
      else if (a.tipe === 'ruangan') ApprovalModule.openRng(d);
      else if (a.tipe === 'atk') ApprovalModule.openAtk(d);
    });
  },

  /* — Kendaraan: pilih unit + driver dengan indikator bentrok — */
  openKnd: function (d) {
    var b = d.row;
    $('#apkId').value = b.id;
    $('#apkInfo').innerHTML = '<b>' + escapeHtml(b.pemohon) + '</b>' + (b.bagian ? ' · ' + escapeHtml(BAGIAN_LABEL[b.bagian] || b.bagian) : '') +
      '<br>' + fmtDateShort(b.tanggal_pakai) +
      (b.tanggal_selesai && String(b.tanggal_selesai).substring(0, 10) !== String(b.tanggal_pakai).substring(0, 10) ? ' s.d. ' + fmtDateShort(b.tanggal_selesai) : '') +
      ' · ' + fmtTime(b.jam_berangkat) + (b.jam_kembali ? '–' + fmtTime(b.jam_kembali) : '') +
      (String(b.luar_kota) === '1' ? ' · <span class="badge badge-serving">Luar Kota</span>' : '') +
      ' → ' + escapeHtml(b.tujuan || '-') +
      (b.keperluan ? '<br><span style="opacity:.8">' + escapeHtml(b.keperluan) + '</span>' : '');
    /* ── V7.8: REKOMENDASI CERDAS ─────────────────────────────────────────
       Server sudah MENGURUTKAN daftar: kendaraan berdasar kecukupan &
       kepasan kapasitas terhadap jumlah penumpang; driver berdasar ROTASI
       ADIL (paling sedikit trip 30 hari / paling lama tidak trip di atas).
       Item teratas ditandai ⭐ Rekomendasi dan otomatis TERPILIH bila
       pemohon tidak mengusulkan sendiri — approver tetap bebas mengganti. */
    var penumpang = parseInt(d.penumpang || b.jumlah_penumpang, 10) || 1;
    // Usulan pemohon yang tak ada di daftar (mis. unit non-operasional lama)
    // diperlakukan seperti tanpa usulan — rekomendasi terpilih otomatis.
    var usulanKnd = b.kendaraan_id && (d.kendaraan || []).some(function (k) { return String(k.id) === String(b.kendaraan_id); });
    var usulanDrv = b.driver_id && (d.drivers || []).some(function (x) { return String(x.id) === String(b.driver_id); });
    var sel = $('#apkKendaraan');
    sel.innerHTML = '<option value="">— Pilih kendaraan —</option>' + (d.kendaraan || []).map(function (k) {
      var label = k.nopol + ' · ' + (k.merk || '') + ' ' + (k.type || '');
      if (k.kapasitas) label += ' · ' + k.kapasitas + ' kursi';
      if (k.rekomendasi) label = '⭐ ' + label + ' — direkomendasikan';
      else if (k.muat === false) label += ' — kapasitas kurang utk ' + penumpang + ' penumpang';
      if (k.bentrok) label += ' — TERPAKAI (' + k.ket + ')';
      else if (k.ket) label += ' — menunggu: ' + k.ket;
      var terpilih = usulanKnd
        ? String(b.kendaraan_id) === String(k.id)
        : (!!k.rekomendasi && !k.bentrok);
      return '<option value="' + escapeHtml(k.id) + '"' + (k.bentrok ? ' disabled' : '') +
        (terpilih ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
    var free = (d.kendaraan || []).filter(function (k) { return !k.bentrok; }).length;
    $('#apkKendaraanHint').textContent = (free
      ? free + ' unit operasional tersedia · ⭐ = kapasitas paling pas untuk ' + penumpang + ' penumpang.'
      : 'Semua unit terpakai pada jam tersebut — pertimbangkan menolak dengan alasan.');
    var selD = $('#apkDriver');
    selD.innerHTML = '<option value="">— Tanpa driver / menyusul —</option>' + (d.drivers || []).map(function (dr) {
      var label = dr.nama + (dr.no_hp ? ' · ' + dr.no_hp : '');
      // Info rotasi: beban 30 hari terakhir + trip terakhir tiap driver
      if (dr.trip_30hari === 0 && !dr.trip_terakhir) label += ' — belum pernah trip';
      else label += ' — ' + (dr.trip_30hari || 0) + ' trip/30hr' +
        (dr.trip_terakhir ? ', terakhir ' + fmtDateShort(dr.trip_terakhir) : '');
      if (dr.rekomendasi) label = '⭐ ' + label;
      if (dr.sibuk) label += ' — BERTUGAS (' + dr.ket + ')';
      var terpilihD = usulanDrv
        ? String(b.driver_id) === String(dr.id)
        : (!!dr.rekomendasi && !dr.sibuk);
      return '<option value="' + escapeHtml(dr.id) + '"' + (dr.sibuk ? ' disabled' : '') +
        (terpilihD ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
    }).join('');
    $('#apkDriverHint').textContent = 'Urutan = rotasi adil: yang paling jarang/paling lama tidak trip di atas (⭐ = giliran berikutnya). Driver yang sedang bertugas dinonaktifkan.';
    $('#apkCatatan').value = '';

    /* Panel notifikasi: penerima & kanal tampak SEBELUM keputusan; pratinjau
       pesan disusun persis seperti backend (approveBookingKendaraan). */
    ApprovalModule._knd = d;
    NotifPanel.mount('apkNotif', {
      grup: 'driver', grupLabel: 'Grup Telegram Driver',
      info: d.notif || null,
      preview: function () {
        var kSel = (d.kendaraan || []).find(function (x) { return String(x.id) === String($('#apkKendaraan').value); });
        var dSel = (d.drivers || []).find(function (x) { return String(x.id) === String($('#apkDriver').value); });
        var cat = $('#apkCatatan').value.trim();
        return 'Pengajuan Kendaraan DISETUJUI\n\n' +
          'Halo ' + b.pemohon + ', pengajuan kendaraan Anda telah DISETUJUI oleh ' + namaSaya() + '.\n\n' +
          'Tanggal: ' + fmtTglID(b.tanggal_pakai) + ' · ' + fmtTime(b.jam_berangkat) +
          (b.jam_kembali ? '–' + fmtTime(b.jam_kembali) : '') +
          '\nTujuan: ' + (b.tujuan || '-') +
          '\nKendaraan: ' + (kSel ? (kSel.nopol + ' ' + (kSel.merk || '') + ' ' + (kSel.type || '')) : '(belum dipilih)') +
          '\nDriver: ' + (dSel ? dSel.nama : 'Menyetir sendiri') +
          (cat ? '\nCatatan: ' + cat : '');
      },
      watch: [$('#apkKendaraan'), $('#apkDriver'), $('#apkCatatan')],
      submitTextSel: '#apkSubmitText', submitBase: 'Setujui'
    });
    Modal.open('modalApproveKnd');
  },
  submitKnd: function () {
    var kid = $('#apkKendaraan').value;
    if (!kid) { Toast.warning('Pilih kendaraan yang ditugaskan'); return; }
    btnLoading($('#apkSubmit'), $('#apkSubmitText'), true);
    API.call('approveBookingKendaraan', {
      id: $('#apkId').value, kendaraan_id: kid,
      driver_id: $('#apkDriver').value, catatan: $('#apkCatatan').value.trim(),
      notif: NotifPanel.collect('apkNotif')
    }).then(function (r) {
      btnLoading($('#apkSubmit'), $('#apkSubmitText'), false, NotifPanel.label('apkNotif'));
      if (r.success) {
        Modal.close('modalApproveKnd');
        Toast.success(r.message || 'Disetujui', (r.notif && r.notif.ringkas) || '');
        ApprovalModule.remove($('#apkId').value); // V7.5: kartu hilang seketika
        notifTundaFlush(r);                       // V7.5: kirim notif di latar belakang
        ApprovalModule.load();
      } else Toast.error('Gagal menyetujui', r.error);
    });
  },

  /* — Ruangan: konfirmasi + jadwal hari itu — */
  openRng: function (d) {
    var b = d.row;
    $('#aprId').value = b.id;
    $('#aprInfo').innerHTML = '<b>' + escapeHtml(b.pemohon) + '</b>' + (b.bagian ? ' · ' + escapeHtml(BAGIAN_LABEL[b.bagian] || b.bagian) : '') +
      '<br>' + escapeHtml(b.nama_ruangan || 'Ruangan') + ' · ' + fmtDateShort(b.tanggal_pakai) +
      ' · ' + fmtTime(b.jam_mulai) + '–' + fmtTime(b.jam_selesai) +
      (b.keperluan ? '<br><span style="opacity:.8">' + escapeHtml(b.keperluan) + '</span>' : '');
    var box = $('#aprJadwal');
    if (d.konflik) {
      box.innerHTML = '<div class="alert alert-danger">Bentrok dengan booking <b>' + escapeHtml(d.konflik.pemohon) +
        '</b> (' + escapeHtml(d.konflik.jam) + ', ' + escapeHtml(STATUS_LABEL_2[d.konflik.status] || d.konflik.status) + '). Persetujuan akan ditolak sistem.</div>';
    } else if (d.jadwal_hari_itu && d.jadwal_hari_itu.length) {
      box.innerHTML = '<div class="form-hint" style="margin-bottom:5px">Jadwal ruangan ini di hari yang sama:</div>' +
        d.jadwal_hari_itu.map(function (j) {
          return '<div style="font-size:12px;padding:4px 0;border-bottom:1px dashed var(--border)"><b>' +
            escapeHtml(j.jam) + '</b> · ' + escapeHtml(j.pemohon) + ' — ' + escapeHtml(j.keperluan || '') + '</div>';
        }).join('');
    } else {
      box.innerHTML = '<div class="form-hint">Belum ada booking lain untuk ruangan ini di hari tersebut.</div>';
    }
    $('#aprCatatan').value = '';

    NotifPanel.mount('aprNotif', {
      grup: null,
      info: d.notif || null,
      preview: function () {
        var cat = $('#aprCatatan').value.trim();
        return 'Booking Ruangan DISETUJUI\n\n' +
          'Halo ' + b.pemohon + ', booking ruangan Anda telah DISETUJUI oleh ' + namaSaya() + '.\n\n' +
          'Ruangan: ' + (b.nama_ruangan || '-') +
          '\nTanggal: ' + fmtTglID(b.tanggal_pakai) + ' · ' + fmtTime(b.jam_mulai) + '–' + fmtTime(b.jam_selesai) +
          '\nKeperluan: ' + (b.keperluan || '-') +
          (cat ? '\nCatatan: ' + cat : '');
      },
      watch: [$('#aprCatatan')],
      submitTextSel: '#aprSubmitText', submitBase: 'Setujui'
    });
    Modal.open('modalApproveRng');
  },
  submitRng: function () {
    btnLoading($('#aprSubmit'), $('#aprSubmitText'), true);
    API.call('approveBookingRuangan', {
      id: $('#aprId').value, catatan: $('#aprCatatan').value.trim(),
      notif: NotifPanel.collect('aprNotif')
    }).then(function (r) {
      btnLoading($('#aprSubmit'), $('#aprSubmitText'), false, NotifPanel.label('aprNotif'));
      if (r.success) {
        Modal.close('modalApproveRng');
        Toast.success(r.message || 'Disetujui', (r.notif && r.notif.ringkas) || '');
        ApprovalModule.remove($('#aprId').value); // V7.5: kartu hilang seketika
        notifTundaFlush(r);                       // V7.5: kirim notif di latar belakang
        ApprovalModule.load();
      } else Toast.error('Gagal menyetujui', r.error);
    });
  },

  /* — ATK: penyesuaian jumlah per item — */
  openAtk: function (d) {
    var p = d.row;
    $('#apaId').value = p.id;
    $('#apaInfo').innerHTML = '<b>' + escapeHtml(p.pemohon) + '</b>' + (p.bagian ? ' · ' + escapeHtml(BAGIAN_LABEL[p.bagian] || p.bagian) : '') +
      '<br>' + fmtDateShort(p.tanggal) + (p.keperluan ? ' · <span style="opacity:.8">' + escapeHtml(p.keperluan) + '</span>' : '');
    $('#apaItems').innerHTML = (d.items || []).map(function (it, i) {
      var stokTxt = it.stok == null ? '?' : it.stok + (it.satuan ? ' ' + it.satuan : '');
      var kurang = it.stok != null && it.stok < it.jumlah;
      var maxV = it.stok == null ? it.jumlah : Math.min(it.jumlah, it.stok);
      return '<tr data-atkid="' + escapeHtml(it.atk_id) + '">' +
        '<td>' + escapeHtml(it.nama_barang || '-') + '</td>' +
        '<td>' + it.jumlah + '</td>' +
        '<td' + (kurang ? ' style="color:var(--danger);font-weight:700"' : '') + '>' + stokTxt + '</td>' +
        '<td><input type="number" class="form-control apa-qty" min="0" max="' + maxV + '" value="' + maxV + '" style="padding:6px 8px;font-size:13px"></td>' +
      '</tr>';
    }).join('');
    $('#apaCatatan').value = '';

    NotifPanel.mount('apaNotif', {
      grup: null,
      info: d.notif || null,
      preview: function () {
        // Susunan final + daftar penyesuaian — cermin approveATKPermintaan backend
        var daftar = [], perubahan = [];
        $all('#apaItems tr').forEach(function (tr) {
          var id2 = tr.getAttribute('data-atkid');
          var jml = parseInt(tr.querySelector('.apa-qty').value, 10) || 0;
          var asli = (d.items || []).find(function (x) { return String(x.atk_id) === String(id2); });
          var nama = (asli && asli.nama_barang) || '-';
          if (asli && jml !== asli.jumlah) perubahan.push(nama + ' ' + asli.jumlah + '→' + jml);
          if (jml > 0) daftar.push('• ' + nama + ' × ' + jml);
        });
        var cat = $('#apaCatatan').value.trim();
        return 'Permintaan ATK DISETUJUI\n\n' +
          'Halo ' + p.pemohon + ', permintaan ATK Anda telah DISETUJUI oleh ' + namaSaya() + '.\n\n' +
          (daftar.join('\n') || '(belum ada barang disetujui)') +
          (perubahan.length ? '\n\nJumlah disesuaikan: ' + perubahan.join(', ') : '') +
          (cat ? '\nCatatan: ' + cat : '') +
          '\n\nSilakan ambil barang di Bagian Umum (SDMUK).';
      },
      watch: [$('#apaCatatan'), $('#apaItems')],
      submitTextSel: '#apaSubmitText', submitBase: 'Setujui'
    });
    Modal.open('modalApproveAtk');
  },
  submitAtk: function () {
    var items = $all('#apaItems tr').map(function (tr) {
      return { atk_id: tr.getAttribute('data-atkid'), jumlah: parseInt(tr.querySelector('.apa-qty').value, 10) || 0 };
    });
    if (!items.some(function (i) { return i.jumlah > 0; })) {
      Toast.warning('Semua jumlah 0 — gunakan tombol Tolak bila permintaan tidak dipenuhi.');
      return;
    }
    btnLoading($('#apaSubmit'), $('#apaSubmitText'), true);
    API.call('approveATKPermintaan', {
      id: $('#apaId').value, items: items, catatan: $('#apaCatatan').value.trim(),
      notif: NotifPanel.collect('apaNotif')
    }).then(function (r) {
      btnLoading($('#apaSubmit'), $('#apaSubmitText'), false, NotifPanel.label('apaNotif'));
      if (r.success) {
        Modal.close('modalApproveAtk');
        Toast.success(r.message || 'Disetujui', (r.notif && r.notif.ringkas) || '');
        ApprovalModule.remove($('#apaId').value); // V7.5: kartu hilang seketika
        notifTundaFlush(r);                       // V7.5: kirim notif di latar belakang
        ApprovalModule.load();
      } else Toast.error('Gagal menyetujui', r.error);
    });
  }
};




/* ══════════════════════════════════════════════════════════════════════════
   SIGNATURE PAD — kanvas tanda tangan digital sederhana (mouse + sentuh).
   Dipakai modal approval Lembur/SKPD TAD untuk menerbitkan Surat Tugas.
   ══════════════════════════════════════════════════════════════════════════ */
var SignaturePad = {
  cv: null, ctx: null, drawing: false, dirty: false,

  attach: function (canvas) {
    var self = SignaturePad;
    self.cv = canvas;
    self.ctx = canvas.getContext('2d');
    self.clear();
    if (canvas._sigBound) return;
    canvas._sigBound = true;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      var t = (e.touches && e.touches[0]) || e;
      return { x: (t.clientX - r.left) * (canvas.width / r.width),
               y: (t.clientY - r.top) * (canvas.height / r.height) };
    }
    function start(e) {
      self.drawing = true;
      var p = pos(e);
      self.ctx.beginPath();
      self.ctx.moveTo(p.x, p.y);
      // titik tunggal pun terekam (tap/klik singkat)
      self.ctx.lineTo(p.x + 0.1, p.y + 0.1);
      self.ctx.stroke();
      self.dirty = true;
      e.preventDefault();
    }
    function move(e) {
      if (!self.drawing) return;
      var p = pos(e);
      self.ctx.lineTo(p.x, p.y);
      self.ctx.stroke();
      self.dirty = true;
      e.preventDefault();
    }
    function end() { self.drawing = false; }
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
  },

  clear: function () {
    var self = SignaturePad;
    if (!self.cv) return;
    // latar putih agar PNG tidak transparan-gelap saat dicetak di surat
    self.ctx.fillStyle = '#ffffff';
    self.ctx.fillRect(0, 0, self.cv.width, self.cv.height);
    self.ctx.strokeStyle = '#1e293b';
    self.ctx.lineWidth = 2.4;
    self.ctx.lineCap = 'round';
    self.ctx.lineJoin = 'round';
    self.dirty = false;
  },

  isEmpty: function () { return !SignaturePad.dirty; },
  toDataURL: function () { return SignaturePad.cv ? SignaturePad.cv.toDataURL('image/png') : ''; }
};
