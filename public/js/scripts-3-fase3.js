/* ════════════════════════════════════════════════════════════════════════════
   GESIT V6 — JS 3/4: MODUL FASE 3
   Isi   : Magang (peserta, presensi, logbook, tugas & penilaian), Presensi TAD, Security (shift, jadwal, insiden, patroli)
   Urutan: file ke-3 dari 4
   Catatan: keempat file JS berbagi scope global (tanpa IIFE) agar antar-modul
   tetap saling terhubung. Muat sesuai urutan di atas.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: MAGANG (Fase 3) — data peserta, presensi, logbook, tugas & penilaian
   ══════════════════════════════════════════════════════════════════════════ */
var MagangModule = {
  list: [],      // seluruh data magang (untuk tabel + isian select)
  logbook: [],
  tugas: [],
  presensiRows: [],     // V6.9: presensi tanggal terpilih (bahan kartu "Belum Presensi")
  rekap: null,          // V6.9: rekap bulanan terakhir dimuat
  _rekapDimuat: false,
  lamaran: [],          // V6.8: lamaran masuk dari halaman publik
  lamaranAktif: null,   // lamaran yang sedang dibuka di modal detail
  _lamaranDimuat: false,
  lbFoto: '',    // data-uri foto logbook (opsional)
  thFoto: '',    // data-uri foto hasil tugas (opsional) — V6.9: dulu "tsFoto", bentrok dengan ID Portal TAD

  init: function () {
    // Pengikat aman: satu elemen hilang tidak boleh mematikan seluruh init.
    // (Inilah penyebab bug lama: $('#lbFFoto') null → addEventListener
    //  melempar error → initTabs di bawahnya tak pernah jalan → tab mati.)
    function on(sel, evt, fn) {
      var el = $(sel);
      if (el) el.addEventListener(evt, fn);
      else if (window.console) console.warn('[Magang] elemen ' + sel + ' tidak ditemukan — pengikat dilewati');
      return el;
    }

    // Tab dipasang PALING AWAL agar navigasi antar-tab selalu hidup
    // meskipun ada pengikat lain di bawah yang gagal.
    initTabs('#mgTabs', '[data-view-panel="magang"]');

    var tgl = $('#mgPresTgl');
    if (tgl) tgl.value = todayISO();

    on('#mgRefreshBtn', 'click', function () {
      MagangModule.load();
      Toast.info('Data magang dimuat ulang');
    });
    on('#mgAddBtn', 'click', function () { MagangModule.openForm(null); });
    on('#mgSearch', 'input', function () { MagangModule.renderTable(); });
    on('#mgFilterStatus', 'change', function () { MagangModule.renderTable(); });

    on('#mgPresTgl', 'change', function () { MagangModule.loadPresensi(); });
    on('#mgPresManualBtn', 'click', function () { MagangModule.openPresManual(); });

    // Rekap bulanan (V6.9) — dimuat malas saat tab pertama kali dibuka
    var rb = $('#mgRekapBulan');
    if (rb) rb.value = thisMonthISO();
    on('#mgRekapBulan', 'change', function () { MagangModule.loadRekap(); });
    on('#mgRekapCsv', 'click', function () { MagangModule.downloadRekapCsv(); });
    var tabRekap = document.querySelector('#mgTabs .tab[data-tab="rekap"]');
    if (tabRekap) tabRekap.addEventListener('click', function () {
      if (!MagangModule._rekapDimuat) MagangModule.loadRekap();
    });
    // Klik nama pada kartu "Belum Presensi" → entri manual terisi otomatis
    var belumBox = $('#mgBelumBox');
    if (belumBox) belumBox.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-belum-id]') : null;
      if (t) MagangModule.openPresManual(t.getAttribute('data-belum-id'));
    });

    on('#mgLogFilter', 'change', function () { MagangModule.loadLogbook(); });
    on('#mgLogAddBtn', 'click', function () { MagangModule.openLogbook(); });

    on('#mgTugasFilter', 'change', function () { MagangModule.loadTugas(); });
    on('#mgTugasAddBtn', 'click', function () { MagangModule.openTugas(null); });

    on('#mgFSubmit', 'click', function () { MagangModule.submitForm(); });
    on('#pmFSubmit', 'click', function () { MagangModule.submitPresManual(); });
    on('#lbFSubmit', 'click', function () { MagangModule.submitLogbook(); });
    on('#lbrSubmit', 'click', function () { MagangModule.submitReview(); });
    on('#tgFSubmit', 'click', function () { MagangModule.submitTugasForm(); });
    on('#thSubmit', 'click', function () { MagangModule.submitTugasHasil(); });
    on('#niSubmit', 'click', function () { MagangModule.submitNilai(); });
    on('#mgAlumniSearch', 'input', function () { MagangModule.renderAlumni(); });

    // Lamaran Masuk (V6.8) — UI admin utk backend getLamaranMagang yang
    // sebelumnya yatim (lamaran hanya tersimpan di sheet + notif Telegram).
    on('#mgLamaranRefresh', 'click', function () { MagangModule.loadLamaran(true); });
    on('#mgLamaranFilter', 'change', function () { MagangModule.renderLamaran(); });
    on('#lmReview', 'click', function () { MagangModule.prosesLamaran('review'); });
    on('#lmTerima', 'click', function () { MagangModule.prosesLamaran('diterima'); });
    on('#lmTolak',  'click', function () { MagangModule.prosesLamaran('ditolak'); });
    on('#lmJadikan', 'click', function () { MagangModule.openFormDariLamaran(MagangModule.lamaranAktif); });
    // Muat malas: daftar diambil saat tab pertama kali dibuka (hemat kuota)
    var tabLamaran = document.querySelector('#mgTabs .tab[data-tab="lamaran"]');
    if (tabLamaran) tabLamaran.addEventListener('click', function () {
      if (!MagangModule._lamaranDimuat) MagangModule.loadLamaran();
    });

    // Izin/Sakit magang (Fase 5.3)
    on('#mgIzinFilter', 'change', function () { MagangModule.loadIzin(); });
    on('#izpSubmit',    'click',  function () { MagangModule.submitIzinProses(); });
    on('#izpTolakBtn',  'click',  function () { MagangModule.submitIzinProses('rejected'); });

    // Foto logbook (opsional) — kamera/galeri, dikompres di sisi klien
    on('#lbFFoto', 'change', function () {
      var f = this.files && this.files[0];
      var prev = $('#lbFotoPreview');
      if (!f) { MagangModule.lbFoto = ''; if (prev) prev.classList.remove('is-visible'); return; }
      compressImage(f, 1280, 0.8).then(function (dataUrl) {
        MagangModule.lbFoto = dataUrl;
        var img = $('#lbFotoImg');
        if (img) img.src = dataUrl;
        if (prev) prev.classList.add('is-visible');
      });
    });
    // Foto hasil tugas (opsional)
    on('#thFoto', 'change', function () {
      var f = this.files && this.files[0];
      var prev = $('#thFotoPreview');
      if (!f) { MagangModule.thFoto = ''; if (prev) prev.classList.remove('is-visible'); return; }
      compressImage(f, 1280, 0.8).then(function (dataUrl) {
        MagangModule.thFoto = dataUrl;
        var img = $('#thFotoImg');
        if (img) img.src = dataUrl;
        if (prev) prev.classList.add('is-visible');
      });
    });
  },

  load: function () {
    // Satu round-trip untuk seluruh tab (stats, peserta, presensi, logbook,
    // tugas) — jauh lebih cepat di jaringan HP daripada 5 panggilan terpisah.
    var tanggal = $('#mgPresTgl').value || todayISO();
    var lb = $('#mgLogFilter').value;
    var tg = $('#mgTugasFilter').value;
    API.call('getModuleBundle', {
      module: 'magang',
      filter: {
        tanggal: tanggal,
        logbook: lb ? { status_review: lb } : {},
        tugas: tg ? { status: tg } : {}
      }
    }).then(function (r) {
      if (r.success && r.data) {
        var d = r.data;
        MagangModule.applyStats(d.stats || { success: false });
        MagangModule.applyData(d.magang || { success: false });
        MagangModule.applyPresensi(d.presensi || { success: false });
        MagangModule.applyLogbook(d.logbook || { success: false });
        MagangModule.applyTugas(d.tugas || { success: false });
      } else {
        // Backend lama belum punya aksi bundel → jatuh mulus ke 5 panggilan
        MagangModule.loadLegacy();
      }
      MagangModule.loadIzin();
      // V6.8: refresh lamaran ikut tombol Refresh bila tab sudah pernah dibuka
      if (MagangModule._lamaranDimuat && isApprover()) MagangModule.loadLamaran();
    });
  },

  loadLegacy: function () {
    MagangModule.loadStats();
    MagangModule.loadData();
    MagangModule.loadPresensi();
    MagangModule.loadLogbook();
    MagangModule.loadTugas();
    MagangModule.loadIzin();
  },

  /* ── Statistik ── */
  applyStats: function (r) {
    if (!r || !r.success) return;
    var d = r.data || {};
    $('#mgStats').innerHTML = [
      statCardHtml({ cls: 'stat-teal',   icon: 'grad',      val: d.aktif,            label: 'Magang Aktif' }),
      statCardHtml({ cls: 'stat-blue',   icon: 'clock',     val: d.presensi_hari_ini, label: 'Presensi Hari Ini' }),
      statCardHtml({ cls: 'stat-amber',  icon: 'clipboard', val: d.logbook_pending,  label: 'Logbook Menunggu Review' }),
      statCardHtml({ cls: 'stat-violet', icon: 'star',      val: d.alumni,           label: 'Alumni' })
    ].join('');
    renderIcons($('#mgStats'));
  },
  loadStats: function () {
    API.call('getMagangStats').then(function (r) { MagangModule.applyStats(r); });
  },

  /* ── Data peserta ── */
  applyData: function (r) {
    if (r && r.success) {
      MagangModule.list = r.data || [];
      MagangModule.renderTable();
      MagangModule.renderAlumni();
      MagangModule.renderBelum();
    }
    else Toast.error('Gagal memuat data magang', r && r.error);
  },
  loadData: function () {
    API.call('getMagang', {}).then(function (r) { MagangModule.applyData(r); });
  },

  aktifOnly: function () {
    return MagangModule.list.filter(function (m) {
      var s = String(m.status || 'active').toLowerCase();
      return s === '' || s === 'active' || s === 'aktif';
    });
  },

  renderTable: function () {
    var tbody = $('#mgTableBody');
    var q = $('#mgSearch').value.trim().toLowerCase();
    var st = $('#mgFilterStatus').value;
    var rows = MagangModule.list.filter(function (m) {
      if (st === 'active') {
        var s = String(m.status || 'active').toLowerCase();
        if (!(s === '' || s === 'active' || s === 'aktif')) return false;
      } else if (st && String(m.status) !== st) return false;
      if (!q) return true;
      return [m.nama, m.universitas, m.jurusan, m.bagian].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'grad', 'Belum ada data magang',
        q || st ? 'Tidak ada yang cocok dengan pencarian / filter.' : 'Tambahkan peserta melalui tombol di kanan atas.');
      renderIcons(tbody);
      return;
    }
    var canEdit = isApprover(), canDel = isAdmin2();
    tbody.innerHTML = rows.map(function (m) {
      var aksi = '<button class="btn btn-ghost btn-sm" data-detail="' + escapeHtml(m.id) + '">Detail</button>';
      if (canEdit) aksi += ' <button class="btn btn-outline btn-sm" data-edit="' + escapeHtml(m.id) + '">Edit</button>';
      if (canDel) aksi += ' <button class="btn btn-danger btn-sm" data-del="' + escapeHtml(m.id) + '">Hapus</button>';
      return '<tr>' +
        '<td><div style="display:flex;align-items:center;gap:9px">' + avatarHtml(m.foto, m.nama) +
        '<div><div class="cell-primary">' + escapeHtml(m.nama) + '</div>' +
        '<div class="cell-sub cell-mono">' + escapeHtml(m.nim || '—') + '</div></div></div></td>' +
        '<td><div style="font-weight:500">' + escapeHtml(m.universitas || '—') + '</div>' +
        '<div class="cell-sub">' + escapeHtml(m.jurusan || '') + '</div></td>' +
        '<td><div>' + escapeHtml(m.bagian || '—') + '</div>' +
        '<div class="cell-sub">' + escapeHtml(m.pembimbing || '') + '</div></td>' +
        '<td style="font-size:12px;white-space:nowrap">' + fmtDateShort(m.periode_mulai) +
        ' <span class="text-muted">→</span> ' + fmtDateShort(m.periode_selesai) + '</td>' +
        '<td>' + statusBadge(m.status || 'active') + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + aksi + '</td></tr>';
    }).join('');
    MagangModule.bindTable(tbody);
  },

  bindTable: function (tbody) {
    $all('[data-detail]', tbody).forEach(function (b) {
      b.addEventListener('click', function () { MagangModule.showDetail(b.getAttribute('data-detail')); });
    });
    $all('[data-edit]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var m = MagangModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-edit'); });
        if (m) MagangModule.openForm(m);
      });
    });
    $all('[data-del]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var m = MagangModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-del'); });
        Confirm.ask('Hapus Data Magang',
          'Hapus ' + (m ? m.nama : 'peserta ini') + ' beserta aksesnya? Tindakan tidak bisa dibatalkan.',
          function () {
            apiKlikSekali(b, 'deleteMagang', { id: b.getAttribute('data-del') }).then(function (res) {
              if (res.success) { Toast.success(res.message || 'Terhapus'); MagangModule.load(); }
              else Toast.error(res.error || 'Gagal menghapus');
            });
          });
      });
    });
  },

  showDetail: function (id) {
    API.call('getDetailMagang', { id: id }).then(function (r) {
      if (!r.success) { Toast.error(r.error || 'Detail tidak ditemukan'); return; }
      var d = r.data || {}, m = d.magang || {};
      var tugasHtml = (d.tugas && d.tugas.length)
        ? d.tugas.slice(0, 6).map(function (t) {
            return '<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;font-size:12px">' +
              '<span>' + escapeHtml(t.judul_tugas) + '</span>' +
              '<span>' + statusBadge(t.status) + (t.nilai !== '' && t.nilai != null ? ' <b>' + escapeHtml(t.nilai) + '</b>' : '') + '</span></div>';
          }).join('')
        : '<span class="text-muted">Belum ada tugas</span>';
      var sertHtml = m.sertifikat_url
        ? '<a class="chip" href="' + escapeHtml(m.sertifikat_url) + '" target="_blank" rel="noopener">' +
            iconSvg('award') + ' ' + escapeHtml(m.sertifikat_nomor || 'Lihat PDF') + '</a>'
        : '<span class="text-muted">Belum diterbitkan</span>';
      DetailView.show('Magang — ' + (m.nama || ''), [
        ['Foto', fotoChip(m.foto, 'Foto profil'), { html: true }],
        ['Nama', m.nama],
        ['NIM', m.nim],
        ['Kampus', m.universitas],
        ['Jurusan', m.jurusan],
        ['No. HP', m.no_hp],
        ['Email', m.email],
        ['Alamat Domisili', m.alamat_domisili],
        ['Alamat Sekarang', m.alamat_sekarang],
        ['Bagian', m.bagian],
        ['Pembimbing', m.pembimbing],
        ['Periode', fmtDateShort(m.periode_mulai) + ' → ' + fmtDateShort(m.periode_selesai)],
        ['Status', statusBadge(m.status || 'active'), { html: true }],
        ['Total Presensi', d.total_presensi],
        ['Logbook', (d.total_logbook || 0) + ' entri · ' + (d.logbook_pending || 0) + ' menunggu review'],
        ['Tugas', tugasHtml, { html: true }],
        ['Sertifikat', sertHtml, { html: true }],
        ['Catatan', m.catatan],
        ['Terdaftar Sejak', fmtDateShort(m.created_at)]
      ]);
    });
  },

  /* ── Lamaran Masuk (V6.8) ────────────────────────────────────────────────
     Backend getLamaranMagang/updateLamaranMagangStatus sudah ada sejak form
     lamaran publik dirilis, tapi tidak pernah punya UI admin — lamaran hanya
     terlihat lewat sheet + notifikasi Telegram. Suite ini melengkapinya:
     tabel review, modal detail + keputusan, dan jalan pintas "Jadikan
     Peserta" yang mengisi form magang dari data pelamar. */
  loadLamaran: function (paksa) {
    if (!isApprover()) return;
    var tbody = $('#mgLamaranBody');
    if (tbody && (!MagangModule._lamaranDimuat || paksa)) {
      tbody.innerHTML = '<tr><td colspan="7" style="padding:14px 16px">' +
        '<div class="skeleton" style="height:16px;max-width:340px"></div></td></tr>';
    }
    API.call('getLamaranMagang', {}).then(function (r) {
      if (!r.success) { Toast.error('Gagal memuat lamaran', r.error); return; }
      MagangModule.lamaran = r.data || [];
      MagangModule._lamaranDimuat = true;
      MagangModule.renderLamaran();
      // Badge dihitung dari data segar — konsisten dengan hitungLamaranBaru_ backend
      MagangModule.setLamaranBadge(MagangModule.lamaran.filter(function (l) {
        return String(l.status || '').toLowerCase() === 'baru';
      }).length);
    });
  },

  LAMARAN_BADGE: { baru: 'badge-waiting', review: 'badge-serving', diterima: 'badge-done', ditolak: 'badge-cancelled' },
  LAMARAN_LABEL: { baru: 'Baru', review: 'Direview', diterima: 'Diterima', ditolak: 'Ditolak' },

  renderLamaran: function () {
    var tbody = $('#mgLamaranBody');
    if (!tbody) return;
    var f = ($('#mgLamaranFilter') ? $('#mgLamaranFilter').value : '') || '';
    var rows = MagangModule.lamaran.filter(function (l) {
      return !f || String(l.status || '').toLowerCase() === f;
    });
    if (!rows.length) {
      tbody.innerHTML = emptyRow(7, 'file',
        f ? 'Tidak ada lamaran "' + (MagangModule.LAMARAN_LABEL[f] || f) + '"' : 'Belum ada lamaran',
        f ? 'Coba filter status lain.'
          : 'Lamaran dari halaman publik ?page=lamaran-magang akan tampil di sini.');
      renderIcons(tbody);
      return;
    }
    tbody.innerHTML = rows.map(function (l) {
      var st = String(l.status || 'baru').toLowerCase();
      var cv = l.cv_url
        ? '<a class="btn btn-ghost btn-sm" href="' + escapeHtml(l.cv_url) + '" target="_blank" rel="noopener">' +
            iconSvg('file', 'btn-icon') + ' Lihat</a>'
        : '<span class="text-muted" style="font-size:12px">—</span>';
      return '<tr>' +
        '<td style="white-space:nowrap;font-size:12px">' + fmtDateShort(l.tanggal) +
          '<div class="cell-sub">' + escapeHtml(l.waktu || '') + '</div></td>' +
        '<td><div class="cell-primary">' + escapeHtml(l.nama_lengkap || '—') + '</div>' +
          '<div class="cell-sub">' + escapeHtml(l.no_hp || '') + (l.email ? ' · ' + escapeHtml(l.email) : '') + '</div></td>' +
        '<td><div style="font-weight:500">' + escapeHtml(l.institusi || '—') + '</div>' +
          '<div class="cell-sub">' + escapeHtml([l.jenjang, l.jurusan].filter(Boolean).join(' — ')) + '</div></td>' +
        '<td style="font-size:12px;white-space:nowrap">' +
          (l.periode_mulai
            ? fmtDateShort(l.periode_mulai) + ' <span class="text-muted">→</span> ' + fmtDateShort(l.periode_selesai)
            : '<span class="text-muted">—</span>') + '</td>' +
        '<td>' + cv + '</td>' +
        '<td><span class="badge ' + (MagangModule.LAMARAN_BADGE[st] || 'badge-neutral') + '">' +
          (MagangModule.LAMARAN_LABEL[st] || escapeHtml(st)) + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn btn-outline btn-sm" data-lamaran="' + escapeHtml(l.id) + '">Proses</button></td></tr>';
    }).join('');
    renderIcons(tbody);
    $all('[data-lamaran]', tbody).forEach(function (b) {
      b.addEventListener('click', function () { MagangModule.openLamaran(b.getAttribute('data-lamaran')); });
    });
  },

  openLamaran: function (id) {
    var l = MagangModule.lamaran.find(function (x) { return String(x.id) === String(id); });
    if (!l) return;
    MagangModule.lamaranAktif = l;
    var st = String(l.status || 'baru').toLowerCase();
    var baris = function (label, nilai, html) {
      return '<div style="display:flex;gap:12px;padding:6px 0;border-bottom:1px solid var(--slate-100);font-size:13px">' +
        '<div style="flex:none;width:138px;color:var(--text-secondary);font-weight:600">' + label + '</div>' +
        '<div style="min-width:0;overflow-wrap:anywhere">' +
          (html ? nilai : escapeHtml(nilai == null || nilai === '' ? '—' : String(nilai))) + '</div></div>';
    };
    $('#lmDetail').innerHTML =
      baris('Status', '<span class="badge ' + (MagangModule.LAMARAN_BADGE[st] || 'badge-neutral') + '">' +
        (MagangModule.LAMARAN_LABEL[st] || escapeHtml(st)) + '</span>', true) +
      baris('Nama', l.nama_lengkap) +
      baris('Kontak', [l.no_hp, l.email].filter(Boolean).join(' · ')) +
      baris('Institusi', l.institusi) +
      baris('Jurusan', [l.jenjang, l.jurusan].filter(Boolean).join(' — ')) +
      baris('Periode Diminta', l.periode_mulai
        ? fmtDateShort(l.periode_mulai) + ' → ' + fmtDateShort(l.periode_selesai) : '') +
      baris('Bagian Diminati', l.bagian_diminati) +
      baris('Motivasi', l.motivasi) +
      baris('CV', l.cv_url
        ? '<a class="btn btn-outline btn-sm" href="' + escapeHtml(l.cv_url) + '" target="_blank" rel="noopener">' +
            iconSvg('file', 'btn-icon') + ' ' + escapeHtml(l.cv_nama || 'Buka CV') + '</a>'
        : '<span class="text-muted">Tidak ada</span>', true) +
      baris('Masuk', fmtDateShort(l.tanggal) + (l.waktu ? ' · ' + l.waktu : '')) +
      (l.diproses_oleh
        ? baris('Diproses Oleh', l.diproses_oleh + (l.tgl_proses ? ' · ' + fmtDateShort(l.tgl_proses) : ''))
        : '');
    renderIcons($('#lmDetail'));
    $('#lmCatatan').value = l.catatan_admin || '';
    // Tombol menyesuaikan status: keputusan final tak bisa "direview" lagi
    var tampil = function (sel, ya) { var b = $(sel); if (b) b.style.display = ya ? '' : 'none'; };
    tampil('#lmReview',  st === 'baru');
    tampil('#lmTerima',  st === 'baru' || st === 'review');
    tampil('#lmTolak',   st === 'baru' || st === 'review');
    tampil('#lmJadikan', st === 'diterima');
    Modal.open('modalLamaran');
  },

  prosesLamaran: function (status) {
    var l = MagangModule.lamaranAktif;
    if (!l) return;
    // Audit V7 #3: tombol keputusan modal dinonaktifkan selama proses
    var btnSel = { review: '#lmReview', diterima: '#lmTerima', ditolak: '#lmTolak' }[status];
    var btn = btnSel ? $(btnSel) : null;
    var kirim = function () {
      apiKlikSekali(btn, 'updateLamaranMagangStatus', {
        id: l.id, status: status,
        catatan: $('#lmCatatan') ? $('#lmCatatan').value.trim() : ''
      }).then(function (r) {
        if (!r.success) { Toast.error(r.error || 'Gagal memproses lamaran'); return; }
        Modal.close('modalLamaran');
        if (status === 'diterima') {
          Toast.success('Lamaran ' + (l.nama_lengkap || '') + ' diterima',
            'Email pemberitahuan dikirim bila notifikasi email aktif.', {
              action: { label: 'Jadikan Peserta', onClick: function () { MagangModule.openFormDariLamaran(l); } }
            });
        } else {
          Toast.success(r.message || 'Status lamaran diperbarui');
        }
        MagangModule.loadLamaran(true);
      });
    };
    if (status === 'ditolak') {
      Confirm.ask('Tolak Lamaran',
        'Tolak lamaran ' + (l.nama_lengkap || 'ini') +
        '? Pelamar menerima email pemberitahuan bila notifikasi email aktif.', kirim);
    } else kirim();
  },

  /** Prefill form Tambah Magang dari data pelamar — tanpa mengetik ulang. */
  openFormDariLamaran: function (l) {
    if (!l) return;
    Modal.close('modalLamaran');
    MagangModule.openForm(null);
    $('#mgFormTitle').textContent = 'Tambah Magang — dari Lamaran';
    $('#mgFNama').value = l.nama_lengkap || '';
    $('#mgFHp').value = l.no_hp || '';
    $('#mgFEmail').value = l.email || '';
    $('#mgFKampus').value = l.institusi || '';
    $('#mgFJurusan').value = l.jurusan || '';
    $('#mgFMulai').value = String(l.periode_mulai || '').substring(0, 10);
    $('#mgFSelesai').value = String(l.periode_selesai || '').substring(0, 10);
    if (l.bagian_diminati) {
      var sel = $('#mgFBagian');
      var ada = Array.prototype.some.call(sel.options, function (o) { return o.value === l.bagian_diminati; });
      if (ada) sel.value = l.bagian_diminati;
    }
    $('#mgFCatatan').value = 'Dari lamaran ' + (l.id || '') +
      (l.motivasi ? ' — Motivasi: ' + l.motivasi : '');
  },

  /** Satu sumber angka badge lamaran baru — sidebar & tab (dipanggil dari
      bundel boot App.onUserReady dan setiap loadLamaran selesai). */
  setLamaranBadge: function (n) {
    n = parseInt(n, 10) || 0;
    ['#mgLamaranNavBadge', '#mgLamaranTabBadge'].forEach(function (sel) {
      var b = $(sel);
      if (!b) return;
      b.textContent = n;
      b.style.display = n ? '' : 'none';
    });
  },

  openForm: function (m) {
    $('#mgFormTitle').textContent = m ? 'Edit Magang' : 'Tambah Magang';
    $('#mgFId').value = m ? m.id : '';
    MagangModule.profilFoto = '';
    var fi = $('#mgFFoto');
    if (fi) {
      fi.value = '';
      if (!fi._bound) {
        fi._bound = true;
        fi.addEventListener('change', function () {
          var f = fi.files && fi.files[0];
          if (!f) { MagangModule.profilFoto = ''; $('#mgFFotoPreview').classList.remove('is-visible'); return; }
          compressImage(f, 800, 0.85).then(function (dataUrl) {
            MagangModule.profilFoto = dataUrl;
            $('#mgFFotoImg').src = dataUrl;
            $('#mgFFotoPreview').classList.add('is-visible');
          });
        });
      }
      // saat edit: tampilkan foto tersimpan sebagai pratinjau (thumbnail ringan)
      var ada = m && m.foto ? driveImgSrc(m.foto, 400) : '';
      if (ada) { $('#mgFFotoImg').src = ada; $('#mgFFotoPreview').classList.add('is-visible'); }
      else $('#mgFFotoPreview').classList.remove('is-visible');
    }
    $('#mgFNama').value = m ? (m.nama || '') : '';
    $('#mgFNim').value = m ? (m.nim || '') : '';
    $('#mgFHp').value = m ? (m.no_hp || '') : '';
    $('#mgFKampus').value = m ? (m.universitas || '') : '';
    $('#mgFJurusan').value = m ? (m.jurusan || '') : '';
    $('#mgFMulai').value = m ? String(m.periode_mulai || '').substring(0, 10) : '';
    $('#mgFSelesai').value = m ? String(m.periode_selesai || '').substring(0, 10) : '';
    $('#mgFBagian').value = m ? (m.bagian || '') : '';
    $('#mgFPembimbing').value = m ? (m.pembimbing || '') : '';
    $('#mgFStatus').value = m ? (String(m.status || 'active')) : 'active';
    $('#mgFEmail').value = m ? (m.email || '') : '';
    $('#mgFAlamatDomisili').value = m ? (m.alamat_domisili || '') : '';
    $('#mgFAlamatSekarang').value = m ? (m.alamat_sekarang || '') : '';
    $('#mgFCatatan').value = m ? (m.catatan || '') : '';
    Modal.open('modalMagang');
  },

  submitForm: function () {
    var nama = $('#mgFNama').value.trim();
    if (!nama) { Toast.warning('Nama peserta wajib diisi'); return; }
    var id = $('#mgFId').value;
    var payload = {
      nama: nama, nim: $('#mgFNim').value.trim(), no_hp: $('#mgFHp').value.trim(),
      universitas: $('#mgFKampus').value.trim(), jurusan: $('#mgFJurusan').value.trim(),
      periode_mulai: $('#mgFMulai').value, periode_selesai: $('#mgFSelesai').value,
      bagian: $('#mgFBagian').value, pembimbing: $('#mgFPembimbing').value.trim(),
      status: $('#mgFStatus').value, email: $('#mgFEmail').value.trim(),
      alamat_domisili: $('#mgFAlamatDomisili').value.trim(),
      alamat_sekarang: $('#mgFAlamatSekarang').value.trim(),
      catatan: $('#mgFCatatan').value.trim()
    };
    if (MagangModule.profilFoto) payload.foto = MagangModule.profilFoto;
    if (id) payload.id = id;
    var btn = $('#mgFSubmit'), txt = $('#mgFSubmitText');
    btnLoading(btn, txt, true);
    API.call(id ? 'updateMagang' : 'createMagang', payload).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan');
      if (res.success) { Modal.close('modalMagang'); Toast.success(res.message || 'Tersimpan'); MagangModule.load(); }
      else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  /* ── Alumni & sertifikat (Fase 4) ── */
  alumniOnly: function () {
    return MagangModule.list.filter(function (m) {
      return String(m.status || '').toLowerCase() === 'alumni';
    });
  },

  renderAlumni: function () {
    var tbody = $('#mgAlumniBody');
    if (!tbody) return;
    var q = ($('#mgAlumniSearch').value || '').toLowerCase();
    var rows = MagangModule.alumniOnly().filter(function (m) {
      return !q || [m.nama, m.universitas, m.jurusan, m.bagian].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'award',
        q ? 'Tidak ada alumni yang cocok' : 'Belum ada alumni',
        q ? 'Coba kata kunci lain.' : 'Peserta otomatis menjadi alumni saat periode magangnya berakhir.');
      renderIcons(tbody);
      return;
    }
    var approver = isApprover();
    tbody.innerHTML = rows.map(function (m) {
      var sert = m.sertifikat_url
        ? '<a class="chip" href="' + escapeHtml(m.sertifikat_url) + '" target="_blank" rel="noopener">' +
            iconSvg('award') + ' ' + escapeHtml(m.sertifikat_nomor || 'Lihat PDF') + '</a>'
        : '<span class="text-muted" style="font-size:12px">Belum diterbitkan</span>';
      var aksi = '<button class="btn btn-ghost btn-sm" data-adet="' + escapeHtml(m.id) + '">Detail</button>';
      if (m.sertifikat_url) {
        aksi += ' <a class="btn btn-outline btn-sm" href="' + escapeHtml(m.sertifikat_url) + '" target="_blank" rel="noopener">' +
          iconSvg('download', 'btn-icon') + ' Unduh</a>';
        if (approver) aksi += ' <button class="btn btn-ghost btn-sm" data-asert="' + escapeHtml(m.id) + '" data-regen="1" title="Terbitkan ulang (mis. setelah data/kacab diperbarui)">Terbitkan Ulang</button>';
      } else if (approver) {
        aksi += ' <button class="btn btn-primary btn-sm" data-asert="' + escapeHtml(m.id) + '">' +
          iconSvg('award', 'btn-icon') + ' Buat Sertifikat</button>';
      }
      return '<tr>' +
        '<td><div style="font-weight:600">' + escapeHtml(m.nama) + '</div>' +
        '<div class="text-muted" style="font-size:11.5px">' + escapeHtml(m.nim || '') + '</div></td>' +
        '<td><div style="font-weight:500">' + escapeHtml(m.universitas || '—') + '</div>' +
        '<div class="text-muted" style="font-size:11.5px">' + escapeHtml(m.jurusan || '') + '</div></td>' +
        '<td>' + escapeHtml(m.bagian || '—') + '</td>' +
        '<td style="font-size:12px;white-space:nowrap">' + fmtDateShort(m.periode_mulai) +
        ' <span class="text-muted">→</span> ' + fmtDateShort(m.periode_selesai) + '</td>' +
        '<td>' + sert + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + aksi + '</td>' +
      '</tr>';
    }).join('');
    renderIcons(tbody);

    $all('[data-adet]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        MagangModule.showDetail(b.getAttribute('data-adet'));
      });
    });
    $all('[data-asert]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-asert');
        var regen = b.getAttribute('data-regen') === '1';
        var m = MagangModule.list.find(function (x) { return String(x.id) === id; });
        Confirm.ask(
          regen ? 'Terbitkan ulang sertifikat?' : 'Terbitkan sertifikat?',
          (m ? m.nama + ' — ' : '') +
            (regen ? 'PDF baru menggantikan tautan lama dengan nomor yang sama.'
                   : 'PDF resmi bernomor akan dibuat & tersimpan di Google Drive.'),
          function () { MagangModule.buatSertifikat(id, regen, b); }
        );
      });
    });
  },

  buatSertifikat: function (id, regen, btn) {
    if (btn) btn.disabled = true;
    Toast.info('Menerbitkan sertifikat…', 'Menyusun PDF di Google Drive, mohon tunggu.');
    API.call('generateSertifikatMagang', { magang_id: id, regenerate: regen }).then(function (r) {
      if (btn) btn.disabled = false;
      if (r.success) {
        Toast.success(r.message || 'Sertifikat terbit', r.warning || '');
        MagangModule.loadData();
        if (r.url) window.open(r.url, '_blank');
      } else {
        Toast.error('Gagal menerbitkan sertifikat', r.error);
      }
    });
  },

  /* ── Presensi ── */
  applyPresensi: function (r) {
    var tbody = $('#mgPresBody');
    if (!r || !r.success) { Toast.error('Gagal memuat presensi', r && r.error); return; }
    var rows = r.data || [];
    MagangModule.presensiRows = rows;
    MagangModule.renderBelum();
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'clock', 'Belum ada presensi',
        'Belum ada peserta yang presensi pada tanggal ini.');
      renderIcons(tbody);
      return;
    }
    var durasi = function (m1, m2) {
      var a = String(m1 || '').match(/(\d{1,2}):(\d{2})/), b = String(m2 || '').match(/(\d{1,2}):(\d{2})/);
      if (!a || !b) return '';
      var mnt = (parseInt(b[1], 10) * 60 + parseInt(b[2], 10)) - (parseInt(a[1], 10) * 60 + parseInt(a[2], 10));
      if (mnt <= 0) return '';
      return Math.floor(mnt / 60) + 'j ' + (mnt % 60 < 10 ? '0' : '') + (mnt % 60) + 'm';
    };
    tbody.innerHTML = rows.map(function (p) {
      var dur = durasi(p.jam_masuk, p.jam_pulang);
      return '<tr>' +
        '<td><div class="cell-primary">' + escapeHtml(p.nama) + '</div></td>' +
        '<td class="cell-mono">' + fmtTime(p.jam_masuk) + '</td>' +
        '<td class="cell-mono">' + fmtTime(p.jam_pulang) +
        (dur ? '<div class="cell-sub">' + dur + '</div>' : '') + '</td>' +
        '<td>' + lokasiChip(p.lokasi_masuk, 'Peta') + '</td>' +
        '<td>' + statusBadge(p.status || 'hadir') + '</td>' +
        '<td><div style="display:flex;gap:5px">' + fotoChip(p.foto_masuk, 'Foto masuk') +
        (p.foto_pulang ? fotoChip(p.foto_pulang, 'Foto pulang') : '') + '</div></td></tr>';
    }).join('');
  },
  loadPresensi: function () {
    var tanggal = $('#mgPresTgl').value || todayISO();
    API.call('getPresensiMagang', { tanggal: tanggal }).then(function (r) {
      MagangModule.applyPresensi(r);
    });
  },

  openPresManual: function (magangId) {
    if (magangId && !isApprover()) return; // klik chip oleh non-approver diabaikan
    fillSelect($('#pmFMagang'), MagangModule.aktifOnly(), '— Pilih magang —', function (m) {
      return m.nama + (m.bagian ? ' · ' + m.bagian : '');
    });
    if (magangId) $('#pmFMagang').value = String(magangId);
    $('#pmFTanggal').value = $('#mgPresTgl').value || todayISO();
    $('#pmFStatus').value = 'hadir';
    $('#pmFMasuk').value = '';
    $('#pmFPulang').value = '';
    $('#pmFKet').value = '';
    Modal.open('modalPresMagang');
  },

  submitPresManual: function () {
    var magangId = $('#pmFMagang').value;
    if (!magangId) { Toast.warning('Pilih peserta magang dahulu'); return; }
    var btn = $('#pmFSubmit'), txt = $('#pmFSubmitText');
    btnLoading(btn, txt, true);
    API.call('createPresensiMagang', {
      magang_id: magangId,
      tanggal: $('#pmFTanggal').value || todayISO(),
      status: $('#pmFStatus').value,
      jam_masuk: $('#pmFMasuk').value,
      jam_pulang: $('#pmFPulang').value,
      keterangan: $('#pmFKet').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan');
      if (res.success) {
        Modal.close('modalPresMagang');
        Toast.success(res.message || 'Presensi tercatat');
        MagangModule.loadPresensi();
        MagangModule.loadStats();
      } else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  /* ── Belum presensi (V6.9) — peserta aktif tanpa catatan di tanggal terpilih ── */
  renderBelum: function () {
    var card = $('#mgBelumCard'), box = $('#mgBelumBox'), cnt = $('#mgBelumCount');
    if (!card || !box) return;
    var aktif = MagangModule.aktifOnly();
    if (!aktif.length) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    var tanggal = ($('#mgPresTgl') && $('#mgPresTgl').value) || todayISO();
    var sudah = {};
    (MagangModule.presensiRows || []).forEach(function (p) { sudah[String(p.magang_id)] = true; });
    var belum = aktif.filter(function (m) { return !sudah[String(m.id)]; });
    if (cnt) cnt.textContent = String(belum.length);
    if (!belum.length) {
      if (cnt) { cnt.classList.remove('is-danger'); }
      box.innerHTML = '<div class="alert alert-success" style="margin:0">Semua <b>' + aktif.length +
        '</b> peserta aktif sudah tercatat presensi pada tanggal ini. \u2705</div>';
      return;
    }
    if (cnt) cnt.classList.add('is-danger');
    var bisaEntri = isApprover();
    box.innerHTML = '<div class="belum-list">' + belum.map(function (m) {
      var label = escapeHtml(m.nama) + (m.bagian ? ' <span class="bl-sub">\u00b7 ' + escapeHtml(m.bagian) + '</span>' : '');
      return bisaEntri
        ? '<button type="button" class="belum-chip" data-belum-id="' + escapeHtml(m.id) + '" title="Entri manual (hadir/izin/sakit)">' + label + '</button>'
        : '<span class="belum-chip is-static">' + label + '</span>';
    }).join('') + '</div>' +
    '<p class="text-muted" style="font-size:11.5px;margin:10px 0 0">' +
      (bisaEntri ? 'Klik nama untuk membuka <b>entri manual</b> (hadir/izin/sakit).'
                 : 'Daftar peserta aktif yang belum tercatat presensi pada ' + fmtTglID(tanggal) + '.') +
      (tanggal > todayISO() ? ' <b>Catatan:</b> tanggal terpilih di masa depan.' : '') + '</p>';
  },

  /* ── Rekap bulanan (V6.9) — bahan penilaian pembimbing ── */
  loadRekap: function () {
    var bulan = ($('#mgRekapBulan') && $('#mgRekapBulan').value) || thisMonthISO();
    var tb = $('#mgRekapBody');
    if (tb) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Memuat rekap\u2026</td></tr>'; }
    API.call('getRekapPresensiMagang', { bulan: bulan }).then(function (r) {
      if (!r.success) {
        // Audit V7 #1: dulu jalur gagal langsung return — baris "Memuat…"
        // macet selamanya dan _rekapDimuat=true (diset SEBELUM panggilan)
        // memblokir percobaan ulang. Kini: tabel diberi status gagal yang
        // jelas dan keluar-masuk tab memicu pemuatan ulang.
        MagangModule._rekapDimuat = false;
        if (tb) { tb.innerHTML = emptyRow(7, 'alert', 'Gagal memuat rekap', r.error || ''); renderIcons(tb); }
        Toast.error('Gagal memuat rekap', r.error);
        return;
      }
      MagangModule._rekapDimuat = true;   // pindah ke SETELAH sukses
      MagangModule.rekap = r.data;
      MagangModule.renderRekap();
    });
  },
  renderRekap: function () {
    var tb = $('#mgRekapBody'), hint = $('#mgRekapHint');
    if (!tb) return;
    var d = MagangModule.rekap || {};
    var rows = d.per_orang || [];
    if (hint) hint.innerHTML = d.hari_kerja !== undefined
      ? 'Persentase dihitung terhadap <b>' + d.hari_kerja + ' hari kerja</b> (Senin\u2013Jumat di luar libur nasional/cuti bersama' +
        (d.bulan_berjalan ? ', s.d. hari ini' : '') + '). <b>Terlambat</b> = check-in setelah pukul ' +
        escapeHtml(d.jam_masuk_acuan || '08:00') + ' (Pengaturan \u2192 Jam kerja mulai). ' +
        '<b>Lengkap</b> = ada jam masuk &amp; pulang.'
      : '';
    if (!rows.length) {
      tb.innerHTML = emptyRow(7, 'chart', 'Belum ada data',
        'Tidak ada peserta aktif maupun presensi pada bulan ini.');
      renderIcons(tb);
      return;
    }
    tb.innerHTML = rows.map(function (o) {
      var badgePersen = o.persen >= 90 ? 'badge-done' : (o.persen >= 75 ? 'badge-waiting' : 'badge-cancelled');
      return '<tr>' +
        '<td><div class="cell-primary">' + escapeHtml(o.nama) + '</div>' +
          '<div class="cell-sub">' + escapeHtml(o.bagian || '\u2014') +
          (String(o.status) === 'alumni' ? ' \u00b7 alumni' : '') + '</div></td>' +
        '<td class="fw-bold">' + o.hadir + '</td>' +
        '<td>' + (o.terlambat ? '<span class="badge badge-waiting">' + o.terlambat + '</span>' : '0') + '</td>' +
        '<td>' + o.izin + '</td>' +
        '<td>' + o.sakit + '</td>' +
        '<td>' + o.lengkap + '</td>' +
        '<td><span class="badge ' + badgePersen + '">' + o.persen + '%</span></td>' +
      '</tr>';
    }).join('');
  },
  downloadRekapCsv: function () {
    var d = MagangModule.rekap;
    if (!d || !(d.per_orang || []).length) { Toast.warning('Muat rekap terlebih dahulu'); return; }
    downloadCSV('rekap-presensi-magang-' + d.bulan + '.csv',
      ['Nama', 'Bagian', 'Status', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Lengkap', 'Hari Kerja', '% Kehadiran'],
      d.per_orang.map(function (o) {
        return [o.nama, o.bagian, o.status, o.hadir, o.terlambat, o.izin, o.sakit, o.lengkap, d.hari_kerja, o.persen + '%'];
      }));
    Toast.success('CSV rekap ' + d.bulan + ' diunduh');
  },

  /* ── Logbook ── */
  applyLogbook: function (r) {
    var tbody = $('#mgLogBody');
    if (!r || !r.success) { Toast.error('Gagal memuat logbook', r && r.error); return; }
    MagangModule.logbook = r.data || [];
    if (!MagangModule.logbook.length) {
        tbody.innerHTML = emptyRow(5, 'clipboard', 'Belum ada logbook',
          'Peserta magang bisa menulis kegiatan harian melalui tombol "Tulis Logbook".');
        renderIcons(tbody);
        return;
      }
      var canReview = isApprover();
      tbody.innerHTML = MagangModule.logbook.map(function (l, i) {
        var aksi = '<button class="btn btn-ghost btn-sm" data-lbdetail="' + i + '">Detail</button>';
        if (canReview && String(l.status_review) === 'pending') {
          aksi += ' <button class="btn btn-primary btn-sm" data-lbreview="' + i + '">Review</button>';
        }
        return '<tr>' +
          '<td style="white-space:nowrap;font-size:12px">' + fmtDateShort(l.tanggal) + '</td>' +
          '<td><div class="cell-primary">' + escapeHtml(l.nama) + '</div></td>' +
          '<td><div style="display:flex;gap:8px;align-items:flex-start">' +
          (l.foto ? fotoChip(l.foto, 'Foto kegiatan') : '') +
          '<div style="font-size:12.5px;max-width:320px;white-space:normal">' + escapeHtml(l.kegiatan) + '</div></div></td>' +
          '<td>' + statusBadge(l.status_review || 'pending') + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' + aksi + '</td></tr>';
      }).join('');
      $all('[data-lbdetail]', tbody).forEach(function (b) {
        b.addEventListener('click', function () {
          var l = MagangModule.logbook[parseInt(b.getAttribute('data-lbdetail'), 10)];
          if (!l) return;
          DetailView.show('Logbook — ' + l.nama, [
            ['Tanggal', fmtDateShort(l.tanggal)],
            ['Peserta', l.nama],
            ['Kegiatan', l.kegiatan],
            ['Hasil', l.hasil],
            ['Foto', fotoChip(l.foto, 'Lihat Foto'), { html: true }],
            ['Review', statusBadge(l.status_review || 'pending'), { html: true }],
            ['Direview oleh', l.review_by],
            ['Catatan Review', l.catatan_review]
          ]);
        });
      });
      $all('[data-lbreview]', tbody).forEach(function (b) {
        b.addEventListener('click', function () {
          var l = MagangModule.logbook[parseInt(b.getAttribute('data-lbreview'), 10)];
          if (!l) return;
          $('#lbrId').value = l.id;
          $('#lbrNama').textContent = l.nama + ' · ' + fmtDateShort(l.tanggal);
          $('#lbrKegiatan').textContent = l.kegiatan;
          $('#lbrStatus').value = 'approved';
          $('#lbrCatatan').value = '';
          Modal.open('modalLogbookReview');
        });
      });
  },
  loadLogbook: function () {
    var st = $('#mgLogFilter').value;
    API.call('getLogbookMagang', st ? { status_review: st } : {}).then(function (r) {
      MagangModule.applyLogbook(r);
    });
  },

  openLogbook: function () {
    fillSelect($('#lbFMagang'), MagangModule.aktifOnly(), '— Pilih magang —', function (m) {
      return m.nama + (m.bagian ? ' · ' + m.bagian : '');
    });
    $('#lbFTanggal').value = todayISO();
    $('#lbFKegiatan').value = '';
    $('#lbFHasil').value = '';
    MagangModule.lbFoto = '';
    $('#lbFFoto').value = '';
    $('#lbFotoPreview').classList.remove('is-visible');
    Modal.open('modalLogbook');
  },

  submitLogbook: function () {
    var magangId = $('#lbFMagang').value;
    var kegiatan = $('#lbFKegiatan').value.trim();
    if (!magangId) { Toast.warning('Pilih peserta magang dahulu'); return; }
    if (!kegiatan) { Toast.warning('Uraian kegiatan wajib diisi'); return; }
    var btn = $('#lbFSubmit'), txt = $('#lbFSubmitText');
    btnLoading(btn, txt, true);
    API.call('createLogbookMagang', {
      magang_id: magangId,
      tanggal: $('#lbFTanggal').value || todayISO(),
      kegiatan: kegiatan,
      hasil: $('#lbFHasil').value.trim(),
      foto: MagangModule.lbFoto || ''
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan Logbook');
      if (res.success) {
        Modal.close('modalLogbook');
        Toast.success(res.message || 'Logbook tersimpan');
        MagangModule.lbFoto = '';
        MagangModule.loadLogbook();
        MagangModule.loadStats();
      } else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  submitReview: function () {
    var id = $('#lbrId').value;
    if (!id) return;
    var btn = $('#lbrSubmit'), txt = $('#lbrSubmitText');
    btnLoading(btn, txt, true);
    API.call('reviewLogbookMagang', {
      id: id,
      status_review: $('#lbrStatus').value,
      catatan_review: $('#lbrCatatan').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan Review');
      if (res.success) {
        Modal.close('modalLogbookReview');
        Toast.success(res.message || 'Review tersimpan');
        MagangModule.loadLogbook();
        MagangModule.loadStats();
      } else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  /* ── Tugas ── */
  applyTugas: function (r) {
    var tbody = $('#mgTugasBody');
    if (!r || !r.success) { Toast.error('Gagal memuat tugas', r && r.error); return; }
    MagangModule.tugas = r.data || [];
    if (!MagangModule.tugas.length) {
        tbody.innerHTML = emptyRow(7, 'star', 'Belum ada tugas',
          'Pembimbing dapat memberi tugas melalui tombol "Beri Tugas".');
        renderIcons(tbody);
        return;
      }
      var canManage = isApprover();
      var PRIO = { rendah: 'neutral', normal: 'serving', tinggi: 'cancelled' };
      tbody.innerHTML = MagangModule.tugas.map(function (t, i) {
        var st2 = String(t.status || 'pending');
        var aksi = '<button class="btn btn-ghost btn-sm" data-tgdetail="' + i + '">Detail</button>';
        if (st2 === 'pending') aksi += ' <button class="btn btn-primary btn-sm" data-tgsubmit="' + i + '">Kumpulkan</button>';
        if (canManage && st2 === 'selesai') aksi += ' <button class="btn btn-success btn-sm" data-tgnilai="' + i + '">Nilai</button>';
        if (canManage) aksi += ' <button class="btn btn-danger btn-sm" data-tgdel="' + i + '">Hapus</button>';
        return '<tr>' +
          '<td style="white-space:nowrap;font-size:12px">' + fmtDateShort(t.deadline) + '</td>' +
          '<td><div class="cell-primary">' + escapeHtml(t.nama_magang) + '</div></td>' +
          '<td><div style="font-weight:500;font-size:12.5px">' + escapeHtml(t.judul_tugas) + '</div>' +
          '<div class="cell-sub" style="white-space:normal">' + escapeHtml(t.deskripsi || '') + '</div></td>' +
          '<td><span class="badge badge-' + (PRIO[String(t.prioritas)] || 'neutral') + '">' +
          escapeHtml(t.prioritas || 'normal') + '</span></td>' +
          '<td>' + statusBadge(st2) + '</td>' +
          '<td class="cell-mono">' + (t.nilai !== '' && t.nilai != null ? escapeHtml(t.nilai) : '—') + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' + aksi + '</td></tr>';
      }).join('');
      MagangModule.bindTugas(tbody);
  },
  loadTugas: function () {
    var st = $('#mgTugasFilter').value;
    API.call('getTugasMagang', st ? { status: st } : {}).then(function (r) {
      MagangModule.applyTugas(r);
    });
  },

  bindTugas: function (tbody) {
    var get = function (b, attr) { return MagangModule.tugas[parseInt(b.getAttribute(attr), 10)]; };
    $all('[data-tgdetail]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = get(b, 'data-tgdetail');
        if (!t) return;
        var hasil = String(t.file_hasil || '');
        DetailView.show('Tugas — ' + t.judul_tugas, [
          ['Peserta', t.nama_magang],
          ['Judul', t.judul_tugas],
          ['Deskripsi', t.deskripsi],
          ['Deadline', fmtDateShort(t.deadline)],
          ['Prioritas', t.prioritas || 'normal'],
          ['Status', statusBadge(t.status), { html: true }],
          ['Lampiran Tugas', t.file_tugas ? fotoChip(t.file_tugas, 'Lampiran') : '—', { html: !!t.file_tugas }],
          ['Hasil', /^https?:\/\//i.test(hasil) ? fotoChip(hasil, 'Buka Hasil') : (hasil || '—'),
            { html: /^https?:\/\//i.test(hasil) }],
          ['Nilai', t.nilai !== '' && t.nilai != null ? t.nilai : '—'],
          ['Catatan', t.catatan],
          ['Diberikan oleh', t.assigned_by]
        ]);
      });
    });
    $all('[data-tgsubmit]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = get(b, 'data-tgsubmit');
        if (!t) return;
        $('#thId').value = t.id;
        $('#thJudul').textContent = t.judul_tugas;
        $('#thMeta').textContent = t.nama_magang + ' · deadline ' + fmtDateShort(t.deadline);
        $('#thHasil').value = '';
        MagangModule.thFoto = '';
        $('#thFoto').value = '';
        $('#thFotoPreview').classList.remove('is-visible');
        Modal.open('modalTugasSubmit');
      });
    });
    $all('[data-tgnilai]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = get(b, 'data-tgnilai');
        if (!t) return;
        $('#niId').value = t.id;
        $('#niJudul').textContent = t.judul_tugas + ' — ' + t.nama_magang;
        $('#niHasil').textContent = 'Hasil: ' + (t.file_hasil || '—');
        $('#niNilai').value = '';
        $('#niCatatan').value = '';
        Modal.open('modalNilai');
      });
    });
    $all('[data-tgdel]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var t = get(b, 'data-tgdel');
        Confirm.ask('Hapus Tugas', 'Hapus tugas "' + (t ? t.judul_tugas : '') + '"?', function () {
          apiKlikSekali(b, 'deleteTugasMagang', { id: t.id }).then(function (res) {
            if (res.success) { Toast.success(res.message || 'Terhapus'); MagangModule.loadTugas(); }
            else Toast.error(res.error || 'Gagal menghapus');
          });
        });
      });
    });
  },

  openTugas: function (t) {
    $('#tgFormTitle').textContent = t ? 'Edit Tugas' : 'Beri Tugas';
    $('#tgFId').value = t ? t.id : '';
    fillSelect($('#tgFMagang'), MagangModule.aktifOnly(), '— Pilih magang —', function (m) {
      return m.nama + (m.bagian ? ' · ' + m.bagian : '');
    });
    if (t) $('#tgFMagang').value = t.magang_id;
    $('#tgFJudul').value = t ? (t.judul_tugas || '') : '';
    $('#tgFDeskripsi').value = t ? (t.deskripsi || '') : '';
    $('#tgFDeadline').value = t ? String(t.deadline || '').substring(0, 10) : '';
    $('#tgFPrioritas').value = t ? (t.prioritas || 'normal') : 'normal';
    Modal.open('modalTugas');
  },

  submitTugasForm: function () {
    var magangId = $('#tgFMagang').value;
    var judul = $('#tgFJudul').value.trim();
    if (!magangId) { Toast.warning('Pilih peserta magang dahulu'); return; }
    if (!judul) { Toast.warning('Judul tugas wajib diisi'); return; }
    var id = $('#tgFId').value;
    var payload = {
      magang_id: magangId, judul_tugas: judul,
      deskripsi: $('#tgFDeskripsi').value.trim(),
      deadline: $('#tgFDeadline').value,
      prioritas: $('#tgFPrioritas').value
    };
    if (id) payload.id = id;
    var btn = $('#tgFSubmit'), txt = $('#tgFSubmitText');
    btnLoading(btn, txt, true);
    API.call(id ? 'updateTugasMagang' : 'createTugasMagang', payload).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan Tugas');
      if (res.success) { Modal.close('modalTugas'); Toast.success(res.message || 'Tersimpan'); MagangModule.loadTugas(); }
      else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  submitTugasHasil: function () {
    var id = $('#thId').value;
    var hasil = $('#thHasil').value.trim();
    if (!hasil && !MagangModule.thFoto) {
      Toast.warning('Isi hasil/tautan pekerjaan Anda atau lampirkan foto');
      return;
    }
    var btn = $('#thSubmit'), txt = $('#thSubmitText');
    btnLoading(btn, txt, true);
    API.call('submitTugasMagang', { id: id, hasil: hasil, foto: MagangModule.thFoto || '' }).then(function (res) {
      btnLoading(btn, txt, false, 'Kumpulkan');
      if (res.success) {
        Modal.close('modalTugasSubmit');
        Toast.success(res.message || 'Terkumpul');
        MagangModule.thFoto = '';
        MagangModule.loadTugas();
        // Bila dikumpulkan dari Portal Magang, segarkan juga daftar tugas peserta
        if (window.MagangSelfModule && MagangSelfModule.magangData) {
          API.call('getTugasMagang', {}).then(function (tr) {
            MagangSelfModule.tugasList = (tr.success && tr.data) ? tr.data : [];
            MagangSelfModule.renderTugas();
          });
        }
      }
      else Toast.error(res.error || 'Gagal mengumpulkan');
    });
  },

  submitNilai: function () {
    var id = $('#niId').value;
    var nilai = $('#niNilai').value;
    if (nilai === '' || isNaN(parseFloat(nilai))) { Toast.warning('Isi nilai 0–100'); return; }
    var btn = $('#niSubmit'), txt = $('#niSubmitText');
    btnLoading(btn, txt, true);
    API.call('nilaiTugasMagang', { id: id, nilai: nilai, catatan: $('#niCatatan').value.trim() }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan Nilai');
      if (res.success) { Modal.close('modalNilai'); Toast.success(res.message || 'Nilai tersimpan'); MagangModule.loadTugas(); }
      else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  /* ════════════ IZIN / SAKIT MAGANG (Fase 5.3) ════════════ */
  _izinList: [],

  loadIzin: function () {
    var filter = ($('#mgIzinFilter') && $('#mgIzinFilter').value) || '';
    API.call('getIzinMagang', { status: filter }).then(function (r) {
      if (!r.success) {
        // Backend belum punya fungsi izin → tampilkan pesan
        var tb = $('#mgIzinBody');
        if (tb) {
          tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:22px">' +
            'Fitur izin/sakit membutuhkan deployment backend terbaru. Jalankan <b>initializeAllSheets()</b> di Apps Script.</td></tr>';
        }
        return;
      }
      MagangModule._izinList = r.data || [];
      MagangModule.renderIzin();
    });
  },

  renderIzin: function () {
    var tb = $('#mgIzinBody');
    if (!tb) return;
    var rows = MagangModule._izinList;
    var JENIS = { izin: 'Izin', sakit: 'Sakit' };
    var STATUS_BADGE = {
      pending:  '<span class="badge badge-waiting">Menunggu</span>',
      approved: '<span class="badge badge-done">Disetujui</span>',
      rejected: '<span class="badge badge-cancelled">Ditolak</span>'
    };
    if (!rows.length) {
      tb.innerHTML = emptyRow(8, 'calendar', 'Belum ada pengajuan', 'Peserta mengajukan lewat Portal Magang (akun role magang).');
      renderIcons(tb);
      return;
    }
    tb.innerHTML = rows.map(function (r) {
      var tglMulai = fmtTglID(r.tgl_mulai);
      var tglRange = r.tgl_selesai && r.tgl_selesai !== r.tgl_mulai
        ? tglMulai + ' – ' + fmtTglID(r.tgl_selesai) : tglMulai;
      var eviBtn = r.lampiran_url
        ? '<a href="' + escapeHtml(r.lampiran_url) + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm" title="Lihat eviden"><svg data-icon="eye" style="width:13px;height:13px"></svg></a>'
        : '<span style="color:var(--slate-400);font-size:11px">—</span>';
      var aksi = (r.status === 'pending')
        ? '<button class="btn btn-success btn-sm" data-izp-approve="' + r.id + '" data-izp-nama="' + escapeHtml(r.nama) + '" data-izp-sub="' + escapeHtml(JENIS[r.jenis] || r.jenis) + ' · ' + tglRange + '" data-izp-lampiran="' + escapeHtml(r.lampiran_url || '') + '">Setujui</button>' +
          '<button class="btn btn-danger btn-sm" data-izp-reject="' + r.id + '" data-izp-nama="' + escapeHtml(r.nama) + '" data-izp-sub="' + escapeHtml(JENIS[r.jenis] || r.jenis) + ' · ' + tglRange + '" data-izp-lampiran="' + escapeHtml(r.lampiran_url || '') + '">Tolak</button>'
        : '';
      return '<tr>' +
        '<td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(r.created_at)) + '</td>' +
        '<td><div class="cell-primary">' + escapeHtml(r.nama) + '</div></td>' +
        '<td><span class="badge badge-neutral">' + escapeHtml(JENIS[r.jenis] || r.jenis) + '</span></td>' +
        '<td style="font-size:12px;white-space:nowrap">' + tglRange + '</td>' +
        '<td style="max-width:180px;font-size:12px">' + escapeHtml(r.alasan || '—') + '</td>' +
        '<td>' + eviBtn + '</td>' +
        '<td>' + (STATUS_BADGE[r.status] || r.status) + '</td>' +
        '<td class="cell-actions">' + aksi + '</td></tr>';
    }).join('');
    renderIcons(tb);
    // Pasang listener tombol aksi
    $all('[data-izp-approve]', tb).forEach(function (b) {
      b.addEventListener('click', function () {
        MagangModule.openIzinProses(b.getAttribute('data-izp-approve'), 'approved',
          b.getAttribute('data-izp-nama'), b.getAttribute('data-izp-sub'), b.getAttribute('data-izp-lampiran'));
      });
    });
    $all('[data-izp-reject]', tb).forEach(function (b) {
      b.addEventListener('click', function () {
        MagangModule.openIzinProses(b.getAttribute('data-izp-reject'), 'rejected',
          b.getAttribute('data-izp-nama'), b.getAttribute('data-izp-sub'), b.getAttribute('data-izp-lampiran'));
      });
    });
  },

  openIzinProses: function (id, action, nama, sub, lampiranUrl) {
    $('#izpId').value = id;
    $('#izpStatus').value = action;
    $('#izpInfo').textContent = nama || '—';
    $('#izpSub').textContent = sub || '—';
    $('#izpCatatan').value = '';
    var submitBtn = $('#izpSubmit'), submitTxt = $('#izpSubmitText');
    var tolakBtn = $('#izpTolakBtn');
    if (action === 'approved') {
      submitBtn.className = 'btn btn-success';
      submitTxt.textContent = 'Setujui';
      if (tolakBtn) tolakBtn.style.display = 'none';
    } else {
      submitBtn.className = 'btn btn-danger';
      submitTxt.textContent = 'Tolak';
      if (tolakBtn) tolakBtn.style.display = 'none';
    }
    // Tampilkan eviden jika ada
    var eviBox = $('#izpEvidenBox'), eviLink = $('#izpEvidenLink'), eviLabel = $('#izpEvidenLabel');
    if (eviBox && lampiranUrl) {
      eviBox.classList.remove('hidden');
      if (eviLink) eviLink.href = lampiranUrl;
      if (eviLabel) eviLabel.textContent = /\.pdf/i.test(lampiranUrl) ? 'Buka PDF Eviden' : 'Lihat Foto Eviden';
    } else if (eviBox) {
      eviBox.classList.add('hidden');
    }
    if (submitBtn) renderIcons(submitBtn.closest('.modal') || document.body);
    Modal.open('modalIzinProses');
  },

  submitIzinProses: function (overrideStatus) {
    var id = $('#izpId').value;
    var status = overrideStatus || $('#izpStatus').value;
    var catatan = $('#izpCatatan').value.trim();
    if (!id || !status) return;
    var btn = $('#izpSubmit'), txt = $('#izpSubmitText');
    btnLoading(btn, txt, true);
    API.call('prosesIzinMagang', { id: id, status: status, catatan_admin: catatan }).then(function (r) {
      btnLoading(btn, txt, false, status === 'approved' ? 'Setujui' : 'Tolak');
      if (r.success) {
        Modal.close('modalIzinProses');
        Toast.success(status === 'approved' ? 'Pengajuan disetujui' : 'Pengajuan ditolak',
          (r.notif && r.notif.ringkas) || '');
        notifTundaFlush(r); // V7.5: notifikasi peserta dikirim di latar belakang
        MagangModule.loadIzin();
      } else {
        Toast.error(r.error || 'Gagal memproses');
      }
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: PORTAL MAGANG SELF (Fase 5.3) — presensi, data diri, tugas, izin/sakit, sertifikat
   ══════════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════════
   HELPER "DATA SAYA" (V6.9) — satu sumber field data diri untuk panel Magang
   & Portal TAD, sehingga keduanya PARITAS (jumlah & jenis kolom identik).
   ══════════════════════════════════════════════════════════════════════════ */
function dsInput(id, label, value, opts) {
  opts = opts || {};
  var full = opts.full ? ' full' : '';
  var inner;
  if (opts.select) {
    inner = '<select class="form-control" id="' + id + '">' +
      '<option value="">\u2014 Pilih \u2014</option>' +
      opts.select.map(function (o) {
        var v = typeof o === 'string' ? o : o[0], l = typeof o === 'string' ? o : o[1];
        return '<option value="' + escapeHtml(v) + '"' + (String(value) === v ? ' selected' : '') + '>' + escapeHtml(l) + '</option>';
      }).join('') + '</select>';
  } else {
    inner = '<input class="form-control" id="' + id + '" type="' + (opts.type || 'text') + '"' +
      (opts.ph ? ' placeholder="' + escapeHtml(opts.ph) + '"' : '') +
      ' value="' + escapeHtml(value == null ? '' : String(value)) + '">';
  }
  return '<div class="form-group' + full + '"><label class="form-label">' + escapeHtml(label) + '</label>' +
    inner + (opts.hint ? '<div class="form-hint">' + opts.hint + '</div>' : '') + '</div>';
}
/* 13 field inti data diri — urutan & label SAMA untuk magang dan TAD.
   pfx membedakan ID elemen ('msProf' vs 'tsP'). */
function dsCoreFieldsHtml(pfx, d, emailHint) {
  return (
    dsInput(pfx + 'Nama', 'Nama Lengkap', d.nama, { full: true,
      hint: 'Mengganti nama mensyaratkan kolom Email = email akun login (penjaga tautan akun).' }) +
    dsInput(pfx + 'Nik', 'NIK (KTP)', d.nik, { ph: '16 digit' }) +
    dsInput(pfx + 'TmpLahir', 'Tempat Lahir', d.tempat_lahir) +
    dsInput(pfx + 'TglLahir', 'Tanggal Lahir', String(d.tanggal_lahir || '').substring(0, 10), { type: 'date' }) +
    dsInput(pfx + 'Jk', 'Jenis Kelamin', d.jenis_kelamin, { select: [['L', 'Laki-laki'], ['P', 'Perempuan']] }) +
    dsInput(pfx + 'Goldar', 'Golongan Darah', d.golongan_darah, { select: ['A', 'B', 'AB', 'O'] }) +
    dsInput(pfx + 'Pendidikan', 'Pendidikan Terakhir', d.pendidikan_terakhir,
      { select: ['SD', 'SMP', 'SMA/SMK', 'D1/D2/D3', 'D4/S1', 'S2', 'S3'] }) +
    dsInput(pfx + 'Email', 'Email', d.email, { type: 'email', hint: emailHint || '' }) +
    dsInput(pfx + 'Hp', 'No. HP / WhatsApp', d.no_hp, { type: 'tel' }) +
    dsInput(pfx + 'Alamat1', 'Alamat Domisili (KTP)', d.alamat_domisili, { full: true }) +
    dsInput(pfx + 'Alamat2', 'Alamat Sekarang', d.alamat_sekarang, { full: true, ph: 'Kos/indekos \u2014 kosongkan bila sama' }) +
    dsInput(pfx + 'DarNama', 'Kontak Darurat \u2014 Nama', d.kontak_darurat_nama) +
    dsInput(pfx + 'DarHp', 'Kontak Darurat \u2014 No. HP', d.kontak_darurat_hp, { type: 'tel' })
  );
}
/* Baca kembali 13 field inti dari form → payload API */
function dsCorePayload(pfx) {
  function v(id) { var el = $('#' + pfx + id); return el ? el.value.trim() : undefined; }
  return {
    nama: v('Nama'), nik: v('Nik'), tempat_lahir: v('TmpLahir'),
    tanggal_lahir: v('TglLahir'), jenis_kelamin: v('Jk'), golongan_darah: v('Goldar'),
    pendidikan_terakhir: v('Pendidikan'), email: v('Email'), no_hp: v('Hp'),
    alamat_domisili: v('Alamat1'), alamat_sekarang: v('Alamat2'),
    kontak_darurat_nama: v('DarNama'), kontak_darurat_hp: v('DarHp')
  };
}

/* ── V7.7: Pengumuman pengelola di Portal Magang & Portal TAD ───────────────
   Mengambil 5 pengumuman terakhir untuk audiens akun ini lewat aksi
   getPengumumanKomunikasi (didaftarkan Patch_Server_Komunikasi.gs).
   Bila patch belum terpasang ATAU belum ada pengumuman, kartu tetap
   TERSEMBUNYI — portal tampil persis seperti sebelum V7.7 (tanpa error). */
function muatPengumumanPortal_(cardSel, listSel) {
  var card = $(cardSel), list = $(listSel);
  if (!card || !list) return;
  API.call('getPengumumanKomunikasi', {}, { latar: true }).then(function (r) {
    if (!r.success || !(r.data || []).length) { card.classList.add('hidden'); return; }
    list.innerHTML = r.data.map(function (p) {
      return '<div style="padding:8px 0;border-bottom:1px dashed var(--border)">' +
        '<div class="text-muted" style="font-size:11.5px">\uD83D\uDDD3 ' + escapeHtml(fmtTglID(p.tanggal)) +
        ' · ' + escapeHtml(p.dari || 'Pengelola') + '</div>' +
        '<div style="font-size:13px;white-space:pre-line;margin-top:2px">' + escapeHtml(p.pesan || '') + '</div>' +
      '</div>';
    }).join('');
    if (list.lastElementChild) list.lastElementChild.style.borderBottom = 'none';
    card.classList.remove('hidden');
  });
}

var MagangSelfModule = {
  mode: 'masuk',
  foto: '',
  lokasi: null,
  magangData: null,
  izinList: [],
  tugasList: [],
  izinLampiran: '',   // data-URI eviden yang diunggah (gambar atau PDF)
  izinLampiranName: '', // nama file asli

  init: function () {
    // PENTING: jangan pakai `this` — Scripts_4 memanggil init lewat referensi
    // fungsi terlepas (initSafe(fn) → fn()), sehingga `this` = undefined dan
    // semua handler (openIzin, submit, dst.) melempar TypeError saat diklik.
    var self = MagangSelfModule;
    function on(s, e, f) { var el = $(s); if (el) el.addEventListener(e, f); }

    // Inisialisasi tabs Portal Magang
    initTabs('#msTabs', '[data-view-panel="magang-self"]');

    // ── Presensi ──
    on('#msMasukBtn', 'click', function () { self.setMode('masuk'); });
    on('#msPulangBtn', 'click', function () { self.setMode('pulang'); });
    on('#msSubmit',   'click', function () { self.submit(); });
    on('#msRefreshBtn', 'click', function () { self.load(); Toast.info('Portal dimuat ulang'); });
    on('#msFoto', 'change', function () {
      var f = this.files && this.files[0], prev = $('#msPreview');
      if (!f) { self.foto = ''; if (prev) prev.classList.remove('is-visible'); return; }
      compressImage(f, 1280, 0.8).then(function (d) {
        self.foto = d;
        var img = $('#msPreviewImg'); if (img) img.src = d;
        if (prev) prev.classList.add('is-visible');
      });
    });

    // ── Izin/Sakit ──
    on('#msIzinAddBtn', 'click', function () { self.openIzin(); });
    on('#izFSubmit', 'click', function () { self.submitIzin(); });
    on('#izFLampiran', 'change', function () {
      var f = this.files && this.files[0];
      var errEl = $('#izFLampiranErr');
      var prev = $('#izFPreview'), imgEl = $('#izFPreviewImg'), pdfEl = $('#izFPreviewPdf'), pdfName = $('#izFPreviewPdfName');
      self.izinLampiran = ''; self.izinLampiranName = '';
      if (prev) prev.classList.add('hidden');
      if (!f) return;
      var MAX = 5 * 1024 * 1024;
      if (f.size > MAX) {
        if (errEl) { errEl.textContent = 'File terlalu besar (maks 5 MB).'; errEl.classList.remove('hidden'); }
        this.value = ''; return;
      }
      if (errEl) errEl.classList.add('hidden');
      self.izinLampiranName = f.name;
      if (f.type.indexOf('image') === 0) {
        compressImage(f, 1600, 0.85).then(function (d) {
          self.izinLampiran = d;
          if (imgEl) { imgEl.src = d; imgEl.style.display = 'block'; }
          if (pdfEl) pdfEl.style.display = 'none';
          if (prev) prev.classList.remove('hidden');
        });
      } else {
        var reader = new FileReader();
        reader.onload = function (e) {
          self.izinLampiran = e.target.result;
          if (imgEl) imgEl.style.display = 'none';
          if (pdfEl) pdfEl.style.display = 'flex';
          if (pdfName) pdfName.textContent = f.name;
          if (prev) prev.classList.remove('hidden');
        };
        reader.readAsDataURL(f);
      }
    });
  },

  load: function () {
    var self = this;
    self.detectLokasi();
    muatPengumumanPortal_('#msPengumumanCard', '#msPengumumanList'); // V7.7
    API.call('magangSelfInfo', {}).then(function (r) {
      if (!r.success) {
        var form = $('#msForm'); if (form) form.classList.add('hidden');
        var nm = $('#msNama'); if (nm) nm.textContent = r.unlinked ? 'Akun belum terhubung ke data magang' : 'Gagal memuat';
        var mt = $('#msMeta'); if (mt) mt.textContent = r.error || '';
        return;
      }
      self.magangData = r.magang;
      var m = r.magang;

      // Profil card header
      var ini = (m.nama || 'M').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
      var av = $('#msAvatar'); if (av) av.textContent = ini;
      var nm = $('#msNama'); if (nm) nm.textContent = m.nama || '—';
      var mt = $('#msMeta'); if (mt) mt.textContent = [m.bagian, m.universitas].filter(Boolean).join(' · ');

      // Grid fakta kunci — Audit V7.2: #msInfoGrid ada di markup sejak V7.1
      // namun tidak pernah diisi; kini menampilkan periode, bagian,
      // pembimbing & identitas kampus dari data yang sudah tersedia.
      var ig = $('#msInfoGrid');
      if (ig) {
        var infoItem = function (label, val) {
          return '<div class="info-item"><div class="info-item-label">' + label + '</div>' +
                 '<div class="info-item-val">' + escapeHtml(val || '—') + '</div></div>';
        };
        var periode = (m.periode_mulai || m.periode_selesai)
          ? (fmtTglID(m.periode_mulai) + ' – ' + fmtTglID(m.periode_selesai))
          : '';
        ig.innerHTML =
          infoItem('Periode', periode) +
          infoItem('Bagian', m.bagian) +
          infoItem('Pembimbing', m.pembimbing) +
          infoItem('Kampus', m.universitas) +
          infoItem('Jurusan', m.jurusan) +
          infoItem('NIM', m.nim);
      }

      // Status chip
      var sc = $('#msStatusChip');
      if (sc) {
        var isAlumni = String(m.status).toLowerCase() === 'alumni';
        var isNonaktif = String(m.status).toLowerCase() === 'nonaktif';
        sc.innerHTML = isAlumni
          ? '<span class="badge badge-neutral" style="font-size:12px">Alumni</span>'
          : isNonaktif
          ? '<span class="badge badge-cancelled" style="font-size:12px">Nonaktif</span>'
          : '<span class="badge badge-done" style="font-size:12px">Aktif</span>';
      }

      // Tab Presensi
      var hi = r.hariIni || {};
      var todayEl = $('#msToday');
      if (todayEl) {
        if (hi.jam_masuk) {
          todayEl.innerHTML = 'Hari ini: masuk <b>' + escapeHtml(hi.jam_masuk) + '</b>' +
            (hi.jam_pulang ? (' · pulang <b>' + escapeHtml(hi.jam_pulang) + '</b>') : ' · belum check-out');
          self.setMode(hi.jam_pulang ? 'masuk' : 'pulang');
        } else {
          todayEl.innerHTML = 'Hari ini: <b>belum check-in</b>';
          self.setMode('masuk');
        }
      }
      var form = $('#msForm'); if (form) form.classList.remove('hidden');
      self.renderRiwayat(r.riwayat || []);

      // Tab Data Saya
      self.renderProfil(m);

      // Tab Tugas
      API.call('getTugasMagang', {}).then(function (tr) {
        self.tugasList = (tr.success && tr.data) ? tr.data : [];
        self.renderTugas();
      });

      // Tab Izin/Sakit
      API.call('getIzinMagang', {}).then(function (ir) {
        self.izinList = (ir.success && ir.data) ? ir.data : [];
        self.renderIzin();
      });

      // Tab Sertifikat
      self.renderSertifikat(m);
    });
  },

  /* ── Presensi ── */
  setMode: function (m) {
    this.mode = m;
    var bM = $('#msMasukBtn'), bP = $('#msPulangBtn');
    if (bM) { bM.classList.toggle('btn-primary', m === 'masuk'); bM.classList.toggle('btn-outline', m !== 'masuk'); }
    if (bP) { bP.classList.toggle('btn-primary', m === 'pulang'); bP.classList.toggle('btn-outline', m !== 'pulang'); }
    var s = $('#msSubmit'); if (s) s.textContent = m === 'masuk' ? 'Check-in Masuk' : 'Check-out Pulang';
    var req = $('#msFotoReq'); if (req) req.style.display = m === 'masuk' ? 'inline' : 'none';
  },

  detectLokasi: function () {
    // V7.0: GeoHelper dua tahap — memperbaiki deteksi lokasi di laptop.
    var self = MagangSelfModule, box = $('#msLokBox'), txt = $('#msLokText');
    if (!txt) return;
    txt.textContent = 'Mendeteksi lokasi…';
    GeoHelper.deteksi().then(function (g) {
      if (g.ok) {
        self.lokasi = { lat: g.lat.toFixed(6), lng: g.lng.toFixed(6) };
        if (box) box.className = 'alert alert-info';
        txt.textContent = 'Lokasi terdeteksi ✓ (±' + Math.round(g.accuracy) + ' m)';
      } else {
        self.lokasi = null;
        if (box) box.className = 'alert alert-warning';
        txt.textContent = g.pesan;
      }
    });
  },

  submit: function () {
    var self = this;
    if (self.mode === 'masuk' && !self.foto) { Toast.error('Selfie wajib', 'Ambil foto selfie saat check-in masuk.'); return; }
    var btn = $('#msSubmit'), normal = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Mengirim…'; }
    API.call(self.mode === 'masuk' ? 'checkinMagangSelf' : 'checkoutMagangSelf',
      { foto: self.foto, lokasi: self.lokasi }).then(function (r) {
      if (btn) { btn.disabled = false; btn.textContent = normal; }
      if (r.success) {
        Toast.success((self.mode === 'masuk' ? 'Check-in' : 'Check-out') + ' berhasil' + (r.jam ? ' · ' + r.jam : ''));
        self.foto = '';
        var prev = $('#msPreview'); if (prev) prev.classList.remove('is-visible');
        var fi = $('#msFoto'); if (fi) fi.value = '';
        self.load();
      } else { Toast.error('Gagal', r.error || 'Coba lagi.'); }
    });
  },

  renderRiwayat: function (rows) {
    var tb = $('#msRiwayatBody'); if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:22px">Belum ada riwayat presensi.</td></tr>';
      return;
    }
    // Deret 30 hari sadar-kalender dari backend: hari kerja Senin–Jumat;
    // Sabtu/Minggu, libur nasional & cuti bersama tampil sebagai baris "Libur".
    tb.innerHTML = rows.map(function (p) {
      return '<tr>' + riwayatTglCell(p) +
        '<td class="cell-mono">' + escapeHtml(p.jam_masuk || '—') + '</td>' +
        '<td class="cell-mono">' + escapeHtml(p.jam_pulang || '—') + '</td>' +
        '<td>' + riwayatStatusBadge(p) + '</td></tr>';
    }).join('');
  },

  /* ── Data Saya (V6.9: seluruh data diri dapat diedit mandiri — paritas TAD) ── */
  profilFoto: '',
  renderProfil: function (m) {
    var box = $('#msProfilBox'); if (!box) return;
    MagangSelfModule.profilFoto = '';
    var fotoSrc = driveImgSrc(m.foto, 400);
    var fotoHtml =
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">' +
        (fotoSrc
          ? '<img id="msPFotoImg" src="' + escapeHtml(fotoSrc) + '" alt="Foto profil" loading="lazy" data-tw="400" onerror="fotoTunnelCoba(this,\'sembunyi\')"' +
            ' style="width:84px;height:84px;object-fit:cover;border-radius:14px;border:1px solid var(--border)">' +
            '<img id="msPFotoImgBaru" alt="" style="display:none;width:84px;height:84px;object-fit:cover;border-radius:14px;border:1px solid var(--border)">'
          : '<span class="avatar-foto avatar-inisial" style="width:84px;height:84px;font-size:26px">' +
              escapeHtml(String(m.nama || '?').trim().split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0).toUpperCase(); }).join('')) + '</span>' +
            '<img id="msPFotoImgBaru" alt="" style="display:none;width:84px;height:84px;object-fit:cover;border-radius:14px;border:1px solid var(--border)">') +
        '<div style="flex:1;min-width:180px"><label class="form-label">Foto Profil</label>' +
          '<input type="file" class="form-control" id="msPFoto" accept="image/*">' +
          '<div class="form-hint">Foto tampil di data Anda &amp; daftar peserta. Dikompres otomatis.</div></div>' +
      '</div>';
    var periode = [fmtTglID(m.periode_mulai), fmtTglID(m.periode_selesai)].filter(function(x){return x && x!=='-';}).join(' \u2013 ') || '\u2014';
    // Blok penempatan — ditetapkan admin, tidak dapat diedit sendiri
    var admin = [
      ['Bagian', m.bagian], ['Pembimbing', m.pembimbing], ['Periode Magang', periode],
      ['Status', m.status || 'active']
    ];
    box.innerHTML = fotoHtml +
      '<p style="font-size:12px;color:var(--slate-500);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Data Diri (semua dapat Anda perbarui)</p>' +
      '<div class="form-grid">' +
        dsCoreFieldsHtml('msProf', m, 'Email ini menautkan akun login Anda ke data magang.') +
        dsInput('msProfNim', 'NIM / NRP', m.nim) +
        dsInput('msProfKampus', 'Institusi / Kampus', m.universitas) +
        dsInput('msProfJurusan', 'Jurusan / Prodi', m.jurusan) +
      '</div>' +
      '<div style="margin-top:14px">' +
        '<button class="btn btn-primary btn-sm" id="msProfSaveBtn"><span id="msProfSaveText">Simpan Perubahan</span></button>' +
      '</div>' +
      '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">' +
      '<p style="font-size:12px;color:var(--slate-500);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Penempatan (ditetapkan admin)</p>' +
      '<dl class="detail-list">' +
      admin.map(function (f) {
        return '<dt>' + escapeHtml(f[0]) + '</dt><dd>' + escapeHtml(f[1] || '\u2014') + '</dd>';
      }).join('') +
      '</dl>' +
      '<p class="text-muted" style="font-size:11.5px;margin-top:12px">' +
      '\uD83D\uDD12 Data ini bersifat pribadi: hanya dapat dilihat &amp; diubah oleh <b>Anda sendiri</b> serta <b>Kepala Bagian / Admin</b>.</p>';
    // Pasang listener setelah render
    var saveBtn = $('#msProfSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', function () { MagangSelfModule.submitProfil(); });
    var fi = $('#msPFoto');
    if (fi) fi.addEventListener('change', function () {
      var f = fi.files && fi.files[0];
      if (!f) { MagangSelfModule.profilFoto = ''; return; }
      compressImage(f, 800, 0.85).then(function (dataUrl) {
        MagangSelfModule.profilFoto = dataUrl;
        var lama = $('#msPFotoImg'), baru = $('#msPFotoImgBaru');
        if (baru) { baru.src = dataUrl; baru.style.display = ''; }
        if (lama) lama.style.display = 'none';
        Toast.info('Foto siap \u2014 klik "Simpan Perubahan" untuk mengunggah');
      });
    });
  },

  submitProfil: function () {
    var payload = dsCorePayload('msProf');
    payload.nim         = ($('#msProfNim')     && $('#msProfNim').value.trim())     || '';
    payload.universitas = ($('#msProfKampus')  && $('#msProfKampus').value.trim())  || '';
    payload.jurusan     = ($('#msProfJurusan') && $('#msProfJurusan').value.trim()) || '';
    if (!payload.nama) { Toast.warning('Nama tidak boleh kosong'); return; }
    if (payload.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) { Toast.warning('Format email tidak valid'); return; }
    if (payload.nik && !/^\d{16}$/.test(payload.nik)) { Toast.warning('NIK harus 16 digit angka'); return; }
    var btn = $('#msProfSaveBtn'), txt = $('#msProfSaveText');
    btnLoading(btn, txt, true);
    if (MagangSelfModule.profilFoto) payload.foto = MagangSelfModule.profilFoto;
    API.call('updateMagangSelf', payload)
      .then(function (r) {
        btnLoading(btn, txt, false, 'Simpan Perubahan');
        if (r.success) {
          Toast.success(MagangSelfModule.profilFoto ? 'Data & foto profil diperbarui' : 'Data diri diperbarui');
          MagangSelfModule.profilFoto = '';
          MagangSelfModule.load();
        }
        else Toast.error(r.error || 'Gagal menyimpan');
      });
  },

  /* ── Tugas ── */
  renderTugas: function () {
    var tb = $('#msTugasBody'); if (!tb) return;
    var rows = this.tugasList;
    var STATUS_BADGE = {
      pending:    '<span class="badge badge-waiting">Menunggu</span>',
      in_progress:'<span class="badge badge-serving">Dikerjakan</span>',
      submitted:  '<span class="badge badge-neutral">Dikirim</span>',
      done:       '<span class="badge badge-done">Selesai</span>',
      cancelled:  '<span class="badge badge-cancelled">Dibatalkan</span>'
    };
    var PRI = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:28px">Belum ada tugas yang ditetapkan.</td></tr>';
      return;
    }
    var self = this;
    tb.innerHTML = rows.map(function (t) {
      var canSubmit = t.status === 'pending' || t.status === 'in_progress';
      var aksi = canSubmit
        ? '<button class="btn btn-primary btn-sm" data-ts-id="' + t.id + '" data-ts-judul="' + escapeHtml(t.judul_tugas) + '">Kumpulkan</button>'
        : '';
      return '<tr>' +
        '<td><div class="cell-primary">' + escapeHtml(t.judul_tugas) + '</div>' +
        '<div class="cell-sub" style="white-space:normal">' + escapeHtml(t.deskripsi || '') + '</div></td>' +
        '<td style="font-size:12px;white-space:nowrap">' + (PRI[t.prioritas] || t.prioritas || '—') + '</td>' +
        '<td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(t.deadline) || '—') + '</td>' +
        '<td>' + (STATUS_BADGE[t.status] || '<span class="badge badge-neutral">' + escapeHtml(t.status) + '</span>') + '</td>' +
        '<td class="cell-actions">' + aksi + '</td></tr>';
    }).join('');
    $all('[data-ts-id]', tb).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-ts-id'), judul = b.getAttribute('data-ts-judul');
        // PENTING: modal ini dipakai bersama MagangModule.submitTugasHasil yang
        // membaca #thId — jangan pakai ID elemen lain, kiriman akan kosong/salah.
        var idEl = $('#thId'); if (idEl) idEl.value = id;
        var jEl  = $('#thJudul'); if (jEl) jEl.textContent = judul;
        var mEl  = $('#thMeta'); if (mEl) mEl.textContent = 'Tugas Anda';
        var hEl  = $('#thHasil'); if (hEl) hEl.value = '';
        var fEl  = $('#thFoto'); if (fEl) fEl.value = '';
        var pv   = $('#thFotoPreview'); if (pv) pv.classList.remove('is-visible');
        MagangModule.thFoto = '';
        Modal.open('modalTugasSubmit');
      });
    });
  },

  /* ── Izin/Sakit ── */
  renderIzin: function () {
    var tb = $('#msIzinBody'); if (!tb) return;
    var rows = this.izinList;
    var JENIS = { izin: 'Izin', sakit: 'Sakit' };
    var STATUS_BADGE = {
      pending:  '<span class="badge badge-waiting">Menunggu</span>',
      approved: '<span class="badge badge-done">Disetujui</span>',
      rejected: '<span class="badge badge-cancelled">Ditolak</span>'
    };
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:28px">Belum ada pengajuan izin/sakit.</td></tr>';
      return;
    }
    tb.innerHTML = rows.map(function (r) {
      var tglMulai = fmtTglID(r.tgl_mulai);
      var tglRange = r.tgl_selesai && r.tgl_selesai !== r.tgl_mulai
        ? tglMulai + ' – ' + fmtTglID(r.tgl_selesai) : tglMulai;
      return '<tr>' +
        '<td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(r.created_at)) + '</td>' +
        '<td><span class="badge badge-neutral">' + escapeHtml(JENIS[r.jenis] || r.jenis) + '</span></td>' +
        '<td style="font-size:12px;white-space:nowrap">' + tglRange + '</td>' +
        '<td style="max-width:160px;font-size:12px">' + escapeHtml(r.alasan || '—') + '</td>' +
        '<td>' + (STATUS_BADGE[r.status] || r.status) + '</td>' +
        '<td style="font-size:11.5px;color:var(--text-secondary)">' + escapeHtml(r.catatan_admin || '—') + '</td></tr>';
    }).join('');
  },

  openIzin: function () {
    var sel  = $('#izFJenis');    if (sel)  sel.value = 'izin';
    var tgl1 = $('#izFMulai');   if (tgl1) tgl1.value = todayISO();
    var tgl2 = $('#izFSelesai'); if (tgl2) tgl2.value = '';
    var al   = $('#izFAlasan');  if (al)   al.value = '';
    var fi   = $('#izFLampiran'); if (fi)  fi.value = '';
    var prev = $('#izFPreview'); if (prev) prev.classList.add('hidden');
    var err  = $('#izFLampiranErr'); if (err) err.classList.add('hidden');
    this.izinLampiran = '';
    this.izinLampiranName = '';
    Modal.open('modalIzinMagang');
  },

  submitIzin: function () {
    var self = this;
    var jenis  = ($('#izFJenis')   && $('#izFJenis').value)   || 'izin';
    var mulai  = ($('#izFMulai')   && $('#izFMulai').value)   || '';
    var selesai= ($('#izFSelesai') && $('#izFSelesai').value) || '';
    var alasan = ($('#izFAlasan')  && $('#izFAlasan').value.trim())  || '';
    if (!mulai)  { Toast.warning('Pilih tanggal mulai'); return; }
    if (!alasan) { Toast.warning('Isi alasan pengajuan'); return; }
    // Validasi: lampiran wajib
    if (!self.izinLampiran) {
      var errEl = $('#izFLampiranErr');
      if (errEl) { errEl.textContent = 'Eviden pendukung wajib dilampirkan.'; errEl.classList.remove('hidden'); }
      Toast.warning('Lampiran wajib', 'Upload surat sakit, surat pernyataan, atau bukti relevan.');
      return;
    }
    // Validasi rentang tanggal
    if (selesai && selesai < mulai) { Toast.warning('Tanggal selesai harus setelah tanggal mulai'); return; }
    if (selesai) {
      var d1 = new Date(mulai), d2 = new Date(selesai);
      if ((d2 - d1) / 86400000 > 30) { Toast.warning('Rentang tanggal maks 30 hari'); return; }
    }
    var btn = $('#izFSubmit'), txt = $('#izFSubmitText');
    btnLoading(btn, txt, true);
    API.call('createIzinMagang', {
      jenis: jenis,
      tgl_mulai: mulai,
      tgl_selesai: selesai || mulai,
      alasan: alasan,
      lampiran: self.izinLampiran,
      lampiran_nama: self.izinLampiranName
    }).then(function (r) {
      btnLoading(btn, txt, false, 'Kirim Pengajuan');
      if (r.success) {
        Modal.close('modalIzinMagang');
        Toast.success('Pengajuan terkirim', 'Admin akan memverifikasi eviden Anda.');
        self.izinLampiran = '';
        self.izinLampiranName = '';
        // Reload daftar izin
        API.call('getIzinMagang', {}).then(function (ir) {
          self.izinList = (ir.success && ir.data) ? ir.data : [];
          self.renderIzin();
        });
      } else {
        Toast.error(r.error || 'Gagal mengirim pengajuan');
      }
    });
  },

  /* ── Sertifikat ── */
  renderSertifikat: function (m) {
    var box = $('#msSertBox'); if (!box) return;
    var isAlumni = String(m.status).toLowerCase() === 'alumni';
    if (m.sertifikat_url) {
      box.innerHTML =
        '<div style="text-align:center;padding:20px 0">' +
        '<svg data-icon="award" style="width:44px;height:44px;color:var(--brand-500);margin:0 auto 12px;display:block"></svg>' +
        '<div style="font-size:15px;font-weight:700;margin-bottom:4px">Sertifikat Magang</div>' +
        '<div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:16px">Nomor: ' + escapeHtml(m.sertifikat_nomor || '—') + '</div>' +
        '<a href="' + escapeHtml(m.sertifikat_url) + '" target="_blank" rel="noopener" class="btn btn-primary">' +
        '<svg class="btn-icon" data-icon="download" style="width:15px;height:15px"></svg> Unduh Sertifikat PDF</a>' +
        '</div>';
      renderIcons(box);
    } else if (!isAlumni) {
      box.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon"><svg data-icon="award" style="width:24px;height:24px"></svg></div>' +
        '<div class="empty-title">Sertifikat Belum Tersedia</div>' +
        '<p class="empty-text">Sertifikat diterbitkan otomatis setelah masa magang selesai.<br>Hubungi pembimbing jika periode sudah berakhir.</p>' +
        '</div>';
      renderIcons(box);
    } else {
      // Alumni tanpa sertifikat — bisa minta regenerasi
      box.innerHTML =
        '<div style="text-align:center;padding:20px 0">' +
        '<svg data-icon="award" style="width:44px;height:44px;color:var(--slate-400);margin:0 auto 12px;display:block"></svg>' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--slate-600)">Sertifikat Belum Diterbitkan</div>' +
        '<p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:16px">Masa magang Anda sudah berakhir. Klik tombol di bawah untuk menerbitkan sertifikat.</p>' +
        '<button class="btn btn-primary btn-sm" id="msSertBtn"><svg class="btn-icon" data-icon="award" style="width:14px;height:14px"></svg> <span id="msSertBtnText">Terbitkan Sertifikat</span></button>' +
        '</div>';
      renderIcons(box);
      var self = this;
      var sBtn = $('#msSertBtn');
      if (sBtn) sBtn.addEventListener('click', function () {
        var btn = sBtn, txt = $('#msSertBtnText');
        btnLoading(btn, txt, true);
        API.call('generateSertifikatSelf', {}).then(function (r) {
          btnLoading(btn, txt, false, 'Terbitkan Sertifikat');
          if (r.success) {
            Toast.success('Sertifikat berhasil diterbitkan!');
            if (r.url) window.open(r.url, '_blank');
            self.load();
          } else {
            Toast.error(r.error || 'Gagal menerbitkan sertifikat');
          }
        });
      });
    }
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: PRESENSI TAD (Fase 3) — Security · Driver · Cleaning Service
   ══════════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════════
   SURAT TUGAS DIGITAL TAD — render + cetak surat lembur/SKPD yang terbit
   otomatis saat kabag+ menyetujui dengan tanda tangan digital.
   Dipakai bersama oleh Portal TAD (personel) dan panel admin.
   ══════════════════════════════════════════════════════════════════════════ */
var SuratTugasTAD = {
  kantor: '',
  _row: null,

  /** Nama kantor untuk kop — diambil sekali dari getAppInfo lalu di-cache. */
  ensureKantor: function (cb) {
    if (SuratTugasTAD.kantor) { cb(); return; }
    API.call('getAppInfo', {}).then(function (r) {
      SuratTugasTAD.kantor = (r.success && r.data && r.data.kantor) || '';
      cb();
    });
  },

  html: function (r) {
    var JENIS = { lembur: 'LEMBUR', skpd: 'SURAT KETERANGAN PERJALANAN DINAS (SKPD)' };
    var t1 = fmtTglID(r.tanggal);
    var t2 = r.tanggal_selesai && String(r.tanggal_selesai).substring(0, 10) !== String(r.tanggal).substring(0, 10)
      ? fmtTglID(r.tanggal_selesai) : '';
    var rentang = t2 ? (t1 + ' s.d. ' + t2) : t1;
    var jam = r.jam_mulai ? (r.jam_mulai + (r.jam_selesai ? ' \u2013 ' + r.jam_selesai : '') + ' WIB') : '\u2014';
    var KAT = { Security: 'Security', Driver: 'Driver', CSO: 'Cleaning Service' };
    return '' +
      '<div style="font-family:Georgia,\'Times New Roman\',serif;color:#111;line-height:1.55;font-size:13px">' +
      '<div style="text-align:center;border-bottom:2.5px double #111;padding-bottom:10px;margin-bottom:16px">' +
        '<div style="font-size:15px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">' + escapeHtml(SuratTugasTAD.kantor || 'Kantor') + '</div>' +
        '<div style="font-size:11.5px;color:#444">Unit Umum \u2014 Tenaga Alih Daya</div>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:14px">' +
        '<div style="font-size:14px;font-weight:700;text-decoration:underline;letter-spacing:.6px">SURAT PERINTAH TUGAS</div>' +
        '<div style="font-size:12.5px;margin-top:2px">Nomor: ' + escapeHtml(r.nomor_surat || '\u2014') + '</div>' +
      '</div>' +
      '<p style="margin:0 0 8px">Yang bertanda tangan di bawah ini memberikan perintah tugas kepada:</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 12px">' +
        '<tr><td style="width:150px;padding:3px 0;vertical-align:top">Nama</td><td style="width:12px">:</td><td style="font-weight:600">' + escapeHtml(r.nama || '') + '</td></tr>' +
        '<tr><td style="padding:3px 0">Kategori Personel</td><td>:</td><td>' + escapeHtml(KAT[r.kategori] || r.kategori || '\u2014') + ' (Tenaga Alih Daya)</td></tr>' +
        '<tr><td style="padding:3px 0">Jenis Penugasan</td><td>:</td><td>' + escapeHtml(JENIS[r.jenis] || String(r.jenis || '').toUpperCase()) + '</td></tr>' +
        '<tr><td style="padding:3px 0">Hari / Tanggal</td><td>:</td><td>' + escapeHtml(rentang) + '</td></tr>' +
        '<tr><td style="padding:3px 0">Waktu</td><td>:</td><td>' + escapeHtml(jam) + '</td></tr>' +
        '<tr><td style="padding:3px 0;vertical-align:top">Uraian Tugas</td><td style="vertical-align:top">:</td><td>' + escapeHtml(r.uraian || '\u2014') + '</td></tr>' +
      '</table>' +
      '<p style="margin:0 0 6px">Demikian surat perintah tugas ini diterbitkan untuk dilaksanakan dengan penuh tanggung jawab. ' +
      'Setelah pelaksanaan, yang bersangkutan <b>wajib mengunggah bukti foto kegiatan</b> melalui Portal TAD.</p>' +
      '<table style="width:100%;margin-top:22px;font-size:13px"><tr>' +
        '<td style="width:50%"></td>' +
        '<td style="text-align:center">' +
          '<div>Disetujui pada ' + escapeHtml(fmtTglID(r.tgl_proses || '')) + '</div>' +
          '<div style="margin-top:4px">Pejabat yang menugaskan,</div>' +
          (r.ttd_url ? '<img src="' + escapeHtml(driveImgSrc(r.ttd_url, 400)) + '" alt="ttd" onerror="this.style.display=\'none\'" style="height:70px;margin:6px auto;display:block">'
                     : '<div style="height:70px"></div>') +
          '<div style="font-weight:700;text-decoration:underline">' + escapeHtml(r.diproses_oleh || '') + '</div>' +
          '<div style="font-size:11.5px;color:#444">Ditandatangani secara digital</div>' +
        '</td>' +
      '</tr></table>' +
      '<div style="margin-top:16px;padding-top:8px;border-top:1px solid #ccc;font-size:10.5px;color:#666">' +
        'Dokumen ini diterbitkan otomatis oleh sistem dan sah tanpa tanda tangan basah. Ref: ' + escapeHtml(r.id || '') +
      '</div></div>';
  },

  open: function (r) {
    SuratTugasTAD._row = r;
    SuratTugasTAD.ensureKantor(function () {
      var body = $('#suratTadBody');
      if (body) body.innerHTML = SuratTugasTAD.html(r);
      var btn = $('#suratTadPrint');
      if (btn) btn.onclick = SuratTugasTAD.print; // onclick agar tidak dobel-listener
      renderIcons($('#modalSuratTad'));
      Modal.open('modalSuratTad');
    });
  },

  print: function () {
    var r = SuratTugasTAD._row;
    if (!r) return;
    var w = window.open('', '_blank', 'width=820,height=980');
    if (!w) { Toast.warning('Popup diblokir', 'Izinkan popup untuk mencetak surat.'); return; }
    w.document.write('<!DOCTYPE html><html><head><title>' +
      escapeHtml(r.nomor_surat || 'Surat Tugas') +
      '</title><meta charset="utf-8"><style>body{margin:28px;background:#fff}@media print{body{margin:12mm}}</style></head><body>' +
      SuratTugasTAD.html(r) + '</body></html>');
    w.document.close();
    w.focus();
    setTimeout(function () { try { w.print(); } catch (e) { /* pengguna bisa cetak manual */ } }, 350);
  }
};

/** Badge status riwayat presensi sadar-kalender (dipakai Portal Magang & TAD). */
function riwayatStatusBadge(p) {
  var SB = { hadir: '<span class="badge badge-done">Hadir</span>',
             izin:  '<span class="badge badge-waiting">Izin</span>',
             sakit: '<span class="badge badge-waiting">Sakit</span>',
             cuti:  '<span class="badge badge-serving">Cuti</span>',
             alpha: '<span class="badge badge-cancelled">Alpha</span>' };
  if (p.status === 'libur') {
    return '<span class="badge badge-neutral" title="' + escapeHtml(p.keterangan || 'Libur') + '">Libur</span>';
  }
  if (p.status === 'tanpa-catatan') {
    return '<span class="badge badge-cancelled">Tidak presensi</span>';
  }
  var b = SB[p.status] || '<span class="badge badge-neutral">' + escapeHtml(p.status || '-') + '</span>';
  // presensi jatuh di hari libur = lembur/piket → beri penanda kecil
  if (p.keterangan) b += ' <span class="badge badge-serving" title="' + escapeHtml(p.keterangan) + '" style="font-size:10px">Hari libur</span>';
  return b;
}

/** Sel keterangan tanggal riwayat: tanggal + nama libur (bila ada). */
function riwayatTglCell(p) {
  var ket = (p.status === 'libur' || p.keterangan)
    ? '<div class="cell-sub" style="font-size:10.5px;color:var(--text-secondary)">' + escapeHtml(p.keterangan || '') + '</div>' : '';
  return '<td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(p.tanggal)) + ket + '</td>';
}

var TADModule = {
  personel: [],
  presensi: [],

  init: function () {
    $('#tadRefreshBtn').addEventListener('click', function () {
      TADModule.load();
      Toast.info('Data TAD dimuat ulang');
    });
    var tgl = $('#tadTgl');
    tgl.value = todayISO();
    tgl.addEventListener('change', function () { TADModule.loadHarian(); });
    $('#tadFilterKategori').addEventListener('change', function () { TADModule.renderHarian(); });
    var bln = $('#tadBulan');
    bln.value = todayISO().substring(0, 7);
    bln.addEventListener('change', function () { TADModule.loadRekap(); });
    initTabs('#tadTabs', '[data-view-panel="tad"]');
    // Tab baru: Izin/Cuti, Lembur/SKPD, Personel
    function on(s, e, f) { var el = $(s); if (el) el.addEventListener(e, f); }
    on('#tadIzinFilter',     'change', function () { TADModule.loadIzin(); });
    on('#tadLemburFilter',   'change', function () { TADModule.loadLembur(); });
    on('#tadPersonelFilter', 'change', function () { TADModule.renderPersonel(); });
    on('#tdpSubmit', 'click', function () { TADModule.submitProses(); });
  },

  load: function () {
    TADModule.loadIzin();
    TADModule.loadLembur();
    TADModule.renderPersonelDeferred = true; // personel dirender dari data bundel/getTAD
    var tanggal = $('#tadTgl').value || todayISO();
    var bulan   = $('#tadBulan').value || todayISO().substring(0, 7);
    API.call('getModuleBundle', {
      module: 'tad',
      filter: { tanggal: tanggal, bulan: bulan }
    }).then(function (r) {
      if (!r.success) {
        // Backend belum punya aksi bundel → muat lewat 3 panggilan lama
        API.call('getTAD', {}).then(function (p) {
          if (p.success) TADModule.personel = p.data || [];
          TADModule.renderPersonel();
          TADModule.loadHarian();
        });
        TADModule.loadRekap();
        return;
      }
      var d = r.data || {};
      if (d.personel && d.personel.success) TADModule.personel = d.personel.data || [];
      TADModule.renderPersonel();
      if (d.presensi && d.presensi.success) {
        TADModule.presensi = d.presensi.data || [];
        TADModule.renderStats(tanggal);
        TADModule.renderHarian();
      } else if (d.presensi) {
        Toast.error('Gagal memuat presensi TAD', d.presensi.error);
      }
      if (d.rekap && d.rekap.success) {
        TADModule._rekapCache = d.rekap.data;
        TADModule.renderRekap(d.rekap.data);
      }
    });
  },

  loadHarian: function () {
    var tanggal = $('#tadTgl').value || todayISO();
    API.call('getPresensiTAD', { tanggal: tanggal }).then(function (r) {
      if (!r.success) { Toast.error('Gagal memuat presensi TAD', r.error); return; }
      TADModule.presensi = r.data || [];
      TADModule.renderStats(tanggal);
      TADModule.renderHarian();
    });
  },

  renderStats: function (tanggal) {
    var isToday = tanggal === todayISO();
    var hadir = TADModule.presensi.length;
    var belumPulang = TADModule.presensi.filter(function (p) { return !p.jam_pulang; }).length;
    var secHadir = TADModule.presensi.filter(function (p) { return String(p.kategori) === 'Security'; }).length;
    $('#tadStats').innerHTML = [
      statCardHtml({ cls: 'stat-teal',  icon: 'users',  val: TADModule.personel.length, label: 'Personel TAD Aktif' }),
      statCardHtml({ cls: 'stat-green', icon: 'check',  val: hadir,       label: isToday ? 'Hadir Hari Ini' : 'Hadir (tgl dipilih)' }),
      statCardHtml({ cls: 'stat-amber', icon: 'clock',  val: belumPulang, label: 'Belum Presensi Pulang' }),
      statCardHtml({ cls: 'stat-blue',  icon: 'shield', val: secHadir,    label: 'Security Hadir' })
    ].join('');
    renderIcons($('#tadStats'));
  },

  renderHarian: function () {
    var tbody = $('#tadBody');
    var kat = $('#tadFilterKategori').value;
    var rows = kat
      ? TADModule.presensi.filter(function (p) { return String(p.kategori) === kat; })
      : TADModule.presensi;
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'clock', 'Belum ada presensi',
        'Personel TAD presensi mandiri lewat halaman ?page=checkin-tad.');
      renderIcons(tbody);
      return;
    }
    var KAT_LABEL = { Security: 'Security', Driver: 'Driver', CSO: 'Cleaning Service' };
    tbody.innerHTML = rows.map(function (p) {
      return '<tr>' +
        '<td><div class="cell-primary">' + escapeHtml(p.nama) + '</div></td>' +
        '<td style="font-size:12px">' + escapeHtml(KAT_LABEL[String(p.kategori)] || p.kategori || '—') + '</td>' +
        '<td class="cell-mono">' + fmtTime(p.jam_masuk) + '</td>' +
        '<td class="cell-mono">' + (p.jam_pulang ? fmtTime(p.jam_pulang)
          : '<span class="badge badge-waiting">Belum</span>') + '</td>' +
        '<td>' + lokasiChip(p.lokasi_masuk, 'Peta') + '</td>' +
        '<td>' + fotoChip(p.foto_masuk, 'Foto') + '</td></tr>';
    }).join('');
  },

  loadRekap: function () {
    var bulan = $('#tadBulan').value || todayISO().substring(0, 7);
    API.call('getRekapPresensiTAD', { bulan: bulan }).then(function (r) {
      if (!r.success) { Toast.error('Gagal memuat rekap', r.error); return; }
      TADModule._rekapCache = r.data;
      TADModule.renderRekap(r.data);
    });
  },

  /* AUDIT V7.7: metode ini dulu TIDAK ADA — padahal jalur bundel load()
     memanggil TADModule.renderRekap(d.rekap.data). Akibatnya SETIAP kali
     halaman TAD dibuka lewat bundel: TypeError "renderRekap is not a
     function" di console, tab Rekap Bulanan tidak terisi, dan strip
     "Memuat data halaman…" menggantung. Logika render dipindah ke sini
     dari loadRekap agar kedua jalur (bundel & panggilan manual saat ganti
     bulan) memakai SATU fungsi yang sama. */
  renderRekap: function (data) {
    var tbody = $('#tadRekapBody'); if (!tbody) return;
    var per = (data && data.per_orang) || [];
    if (!per.length) {
      tbody.innerHTML = emptyRow(4, 'chart', 'Belum ada data',
        'Belum ada presensi TAD pada bulan ini.');
      renderIcons(tbody);
      return;
    }
    var KAT_LABEL = { Security: 'Security', Driver: 'Driver', CSO: 'Cleaning Service' };
    tbody.innerHTML = per.map(function (o) {
      return '<tr>' +
        '<td><div class="cell-primary">' + escapeHtml(o.nama) + '</div></td>' +
        '<td style="font-size:12px">' + escapeHtml(KAT_LABEL[String(o.kategori)] || o.kategori || '—') + '</td>' +
        '<td class="cell-mono">' + o.hadir + ' hari</td>' +
        '<td class="cell-mono">' + o.lengkap + ' hari</td></tr>';
    }).join('');
  }
,  /* ── Tab Izin/Cuti (admin) ── */
  _izinList: [],
  loadIzin: function () {
    API.call('getIzinTAD', { status: ($('#tadIzinFilter') && $('#tadIzinFilter').value) || '' }).then(function (r) {
      if (!r.success) return;
      TADModule._izinList = r.data || [];
      TADModule.renderIzin();
    });
  },
  renderIzin: function () {
    var tb = $('#tadIzinBody'); if (!tb) return;
    var rows = TADModule._izinList;
    var JENIS = { izin: 'Izin', sakit: 'Sakit', cuti: 'Cuti' };
    var SB = { pending: '<span class="badge badge-waiting">Menunggu</span>',
               approved: '<span class="badge badge-done">Disetujui</span>',
               rejected: '<span class="badge badge-cancelled">Ditolak</span>' };
    if (!rows.length) {
      tb.innerHTML = emptyRow(8, 'calendar', 'Belum ada pengajuan', 'Personel mengajukan lewat Portal TAD.');
      renderIcons(tb); return;
    }
    tb.innerHTML = rows.map(function (r) {
      var rng = fmtTglID(r.tgl_mulai) + (r.tgl_selesai && r.tgl_selesai !== r.tgl_mulai ? ' – ' + fmtTglID(r.tgl_selesai) : '');
      var evi = r.lampiran_url
        ? '<a href="' + escapeHtml(r.lampiran_url) + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm"><svg data-icon="eye" style="width:13px;height:13px"></svg></a>'
        : '—';
      var aksi = (r.status === 'pending')
        ? '<button class="btn btn-success btn-sm" data-tdp=\'{"tipe":"izin","st":"approved","id":"' + r.id + '"}\' data-nm="' + escapeHtml(r.nama) + '" data-sb="' + escapeHtml((JENIS[r.jenis] || r.jenis) + ' · ' + rng) + '" data-ev="' + escapeHtml(r.lampiran_url || '') + '">Setujui</button>' +
          '<button class="btn btn-danger btn-sm" data-tdp=\'{"tipe":"izin","st":"rejected","id":"' + r.id + '"}\' data-nm="' + escapeHtml(r.nama) + '" data-sb="' + escapeHtml((JENIS[r.jenis] || r.jenis) + ' · ' + rng) + '" data-ev="' + escapeHtml(r.lampiran_url || '') + '">Tolak</button>'
        : '';
      return '<tr>' +
        '<td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(r.created_at)) + '</td>' +
        '<td><div class="cell-primary">' + escapeHtml(r.nama) + '</div><div class="cell-sub">' + escapeHtml(r.kategori || '') + '</div></td>' +
        '<td><span class="badge badge-neutral">' + escapeHtml(JENIS[r.jenis] || r.jenis) + '</span></td>' +
        '<td style="font-size:12px;white-space:nowrap">' + rng + '</td>' +
        '<td style="max-width:170px;font-size:12px">' + escapeHtml(r.alasan || '—') + '</td>' +
        '<td>' + evi + '</td>' +
        '<td>' + (SB[r.status] || r.status) + '</td>' +
        '<td class="cell-actions">' + aksi + '</td></tr>';
    }).join('');
    renderIcons(tb);
    TADModule.bindProses(tb);
  },

  /* ── Tab Lembur/SKPD (admin) ── */
  _lemburList: [],
  loadLembur: function () {
    API.call('getLemburTAD', { status: ($('#tadLemburFilter') && $('#tadLemburFilter').value) || '' }).then(function (r) {
      if (!r.success) return;
      TADModule._lemburList = r.data || [];
      TADModule.renderLembur();
    });
  },
  renderLembur: function () {
    var tb = $('#tadLemburBody'); if (!tb) return;
    var rows = TADModule._lemburList;
    var JENIS = { lembur: 'Lembur', skpd: 'SKPD' };
    var SB = { pending: '<span class="badge badge-waiting">Menunggu</span>',
               approved: '<span class="badge badge-done">Disetujui</span>',
               rejected: '<span class="badge badge-cancelled">Ditolak</span>' };
    if (!rows.length) {
      tb.innerHTML = emptyRow(8, 'clock', 'Belum ada pengajuan', 'Personel mengajukan lembur/SKPD lewat Portal TAD.');
      renderIcons(tb); return;
    }
    tb.innerHTML = rows.map(function (r, i) {
      // Penugasan bisa multi-hari → tampilkan rentang tanggal
      var multi = r.tanggal_selesai && String(r.tanggal_selesai).substring(0, 10) !== String(r.tanggal).substring(0, 10);
      var wkt = fmtTglID(r.tanggal) + (multi ? ' \u2013 ' + fmtTglID(r.tanggal_selesai) : '') +
        (r.jam_mulai ? ' \u00b7 ' + r.jam_mulai + (r.jam_selesai ? '\u2013' + r.jam_selesai : '') : '');
      var evi = r.lampiran_url
        ? '<a href="' + escapeHtml(r.lampiran_url) + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm" title="Dokumen pendukung"><svg data-icon="eye" style="width:13px;height:13px"></svg></a>'
        : '';
      // Bukti foto kegiatan (wajib diunggah personel setelah pelaksanaan)
      var bukti = r.bukti_url
        ? ' <a href="' + escapeHtml(r.bukti_url) + '" target="_blank" rel="noopener" class="badge badge-done" title="Bukti kegiatan \u2014 ' + escapeHtml(r.bukti_at || '') + '">Bukti \u2713</a>'
        : (r.status === 'approved' ? ' <span class="badge badge-waiting" title="Personel belum mengunggah bukti foto kegiatan">Bukti \u2014</span>' : '');
      var aksi = '';
      if (r.status === 'pending') {
        aksi = '<button class="btn btn-success btn-sm" data-tdp=\'{"tipe":"lembur","st":"approved","idx":' + i + '}\'>Setujui</button>' +
               '<button class="btn btn-danger btn-sm" data-tdp=\'{"tipe":"lembur","st":"rejected","idx":' + i + '}\'>Tolak</button>';
      } else if (r.status === 'approved') {
        aksi = '<button class="btn btn-outline btn-sm" data-tdsurat="' + i + '" title="Lihat/cetak Surat Tugas digital">Surat</button>';
      }
      return '<tr>' +
        '<td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(r.created_at)) + '</td>' +
        '<td><div class="cell-primary">' + escapeHtml(r.nama) + '</div><div class="cell-sub">' + escapeHtml(r.kategori || '') + '</div></td>' +
        '<td><span class="badge badge-neutral">' + escapeHtml(JENIS[r.jenis] || r.jenis) + '</span>' +
          (r.nomor_surat ? '<div class="cell-sub cell-mono" style="font-size:10.5px" title="Nomor Surat Tugas">' + escapeHtml(r.nomor_surat) + '</div>' : '') + '</td>' +
        '<td style="font-size:12px;white-space:nowrap">' + wkt + '</td>' +
        '<td style="max-width:170px;font-size:12px">' + escapeHtml(r.uraian || '\u2014') + '</td>' +
        '<td style="white-space:nowrap">' + (evi + bukti || '\u2014') + '</td>' +
        '<td>' + (SB[r.status] || r.status) + '</td>' +
        '<td class="cell-actions">' + aksi + '</td></tr>';
    }).join('');
    renderIcons(tb);
    TADModule.bindProses(tb);
    $all('[data-tdsurat]', tb).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = TADModule._lemburList[parseInt(b.getAttribute('data-tdsurat'), 10)];
        if (r) SuratTugasTAD.open(r);
      });
    });
  },

  bindProses: function (root) {
    $all('[data-tdp]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var cfg;
        try { cfg = JSON.parse(b.getAttribute('data-tdp')); } catch (e) { return; }
        var row = null;
        if (cfg.idx !== undefined) {
          // pola baru (lembur): data diambil dari cache list — bebas masalah escaping
          row = (cfg.tipe === 'izin' ? TADModule._izinList : TADModule._lemburList)[cfg.idx] || null;
          if (!row) return;
          cfg.id = row.id;
        }
        $('#tdpId').value = cfg.id;
        $('#tdpTipe').value = cfg.tipe;
        $('#tdpStatus').value = cfg.st;
        var nm = row ? row.nama : (b.getAttribute('data-nm') || '\u2014');
        var sb = b.getAttribute('data-sb') || '';
        if (row && !sb) {
          var multi = row.tanggal_selesai && String(row.tanggal_selesai).substring(0, 10) !== String(row.tanggal).substring(0, 10);
          sb = (row.jenis === 'skpd' ? 'SKPD' : 'Lembur') + ' \u00b7 ' + fmtTglID(row.tanggal) +
            (multi ? ' \u2013 ' + fmtTglID(row.tanggal_selesai) : '');
        }
        $('#tdpInfo').textContent = nm;
        $('#tdpSub').textContent = sb || '\u2014';
        $('#tdpCatatan').value = '';
        $('#tdpTitle').textContent = (cfg.st === 'approved' ? 'Setujui' : 'Tolak') + ' Pengajuan';
        var sub = $('#tdpSubmit'), st = $('#tdpSubmitText');
        sub.className = cfg.st === 'approved' ? 'btn btn-success' : 'btn btn-danger';
        st.textContent = cfg.st === 'approved' ? 'Setujui' : 'Tolak';
        var ev = row ? (row.lampiran_url || '') : (b.getAttribute('data-ev') || '');
        var box = $('#tdpEvidenBox'), lnk = $('#tdpEvidenLink'), lbl = $('#tdpEvidenLabel');
        if (ev) { box.classList.remove('hidden'); lnk.href = ev;
          lbl.textContent = /\.pdf/i.test(ev) ? 'Buka PDF Eviden' : 'Lihat Eviden'; }
        else box.classList.add('hidden');
        // Tanda tangan digital: WAJIB saat menyetujui lembur/SKPD → terbit Surat Tugas
        var ttdBlock = $('#tdpTtdBlock');
        var perluTtd = cfg.tipe === 'lembur' && cfg.st === 'approved';
        if (ttdBlock) {
          ttdBlock.classList.toggle('hidden', !perluTtd);
          if (perluTtd) {
            SignaturePad.attach($('#tdpTtdCanvas'));
            var cl = $('#tdpTtdClear');
            if (cl) cl.onclick = function () { SignaturePad.clear(); };
          }
        }
        renderIcons($('#modalTadProses'));
        Modal.open('modalTadProses');
      });
    });
  },
  submitProses: function () {
    var id = $('#tdpId').value, tipe = $('#tdpTipe').value, status = $('#tdpStatus').value;
    if (!id || !tipe || !status) return;
    var payload = { id: id, status: status, catatan_admin: $('#tdpCatatan').value.trim() };
    if (tipe === 'lembur' && status === 'approved') {
      // Approval = menerbitkan Surat Tugas digital → tanda tangan wajib
      if (SignaturePad.isEmpty()) {
        Toast.warning('Tanda tangan wajib', 'Gambar tanda tangan Anda pada kotak yang tersedia.');
        return;
      }
      payload.ttd = SignaturePad.toDataURL();
    }
    var btn = $('#tdpSubmit'), txt = $('#tdpSubmitText');
    btnLoading(btn, txt, true);
    API.call(tipe === 'izin' ? 'prosesIzinTAD' : 'prosesLemburTAD', payload).then(function (r) {
      btnLoading(btn, txt, false, status === 'approved' ? 'Setujui' : 'Tolak');
      if (r.success) {
        Modal.close('modalTadProses');
        Toast.success(r.message || 'Diproses',
          r.nomor_surat ? 'Surat Tugas ' + r.nomor_surat + ' terbit.' : '');
        if (tipe === 'izin') TADModule.loadIzin(); else TADModule.loadLembur();
        TADModule.loadHarian && TADModule.loadHarian();
      } else Toast.error(r.error || 'Gagal memproses');
    });
  },

  /* ── Tab Personel (gabungan Drivers/Security/Cleaning) ── */
  renderPersonel: function () {
    var tb = $('#tadPersonelBody'); if (!tb) return;
    var kat = ($('#tadPersonelFilter') && $('#tadPersonelFilter').value) || '';
    var rows = (TADModule.personel || []).filter(function (p) { return !kat || p.kategori === kat; });
    if (!rows.length) {
      tb.innerHTML = emptyRow(5, 'users', 'Tidak ada personel', 'Kelola master di sheet Drivers/Security/Cleaning.');
      renderIcons(tb); return;
    }
    tb.innerHTML = rows.map(function (p) {
      return '<tr>' +
        '<td><div style="display:flex;align-items:center;gap:9px">' + avatarHtml(p.foto, p.nama) +
        '<span class="cell-primary">' + escapeHtml(p.nama) + '</span></div></td>' +
        '<td><span class="badge badge-neutral">' + escapeHtml(p.kategori_label || p.kategori) + '</span></td>' +
        '<td style="font-size:12px">' + escapeHtml(p.no_hp || '—') + '</td>' +
        '<td style="font-size:12px">' + (p.email ? escapeHtml(p.email)
          : '<span style="color:var(--warning)">belum diisi — portal tertaut via nama</span>') + '</td>' +
        '<td>' + (String(p.status).toLowerCase() === 'active'
          ? '<span class="badge badge-done">Aktif</span>'
          : '<span class="badge badge-cancelled">' + escapeHtml(p.status || '-') + '</span>') + '</td></tr>';
    }).join('');
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   PORTAL TAD — layanan mandiri Driver, CSO & Security.
   Presensi satu tombol (driver/cso), izin/sakit/CUTI & lembur/SKPD dgn eviden
   wajib, dan edit kontak. Security: tab Presensi disembunyikan (presensi
   shift-nya lewat panel Security), sisanya tersedia penuh.
   ══════════════════════════════════════════════════════════════════════════ */
var TadSelfModule = {
  data: null,
  izinList: [],
  lemburList: [],
  foto: '',
  lokasi: null,
  izLampiran: '', izLampiranName: '',
  lbLampiran: '', lbLampiranName: '',

  init: function () {
    // Jangan pakai `this` — initSafe memanggil lewat referensi terlepas.
    var self = TadSelfModule;
    function on(s, e, f) { var el = $(s); if (el) el.addEventListener(e, f); }
    initTabs('#tsTabs', '[data-view-panel="tad-self"]');

    on('#tsRefreshBtn', 'click', function () { self.load(); Toast.info('Portal dimuat ulang'); });
    on('#tsPresensiBtn', 'click', function () { self.submitPresensi(); });
    on('#tsFoto', 'change', function () {
      var f = this.files && this.files[0], prev = $('#tsFotoPrev');
      if (!f) { self.foto = ''; if (prev) prev.classList.remove('is-visible'); return; }
      compressImage(f, 1280, 0.8).then(function (d) {
        self.foto = d;
        var img = $('#tsFotoPrevImg'); if (img) img.src = d;
        if (prev) prev.classList.add('is-visible');
      });
    });

    on('#tsIzinAddBtn', 'click', function () { self.openIzin(); });
    on('#tizSubmit', 'click', function () { self.submitIzin(); });
    self.bindLampiran('#tizLampiran', '#tizLampiranErr', '#tizPreview', '#tizPreviewImg', '#tizPreviewPdf', '#tizPreviewPdfName', 'iz');

    on('#tsLemburAddBtn', 'click', function () { self.openLembur(); });
    on('#tlbSubmit', 'click', function () { self.submitLembur(); });
    self.bindLampiran('#tlbLampiran', '#tlbLampiranErr', '#tlbPreview', '#tlbPreviewImg', '#tlbPreviewPdf', '#tlbPreviewPdfName', 'lb');

    // Bukti foto kegiatan (setelah lembur/SKPD disetujui & dilaksanakan)
    on('#bktSubmit', 'click', function () { self.submitBukti(); });
    on('#bktFile', 'change', function () {
      var f = this.files && this.files[0];
      var err = $('#bktErr'), prev = $('#bktPreview'), img = $('#bktPreviewImg');
      self.buktiFoto = '';
      if (prev) prev.classList.add('hidden');
      if (!f) return;
      if (f.type.indexOf('image') !== 0) {
        if (err) { err.textContent = 'Bukti wajib berupa FOTO kegiatan (JPG/PNG).'; err.classList.remove('hidden'); }
        this.value = ''; return;
      }
      if (f.size > 5 * 1024 * 1024) {
        if (err) { err.textContent = 'File terlalu besar (maks 5 MB).'; err.classList.remove('hidden'); }
        this.value = ''; return;
      }
      if (err) err.classList.add('hidden');
      compressImage(f, 1600, 0.85).then(function (d) {
        self.buktiFoto = d;
        if (img) img.src = d;
        if (prev) prev.classList.remove('hidden');
      });
    });
  },

  /** Pola baca eviden yang sama dgn Portal Magang: gambar dikompres, PDF dibaca apa adanya. */
  bindLampiran: function (inputSel, errSel, prevSel, imgSel, pdfSel, pdfNameSel, target) {
    var self = TadSelfModule;
    var el = $(inputSel); if (!el) return;
    el.addEventListener('change', function () {
      var f = this.files && this.files[0];
      var errEl = $(errSel), prev = $(prevSel), imgEl = $(imgSel), pdfEl = $(pdfSel), pdfName = $(pdfNameSel);
      self[target + 'Lampiran'] = ''; self[target + 'LampiranName'] = '';
      if (prev) prev.classList.add('hidden');
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        if (errEl) { errEl.textContent = 'File terlalu besar (maks 5 MB).'; errEl.classList.remove('hidden'); }
        this.value = ''; return;
      }
      if (errEl) errEl.classList.add('hidden');
      self[target + 'LampiranName'] = f.name;
      if (f.type.indexOf('image') === 0) {
        compressImage(f, 1600, 0.85).then(function (d) {
          self[target + 'Lampiran'] = d;
          if (imgEl) { imgEl.src = d; imgEl.style.display = 'block'; }
          if (pdfEl) pdfEl.style.display = 'none';
          if (prev) prev.classList.remove('hidden');
        });
      } else {
        var reader = new FileReader();
        reader.onload = function (e) {
          self[target + 'Lampiran'] = e.target.result;
          if (imgEl) imgEl.style.display = 'none';
          if (pdfEl) pdfEl.style.display = 'flex';
          if (pdfName) pdfName.textContent = f.name;
          if (prev) prev.classList.remove('hidden');
        };
        reader.readAsDataURL(f);
      }
    });
  },

  load: function () {
    var self = TadSelfModule;
    API.call('tadSelfInfo', {}).then(function (r) {
      if (!r.success) {
        var nm = $('#tsNama'); if (nm) nm.textContent = 'Belum tertaut';
        var mt = $('#tsMeta'); if (mt) mt.textContent = r.error || 'Hubungi admin.';
        return;
      }
      var t = r.tad; self.data = t;
      var av = $('#tsAvatar');
      if (av) av.textContent = String(t.nama || '?').trim().split(/\s+/).slice(0, 2)
        .map(function (w) { return w[0]; }).join('').toUpperCase();
      var nm = $('#tsNama'); if (nm) nm.textContent = t.nama;
      var mt = $('#tsMeta'); if (mt) mt.textContent = t.kategori_label + (t.no_hp ? ' · ' + t.no_hp : '');
      var sc = $('#tsStatusChip');
      if (sc) sc.innerHTML = String(t.status).toLowerCase() === 'active'
        ? '<span class="badge badge-done" style="font-size:12px">Aktif</span>'
        : '<span class="badge badge-cancelled" style="font-size:12px">' + escapeHtml(t.status || '-') + '</span>';

      // SECURITY: panel Presensi DISEMBUNYIKAN total di Portal TAD — presensi
      // shift hanya lewat halaman Security (agar tidak membingungkan).
      var isSecurity = t.kategori === 'Security';
      var tabP = $('#tsTabPresensi');
      var panelP = document.querySelector('[data-view-panel="tad-self"] [data-tab-panel="presensi"]');
      if (tabP) tabP.style.display = isSecurity ? 'none' : '';
      if (panelP) panelP.style.display = isSecurity ? 'none' : '';
      if (isSecurity && tabP && tabP.classList.contains('is-active')) {
        // pindah otomatis ke tab Izin/Cuti
        var tabIzin = document.querySelector('#tsTabs [data-tab="izin"]');
        if (tabIzin) tabIzin.click();
      }

      // Presensi hari ini
      var hi = r.hariIni || {};
      var td = $('#tsToday');
      if (td) {
        if (hi.jam_masuk) {
          td.innerHTML = 'Hari ini: masuk <b>' + escapeHtml(hi.jam_masuk) + '</b>' +
            (hi.jam_pulang ? ' · pulang <b>' + escapeHtml(hi.jam_pulang) + '</b> — lengkap' : ' · belum pulang');
        } else td.innerHTML = 'Hari ini: <b>belum presensi</b>';
      }
      self.renderRiwayat(r.riwayat || []);
      self.renderProfil(t);
      self.detectLokasi();
    });
    self.loadIzin();
    self.loadLembur();
    muatPengumumanPortal_('#tsPengumumanCard', '#tsPengumumanList'); // V7.7
  },

  detectLokasi: function () {
    // V7.0: GeoHelper dua tahap — memperbaiki deteksi lokasi di laptop.
    var self = TadSelfModule, txt = $('#tsLokText');
    if (txt) txt.textContent = 'Lokasi: mendeteksi…';
    GeoHelper.deteksi().then(function (g) {
      if (g.ok) {
        self.lokasi = { lat: g.lat, lng: g.lng, accuracy: g.accuracy };
        if (txt) txt.textContent = 'Lokasi: terdeteksi (±' + Math.round(g.accuracy) + ' m)';
      } else {
        self.lokasi = null;
        if (txt) txt.textContent = 'Lokasi: ' + g.pesan + ' — presensi tetap bisa.';
      }
    });
  },

  submitPresensi: function () {
    var self = TadSelfModule;
    var btn = $('#tsPresensiBtn'), txt = $('#tsPresensiBtnText');
    btnLoading(btn, txt, true);
    API.call('presensiTADSelf', { foto: self.foto || '', lokasi: self.lokasi }).then(function (r) {
      btnLoading(btn, txt, false, 'Presensi Sekarang');
      if (r.success) {
        Toast.success(r.message || 'Presensi tercatat');
        self.foto = '';
        var fi = $('#tsFoto'); if (fi) fi.value = '';
        var pv = $('#tsFotoPrev'); if (pv) pv.classList.remove('is-visible');
        self.load();
      } else Toast.error(r.error || 'Gagal presensi');
    });
  },

  renderRiwayat: function (rows) {
    var tb = $('#tsRiwayatBody'); if (!tb) return;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:24px">Belum ada riwayat presensi.</td></tr>';
      return;
    }
    // Deret 30 hari sadar-kalender: akhir pekan & libur nasional ikut tampil.
    tb.innerHTML = rows.map(function (p) {
      return '<tr>' + riwayatTglCell(p) +
        '<td>' + escapeHtml(p.jam_masuk || '—') + '</td>' +
        '<td>' + escapeHtml(p.jam_pulang || '—') + '</td>' +
        '<td>' + riwayatStatusBadge(p) + '</td></tr>';
    }).join('');
  },

  /* ── Izin/Cuti ── */
  loadIzin: function () {
    var self = TadSelfModule;
    API.call('getIzinTAD', {}).then(function (r) {
      self.izinList = (r.success && r.data) ? r.data : [];
      self.renderIzin();
      // Security: catatan auto-presensi tidak berlaku
      var hint = $('#tsIzinHint');
      if (hint && self.data && self.data.kategori === 'Security') {
        hint.innerHTML = 'Keputusan tercatat di sistem; presensi shift Security tetap dikelola lewat <b>panel Security</b>.';
      }
    });
  },
  renderIzin: function () {
    var tb = $('#tsIzinBody'); if (!tb) return;
    var JENIS = { izin: 'Izin', sakit: 'Sakit', cuti: 'Cuti' };
    var SB = { pending: '<span class="badge badge-waiting">Menunggu</span>',
               approved: '<span class="badge badge-done">Disetujui</span>',
               rejected: '<span class="badge badge-cancelled">Ditolak</span>' };
    var rows = TadSelfModule.izinList;
    tb.innerHTML = rows.length ? rows.map(function (r) {
      var rng = fmtTglID(r.tgl_mulai) + (r.tgl_selesai && r.tgl_selesai !== r.tgl_mulai ? ' – ' + fmtTglID(r.tgl_selesai) : '');
      return '<tr><td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(r.created_at)) + '</td>' +
        '<td><span class="badge badge-neutral">' + escapeHtml(JENIS[r.jenis] || r.jenis) + '</span></td>' +
        '<td style="font-size:12px;white-space:nowrap">' + rng + '</td>' +
        '<td style="max-width:160px;font-size:12px">' + escapeHtml(r.alasan || '—') + '</td>' +
        '<td>' + (SB[r.status] || r.status) + '</td>' +
        '<td style="font-size:11.5px;color:var(--text-secondary)">' + escapeHtml(r.catatan_admin || '—') + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="text-center text-muted" style="padding:24px">Belum ada pengajuan.</td></tr>';
  },
  openIzin: function () {
    var s = $('#tizJenis'); if (s) s.value = 'izin';
    var t1 = $('#tizMulai'); if (t1) t1.value = todayISO();
    var t2 = $('#tizSelesai'); if (t2) t2.value = '';
    var al = $('#tizAlasan'); if (al) al.value = '';
    var fi = $('#tizLampiran'); if (fi) fi.value = '';
    var pv = $('#tizPreview'); if (pv) pv.classList.add('hidden');
    var er = $('#tizLampiranErr'); if (er) er.classList.add('hidden');
    TadSelfModule.izLampiran = ''; TadSelfModule.izLampiranName = '';
    Modal.open('modalIzinTad');
  },
  submitIzin: function () {
    var self = TadSelfModule;
    var jenis = $('#tizJenis').value, mulai = $('#tizMulai').value,
        selesai = $('#tizSelesai').value, alasan = $('#tizAlasan').value.trim();
    if (!mulai) { Toast.warning('Pilih tanggal mulai'); return; }
    if (!alasan) { Toast.warning('Isi alasan pengajuan'); return; }
    if (!self.izLampiran) {
      var er = $('#tizLampiranErr');
      if (er) { er.textContent = 'Eviden pendukung wajib dilampirkan.'; er.classList.remove('hidden'); }
      Toast.warning('Lampiran wajib'); return;
    }
    if (selesai && selesai < mulai) { Toast.warning('Tanggal selesai harus setelah tanggal mulai'); return; }
    var btn = $('#tizSubmit'), txt = $('#tizSubmitText');
    btnLoading(btn, txt, true);
    API.call('createIzinTAD', {
      jenis: jenis, tgl_mulai: mulai, tgl_selesai: selesai || mulai,
      alasan: alasan, lampiran: self.izLampiran, lampiran_nama: self.izLampiranName
    }).then(function (r) {
      btnLoading(btn, txt, false, 'Kirim Pengajuan');
      if (r.success) {
        Modal.close('modalIzinTad');
        Toast.success('Pengajuan terkirim', 'Menunggu verifikasi kabag/admin.');
        self.izLampiran = ''; self.loadIzin();
      } else Toast.error(r.error || 'Gagal mengirim');
    });
  },

  /* ── Lembur/SKPD ── */
  loadLembur: function () {
    var self = TadSelfModule;
    API.call('getLemburTAD', {}).then(function (r) {
      self.lemburList = (r.success && r.data) ? r.data : [];
      self.renderLembur();
    });
  },
  renderLembur: function () {
    var tb = $('#tsLemburBody'); if (!tb) return;
    var JENIS = { lembur: 'Lembur', skpd: 'SKPD' };
    var SB = { pending: '<span class="badge badge-waiting">Menunggu</span>',
               approved: '<span class="badge badge-done">Disetujui</span>',
               rejected: '<span class="badge badge-cancelled">Ditolak</span>' };
    var rows = TadSelfModule.lemburList;
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Belum ada pengajuan.</td></tr>';
      return;
    }
    tb.innerHTML = rows.map(function (r, i) {
      // Penugasan bisa multi-hari → tampilkan rentang tanggal
      var multi = r.tanggal_selesai && String(r.tanggal_selesai).substring(0, 10) !== String(r.tanggal).substring(0, 10);
      var wkt = fmtTglID(r.tanggal) + (multi ? ' \u2013 ' + fmtTglID(r.tanggal_selesai) : '') +
        (r.jam_mulai ? ' \u00b7 ' + r.jam_mulai + (r.jam_selesai ? '\u2013' + r.jam_selesai : '') : '');
      var aksi = '';
      if (r.status === 'approved') {
        aksi += '<button class="btn btn-outline btn-sm" data-lbsurat="' + i + '" title="Lihat/cetak Surat Tugas digital">Surat</button>';
        aksi += r.bukti_url
          ? ' <a href="' + escapeHtml(r.bukti_url) + '" target="_blank" rel="noopener" class="badge badge-done" title="Bukti kegiatan sudah diunggah">Bukti \u2713</a>'
          : ' <button class="btn btn-primary btn-sm" data-lbbukti="' + i + '" title="Unggah bukti foto kegiatan setelah pelaksanaan">Unggah Bukti</button>';
      }
      return '<tr><td style="font-size:12px;white-space:nowrap">' + escapeHtml(fmtTglID(r.created_at)) + '</td>' +
        '<td><span class="badge badge-neutral">' + escapeHtml(JENIS[r.jenis] || r.jenis) + '</span></td>' +
        '<td style="font-size:12px;white-space:nowrap">' + wkt + '</td>' +
        '<td style="max-width:160px;font-size:12px">' + escapeHtml(r.uraian || '\u2014') + '</td>' +
        '<td>' + (SB[r.status] || r.status) + '</td>' +
        '<td style="font-size:11.5px;color:var(--text-secondary)">' + escapeHtml(r.catatan_admin || '\u2014') + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + (aksi || '\u2014') + '</td></tr>';
    }).join('');
    $all('[data-lbsurat]', tb).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = TadSelfModule.lemburList[parseInt(b.getAttribute('data-lbsurat'), 10)];
        if (r) SuratTugasTAD.open(r);
      });
    });
    $all('[data-lbbukti]', tb).forEach(function (b) {
      b.addEventListener('click', function () {
        var r = TadSelfModule.lemburList[parseInt(b.getAttribute('data-lbbukti'), 10)];
        if (r) TadSelfModule.openBukti(r);
      });
    });
  },
  openLembur: function () {
    var s = $('#tlbJenis'); if (s) s.value = 'lembur';
    var t = $('#tlbTanggal'); if (t) t.value = todayISO();
    ['tlbTanggalSelesai', 'tlbJamMulai', 'tlbJamSelesai', 'tlbUraian', 'tlbLampiran'].forEach(function (id) {
      var el = $('#' + id); if (el) el.value = '';
    });
    var pv = $('#tlbPreview'); if (pv) pv.classList.add('hidden');
    var er = $('#tlbLampiranErr'); if (er) er.classList.add('hidden');
    TadSelfModule.lbLampiran = ''; TadSelfModule.lbLampiranName = '';
    Modal.open('modalLemburTad');
  },
  submitLembur: function () {
    var self = TadSelfModule;
    var jenis = $('#tlbJenis').value, tanggal = $('#tlbTanggal').value,
        selesai = ($('#tlbTanggalSelesai') && $('#tlbTanggalSelesai').value) || '',
        uraian = $('#tlbUraian').value.trim();
    if (!tanggal) { Toast.warning('Pilih tanggal mulai'); return; }
    if (selesai && selesai < tanggal) { Toast.warning('Tanggal selesai harus setelah tanggal mulai'); return; }
    if (selesai && (new Date(selesai) - new Date(tanggal)) / 86400000 > 13) {
      Toast.warning('Rentang penugasan maksimum 14 hari'); return;
    }
    if (!uraian) { Toast.warning('Isi uraian kegiatan'); return; }
    // Lampiran OPSIONAL: pengajuan = rencana; Surat Tugas digital terbit saat
    // disetujui, dan bukti foto kegiatan diunggah setelah pelaksanaan.
    var btn = $('#tlbSubmit'), txt = $('#tlbSubmitText');
    btnLoading(btn, txt, true);
    API.call('createLemburTAD', {
      jenis: jenis, tanggal: tanggal, tanggal_selesai: selesai || tanggal,
      jam_mulai: $('#tlbJamMulai').value, jam_selesai: $('#tlbJamSelesai').value,
      uraian: uraian, lampiran: self.lbLampiran || '', lampiran_nama: self.lbLampiranName || ''
    }).then(function (r) {
      btnLoading(btn, txt, false, 'Kirim Pengajuan');
      if (r.success) {
        Modal.close('modalLemburTad');
        Toast.success('Rencana terkirim', 'Setelah disetujui, Surat Tugas digital terbit otomatis.');
        self.lbLampiran = ''; self.loadLembur();
      } else Toast.error(r.error || 'Gagal mengirim');
    });
  },

  /* ── Bukti foto kegiatan (wajib setelah pelaksanaan) ── */
  buktiFoto: '',
  openBukti: function (r) {
    TadSelfModule.buktiFoto = '';
    var id = $('#bktId'); if (id) id.value = r.id;
    var info = $('#bktInfo'); if (info) info.textContent = (r.jenis === 'skpd' ? 'SKPD' : 'Lembur') + (r.nomor_surat ? ' \u2014 ' + r.nomor_surat : '');
    var multi = r.tanggal_selesai && String(r.tanggal_selesai).substring(0, 10) !== String(r.tanggal).substring(0, 10);
    var sub = $('#bktSub'); if (sub) sub.textContent = fmtTglID(r.tanggal) + (multi ? ' \u2013 ' + fmtTglID(r.tanggal_selesai) : '') + ' \u00b7 ' + (r.uraian || '');
    var f = $('#bktFile'); if (f) f.value = '';
    var pv = $('#bktPreview'); if (pv) pv.classList.add('hidden');
    var er = $('#bktErr'); if (er) er.classList.add('hidden');
    renderIcons($('#modalBuktiLembur'));
    Modal.open('modalBuktiLembur');
  },
  submitBukti: function () {
    var self = TadSelfModule;
    var id = $('#bktId').value;
    if (!id) return;
    if (!self.buktiFoto) {
      var er = $('#bktErr');
      if (er) { er.textContent = 'Foto kegiatan wajib diunggah.'; er.classList.remove('hidden'); }
      Toast.warning('Foto kegiatan wajib'); return;
    }
    var btn = $('#bktSubmit'), txt = $('#bktSubmitText');
    btnLoading(btn, txt, true);
    API.call('uploadBuktiLemburTAD', { id: id, bukti: self.buktiFoto }).then(function (r) {
      btnLoading(btn, txt, false, 'Unggah Bukti');
      if (r.success) {
        Modal.close('modalBuktiLembur');
        Toast.success('Bukti tersimpan', r.message || 'Pelaksanaan tercatat selesai.');
        self.buktiFoto = ''; self.loadLembur();
      } else Toast.error(r.error || 'Gagal mengunggah');
    });
  },

  /* ── Data Saya (V6.9: seluruh data diri dapat diedit mandiri — paritas magang) ── */
  profilFoto: '',

  renderProfil: function (t) {
    var box = $('#tsProfilBox'); if (!box) return;
    var self = TadSelfModule;
    self.profilFoto = '';
    var isDriver = t.kategori === 'Driver';
    var isCso = t.kategori === 'CSO';
    // Audit V7.2: cek hasil driveImgSrc (bukan sekadar t.foto) — nilai marker
    // lama non-URL membuat src="" tampil sebagai ikon rusak; onerror melindungi
    // dari thumbnail Drive yang ditolak (berkas belum publik).
    var tsFotoSrc = driveImgSrc(t.foto, 400);
    var fotoHtml = tsFotoSrc
      ? '<img id="tsPFotoImg" src="' + escapeHtml(tsFotoSrc) + '" alt="Foto profil" loading="lazy" data-tw="400" onerror="fotoTunnelCoba(this,\'sembunyi\')" style="width:96px;height:96px;object-fit:cover;border-radius:14px;border:1px solid var(--border)">'
      : '<div id="tsPFotoImgWrap" style="width:96px;height:96px;border-radius:14px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--slate-400);font-size:11px;text-align:center">Belum ada<br>foto</div>' +
        '<img id="tsPFotoImg" alt="Foto profil" style="display:none;width:96px;height:96px;object-fit:cover;border-radius:14px;border:1px solid var(--border)">';

    // Data untuk field inti — TAD memakai kolom `alamat` sebagai Alamat Domisili
    var d = {
      nama: t.nama, nik: t.nik, tempat_lahir: t.tempat_lahir, tanggal_lahir: t.tanggal_lahir,
      jenis_kelamin: t.jenis_kelamin, golongan_darah: t.golongan_darah,
      pendidikan_terakhir: t.pendidikan_terakhir, email: t.email, no_hp: t.no_hp,
      alamat_domisili: t.alamat, alamat_sekarang: t.alamat_sekarang,
      kontak_darurat_nama: t.kontak_darurat_nama, kontak_darurat_hp: t.kontak_darurat_hp
    };

    box.innerHTML = '<div class="card"><div class="card-body">' +
      '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px">' +
      '<div>' + fotoHtml + '</div>' +
      '<div style="flex:1;min-width:220px">' +
      '<dl class="detail-list">' +
      '<dt>Kategori</dt><dd>' + escapeHtml(t.kategori_label || t.kategori) + '</dd>' +
      '<dt>Status</dt><dd>' + (String(t.status).toLowerCase() === 'active'
        ? '<span class="badge badge-done">Aktif</span>'
        : '<span class="badge badge-neutral">' + escapeHtml(t.status || '-') + '</span>') + '</dd>' +
      (isCso ? '<dt>Area Tugas</dt><dd>' + escapeHtml(t.area_tugas || '\u2014') + ' <span class="text-muted" style="font-size:11px">(ditetapkan admin)</span></dd>' : '') +
      '</dl></div></div>' +
      '<hr style="border:none;border-top:1px solid var(--border);margin:4px 0 16px">' +
      '<p style="font-size:12px;color:var(--slate-500);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Data Diri (semua dapat Anda perbarui)</p>' +
      '<div class="form-grid">' +
      dsCoreFieldsHtml('tsP', d, 'Email ini menautkan akun login Anda ke data personel.') +
      (isDriver
        ? dsInput('tsPNoSim', 'No. SIM', t.no_sim) +
          dsInput('tsPSimExp', 'Masa Berlaku SIM', String(t.masa_berlaku_sim || '').substring(0, 10), { type: 'date' })
        : '') +
      '<div class="form-group full"><label class="form-label">Ganti Foto Profil</label>' +
      '<input type="file" class="form-control" id="tsPFoto" accept="image/*">' +
      '<div class="form-hint">Opsional \u2014 JPG/PNG, otomatis dikompres.</div></div>' +
      '</div>' +
      '<div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
      '<button class="btn btn-primary btn-sm" id="tsPSave"><span id="tsPSaveText">Simpan Perubahan</span></button>' +
      '</div>' +
      '<p class="text-muted" style="font-size:11.5px;margin-top:14px">' +
      '\uD83D\uDD12 Data ini bersifat pribadi: hanya dapat dilihat & diubah oleh <b>Anda sendiri</b>, ' +
      'serta oleh <b>Kepala Bagian / Admin</b>. Pengguna lain tidak memiliki akses.</p>' +
      '</div></div>';

    var b = $('#tsPSave');
    if (b) b.addEventListener('click', function () { TadSelfModule.submitProfil(); });
    var f = $('#tsPFoto');
    if (f) f.addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) { self.profilFoto = ''; return; }
      if (file.type.indexOf('image') !== 0) { Toast.warning('Pilih berkas gambar'); this.value = ''; return; }
      compressImage(file, 800, 0.85).then(function (d) {
        self.profilFoto = d;
        var img = $('#tsPFotoImg');
        if (img) { img.src = d; img.style.display = 'block'; }
        var wrap = $('#tsPFotoImgWrap'); if (wrap) wrap.style.display = 'none';
      });
    });
  },

  submitProfil: function () {
    var core = dsCorePayload('tsP');
    // Peta field inti → kolom TAD (`alamat` = Alamat Domisili)
    var payload = {
      nama: core.nama, nik: core.nik, tempat_lahir: core.tempat_lahir,
      tanggal_lahir: core.tanggal_lahir, jenis_kelamin: core.jenis_kelamin,
      golongan_darah: core.golongan_darah, pendidikan_terakhir: core.pendidikan_terakhir,
      email: core.email, no_hp: core.no_hp,
      alamat: core.alamat_domisili, alamat_sekarang: core.alamat_sekarang,
      kontak_darurat_nama: core.kontak_darurat_nama, kontak_darurat_hp: core.kontak_darurat_hp
    };
    if (!payload.nama) { Toast.warning('Nama tidak boleh kosong'); return; }
    if (payload.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) { Toast.warning('Format email tidak valid'); return; }
    if (payload.nik && !/^\d{16}$/.test(payload.nik)) { Toast.warning('NIK harus 16 digit angka'); return; }
    var sim = $('#tsPNoSim'); if (sim) payload.no_sim = sim.value.trim();
    var simExp = $('#tsPSimExp'); if (simExp) payload.masa_berlaku_sim = simExp.value;
    if (TadSelfModule.profilFoto) payload.foto = TadSelfModule.profilFoto;
    var btn = $('#tsPSave'), txt = $('#tsPSaveText');
    btnLoading(btn, txt, true);
    API.call('updateTADSelf', payload).then(function (r) {
      btnLoading(btn, txt, false, 'Simpan Perubahan');
      if (r.success) { Toast.success('Data diri diperbarui'); TadSelfModule.load(); }
      else Toast.error(r.error || 'Gagal menyimpan');
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: SECURITY (Fase 3) — presensi shift, jadwal, insiden, patroli
   ══════════════════════════════════════════════════════════════════════════ */
var SecurityModule = {
  personel: [],
  presensi: [],
  insiden: [],
  checkpoints: [],
  incidentTypes: [],
  HARI: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  fotoMasuk: '', fotoKeluar: '', fotoInsiden: '', fotoPatroli: '',

  /** Pasang input foto → kompres → simpan ke properti + pratinjau. */
  bindFoto: function (inputSel, prevSel, imgSel, prop) {
    var el = $(inputSel); if (!el) return;
    el.addEventListener('change', function () {
      var f = this.files && this.files[0];
      var prev = $(prevSel), img = $(imgSel);
      SecurityModule[prop] = '';
      if (prev) prev.classList.add('hidden');
      if (!f) return;
      if (f.type.indexOf('image') !== 0) { Toast.warning('Pilih berkas gambar (JPG/PNG)'); this.value = ''; return; }
      compressImage(f, 1280, 0.8).then(function (d) {
        SecurityModule[prop] = d;
        if (img) img.src = d;
        if (prev) prev.classList.remove('hidden');
      });
    });
  },

  /** Reset input foto + pratinjau. */
  resetFoto: function (inputSel, prevSel, prop) {
    SecurityModule[prop] = '';
    var el = $(inputSel); if (el) el.value = '';
    var prev = $(prevSel); if (prev) prev.classList.add('hidden');
  },

  /** Ambil GPS lalu jalankan cb(lokasi|null) — dipakai presensi, insiden, patroli. */
  ambilGps: function (cb) {
    // V7.0: GeoHelper dua tahap — laptop/PC pos komando kini juga terdeteksi.
    GeoHelper.deteksi().then(function (g) {
      cb(g.ok ? { lat: g.lat.toFixed(6), lng: g.lng.toFixed(6) } : null);
    });
  },

  init: function () {
    $('#secRefreshBtn').addEventListener('click', function () {
      SecurityModule.load();
      Toast.info('Data security dimuat ulang');
    });
    $('#secMasukBtn').addEventListener('click', function () { SecurityModule.openMasuk(); });

    var tgl = $('#secPresTgl');
    tgl.value = todayISO();
    tgl.addEventListener('change', function () { SecurityModule.loadPresensi(); });

    var ws = $('#secWeekStart');
    ws.value = SecurityModule.mondayOfWeek();
    ws.addEventListener('change', function () { SecurityModule.loadJadwal(); });
    $('#secJadwalBtn').addEventListener('click', function () { SecurityModule.openJadwalBuilder(); });

    $('#secInsidenFilter').addEventListener('change', function () { SecurityModule.loadInsiden(); });
    $('#secInsidenAddBtn').addEventListener('click', function () { SecurityModule.openInsiden(); });
    $('#secPatroliAddBtn').addEventListener('click', function () { SecurityModule.openPatroli(); });
    $('#secCheckpointAddBtn').addEventListener('click', function () { SecurityModule.openCheckpoint(); });

    $('#psSubmit').addEventListener('click', function () { SecurityModule.submitMasuk(); });
    $('#psoSubmit').addEventListener('click', function () { SecurityModule.submitKeluar(); });
    $('#jsSubmit').addEventListener('click', function () { SecurityModule.submitJadwal(); });
    $('#inSubmit').addEventListener('click', function () { SecurityModule.submitInsiden(); });
    $('#insSubmit').addEventListener('click', function () { SecurityModule.submitInsidenStatus(); });
    $('#ptSubmit').addEventListener('click', function () { SecurityModule.submitPatroli(); });
    $('#cpSubmit').addEventListener('click', function () { SecurityModule.submitCheckpoint(); });

    SecurityModule.bindFoto('#psFoto',  '#psFotoPrev',  '#psFotoPrevImg',  'fotoMasuk');
    SecurityModule.bindFoto('#psoFoto', '#psoFotoPrev', '#psoFotoPrevImg', 'fotoKeluar');
    SecurityModule.bindFoto('#inFoto',  '#inFotoPrev',  '#inFotoPrevImg',  'fotoInsiden');
    SecurityModule.bindFoto('#ptFoto',  '#ptFotoPrev',  '#ptFotoPrevImg',  'fotoPatroli');

    initTabs('#secTabs', '[data-view-panel="security"]');
  },

  /* Senin pada minggu berjalan (yyyy-MM-dd) */
  mondayOfWeek: function () {
    var d = new Date();
    var day = d.getDay(); // 0=Min
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    function p(n) { return n < 10 ? '0' + n : n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  },

  weekDates: function () {
    var start = $('#secWeekStart').value || SecurityModule.mondayOfWeek();
    var base = new Date(start + 'T00:00:00');
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(base);
      d.setDate(base.getDate() + i);
      function p(n) { return n < 10 ? '0' + n : n; }
      dates.push(d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()));
    }
    return dates;
  },

  load: function () {
    API.call('getSecurityStats').then(function (r) {
      if (!r.success) return;
      var d = r.data || {};
      $('#secStats').innerHTML = [
        statCardHtml({ cls: 'stat-teal',  icon: 'shield',   val: d.personel_aktif,  label: 'Personel Aktif' }),
        statCardHtml({ cls: 'stat-green', icon: 'check',    val: d.hadir_hari_ini,  label: 'Hadir Hari Ini' }),
        statCardHtml({ cls: 'stat-rose',  icon: 'alert',    val: d.insiden_open,    label: 'Insiden Belum Selesai' }),
        statCardHtml({ cls: 'stat-blue',  icon: 'activity', val: d.patroli_hari_ini, label: 'Patroli Hari Ini' })
      ].join('');
      renderIcons($('#secStats'));
    });
    API.call('getSecurityList').then(function (r) {
      if (r.success) SecurityModule.personel = r.data || [];
      SecurityModule.loadJadwal();
    });
    API.call('getPatrolCheckpoints').then(function (r) {
      if (r.success) SecurityModule.checkpoints = r.data || [];
      SecurityModule.renderCheckpoints();
    });
    if (!SecurityModule.incidentTypes.length) {
      API.call('getIncidentTypes').then(function (r) {
        if (r.success) SecurityModule.incidentTypes = r.data || [];
      });
    }
    SecurityModule.loadPresensi();
    SecurityModule.loadInsiden();
    SecurityModule.loadPatroli();
  },

  /* ── Presensi shift ── */
  loadPresensi: function () {
    var tanggal = $('#secPresTgl').value || todayISO();
    API.call('getPresensiSecurity', { tanggal: tanggal }).then(function (r) {
      var tbody = $('#secPresBody');
      if (!r.success) { Toast.error('Gagal memuat presensi', r.error); return; }
      SecurityModule.presensi = r.data || [];
      if (!SecurityModule.presensi.length) {
        tbody.innerHTML = emptyRow(6, 'shield', 'Belum ada presensi',
          'Gunakan tombol "Presensi Masuk" saat mulai shift.');
        renderIcons(tbody);
        return;
      }
      var canAct = isApprover() ||
        String(Auth.user && Auth.user.role).toLowerCase() === 'security';
      tbody.innerHTML = SecurityModule.presensi.map(function (p, i) {
        var aksi = '';
        if (canAct && !p.jam_keluar) {
          aksi = '<button class="btn btn-outline btn-sm" data-keluar="' + i + '">Presensi Keluar</button>';
        }
        return '<tr>' +
          '<td><div class="cell-primary">' + escapeHtml(p.nama) + '</div></td>' +
          '<td>' + escapeHtml(shiftLabelJam(String(p.shift)) || p.shift || '—') +
          (String(p.status) === 'lembur' ? ' <span class="badge badge-waiting" title="Presensi pada hari libur nasional — dihitung lembur">Lembur</span>' : '') + '</td>' +
          '<td class="cell-mono">' + fmtTime(p.jam_masuk) + '</td>' +
          '<td class="cell-mono">' + (p.jam_keluar ? fmtTime(p.jam_keluar)
            : '<span class="badge badge-serving">Bertugas</span>') + '</td>' +
          '<td><div style="font-size:12px;max-width:280px;white-space:normal">' +
          escapeHtml(p.catatan || '—') + '</div></td>' +
          '<td style="text-align:right;white-space:nowrap">' + aksi + '</td></tr>';
      }).join('');
      $all('[data-keluar]', tbody).forEach(function (b) {
        b.addEventListener('click', function () {
          var p = SecurityModule.presensi[parseInt(b.getAttribute('data-keluar'), 10)];
          if (!p) return;
          $('#psoId').value = p.id;
          $('#psoNama').textContent = p.nama;
          $('#psoMeta').textContent = 'Shift ' + shiftLabelJam(String(p.shift)) +
            ' · masuk ' + fmtTime(p.jam_masuk);
          $('#psoCatatan').value = '';
          SecurityModule.resetFoto('#psoFoto', '#psoFotoPrev', 'fotoKeluar');
          Modal.open('modalPresensiSecOut');
        });
      });
    });
  },

  openMasuk: function () {
    // Role SECURITY: dikunci atas nama sendiri — pilihan personel disembunyikan.
    var grpSec = $('#psSecurity') ? $('#psSecurity').closest('.form-group') : null;
    if (isRoleSecurity()) {
      if (grpSec) grpSec.style.display = 'none';
      $('#psSecurity').value = '';
    } else {
      if (grpSec) grpSec.style.display = '';
      fillSelect($('#psSecurity'), SecurityModule.personel, '— Sesuai akun login —', function (s) { return s.nama; });
    }
    // Serah terima: 07.00 (pagi), 15.00 (sore), 23.00 (malam) — toleransi 1 jam sebelum
    var h = new Date().getHours();
    $('#psShift').value = (h >= 6 && h < 14) ? 'pagi' : ((h >= 14 && h < 22) ? 'siang' : 'malam');
    $('#psKeterangan').value = '';
    SecurityModule.resetFoto('#psFoto', '#psFotoPrev', 'fotoMasuk');
    Modal.open('modalPresensiSec');
  },

  submitMasuk: function () {
    if (isRoleSecurity() && !SecurityModule.fotoMasuk) {
      Toast.warning('Foto eviden wajib', 'Ambil selfie/foto pos terlebih dahulu.');
      return;
    }
    var btn = $('#psSubmit'), txt = $('#psSubmitText');
    btnLoading(btn, txt, true);
    var payload = { shift: $('#psShift').value, catatan: $('#psKeterangan').value.trim() };
    if (SecurityModule.fotoMasuk) payload.foto = SecurityModule.fotoMasuk;
    if (!isRoleSecurity() && $('#psSecurity').value) payload.security_id = $('#psSecurity').value;
    SecurityModule.ambilGps(function (lok) {
      if (lok) payload.lokasi = lok;
      API.call('createPresensiSecurity', payload).then(function (res) {
        btnLoading(btn, txt, false, 'Presensi Masuk');
        if (res.success) {
          Modal.close('modalPresensiSec');
          Toast.success(res.message || 'Presensi masuk tercatat',
            'Terkirim ke grup Telegram security (foto + titik lokasi).');
          SecurityModule.load();
        } else Toast.error(res.error || 'Gagal presensi');
      });
    });
  },

  submitKeluar: function () {
    var id = $('#psoId').value;
    if (!id) return;
    var btn = $('#psoSubmit'), txt = $('#psoSubmitText');
    btnLoading(btn, txt, true);
    var payload = { id: id, catatan: $('#psoCatatan').value.trim() };
    if (SecurityModule.fotoKeluar) payload.foto = SecurityModule.fotoKeluar;
    SecurityModule.ambilGps(function (lok) {
      if (lok) payload.lokasi = lok;
      API.call('updatePresensiSecurityKeluar', payload).then(function (res) {
        btnLoading(btn, txt, false, 'Catat Keluar');
        if (res.success) {
          Modal.close('modalPresensiSecOut');
          Toast.success(res.message || 'Presensi keluar tercatat');
          SecurityModule.load();
        } else Toast.error(res.error || 'Gagal menyimpan');
      });
    });
  },

  /* ── Jadwal shift mingguan + indikator kepatuhan aturan piket ──
     Pola kerja SECURITY (rotasi, TIDAK mengikuti kalender kerja kantor):
       2 hari masuk PAGI \u2192 2 hari masuk MALAM \u2192 2 hari LIBUR.
     Kebutuhan harian (termasuk Sabtu/Minggu): Pagi \u2265 2 dan Malam \u2265 2 personel.
     LEMBUR hanya dihitung pada HARI LIBUR NASIONAL / cuti bersama —
     hari tersebut mewajibkan piket minimal 2 personel. */
  kalender: {},

  hitungKepatuhan: function (countByDateShift, tgl) {
    var info = SecurityModule.kalender[tgl] || { keterangan: '' };
    var liburNas = !!info.libur_nasional;
    var c = countByDateShift[tgl] || { pagi: 0, siang: 0, malam: 0, total: 0 };
    var items = [];
    if (liburNas) {
      // Hari libur nasional: piket (lembur) minimal 2 personel total
      items.push({ label: 'Piket (lembur)', kode: 'Pkt', n: c.total, min: 2, ok: c.total >= 2 });
    } else {
      items.push({ label: 'Pagi',  kode: 'P', n: c.pagi,  min: 2, ok: c.pagi  >= 2 });
      items.push({ label: 'Malam', kode: 'M', n: c.malam, min: 2, ok: c.malam >= 2 });
    }
    return { info: info, liburNas: liburNas, items: items,
      ok: items.every(function (x) { return x.ok; }) };
  },

  kepatuhanCellHtml: function (countByDateShift, tgl) {
    var k = SecurityModule.hitungKepatuhan(countByDateShift, tgl);
    return '<td style="text-align:center;font-size:10.5px;line-height:1.6;padding:6px 4px">' +
      k.items.map(function (x) {
        return '<span style="white-space:nowrap;color:' + (x.ok ? 'var(--success, #16a34a)' : 'var(--warning, #d97706)') +
          ';font-weight:600" title="' + x.label + ' minimal ' + x.min + ' personel">' +
          x.kode + ' ' + x.n + '/' + x.min + (x.ok ? ' \u2713' : ' \u26a0') + '</span>';
      }).join('<br>') + '</td>';
  },

  loadJadwal: function () {
    var dates = SecurityModule.weekDates();
    // Kalender kerja (akhir pekan + libur nasional/cuti bersama) — untuk indikator
    API.call('getKalenderKerja', { start: dates[0], end: dates[6] }).then(function (kr) {
      if (kr.success) SecurityModule.kalender = kr.data || {};
      API.call('getJadwalShift', { start: dates[0], end: dates[6] }).then(function (r) {
        var wrap = $('#secJadwalWrap');
        if (!r.success) { Toast.error('Gagal memuat jadwal', r.error); return; }
        var rows = r.data || [];
        if (!SecurityModule.personel.length) {
          wrap.innerHTML = emptyBoxHtml('calendar', 'Belum ada personel security aktif.');
          renderIcons(wrap);
          return;
        }
        var map = {}, count = {};
        dates.forEach(function (t) { count[t] = { pagi: 0, siang: 0, malam: 0, total: 0 }; });
        rows.forEach(function (j) {
          var t = String(j.tanggal).substring(0, 10);
          var sh = String(j.shift || '');
          map[String(j.security_id) + '|' + t] = sh;
          if (count[t] && sh && sh !== 'libur') {
            if (count[t][sh] !== undefined) count[t][sh]++;
            count[t].total++;
          }
        });
        var SH_CLS = { pagi: 'serving', siang: 'waiting', malam: 'neutral', libur: 'cancelled' };
        var html = '<table class="table"><thead><tr><th>Personel</th>';
        dates.forEach(function (t, i) {
          var info = SecurityModule.kalender[t] || {};
          // Rotasi security tidak mengenal akhir pekan — hanya LIBUR NASIONAL yang ditandai
          var merah = !!info.libur_nasional;
          html += '<th style="text-align:center;font-size:11px' + (merah ? ';color:var(--danger, #dc2626)' : '') + '"' +
            (merah && info.keterangan ? ' title="' + escapeHtml(info.keterangan) + '"' : '') + '>' +
            SecurityModule.HARI[i] +
            '<br><span class="text-muted" style="font-weight:400' + (merah ? ';color:var(--danger, #dc2626)' : '') + '">' +
            t.substring(8, 10) + '/' + t.substring(5, 7) + '</span>' +
            (merah ? '<br><span style="font-size:9px;font-weight:600">LIBUR NASIONAL</span>' : '') + '</th>';
        });
        html += '</tr></thead><tbody>';
        SecurityModule.personel.forEach(function (s) {
          html += '<tr><td><div class="cell-primary" style="font-size:12.5px">' + escapeHtml(s.nama) + '</div></td>';
          dates.forEach(function (t) {
            var sh = map[String(s.id) + '|' + t];
            html += '<td style="text-align:center">' + (sh
              ? '<span class="badge badge-' + (SH_CLS[sh] || 'neutral') + '" title="' + escapeHtml(shiftLabelJam(sh)) + '">' + escapeHtml(SHIFT_LABEL[sh] || sh) + '</span>'
              : '<span class="text-muted" style="font-size:11px">—</span>') + '</td>';
          });
          html += '</tr>';
        });
        // Baris ringkasan kepatuhan per tanggal
        html += '<tr style="background:var(--slate-50)"><td style="font-size:11px;font-weight:700;color:var(--text-secondary)">Kepatuhan<br><span style="font-weight:400">aturan piket</span></td>';
        dates.forEach(function (t) { html += SecurityModule.kepatuhanCellHtml(count, t); });
        html += '</tr></tbody></table>';
        html += '<p class="text-muted" style="font-size:11px;margin:8px 2px 0">' +
          'Pola kerja security: <b>rotasi 2 hari pagi \u2192 2 hari malam \u2192 2 hari libur</b> ' +
          '(tidak mengikuti kalender kerja kantor — Sabtu/Minggu hari biasa). ' +
          'Kebutuhan harian: <b>Pagi (07.00–15.00) min 2</b> dan <b>Malam (23.00–07.00) min 2</b> personel. ' +
          '<b>Lembur hanya pada hari libur nasional/cuti bersama</b> — piket minimal 2 personel.</p>';
        wrap.innerHTML = html;
      });
    });
  },

  openJadwalBuilder: function () {
    if (!SecurityModule.personel.length) { Toast.warning('Belum ada personel security aktif'); return; }
    var dates = SecurityModule.weekDates();
    API.call('getJadwalShift', { start: dates[0], end: dates[6] }).then(function (r) {
      var map = {};
      ((r.success && r.data) || []).forEach(function (j) {
        map[String(j.security_id) + '|' + String(j.tanggal).substring(0, 10)] = String(j.shift || '');
      });
      $('#jsInfo').textContent = 'Minggu ' + fmtDateShort(dates[0]) + ' \u2013 ' + fmtDateShort(dates[6]) +
        '. Kosongkan sel bila tidak ingin mengubah jadwal yang ada. ' +
        'Pola security: rotasi 2 pagi \u2192 2 malam \u2192 2 libur (Sabtu/Minggu hari biasa); ' +
        'Pagi & Malam masing-masing min 2 personel/hari; libur nasional = piket 2 personel (lembur).';
      var opsi = [['', '—'], ['pagi', 'Pagi (07.00–15.00)'], ['siang', 'Sore (15.00–23.00)'],
                  ['malam', 'Malam (23.00–07.00)'], ['libur', 'Libur']];
      var html = '<div style="margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-outline btn-sm" id="jsRotasiBtn">\u26A1 Terapkan Pola 2-2-2</button>' +
        '<span class="text-muted" style="font-size:11px">Mengisi otomatis rotasi 2 pagi \u2192 2 malam \u2192 2 libur per pasangan personel (urut daftar), sinambung antar-minggu.</span></div>';
      html += '<table class="table"><thead><tr><th>Personel</th>';
      dates.forEach(function (t, i) {
        var infoB = SecurityModule.kalender[t] || {};
        var merahB = !!infoB.libur_nasional;
        html += '<th style="text-align:center;font-size:11px' + (merahB ? ';color:var(--danger, #dc2626)' : '') + '"' +
          (merahB && infoB.keterangan ? ' title="' + escapeHtml(infoB.keterangan) + '"' : '') + '>' + SecurityModule.HARI[i] +
          '<br><span class="text-muted" style="font-weight:400' + (merahB ? ';color:var(--danger, #dc2626)' : '') + '">' +
          t.substring(8, 10) + '/' + t.substring(5, 7) + '</span>' +
          (merahB ? '<br><span style="font-size:9px;font-weight:600">LIBUR NAS.</span>' : '') + '</th>';
      });
      html += '</tr></thead><tbody>';
      SecurityModule.personel.forEach(function (s) {
        html += '<tr><td style="font-size:12px;font-weight:600;white-space:nowrap">' + escapeHtml(s.nama) + '</td>';
        dates.forEach(function (t) {
          var cur = map[String(s.id) + '|' + t] || '';
          html += '<td><select class="form-control shift-select" data-sec="' + escapeHtml(s.id) +
            '" data-nama="' + escapeHtml(s.nama) + '" data-tgl="' + t + '">';
          opsi.forEach(function (o) {
            html += '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
          });
          html += '</select></td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '<div id="jsCompliance" style="margin-top:10px"></div>';
      $('#jsGrid').innerHTML = html;
      // Indikator kepatuhan LANGSUNG saat menyusun — dihitung ulang tiap perubahan sel
      var refresh = function () { SecurityModule.renderBuilderCompliance(dates); };
      $all('.shift-select', $('#jsGrid')).forEach(function (sel) {
        sel.addEventListener('change', refresh);
      });
      var rotBtn = $('#jsRotasiBtn');
      if (rotBtn) rotBtn.addEventListener('click', function () {
        SecurityModule.fillRotasi(dates);
        refresh();
        Toast.info('Pola rotasi 2-2-2 diterapkan', 'Periksa lalu klik Simpan Jadwal.');
      });
      refresh();
      Modal.open('modalJadwalShift');
    });
  },

  /** Isi grid dengan pola rotasi 2 pagi \u2192 2 malam \u2192 2 libur.
      Siklus 6 hari ditambatkan ke tanggal tetap (Senin 05-01-2026) sehingga
      SINAMBUNG antar-minggu; personel dipasangkan berurutan (1-2, 3-4, 5-6). */
  fillRotasi: function (dates) {
    var epoch = Date.UTC(2026, 0, 5); // Senin, 5 Januari 2026
    var idx = {};
    SecurityModule.personel.forEach(function (s, i) { idx[String(s.id)] = i; });
    $all('.shift-select', $('#jsGrid')).forEach(function (sel) {
      var i = idx[String(sel.getAttribute('data-sec'))];
      if (i === undefined) return;
      var t = sel.getAttribute('data-tgl');
      var hari = Math.round((Date.parse(t + 'T00:00:00Z') - epoch) / 86400000);
      var pasangan = Math.floor(i / 2) % 3;           // 3 pasangan bergiliran
      var pos = ((hari + pasangan * 2) % 6 + 6) % 6;  // posisi dalam siklus 6 hari
      sel.value = pos < 2 ? 'pagi' : (pos < 4 ? 'malam' : 'libur');
    });
  },

  /** Ringkasan kepatuhan pada modal penyusunan jadwal (live). */
  renderBuilderCompliance: function (dates) {
    var box = $('#jsCompliance'); if (!box) return;
    var count = {};
    dates.forEach(function (t) { count[t] = { pagi: 0, siang: 0, malam: 0, total: 0 }; });
    $all('.shift-select', $('#jsGrid')).forEach(function (sel) {
      var t = sel.getAttribute('data-tgl'), sh = sel.value;
      if (count[t] && sh && sh !== 'libur') {
        if (count[t][sh] !== undefined) count[t][sh]++;
        count[t].total++;
      }
    });
    var chips = dates.map(function (t, i) {
      var k = SecurityModule.hitungKepatuhan(count, t);
      return '<span style="display:inline-flex;flex-direction:column;align-items:center;gap:1px;' +
        'border:1px solid var(--border);border-radius:8px;padding:5px 8px;font-size:10.5px;min-width:74px"' +
        (k.info.keterangan ? ' title="' + escapeHtml(k.info.keterangan) + '"' : '') + '>' +
        '<b style="font-size:10px' + (k.liburNas ? ';color:var(--danger, #dc2626)' : '') + '">' +
        SecurityModule.HARI[i] + ' ' + t.substring(8, 10) + '/' + t.substring(5, 7) + '</b>' +
        k.items.map(function (x) {
          return '<span style="color:' + (x.ok ? 'var(--success, #16a34a)' : 'var(--warning, #d97706)') +
            ';font-weight:600">' + x.kode + ' ' + x.n + '/' + x.min +
            (x.ok ? ' \u2713' : ' \u26a0') + '</span>';
        }).join('') + '</span>';
    }).join(' ');
    box.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px">' + chips + '</div>' +
      '<p class="text-muted" style="font-size:11px;margin-top:6px">P = Pagi (min 2/hari) · M = Malam (min 2/hari) — berlaku setiap hari termasuk Sabtu/Minggu. ' +
      'Pkt = Piket hari libur nasional (min 2 total, dihitung lembur). ' +
      'Peringatan \u26a0 tidak memblokir penyimpanan — pastikan terpenuhi sebelum menyimpan.</p>';
  },

  submitJadwal: function () {
    var jadwal = [];
    $all('.shift-select', $('#jsGrid')).forEach(function (sel) {
      if (!sel.value) return;
      jadwal.push({
        security_id: sel.getAttribute('data-sec'),
        nama: sel.getAttribute('data-nama'),
        tanggal: sel.getAttribute('data-tgl'),
        shift: sel.value
      });
    });
    if (!jadwal.length) { Toast.warning('Isi minimal satu sel jadwal'); return; }
    var btn = $('#jsSubmit'), txt = $('#jsSubmitText');
    btnLoading(btn, txt, true);
    API.call('createJadwalShift', { jadwal: jadwal }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan Jadwal');
      if (res.success) {
        Modal.close('modalJadwalShift');
        Toast.success(res.message || 'Jadwal tersimpan');
        SecurityModule.loadJadwal();
      } else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  /* ── Insiden ── */
  loadInsiden: function () {
    var st = $('#secInsidenFilter').value;
    API.call('getIncidentReports', st ? { status: st } : {}).then(function (r) {
      var tbody = $('#secInsidenBody');
      if (!r.success) { Toast.error('Gagal memuat insiden', r.error); return; }
      SecurityModule.insiden = r.data || [];
      if (!SecurityModule.insiden.length) {
        tbody.innerHTML = emptyRow(6, 'alert', 'Tidak ada laporan insiden',
          'Semoga tetap aman. Gunakan "Lapor Insiden" bila terjadi kejadian.');
        renderIcons(tbody);
        return;
      }
      var canFollow = isApprover();
      var jenisLabel = function (id) {
        var t = SecurityModule.incidentTypes.find(function (x) { return String(x.id) === String(id); });
        return t ? t.label : id;
      };
      tbody.innerHTML = SecurityModule.insiden.map(function (x, i) {
        var aksi = '<button class="btn btn-ghost btn-sm" data-indetail="' + i + '">Detail</button>';
        if (canFollow && String(x.status) !== 'closed') {
          aksi += ' <button class="btn btn-primary btn-sm" data-infollow="' + i + '">Tindak Lanjut</button>';
        }
        return '<tr>' +
          '<td style="white-space:nowrap;font-size:12px">' + fmtDateShort(x.tanggal) +
          '<div class="cell-sub cell-mono">' + fmtTime(x.waktu) + '</div></td>' +
          '<td><div style="font-weight:600;font-size:12.5px">' + escapeHtml(jenisLabel(x.jenis_incident)) + '</div></td>' +
          '<td style="font-size:12px">' + escapeHtml(x.lokasi || '—') + '</td>' +
          '<td style="font-size:12px">' + escapeHtml(x.nama_security || '—') + '</td>' +
          '<td>' + statusBadge(x.status || 'open') + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' + aksi + '</td></tr>';
      }).join('');
      $all('[data-indetail]', tbody).forEach(function (b) {
        b.addEventListener('click', function () {
          var x = SecurityModule.insiden[parseInt(b.getAttribute('data-indetail'), 10)];
          if (!x) return;
          DetailView.show('Insiden — ' + jenisLabel(x.jenis_incident), [
            ['Tanggal', fmtDateShort(x.tanggal) + ' ' + fmtTime(x.waktu)],
            ['Jenis', jenisLabel(x.jenis_incident)],
            ['Lokasi', x.lokasi],
            ['Pelapor', x.nama_security],
            ['Saksi', x.saksi],
            ['Kronologi', x.deskripsi],
            ['Tindakan Awal', x.tindakan],
            ['Status', statusBadge(x.status || 'open'), { html: true }],
            ['Tindak Lanjut', x.follow_up],
            ['Foto', (x.foto_1 ? fotoChip(x.foto_1, 'Foto 1') + ' ' : '') +
              (x.foto_2 ? fotoChip(x.foto_2, 'Foto 2') : '') || '—',
              { html: !!(x.foto_1 || x.foto_2) }]
          ]);
        });
      });
      $all('[data-infollow]', tbody).forEach(function (b) {
        b.addEventListener('click', function () {
          var x = SecurityModule.insiden[parseInt(b.getAttribute('data-infollow'), 10)];
          if (!x) return;
          $('#insId').value = x.id;
          $('#insJudul').textContent = jenisLabel(x.jenis_incident) + (x.lokasi ? ' · ' + x.lokasi : '');
          $('#insDesk').textContent = x.deskripsi || '';
          $('#insStatus').value = String(x.status) === 'open' ? 'proses' : (x.status || 'proses');
          $('#insFollow').value = x.follow_up || '';
          Modal.open('modalInsidenStatus');
        });
      });
    });
  },

  openInsiden: function () {
    var fillJenis = function () {
      fillSelect($('#inJenis'), SecurityModule.incidentTypes, '— Pilih jenis —',
        function (t) { return t.label; });
    };
    if (SecurityModule.incidentTypes.length) fillJenis();
    else API.call('getIncidentTypes').then(function (r) {
      if (r.success) SecurityModule.incidentTypes = r.data || [];
      fillJenis();
    });
    var grpSec = $('#inSecurity') ? $('#inSecurity').closest('.form-group') : null;
    if (isRoleSecurity()) {
      if (grpSec) grpSec.style.display = 'none'; // laporan selalu atas nama sendiri
      $('#inSecurity').value = '';
    } else {
      if (grpSec) grpSec.style.display = '';
      fillSelect($('#inSecurity'), SecurityModule.personel, '— Sesuai akun login —', function (s) { return s.nama; });
    }
    $('#inLokasi').value = '';
    $('#inSaksi').value = '';
    $('#inDeskripsi').value = '';
    $('#inTindakan').value = '';
    SecurityModule.resetFoto('#inFoto', '#inFotoPrev', 'fotoInsiden');
    Modal.open('modalInsiden');
  },

  submitInsiden: function () {
    var jenis = $('#inJenis').value;
    var desk = $('#inDeskripsi').value.trim();
    if (!jenis) { Toast.warning('Pilih jenis insiden'); return; }
    if (!desk) { Toast.warning('Uraikan kronologi kejadian'); return; }
    if (isRoleSecurity() && !SecurityModule.fotoInsiden) {
      Toast.warning('Foto kejadian wajib', 'Lampirkan foto sebagai eviden.'); return;
    }
    var payload = {
      jenis_incident: jenis, lokasi: $('#inLokasi').value.trim(),
      deskripsi: desk, tindakan: $('#inTindakan').value.trim(),
      saksi: $('#inSaksi').value.trim()
    };
    if (SecurityModule.fotoInsiden) payload.foto_1 = SecurityModule.fotoInsiden;
    if (!isRoleSecurity() && $('#inSecurity').value) payload.security_id = $('#inSecurity').value;
    var btn = $('#inSubmit'), txt = $('#inSubmitText');
    btnLoading(btn, txt, true);
    SecurityModule.ambilGps(function (lok) {
      if (lok) payload.gps = lok;
      API.call('createIncidentReport', payload).then(function (res) {
        btnLoading(btn, txt, false, 'Kirim Laporan');
        if (res.success) {
          Modal.close('modalInsiden');
          Toast.success(res.message || 'Laporan tercatat',
            'Terkirim ke grup Telegram security (foto + titik lokasi).');
          SecurityModule.load();
        } else Toast.error(res.error || 'Gagal mengirim laporan');
      });
    });
  },

  submitInsidenStatus: function () {
    var id = $('#insId').value;
    if (!id) return;
    var btn = $('#insSubmit'), txt = $('#insSubmitText');
    btnLoading(btn, txt, true);
    API.call('updateIncidentStatus', {
      id: id, status: $('#insStatus').value, follow_up: $('#insFollow').value.trim()
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan');
      if (res.success) {
        Modal.close('modalInsidenStatus');
        Toast.success(res.message || 'Status diperbarui');
        SecurityModule.load();
      } else Toast.error(res.error || 'Gagal menyimpan');
    });
  },

  /* ── Patroli ── */
  renderCheckpoints: function () {
    var wrap = $('#secCheckpointList');
    if (!SecurityModule.checkpoints.length) {
      wrap.innerHTML = emptyBoxHtml('shield', 'Belum ada checkpoint. Admin dapat menambahkan.');
      renderIcons(wrap);
      return;
    }
    wrap.innerHTML = '<div class="mini-list">' + SecurityModule.checkpoints.map(function (c) {
      return '<div class="mini-item"><div style="min-width:0">' +
        '<div class="mini-main">' + escapeHtml(c.nama_checkpoint) + '</div>' +
        '<div class="mini-sub">' + escapeHtml([c.lokasi, c.lantai ? 'Lantai ' + c.lantai : ''].filter(Boolean).join(' · ') || '—') + '</div>' +
        '</div><span class="cell-mono text-muted" style="font-size:11px">#' + escapeHtml(c.urutan || '-') + '</span></div>';
    }).join('') + '</div>';
  },

  loadPatroli: function () {
    API.call('getPatrolLog', { tanggal: todayISO() }).then(function (r) {
      var wrap = $('#secPatroliList');
      if (!r.success) { Toast.error('Gagal memuat patroli', r.error); return; }
      var rows = r.data || [];
      if (!rows.length) {
        wrap.innerHTML = emptyBoxHtml('activity', 'Belum ada patroli hari ini.');
        renderIcons(wrap);
        return;
      }
      wrap.innerHTML = '<div class="mini-list">' + rows.map(function (p) {
        var kond = String(p.kondisi || 'normal');
        return '<div class="mini-item"><div style="min-width:0">' +
          '<div class="mini-main">' + escapeHtml(p.nama_checkpoint) + '</div>' +
          '<div class="mini-sub">' + fmtTime(p.waktu) + ' · ' + escapeHtml(p.nama_security || '') +
          (p.catatan ? ' · ' + escapeHtml(p.catatan) : '') + '</div></div>' +
          '<span class="chip' + (kond === 'bahaya' ? ' is-danger' : '') + '">' +
          escapeHtml(KONDISI_LABEL[kond] || kond) + '</span></div>';
      }).join('') + '</div>';
    });
  },

  openPatroli: function () {
    if (!SecurityModule.checkpoints.length) { Toast.warning('Belum ada checkpoint patroli'); return; }
    fillSelect($('#ptCheckpoint'), SecurityModule.checkpoints, '— Pilih checkpoint —',
      function (c) { return c.nama_checkpoint; });
    var grpSec = $('#ptSecurity') ? $('#ptSecurity').closest('.form-group') : null;
    if (isRoleSecurity()) {
      if (grpSec) grpSec.style.display = 'none'; // patroli selalu atas nama sendiri
      $('#ptSecurity').value = '';
    } else {
      if (grpSec) grpSec.style.display = '';
      fillSelect($('#ptSecurity'), SecurityModule.personel, '— Sesuai akun login —', function (s) { return s.nama; });
    }
    // Shift mengikuti jam serah terima 07.00 / 15.00 / 23.00
    var h = new Date().getHours();
    $('#ptShift').value = (h >= 7 && h < 15) ? 'pagi' : ((h >= 15 && h < 23) ? 'siang' : 'malam');
    $('#ptKondisi').value = 'normal';
    $('#ptCatatan').value = '';
    SecurityModule.resetFoto('#ptFoto', '#ptFotoPrev', 'fotoPatroli');
    Modal.open('modalPatroli');
  },

  submitPatroli: function () {
    var cp = $('#ptCheckpoint').value;
    if (!cp) { Toast.warning('Pilih checkpoint dahulu'); return; }
    if (isRoleSecurity() && !SecurityModule.fotoPatroli) {
      Toast.warning('Foto checkpoint wajib', 'Lampirkan foto sebagai eviden patroli.'); return;
    }
    var payload = {
      checkpoint_id: cp, shift: $('#ptShift').value,
      kondisi: $('#ptKondisi').value, catatan: $('#ptCatatan').value.trim()
    };
    if (SecurityModule.fotoPatroli) payload.foto = SecurityModule.fotoPatroli;
    if (!isRoleSecurity() && $('#ptSecurity').value) payload.security_id = $('#ptSecurity').value;
    var btn = $('#ptSubmit'), txt = $('#ptSubmitText');
    btnLoading(btn, txt, true);
    SecurityModule.ambilGps(function (lok) {
      if (lok) payload.gps = lok;
      API.call('createPatrolLog', payload).then(function (res) {
        btnLoading(btn, txt, false, 'Simpan Patroli');
        if (res.success) {
          Modal.close('modalPatroli');
          Toast.success(res.message || 'Patroli tercatat',
            'Terkirim ke grup Telegram security (foto + titik lokasi).');
          SecurityModule.loadPatroli();
        } else Toast.error(res.error || 'Gagal menyimpan');
      });
    });
  },

  openCheckpoint: function () {
    $('#cpNama').value = '';
    $('#cpLokasi').value = '';
    $('#cpLantai').value = '';
    $('#cpUrutan').value = String(SecurityModule.checkpoints.length + 1);
    Modal.open('modalCheckpoint');
  },

  submitCheckpoint: function () {
    var nama = $('#cpNama').value.trim();
    if (!nama) { Toast.warning('Nama checkpoint wajib diisi'); return; }
    var btn = $('#cpSubmit'), txt = $('#cpSubmitText');
    btnLoading(btn, txt, true);
    API.call('createPatrolCheckpoint', {
      nama_checkpoint: nama, lokasi: $('#cpLokasi').value.trim(),
      lantai: $('#cpLantai').value.trim(), urutan: $('#cpUrutan').value
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Simpan');
      if (res.success) {
        Modal.close('modalCheckpoint');
        Toast.success(res.message || 'Checkpoint ditambahkan');
        API.call('getPatrolCheckpoints').then(function (r) {
          if (r.success) SecurityModule.checkpoints = r.data || [];
          SecurityModule.renderCheckpoints();
        });
      } else Toast.error(res.error || 'Gagal menyimpan');
    });
  }
};
