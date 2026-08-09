/* ════════════════════════════════════════════════════════════════════════════
   GESIT V6 — JS 4/4: MODUL FASE 4 + INISIALISASI APP
   Isi   : Agenda Pimpinan, Kalender Budaya, Konten Sosmed, Monitoring Berita, Eco Office, Laporan & Export, App init (WAJIB paling akhir)
   Urutan: file ke-4 dari 4 (WAJIB paling akhir)
   Catatan: keempat file JS berbagi scope global (tanpa IIFE) agar antar-modul
   tetap saling terhubung. Muat sesuai urutan di atas.
   ════════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: AGENDA PIMPINAN (Fase 4) — daftar, kalender, kelola pimpinan
   ══════════════════════════════════════════════════════════════════════════ */
var AgendaModule = {
  list: [],
  pimpinan: [],
  bulan: '',
  fileData: '',
  fotoData: '',   // V6.10: foto pimpinan baru (data-URL hasil kamera/galeri)
  fotoHapus: false,

  init: function () {
    AgendaModule.bulan = thisMonthISO();
    $('#agdBulan').value = AgendaModule.bulan;
    $('#agdRefreshBtn').addEventListener('click', function () { AgendaModule.load(); Toast.info('Agenda dimuat ulang'); });
    $('#agdAddBtn').addEventListener('click', function () { AgendaModule.openForm(null); });
    $('#agdBulan').addEventListener('change', function () {
      AgendaModule.bulan = $('#agdBulan').value || thisMonthISO();
      AgendaModule.load();
    });
    $('#agdFilterStatus').addEventListener('change', AgendaModule.renderTable);
    $('#agdSubmit').addEventListener('click', AgendaModule.submit);
    $('#agdFile').addEventListener('change', AgendaModule.onFile);
    var pmp = $('#agdPimpinanBtn');
    if (pmp) pmp.addEventListener('click', AgendaModule.openPimpinan);
    $('#pmpSubmit').addEventListener('click', AgendaModule.submitPimpinan);
    $('#pmpResetBtn').addEventListener('click', function () { AgendaModule.resetPimpinanForm(); });

    /* V6.10: markup baru DISUNTIK dari JS sehingga Index.html TIDAK perlu
       diubah — kompatibel dengan versi Index mana pun yang memuat anchor
       #pmpNoHp (modal pimpinan) dan #agdHariIni (panel agenda). */
    AgendaModule.injectMarkup();

    /* V6.10: foto pimpinan — tombol kamera memicu <input capture="environment">
       sehingga di HP/tablet KAMERA perangkat langsung terbuka; di desktop
       jatuh ke dialog file biasa. Galeri = input file tanpa capture. */
    var kamBtn = $('#pmpFotoKameraBtn'), galBtn = $('#pmpFotoGaleriBtn'), hpsBtn = $('#pmpFotoHapusBtn');
    if (kamBtn) kamBtn.addEventListener('click', function () { $('#pmpFotoKameraInput').click(); });
    if (galBtn) galBtn.addEventListener('click', function () { $('#pmpFotoGaleriInput').click(); });
    if (hpsBtn) hpsBtn.addEventListener('click', AgendaModule.hapusFotoPimpinan);
    ['pmpFotoKameraInput', 'pmpFotoGaleriInput'].forEach(function (id) {
      var inp = $('#' + id);
      if (inp) inp.addEventListener('change', function () { AgendaModule.onFotoPimpinan(inp); });
    });

    initTabs('#agdTabs', '[data-view-panel="agenda"]');
  },

  /* ── V6.10: suntik markup baru (foto pimpinan + papan ketersediaan) ──
     Disuntik dari JS agar TIDAK ada ketergantungan pada versi Index.html. */
  injectMarkup: function () {
    // 1. Field "Foto Pimpinan" di modal Kelola Pimpinan
    if (!$('#pmpFotoPreview')) {
      var noHp = $('#pmpNoHp');
      var grid = noHp && noHp.closest ? noHp.closest('.form-grid') : null;
      if (grid) {
        grid.insertAdjacentHTML('beforeend',
          '<div class="form-group full">' +
            '<label class="form-label">Foto Pimpinan</label>' +
            '<div class="pmp-foto-row">' +
              '<span class="avatar-foto avatar-inisial pmp-foto-preview" id="pmpFotoPreview">?</span>' +
              '<div class="pmp-foto-btns">' +
                '<button type="button" class="btn btn-outline btn-sm" id="pmpFotoKameraBtn">' +
                  '<svg class="btn-icon" data-icon="camera"></svg> Ambil dari Kamera</button>' +
                '<button type="button" class="btn btn-outline btn-sm" id="pmpFotoGaleriBtn">' +
                  '<svg class="btn-icon" data-icon="file"></svg> Pilih dari Galeri</button>' +
                '<button type="button" class="btn btn-ghost btn-sm hidden" id="pmpFotoHapusBtn">' +
                  '<svg class="btn-icon" data-icon="trash"></svg> Hapus Foto</button>' +
              '</div>' +
            '</div>' +
            // capture="environment" → di HP/tablet langsung membuka KAMERA perangkat
            '<input type="file" id="pmpFotoKameraInput" accept="image/*" capture="environment" style="display:none">' +
            '<input type="file" id="pmpFotoGaleriInput" accept="image/*" style="display:none">' +
            '<div class="form-hint">Foto tampil di papan ketersediaan pimpinan, katalog &amp; agenda. Di HP/tablet, tombol kamera langsung membuka kamera perangkat.</div>' +
          '</div>');
        renderIcons(grid);
      }
    }
    // 2. Kontainer papan ketersediaan di atas panel "Hari Ini & Besok"
    if (!$('#agdKetersediaan')) {
      var hariIni = $('#agdHariIni');
      if (hariIni) hariIni.insertAdjacentHTML('beforebegin',
        '<div id="agdKetersediaan" style="margin:2px 0 14px"></div>');
    }
  },

  load: function () {
    AgendaModule.loadPimpinan();
    AgendaModule.loadKetersediaan();
    API.call('getAgenda', { bulan: AgendaModule.bulan }).then(function (r) {
      if (r.success) {
        AgendaModule.list = r.data || [];
        AgendaModule.renderStats();
        AgendaModule.renderHariIni();
        AgendaModule.renderTable();
      } else Toast.error('Gagal memuat agenda', r.error);
    });
    AgendaModule.loadKalender();
  },

  /* ── V6.10: papan ketersediaan pimpinan (kontrol manual utk kabag/admin) ── */
  loadKetersediaan: function () {
    var el = $('#agdKetersediaan');
    if (!el) return;
    API.call('getKetersediaanPimpinan').then(function (r) {
      if (!r.success) {
        // Backend lama belum punya aksi ini → sembunyikan panel tanpa ribut
        el.innerHTML = /tidak dikenal/i.test(r.error || '') ? '' :
          '<div class="pd-empty" style="padding:14px">' + escapeHtml(r.error || 'Papan ketersediaan belum bisa dimuat.') + '</div>';
        return;
      }
      var kontrol = isApprover();
      el.innerHTML = '<div class="card"><div class="card-header">' +
        '<div class="card-title">' + iconSvg('users') + ' Ketersediaan Pimpinan Hari Ini</div>' +
        '<span class="text-muted" style="font-size:11.5px">' + escapeHtml(ketRingkasTeks(r.ringkas)) + '</span>' +
        '</div><div class="card-body" id="agdKetBody"></div>' +
        (kontrol ? '<div class="card-footer" style="font-size:11.5px;color:var(--text-secondary)">Status otomatis mengikuti agenda hari ini (eksternal → Dinas Luar). Pilih status manual bila kondisi nyata berbeda — berlaku sampai hari berganti.</div>' : '') +
        '</div>';
      renderKetersediaanBoard($('#agdKetBody'), r.data, { kontrol: kontrol });
      renderIcons(el);
      if (!kontrol) return;

      // Simpan otomatis: ganti select → simpan; catatan (Enter/blur) → simpan
      function simpan(id, status, catatan, elemen) {
        elemen.disabled = true;
        API.call('setKetersediaanPimpinan', { id: id, status: status, catatan: catatan }).then(function (res) {
          elemen.disabled = false;
          if (res.success) { Toast.success(res.message || 'Status diperbarui'); AgendaModule.loadKetersediaan(); }
          else Toast.error('Gagal menyimpan status', res.error);
        });
      }
      $all('[data-ketset]', el).forEach(function (sel) {
        sel.addEventListener('change', function () {
          var id = sel.getAttribute('data-ketset');
          var note = $('[data-ketnote="' + id + '"]', el);
          var noteVal = note ? note.value.trim() : '';
          if (note) note.classList.toggle('hidden', !sel.value);
          simpan(id, sel.value, sel.value ? noteVal : '', sel);
        });
      });
      $all('[data-ketnote]', el).forEach(function (inp) {
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') inp.blur(); });
        inp.addEventListener('change', function () {
          var id = inp.getAttribute('data-ketnote');
          var sel = $('[data-ketset="' + id + '"]', el);
          if (sel && sel.value) simpan(id, sel.value, inp.value.trim(), inp);
        });
      });
    });
  },

  /* Panel "Hari Ini & Besok" — jawaban cepat tanpa membuka tabel/kalender.
     V6.10: tampilan timeline (garis waktu) + PERBAIKAN BUG: "besok" dulu
     dihitung via toISOString() (UTC) sehingga sebelum jam 07.00 WIB tanggalnya
     mundur sehari; kini murni tanggal lokal perangkat. */
  renderHariIni: function () {
    var el = $('#agdHariIni');
    if (!el) return;
    var ini = todayISO();
    var besok = (function () {
      var d = new Date(); d.setDate(d.getDate() + 1);
      function p(n) { return n < 10 ? '0' + n : n; }
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    })();
    function ambil(tgl) {
      return AgendaModule.list.filter(function (a) {
        return String(a.tanggal).substring(0, 10) === tgl && a.status === 'terjadwal';
      }).sort(function (a, b) { return String(a.jam_mulai).localeCompare(String(b.jam_mulai)); });
    }
    var hariIni = ambil(ini), hariBesok = ambil(besok);
    function baris(a) {
      var jenisCls = a.jenis === 'eksternal' ? ' is-eks' : (a.jenis === 'daring' ? ' is-daring' : '');
      return '<div class="agd-tl-item' + jenisCls + '">' +
        '<div class="agd-tl-time">' + fmtTime(a.jam_mulai) +
          (a.jam_selesai ? '<span>–' + fmtTime(a.jam_selesai) + '</span>' : '') + '</div>' +
        '<div class="agd-tl-rail"><span class="agd-tl-dot"></span></div>' +
        '<div class="agd-tl-body">' +
          '<div class="agd-tl-title">' + escapeHtml(a.nama_kegiatan) + '</div>' +
          '<div class="agd-tl-meta">' +
            (a.nama_pimpinan ? '<span>' + iconSvg('user') + escapeHtml(a.nama_pimpinan) + '</span>' : '') +
            (a.lokasi ? '<span>' + iconSvg('door') + escapeHtml(a.lokasi) + '</span>' : '') +
            (a.jenis ? '<span class="agd-jenis">' + escapeHtml(a.jenis) + '</span>' : '') +
          '</div>' +
        '</div></div>';
    }
    var html = '<div class="card"><div class="card-header"><div class="card-title">' + iconSvg('rocket') +
      ' Hari Ini &amp; Besok</div>' +
      (hariIni.length ? '<button class="btn btn-outline btn-sm" id="agdSalinBtn">' + iconSvg('clipboard') + ' Salin agenda hari ini</button>' : '') +
      '</div><div class="card-body">';
    html += hariIni.length ? '<div class="agd-tl">' + hariIni.map(baris).join('') + '</div>'
      : '<div class="text-muted" style="font-size:12.5px;margin-bottom:6px">Tidak ada agenda pimpinan hari ini.</div>';
    if (besok.substring(0, 7) === AgendaModule.bulan) {
      html += '<div class="agd-tl-sep">Besok · ' + fmtDateShort(besok) + '</div>';
      html += hariBesok.length ? '<div class="agd-tl is-besok">' + hariBesok.map(baris).join('') + '</div>'
        : '<div class="text-muted" style="font-size:12.5px">Belum ada agenda untuk besok.</div>';
    }
    html += '</div></div>';
    el.innerHTML = html;
    var btn = $('#agdSalinBtn');
    if (btn) btn.addEventListener('click', function () {
      var teks = 'AGENDA PIMPINAN ' + fmtDateShort(ini) + '\n' + hariIni.map(function (a) {
        return '- ' + fmtTime(a.jam_mulai) + (a.jam_selesai ? '-' + fmtTime(a.jam_selesai) : '') + ' ' +
          a.nama_kegiatan + (a.nama_pimpinan ? ' (' + a.nama_pimpinan + ')' : '') + (a.lokasi ? ' @ ' + a.lokasi : '');
      }).join('\n');
      AgendaModule.salinTeks(teks);
    });
  },

  salinTeks: function (teks) {
    function sukses() { Toast.success('Tersalin', 'Tempel ke WhatsApp/Telegram grup pimpinan.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teks).then(sukses, function () { AgendaModule.salinFallback(teks); sukses(); });
    } else { AgendaModule.salinFallback(teks); sukses(); }
  },
  salinFallback: function (teks) {
    var ta = document.createElement('textarea');
    ta.value = teks; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* abaikan */ }
    document.body.removeChild(ta);
  },

  loadPimpinan: function () {
    API.call('getPimpinanList').then(function (r) {
      if (!r.success) return;
      AgendaModule.pimpinan = r.data || [];
      AgendaModule.renderPimpinanBox([]);
    });
  },

  /* V6.5: pilihan MULTI-pimpinan — Kepala Cabang lazim didampingi kepala bagian */
  renderPimpinanBox: function (terpilih) {
    var box = $('#agdPimpinanBox');
    if (!box) return;
    if (!AgendaModule.pimpinan.length) {
      box.innerHTML = '<div class="text-muted" style="font-size:12px;padding:4px">Belum ada master pimpinan — tambahkan lewat tombol "Kelola Pimpinan".</div>';
      return;
    }
    box.innerHTML = AgendaModule.pimpinan.map(function (p) {
      var on = terpilih.indexOf(String(p.id)) !== -1;
      return '<label class="check-item" style="padding:7px 9px;margin-bottom:4px">' +
        '<input type="checkbox" value="' + escapeHtml(p.id) + '"' + (on ? ' checked' : '') + '>' +
        avatarHtml(p.foto_thumb || p.foto, p.nama, 26) +
        '<span><b>' + escapeHtml(p.nama) + '</b>' +
        (p.jabatan ? ' <span class="text-muted" style="font-size:11.5px">· ' + escapeHtml(p.jabatan) + '</span>' : '') +
        '</span></label>';
    }).join('');
  },

  pimpinanTerpilih: function () {
    return $all('#agdPimpinanBox input:checked').map(function (cb) { return cb.value; });
  },

  renderStats: function () {
    var rows = AgendaModule.list;
    var hariIni = todayISO();
    var stat = {
      total: rows.length,
      hari_ini: rows.filter(function (a) { return String(a.tanggal).substring(0, 10) === hariIni && a.status !== 'batal'; }).length,
      terjadwal: rows.filter(function (a) { return a.status === 'terjadwal'; }).length,
      batal: rows.filter(function (a) { return a.status === 'batal'; }).length
    };
    $('#agdStats').innerHTML = [
      statCardHtml({ cls: 'stat-teal',  icon: 'calendar', val: stat.total,     label: 'Agenda Bulan Ini' }),
      statCardHtml({ cls: 'stat-blue',  icon: 'clock',    val: stat.hari_ini,  label: 'Agenda Hari Ini' }),
      statCardHtml({ cls: 'stat-amber', icon: 'rocket',   val: stat.terjadwal, label: 'Masih Terjadwal' }),
      statCardHtml({ cls: 'stat-rose',  icon: 'x',        val: stat.batal,     label: 'Dibatalkan' })
    ].join('');
    renderIcons($('#agdStats'));
  },

  renderTable: function () {
    var f = $('#agdFilterStatus').value;
    var rows = AgendaModule.list.filter(function (a) { return !f || String(a.status) === f; });
    var tbody = $('#agdTableBody');
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'calendar', 'Belum ada agenda',
        'Klik "Tambah Agenda" untuk menjadwalkan kegiatan pimpinan.');
      renderIcons(tbody);
      return;
    }
    var approver = isApprover();
    var me = (Auth.user && (Auth.user.nama || Auth.user.username)) || '';
    tbody.innerHTML = rows.map(function (a) {
      var boleh = approver || String(a.created_by) === String(me);
      var aksi = '<button class="btn btn-ghost btn-sm" data-adetail="' + escapeHtml(a.id) + '">Detail</button>';
      if (boleh && a.status === 'terjadwal') {
        aksi += ' <button class="btn btn-outline btn-sm" data-aedit="' + escapeHtml(a.id) + '">Edit</button>' +
                ' <button class="btn btn-success btn-sm" data-adone="' + escapeHtml(a.id) + '">Selesai</button>' +
                ' <button class="btn btn-danger btn-sm" data-abatal="' + escapeHtml(a.id) + '">Batal</button>';
      }
      if (approver && a.status === 'terjadwal') {
        aksi += ' <button class="btn btn-outline btn-sm" title="Kirim pengingat ke Telegram/email tiap pimpinan" data-aingat="' + escapeHtml(a.id) + '">' + iconSvg('bell','btn-icon') + ' Ingatkan</button>';
      }
      if (approver) {
        aksi += ' <button class="btn btn-ghost btn-sm" title="Buat agenda serupa" data-adup="' + escapeHtml(a.id) + '">Duplikat</button>';
      }
      return '<tr>' +
        '<td style="white-space:nowrap"><div style="font-weight:600">' + fmtDateShort(a.tanggal) + '</div>' +
        '<div class="text-muted" style="font-size:11.5px">' + fmtTime(a.jam_mulai) + (a.jam_selesai ? '–' + fmtTime(a.jam_selesai) : '') + '</div></td>' +
        '<td><div style="font-weight:600">' + escapeHtml(a.nama_kegiatan) + '</div>' +
        (a.jenis ? '<div class="text-muted" style="font-size:11.5px;text-transform:capitalize">' + escapeHtml(a.jenis) + '</div>' : '') + '</td>' +
        '<td style="font-size:12.5px">' + escapeHtml(a.nama_pimpinan || '—') + '</td>' +
        '<td style="font-size:12.5px">' + escapeHtml(a.lokasi || '—') + '</td>' +
        '<td>' + statusBadge(a.status) + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + aksi + '</td>' +
      '</tr>';
    }).join('');

    $all('[data-adetail]', tbody).forEach(function (b) {
      b.addEventListener('click', function () { AgendaModule.showDetail(b.getAttribute('data-adetail')); });
    });
    $all('[data-aedit]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = AgendaModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-aedit'); });
        if (a) AgendaModule.openForm(a);
      });
    });
    $all('[data-aingat]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true;
        API.call('ingatkanAgenda', { id: b.getAttribute('data-aingat') }).then(function (r) {
          b.disabled = false;
          if (r.success) {
            var gagal = (r.hasil || []).filter(function (h) { return !h.ok; });
            Toast.success('Pengingat dikirim', r.message);
            if (gagal.length) Toast.warning('Sebagian tidak terkirim',
              gagal.map(function (h) { return h.nama + ': ' + (h.info || 'gagal'); }).join(' · '));
          } else Toast.error('Gagal mengirim pengingat', r.error);
        });
      });
    });
    $all('[data-adup]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = AgendaModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-adup'); });
        if (!a) return;
        var salinan = JSON.parse(JSON.stringify(a));
        salinan.id = ''; // simpan sebagai agenda BARU
        AgendaModule.openForm(salinan);
        $('#agdModalTitle').textContent = 'Duplikat Agenda — atur tanggal barunya';
        $('#agdId').value = '';
      });
    });
    $all('[data-adone]', tbody).forEach(function (b) {
      b.addEventListener('click', function () { AgendaModule.setStatus(b.getAttribute('data-adone'), 'selesai', b); });
    });
    $all('[data-abatal]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Batalkan agenda?', 'Agenda akan ditandai batal dan hilang dari kalender.', function () {
          AgendaModule.setStatus(b.getAttribute('data-abatal'), 'batal', b);
        });
      });
    });
  },

  showDetail: function (id) {
    var a = AgendaModule.list.find(function (x) { return String(x.id) === String(id); });
    if (!a) return;
    var pairs = [
      ['Kegiatan', a.nama_kegiatan],
      ['Pimpinan', a.nama_pimpinan || '—'],
      ['Waktu', fmtDateShort(a.tanggal) + ' · ' + fmtTime(a.jam_mulai) + (a.jam_selesai ? '–' + fmtTime(a.jam_selesai) : '')],
      ['Jenis', a.jenis || '—'],
      ['Lokasi', a.lokasi || '—'],
      ['Peserta', a.peserta || '—'],
      ['Status', statusBadge(a.status), { html: true }],
      ['Keterangan', a.keterangan || '—'],
      ['Dibuat oleh', a.created_by || '—']
    ];
    if (a.file_undangan && String(a.file_undangan).indexOf('http') === 0) {
      pairs.push(['Undangan', '<a class="chip" href="' + escapeHtml(a.file_undangan) + '" target="_blank" rel="noopener">' +
        iconSvg('link') + ' Buka file</a>', { html: true }]);
    }
    DetailView.show('Agenda Pimpinan', pairs);
  },

  setStatus: function (id, status, btn) {
    // Audit V7 #3: anti klik-ganda — tombol dinonaktifkan selama proses
    apiKlikSekali(btn, 'updateAgenda', { id: id, status: status }).then(function (r) {
      if (r.success) { Toast.success('Agenda ' + (status === 'selesai' ? 'ditandai selesai' : 'dibatalkan')); AgendaModule.load(); }
      else Toast.error('Gagal', r.error);
    });
  },

  openForm: function (a) {
    $('#agdModalTitle').textContent = a ? 'Edit Agenda' : 'Tambah Agenda';
    $('#agdId').value = a ? a.id : '';
    AgendaModule.renderPimpinanBox(a ? String(a.pimpinan_id || '').split(',').map(function (x) { return x.trim(); }) : []);
    $('#agdKegiatan').value = a ? (a.nama_kegiatan || '') : '';
    $('#agdTanggal').value = a ? String(a.tanggal || '').substring(0, 10) : todayISO();
    /* V7.8: agenda MULTI-HARI — field "Sampai Tanggal" hanya untuk agenda
       BARU (satu isian menjadi satu agenda per hari). Saat edit, tiap hari
       adalah baris tersendiri sehingga field disembunyikan. */
    var ts = $('#agdTanggalSelesai');
    if (ts) { ts.value = ''; }
    var tsWrap = $('#agdTanggalSelesaiWrap');
    if (tsWrap) tsWrap.classList.toggle('hidden', !!(a && a.id));
    $('#agdJenis').value = a ? (a.jenis || 'internal') : 'internal';
    $('#agdJamMulai').value = a ? fmtTime(a.jam_mulai) : '';
    $('#agdJamSelesai').value = a ? fmtTime(a.jam_selesai) : '';
    $('#agdLokasi').value = a ? (a.lokasi || '') : '';
    $('#agdPeserta').value = a ? (a.peserta || '') : '';
    $('#agdKeterangan').value = a ? (a.keterangan || '') : '';
    $('#agdFile').value = '';
    AgendaModule.fileData = '';
    Modal.open('modalAgenda');
  },

  onFile: function () {
    var f = $('#agdFile').files[0];
    AgendaModule.fileData = '';
    if (!f) return;
    if (f.size > 4.5 * 1024 * 1024) {
      Toast.warning('File terlalu besar', 'Maksimal ±4 MB agar tersimpan lancar.');
      $('#agdFile').value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () { AgendaModule.fileData = reader.result; };
    reader.readAsDataURL(f);
  },

  submit: function () {
    var tsEl = $('#agdTanggalSelesai');
    var payload = {
      id: $('#agdId').value || undefined,
      pimpinan_id: AgendaModule.pimpinanTerpilih(),
      nama_kegiatan: $('#agdKegiatan').value.trim(),
      tanggal: $('#agdTanggal').value,
      // V7.8: multi-hari — hanya untuk agenda baru (mode edit tidak memakainya)
      tanggal_selesai: (!$('#agdId').value && tsEl) ? tsEl.value : '',
      jenis: $('#agdJenis').value,
      jam_mulai: $('#agdJamMulai').value,
      jam_selesai: $('#agdJamSelesai').value,
      lokasi: $('#agdLokasi').value.trim(),
      peserta: $('#agdPeserta').value.trim(),
      keterangan: $('#agdKeterangan').value.trim(),
      file_undangan: AgendaModule.fileData || undefined
    };
    if (!payload.pimpinan_id.length || !payload.nama_kegiatan || !payload.tanggal || !payload.jam_mulai) {
      Toast.warning('Lengkapi dulu', 'Minimal satu pimpinan, kegiatan, tanggal & jam mulai wajib diisi.');
      return;
    }
    if (payload.tanggal_selesai) {
      if (payload.tanggal_selesai < payload.tanggal) {
        Toast.warning('Rentang tidak valid', 'Tanggal selesai harus sama atau setelah tanggal mulai.');
        return;
      }
      if ((new Date(payload.tanggal_selesai) - new Date(payload.tanggal)) / 86400000 > 30) {
        Toast.warning('Rentang terlalu panjang', 'Maksimum 31 hari per isian — buat bertahap untuk yang lebih lama.');
        return;
      }
    }
    btnLoading($('#agdSubmit'), $('#agdSubmitText'), true);
    API.call(payload.id ? 'updateAgenda' : 'createAgenda', payload).then(function (r) {
      btnLoading($('#agdSubmit'), $('#agdSubmitText'), false, 'Simpan Agenda');
      if (r.success) {
        Modal.close('modalAgenda');
        Toast.success(r.message || 'Agenda tersimpan');
        if (r.warning) Toast.warning('Cek ketersediaan ruangan', r.warning);
        AgendaModule.load();
      } else Toast.error('Gagal menyimpan', r.error);
    });
  },

  /* — Kalender agenda (pakai getKalenderBulan gabungan, filter agenda saja) — */
  loadKalender: function () {
    API.call('getKalenderBulan', { bulan: AgendaModule.bulan }).then(function (r) {
      if (!r.success) return;
      var all = (r.data && r.data.days) || {};
      var only = {};
      Object.keys(all).forEach(function (tgl) {
        var items = all[tgl].filter(function (e) { return e.tipe === 'agenda'; });
        if (items.length) only[tgl] = items;
      });
      renderMonthCalendar({
        el: '#agdCalendar', bulan: AgendaModule.bulan, days: only,
        onNav: function (b) {
          AgendaModule.bulan = b;
          $('#agdBulan').value = b;
          AgendaModule.load();
        },
        onDayClick: function (tgl, items) {
          if (!items.length) return;
          DetailView.show('Agenda ' + fmtDateShort(tgl), items.map(function (e) {
            return [e.jam || '—', e.nama + (e.sub ? ' · ' + e.sub : '') + (e.lokasi ? ' @ ' + e.lokasi : '')];
          }));
        }
      });
    });
  },

  /* — Kelola master pimpinan (admin) — */
  openPimpinan: function () {
    AgendaModule.resetPimpinanForm();
    AgendaModule.renderPimpinanTable();
    Modal.open('modalPimpinan');
  },
  renderPimpinanTable: function () {
    var tbody = $('#pmpTableBody');
    if (!AgendaModule.pimpinan.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-muted" style="font-size:12.5px;padding:14px">Belum ada data — tambahkan lewat form di bawah.</td></tr>';
      return;
    }
    tbody.innerHTML = AgendaModule.pimpinan.map(function (p) {
      return '<tr><td><div style="display:flex;align-items:center;gap:9px">' +
        avatarHtml(p.foto_thumb || p.foto, p.nama, 34) +
        '<div style="min-width:0"><div style="font-weight:600">' + escapeHtml(p.nama) + '</div>' +
        '<div class="text-muted" style="font-size:11px">' + (p.email ? '&#9993; ' + escapeHtml(p.email) : 'email belum diisi') + '</div></div>' +
        '</div></td>' +
        '<td style="font-size:12.5px">' + escapeHtml(p.jabatan || '—') + '</td>' +
        '<td style="text-align:right"><button class="btn btn-outline btn-sm" data-pedit="' + escapeHtml(p.id) + '">Edit</button></td></tr>';
    }).join('');
    $all('[data-pedit]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = AgendaModule.pimpinan.find(function (x) { return String(x.id) === b.getAttribute('data-pedit'); });
        if (!p) return;
        $('#pmpFormTitle').textContent = 'Edit Pimpinan';
        $('#pmpId').value = p.id;
        $('#pmpNama').value = p.nama || '';
        $('#pmpJabatan').value = p.jabatan || '';
        $('#pmpEmail').value = p.email || '';
        $('#pmpNoHp').value = p.no_hp || '';
        // V6.10: tampilkan foto tersimpan di preview; foto baru belum dipilih
        AgendaModule.fotoData = '';
        AgendaModule.fotoHapus = false;
        AgendaModule.setFotoPreview(driveImgSrc(p.foto_thumb || p.foto, 200), p.nama);
      });
    });
  },

  /* ── V6.10: foto pimpinan (kamera perangkat / galeri) ── */
  setFotoPreview: function (src, nama) {
    var prev = $('#pmpFotoPreview'), hps = $('#pmpFotoHapusBtn');
    if (!prev) return;
    if (src) {
      prev.classList.remove('avatar-inisial');
      prev.innerHTML = '<img alt="" src="' + escapeHtml(src) + '">';
      // Audit V7.2: coba terowongan foto dulu (jaringan yang memblokir Drive);
      // gagal total → kembali ke inisial, bukan ikon gambar rusak.
      var im = prev.querySelector('img');
      if (im) {
        im.setAttribute('data-tw', '200');
        im.setAttribute('data-inisial', String(nama || $('#pmpNama').value || '?').trim()
          .split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0).toUpperCase(); }).join('') || '?');
        im.onerror = function () { fotoTunnelCoba(im, 'inisial'); };
      }
      if (hps) hps.classList.remove('hidden');
    } else {
      prev.classList.add('avatar-inisial');
      var inisial = String(nama || $('#pmpNama').value || '?').trim().split(/\s+/).slice(0, 2)
        .map(function (x) { return x.charAt(0).toUpperCase(); }).join('') || '?';
      prev.textContent = inisial;
      if (hps) hps.classList.add('hidden');
    }
  },
  onFotoPimpinan: function (inp) {
    var f = inp.files && inp.files[0];
    inp.value = ''; // agar memilih file yang sama dua kali tetap memicu change
    if (!f) return;
    if (!/^image\//i.test(f.type || '')) {
      Toast.warning('Bukan gambar', 'Pilih berkas foto (JPG/PNG).');
      return;
    }
    // Kompres di perangkat (maks 900px, kualitas 0.82) — hemat kuota & cepat.
    // compressImage tak pernah reject: gagal = resolve string kosong.
    compressImage(f, 900, 0.82).then(function (dataUrl) {
      if (!dataUrl) {
        Toast.error('Gagal membaca foto', 'Coba ambil ulang atau pilih foto lain.');
        return;
      }
      AgendaModule.fotoData = dataUrl;
      AgendaModule.fotoHapus = false;
      AgendaModule.setFotoPreview(dataUrl);
      Toast.info('Foto siap', 'Klik "Simpan Pimpinan" untuk menyimpan.');
    });
  },
  hapusFotoPimpinan: function () {
    AgendaModule.fotoData = '';
    AgendaModule.fotoHapus = true;
    AgendaModule.setFotoPreview('');
    Toast.info('Foto akan dihapus saat disimpan');
  },

  resetPimpinanForm: function () {
    $('#pmpFormTitle').textContent = 'Tambah Pimpinan';
    $('#pmpId').value = '';
    $('#pmpNama').value = '';
    $('#pmpJabatan').value = '';
    $('#pmpEmail').value = '';
    $('#pmpNoHp').value = '';
    AgendaModule.fotoData = '';
    AgendaModule.fotoHapus = false;
    AgendaModule.setFotoPreview('');
  },
  submitPimpinan: function () {
    var payload = { id: $('#pmpId').value || undefined, nama: $('#pmpNama').value.trim(), jabatan: $('#pmpJabatan').value.trim(),
      email: $('#pmpEmail').value.trim(), no_hp: $('#pmpNoHp').value.trim() };
    if (!payload.nama || !payload.jabatan) { Toast.warning('Nama & jabatan wajib diisi'); return; }
    // V6.10: foto hanya dikirim bila diganti; hapus_foto bila admin menghapusnya
    if (AgendaModule.fotoData) payload.foto = AgendaModule.fotoData;
    else if (AgendaModule.fotoHapus && payload.id) payload.hapus_foto = 1;
    btnLoading($('#pmpSubmit'), $('#pmpSubmitText'), true);
    API.call('savePimpinan', payload).then(function (r) {
      btnLoading($('#pmpSubmit'), $('#pmpSubmitText'), false, 'Simpan Pimpinan');
      if (r.success) {
        Toast.success('Data pimpinan tersimpan');
        AgendaModule.resetPimpinanForm();
        API.call('getPimpinanList').then(function (r2) {
          if (r2.success) {
            AgendaModule.pimpinan = r2.data || [];
            AgendaModule.renderPimpinanTable();
            AgendaModule.renderPimpinanBox([]);
          }
        });
        AgendaModule.loadKetersediaan(); // papan ketersediaan ikut segar (foto/nama baru)
      } else Toast.error('Gagal menyimpan', r.error);
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: KALENDER BUDAYA (Fase 4) — kegiatan rutin + kalender gabungan
   ══════════════════════════════════════════════════════════════════════════ */
var BudayaModule = {
  list: [],
  bulan: '',
  RECURRING_LABEL: { harian: 'Harian (hari kerja)', mingguan: 'Mingguan', bulanan: 'Bulanan', sekali: 'Sekali' },

  init: function () {
    BudayaModule.bulan = thisMonthISO();
    $('#bdyRefreshBtn').addEventListener('click', function () { BudayaModule.load(); Toast.info('Kalender dimuat ulang'); });
    var add = $('#bdyAddBtn');
    if (add) add.addEventListener('click', function () { BudayaModule.openForm(null); });
    $('#bdyRecurring').addEventListener('change', BudayaModule.onRecurringChange);
    $('#bdySubmit').addEventListener('click', BudayaModule.submit);
    initTabs('#bdyTabs', '[data-view-panel="budaya"]');
  },

  load: function () {
    BudayaModule.loadKalender();
    BudayaModule.loadHariIni();
    BudayaModule.loadStats();
    API.call('getKalenderBudaya', { semua: 1 }).then(function (r) {
      if (r.success) { BudayaModule.list = r.data || []; BudayaModule.renderTable(); }
      else Toast.error('Gagal memuat kegiatan', r.error);
    });
  },

  /* Kegiatan HARI INI + tombol catat terlaksana — dari jadwal menjadi akuntabilitas */
  loadHariIni: function () {
    var el = $('#bdyHariIni');
    if (!el) return;
    API.call('getBudayaHariIni').then(function (r) {
      if (!r.success) { el.innerHTML = ''; return; }
      var rows = r.data || [];
      var html = '<div class="card"><div class="card-header"><div class="card-title">' + iconSvg('star') +
        ' Kegiatan Hari Ini</div><span class="text-muted" style="font-size:12px" id="bdyKetChip"></span></div><div class="card-body">';
      if (!rows.length) {
        html += '<div class="text-muted" style="font-size:12.5px">Tidak ada kegiatan rutin yang jatuh hari ini.</div>';
      } else {
        html += rows.map(function (k) {
          var status = '';
          if (k.log_status === 'terlaksana') {
            status = '<span class="badge badge-done">Terlaksana</span>' +
              (k.log_oleh ? ' <span class="text-muted" style="font-size:11px">oleh ' + escapeHtml(k.log_oleh) + '</span>' : '');
          } else if (k.log_status === 'tidak') {
            status = '<span class="badge badge-cancelled">Tidak terlaksana</span>' +
              (k.log_catatan ? ' <span class="text-muted" style="font-size:11px">' + escapeHtml(k.log_catatan) + '</span>' : '');
          } else {
            status = '<button class="btn btn-success btn-sm" data-blaks="' + escapeHtml(k.id) + '">' + iconSvg('check','btn-icon') + ' Terlaksana</button> ' +
              '<button class="btn btn-outline btn-sm" data-btidak="' + escapeHtml(k.id) + '">' + iconSvg('x','btn-icon') + ' Tidak</button>';
          }
          return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;' +
            'padding:8px 0;border-bottom:1px solid var(--border)">' +
            '<div><b>' + (k.jam || '—') + '</b> ' + escapeHtml(k.nama) +
            (k.pj ? ' <span class="text-muted" style="font-size:11.5px">· PJ: ' + escapeHtml(k.pj) + '</span>' : '') + '</div>' +
            '<div style="white-space:nowrap">' + status + '</div></div>';
        }).join('');
      }
      html += '</div></div>';
      el.innerHTML = html;
      $all('[data-blaks]', el).forEach(function (b) {
        b.addEventListener('click', function () { BudayaModule.catat(b.getAttribute('data-blaks'), 'terlaksana', '', b); });
      });
      $all('[data-btidak]', el).forEach(function (b) {
        b.addEventListener('click', function () {
          var alasan = prompt('Kenapa tidak terlaksana? (opsional)') || '';
          BudayaModule.catat(b.getAttribute('data-btidak'), 'tidak', alasan, b);
        });
      });
      BudayaModule.loadStats();
    });
  },

  catat: function (id, status, catatan, btn) {
    // Audit V7 #3: anti klik-ganda
    apiKlikSekali(btn, 'catatBudayaLog', { budaya_id: id, status: status, catatan: catatan }).then(function (r) {
      if (r.success) { Toast.success(r.message || 'Tercatat'); BudayaModule.loadHariIni(); }
      else Toast.error('Gagal mencatat', r.error);
    });
  },

  loadStats: function () {
    API.call('getBudayaStats', { bulan: thisMonthISO() }).then(function (r) {
      var chip = $('#bdyKetChip');
      if (!r.success || !chip) return;
      var d = r.data || {};
      if (!d.target) { chip.textContent = ''; return; }
      var terlewat = (d.per_kegiatan && d.per_kegiatan.length && d.per_kegiatan[0].persen < 100)
        ? ' · paling sering terlewat: ' + d.per_kegiatan[0].nama + ' (' + d.per_kegiatan[0].persen + '%)'
        : '';
      chip.textContent = 'Keterlaksanaan bulan ini: ' + d.persen + '% (' + d.terlaksana + '/' + d.target + ')' + terlewat;
    });
  },

  loadKalender: function () {
    API.call('getKalenderBulan', { bulan: BudayaModule.bulan }).then(function (r) {
      if (!r.success) { Toast.error('Gagal memuat kalender', r.error); return; }
      renderMonthCalendar({
        el: '#bdyCalendar', bulan: BudayaModule.bulan,
        days: (r.data && r.data.days) || {},
        onNav: function (b) { BudayaModule.bulan = b; BudayaModule.loadKalender(); },
        onDayClick: function (tgl, items) {
          if (!items.length) return;
          DetailView.show('Kegiatan ' + fmtDateShort(tgl), items.map(function (e) {
            return [e.jam || '—', (e.tipe === 'agenda' ? '[Agenda] ' : '') + e.nama +
              (e.sub ? ' · ' + e.sub : '') + (e.lokasi ? ' @ ' + e.lokasi : '')];
          }));
        }
      });
    });
  },

  renderTable: function () {
    var tbody = $('#bdyTableBody');
    if (!BudayaModule.list.length) {
      tbody.innerHTML = emptyRow(6, 'star', 'Belum ada kegiatan budaya',
        'Tambahkan kegiatan rutin seperti doa pagi, senam, atau briefing.');
      renderIcons(tbody);
      return;
    }
    var approver = isApprover();
    tbody.innerHTML = BudayaModule.list.map(function (k) {
      var pola = BudayaModule.RECURRING_LABEL[k.recurring] || k.recurring;
      if (k.recurring === 'mingguan') pola += ' · ' + (k.recurring_day || '');
      if (k.recurring === 'bulanan') pola += ' · tgl ' + (k.recurring_day || '');
      if (k.recurring === 'sekali') pola += ' · ' + fmtDateShort(k.tanggal);
      var aksi = approver
        ? '<button class="btn btn-outline btn-sm" data-bedit="' + escapeHtml(k.id) + '">Edit</button>' +
          ' <button class="btn btn-ghost btn-sm" data-btoggle="' + escapeHtml(k.id) + '">' + (isStatusAktifJs(k.status) ? 'Nonaktifkan' : 'Aktifkan') + '</button>' +
          ' <button class="btn btn-danger btn-sm" data-bdel="' + escapeHtml(k.id) + '">Hapus</button>'
        : '<span class="text-muted" style="font-size:12px">—</span>';
      return '<tr>' +
        '<td><div style="font-weight:600">' + escapeHtml(k.nama_kegiatan) + '</div>' +
        (k.lokasi ? '<div class="text-muted" style="font-size:11.5px">' + escapeHtml(k.lokasi) + '</div>' : '') + '</td>' +
        '<td style="font-size:12.5px">' + escapeHtml(pola) + '</td>' +
        '<td style="font-size:12.5px">' + (k.jam ? fmtTime(k.jam) : '—') + '</td>' +
        '<td style="font-size:12.5px">' + escapeHtml(k.penanggung_jawab || '—') + '</td>' +
        '<td>' + statusBadge(k.status || 'active') + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + aksi + '</td>' +
      '</tr>';
    }).join('');

    $all('[data-bedit]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = BudayaModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-bedit'); });
        if (k) BudayaModule.openForm(k);
      });
    });
    $all('[data-btoggle]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = BudayaModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-btoggle'); });
        if (!k) return;
        var baru = isStatusAktifJs(k.status) ? 'nonaktif' : 'active';
        apiKlikSekali(b, 'updateKalenderBudaya', { id: k.id, status: baru }).then(function (r) {
          if (r.success) { Toast.success(baru === 'active' ? 'Kegiatan diaktifkan' : 'Kegiatan dinonaktifkan'); BudayaModule.load(); }
          else Toast.error('Gagal', r.error);
        });
      });
    });
    $all('[data-bdel]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Hapus kegiatan?', 'Kegiatan hilang permanen dari kalender.', function () {
          apiKlikSekali(b, 'deleteKalenderBudaya', { id: b.getAttribute('data-bdel') }).then(function (r) {
            if (r.success) { Toast.success('Kegiatan dihapus'); BudayaModule.load(); }
            else Toast.error('Gagal menghapus', r.error);
          });
        });
      });
    });
  },

  onRecurringChange: function () {
    var v = $('#bdyRecurring').value;
    $('#bdyHariWrap').style.display = v === 'mingguan' ? '' : 'none';
    $('#bdyTglBulananWrap').style.display = v === 'bulanan' ? '' : 'none';
    $('#bdyTglWrap').style.display = v === 'sekali' ? '' : 'none';
  },

  openForm: function (k) {
    $('#bdyModalTitle').textContent = k ? 'Edit Kegiatan Budaya' : 'Tambah Kegiatan Budaya';
    $('#bdyId').value = k ? k.id : '';
    $('#bdyKegiatan').value = k ? (k.nama_kegiatan || '') : '';
    $('#bdyRecurring').value = k ? (k.recurring || 'harian') : 'harian';
    $('#bdyHari').value = (k && k.recurring === 'mingguan' && k.recurring_day) ? k.recurring_day : 'Senin';
    $('#bdyTglBulanan').value = (k && k.recurring === 'bulanan') ? (k.recurring_day || '') : '';
    $('#bdyTanggal').value = (k && k.recurring === 'sekali') ? String(k.tanggal || '').substring(0, 10) : '';
    $('#bdyJam').value = k ? fmtTime(k.jam) : '';
    $('#bdyWarna').value = k ? (k.warna || 'teal') : 'teal';
    $('#bdyLokasi').value = k ? (k.lokasi || '') : '';
    $('#bdyPJ').value = k ? (k.penanggung_jawab || '') : '';
    $('#bdyCatatan').value = k ? (k.catatan || '') : '';
    BudayaModule.onRecurringChange();
    Modal.open('modalBudaya');
  },

  submit: function () {
    var rec = $('#bdyRecurring').value;
    var payload = {
      id: $('#bdyId').value || undefined,
      nama_kegiatan: $('#bdyKegiatan').value.trim(),
      recurring: rec,
      recurring_day: rec === 'mingguan' ? $('#bdyHari').value : rec === 'bulanan' ? $('#bdyTglBulanan').value : '',
      tanggal: rec === 'sekali' ? $('#bdyTanggal').value : '',
      jam: $('#bdyJam').value,
      warna: $('#bdyWarna').value,
      lokasi: $('#bdyLokasi').value.trim(),
      penanggung_jawab: $('#bdyPJ').value.trim(),
      catatan: $('#bdyCatatan').value.trim()
    };
    if (!payload.nama_kegiatan) { Toast.warning('Isi nama kegiatan'); return; }
    if (rec === 'mingguan' && !payload.recurring_day) { Toast.warning('Pilih hari'); return; }
    if (rec === 'bulanan' && !payload.recurring_day) { Toast.warning('Isi tanggal bulanan (1–31)'); return; }
    if (rec === 'sekali' && !payload.tanggal) { Toast.warning('Isi tanggal kegiatan'); return; }
    btnLoading($('#bdySubmit'), $('#bdySubmitText'), true);
    API.call(payload.id ? 'updateKalenderBudaya' : 'createKalenderBudaya', payload).then(function (r) {
      btnLoading($('#bdySubmit'), $('#bdySubmitText'), false, 'Simpan Kegiatan');
      if (r.success) {
        Modal.close('modalBudaya');
        Toast.success(r.message || 'Kegiatan tersimpan');
        BudayaModule.load();
      } else Toast.error('Gagal menyimpan', r.error);
    });
  }
};


/* ══════════════════════════════════════════════════════════════════════════
   MODUL: KONTEN SOSMED (Fase 4) — rencana, kalender, metrik & export
   ══════════════════════════════════════════════════════════════════════════ */
var SosmedModule = {
  list: [],
  bulan: '',
  PLATFORMS: ['Instagram', 'Facebook', 'TikTok', 'X/Twitter', 'YouTube', 'WhatsApp Channel'],

  init: function () {
    SosmedModule.bulan = thisMonthISO();
    $('#ssmBulan').value = SosmedModule.bulan;
    $('#ssmRefreshBtn').addEventListener('click', function () { SosmedModule.load(); Toast.info('Konten dimuat ulang'); });
    $('#ssmAddBtn').addEventListener('click', function () { SosmedModule.openForm(null); });
    $('#ssmExportBtn').addEventListener('click', SosmedModule.exportCsv);
    $('#ssmBulan').addEventListener('change', function () {
      SosmedModule.bulan = $('#ssmBulan').value || thisMonthISO();
      SosmedModule.load();
    });
    $('#ssmFilterPlatform').addEventListener('change', SosmedModule.renderTable);
    $('#ssmFilterStatus').addEventListener('change', SosmedModule.renderTable);
    $('#ssmFilterPlatform').innerHTML = '<option value="">Semua Platform</option>' +
      SosmedModule.PLATFORMS.map(function (p) { return '<option>' + p + '</option>'; }).join('');
    $('#ktnPlatform').innerHTML = SosmedModule.PLATFORMS.map(function (p) { return '<option>' + p + '</option>'; }).join('');
    $('#ktnSubmit').addEventListener('click', SosmedModule.submit);
    $('#mtrSubmit').addEventListener('click', SosmedModule.submitMetrik);
    initTabs('#ssmTabs', '[data-view-panel="sosmed"]');
  },

  load: function () {
    API.call('getKontenSosmed', { bulan: SosmedModule.bulan }).then(function (r) {
      if (r.success) {
        SosmedModule.list = r.data || [];
        SosmedModule.renderTable();
        SosmedModule.renderKalender();
      } else Toast.error('Gagal memuat konten', r.error);
    });
    API.call('getSosmedStats', { bulan: SosmedModule.bulan }).then(function (r) {
      if (!r.success) return;
      var d = r.data || {};
      $('#ssmStats').innerHTML = [
        statCardHtml({ cls: 'stat-teal',   icon: 'megaphone', val: d.total,       label: 'Konten Bulan Ini' }),
        statCardHtml({ cls: 'stat-blue',   icon: 'rocket',    val: d.tayang,      label: 'Sudah Tayang' }),
        statCardHtml({ cls: 'stat-amber',  icon: 'clock',     val: (d.draft || 0) + (d.dijadwalkan || 0), label: 'Draft & Terjadwal' }),
        statCardHtml({ cls: (d.terlambat || 0) > 0 ? 'stat-rose' : 'stat-teal', icon: 'alert', val: d.terlambat || 0, label: 'Terlambat Tayang' }),
        statCardHtml({ cls: 'stat-violet', icon: 'chart',     val: (d.rata_er || 0) + '%', label: 'Rata-rata Engagement' })
      ].join('');
      renderIcons($('#ssmStats'));
      SosmedModule.renderSorot(d);
    });
  },

  /* Sorotan: tunggakan pipeline + konten berkinerja terbaik bulan ini */
  renderSorot: function (d) {
    var el = $('#ssmSorot');
    if (!el) return;
    var potongan = [];
    if ((d.terlambat || 0) > 0 || (d.due_hari_ini || 0) > 0) {
      var teks = [];
      if (d.terlambat) teks.push('<b>' + d.terlambat + ' konten terlambat</b> (lewat tanggal, belum tayang)');
      if (d.due_hari_ini) teks.push('<b>' + d.due_hari_ini + ' konten jatuh tempo hari ini</b>');
      potongan.push('<div class="pd-insight neg"><span class="ic">' + iconSvg('alert') + '</span><div>' +
        teks.join(' · ') + ' — tandai tayang lewat tombol <b>Metrik</b> atau geser tanggalnya.</div></div>');
    }
    if (d.terbaik) {
      potongan.push('<div class="pd-insight pos"><span class="ic">' + iconSvg('award') + '</span><div>' +
        'Konten terbaik bulan ini: <b>[' + escapeHtml(d.terbaik.platform) + ']</b> &#8220;' +
        escapeHtml(d.terbaik.caption) + '&#8230;&#8221; — ER <b>' + d.terbaik.er + '%</b> (reach ' +
        d.terbaik.reach + '). Pelajari polanya untuk konten berikutnya.</div></div>');
    }
    el.innerHTML = potongan.join('');
    renderIcons(el);
  },

  renderTable: function () {
    var fp = $('#ssmFilterPlatform').value, fs = $('#ssmFilterStatus').value;
    var rows = SosmedModule.list.filter(function (k) {
      return (!fp || k.platform === fp) && (!fs || String(k.status) === fs);
    });
    var tbody = $('#ssmTableBody');
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'megaphone', 'Belum ada konten',
        'Klik "Rencanakan Konten" untuk menyusun kalender posting.');
      renderIcons(tbody);
      return;
    }
    var approver = isApprover();
    var me = (Auth.user && (Auth.user.nama || Auth.user.username)) || '';
    tbody.innerHTML = rows.map(function (k) {
      var boleh = approver || String(k.created_by) === String(me);
      var performa = String(k.status) === 'tayang'
        ? '<span class="er-badge">ER ' + (k.er || 0) + '%</span>' +
          '<div class="text-muted" style="font-size:11px;margin-top:2px">' +
          (k.likes || 0) + ' like · ' + (k.comments || 0) + ' komen · reach ' + (k.reach || 0) + '</div>'
        : '<span class="text-muted" style="font-size:12px">—</span>';
      var aksi = '<button class="btn btn-ghost btn-sm" data-sdet="' + escapeHtml(k.id) + '">Detail</button>' +
                 ' <button class="btn btn-ghost btn-sm" title="Salin caption + hashtag untuk diposting" data-ssalin="' + escapeHtml(k.id) + '">Salin</button>';
      if (boleh) {
        if (String(k.status) === 'draft') {
          aksi += ' <button class="btn btn-outline btn-sm" title="Tandai siap tayang sesuai jadwal" data-sjadwal="' + escapeHtml(k.id) + '">&#8594; Jadwalkan</button>';
        }
        aksi += ' <button class="btn btn-outline btn-sm" data-sedit="' + escapeHtml(k.id) + '">Edit</button>' +
                ' <button class="btn btn-success btn-sm" data-smetrik="' + escapeHtml(k.id) + '">Metrik</button>' +
                ' <button class="btn btn-danger btn-sm" data-sdel="' + escapeHtml(k.id) + '">Hapus</button>';
      }
      var telat = String(k.tanggal).substring(0, 10) < todayISO() &&
        ['draft', 'dijadwalkan'].indexOf(String(k.status)) !== -1;
      return '<tr>' +
        '<td style="white-space:nowrap;font-size:12.5px">' + fmtDateShort(k.tanggal) +
        (k.jadwal_posting ? '<div class="text-muted" style="font-size:11px">' + fmtTime(k.jadwal_posting) + '</div>' : '') +
        (telat ? '<div style="font-size:10.5px;font-weight:700;color:var(--danger)">' + iconSvg('alert') + ' terlambat</div>' : '') + '</td>' +
        '<td style="font-size:12.5px">' + escapeHtml(k.platform) +
        '<div class="text-muted" style="font-size:11px;text-transform:capitalize">' + escapeHtml(k.jenis_konten || '') + '</div></td>' +
        '<td style="max-width:280px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500" title="' +
          escapeHtml(k.caption || '') + '">' + escapeHtml(k.caption || '') + '</div></td>' +
        '<td>' + statusBadge(k.status) + '</td>' +
        '<td>' + performa + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + aksi + '</td>' +
      '</tr>';
    }).join('');

    $all('[data-sdet]', tbody).forEach(function (b) {
      b.addEventListener('click', function () { SosmedModule.showDetail(b.getAttribute('data-sdet')); });
    });
    $all('[data-ssalin]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = SosmedModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-ssalin'); });
        if (!k) return;
        AgendaModule.salinTeks(String(k.caption || '') + (k.hashtags ? '\n\n' + k.hashtags : ''));
      });
    });
    $all('[data-sjadwal]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        apiKlikSekali(b, 'updateKontenSosmed', { id: b.getAttribute('data-sjadwal'), status: 'dijadwalkan' }).then(function (r) {
          if (r.success) { Toast.success('Konten dijadwalkan'); SosmedModule.load(); }
          else Toast.error('Gagal', r.error);
        });
      });
    });
    $all('[data-sedit]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = SosmedModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-sedit'); });
        if (k) SosmedModule.openForm(k);
      });
    });
    $all('[data-smetrik]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = SosmedModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-smetrik'); });
        if (k) SosmedModule.openMetrik(k);
      });
    });
    $all('[data-sdel]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Hapus konten?', 'Rencana konten hilang permanen.', function () {
          API.call('deleteKontenSosmed', { id: b.getAttribute('data-sdel') }).then(function (r) {
            if (r.success) { Toast.success('Konten dihapus'); SosmedModule.load(); }
            else Toast.error('Gagal menghapus', r.error);
          });
        });
      });
    });
  },

  showDetail: function (id) {
    var k = SosmedModule.list.find(function (x) { return String(x.id) === String(id); });
    if (!k) return;
    var pairs = [
      ['Platform', k.platform + (k.jenis_konten ? ' · ' + k.jenis_konten : '')],
      ['Jadwal', fmtDateShort(k.tanggal) + (k.jadwal_posting ? ' · ' + fmtTime(k.jadwal_posting) : '')],
      ['Status', statusBadge(k.status), { html: true }],
      ['Caption', k.caption || '—'],
      ['Hashtags', k.hashtags || '—'],
      ['Dibuat oleh', k.created_by || '—']
    ];
    if (k.media_url && String(k.media_url).indexOf('http') === 0) {
      pairs.push(['Media', '<a class="chip" href="' + escapeHtml(k.media_url) + '" target="_blank" rel="noopener">' +
        iconSvg('link') + ' Buka aset</a>', { html: true }]);
    }
    if (String(k.status) === 'tayang') {
      pairs.push(['Performa', (k.likes || 0) + ' likes · ' + (k.comments || 0) + ' komentar · ' +
        (k.shares || 0) + ' share · reach ' + (k.reach || 0) + ' · ER ' + (k.er || 0) + '%']);
    }
    DetailView.show('Konten Sosmed', pairs);
  },

  openForm: function (k) {
    $('#ktnModalTitle').textContent = k ? 'Edit Konten' : 'Rencanakan Konten';
    $('#ktnId').value = k ? k.id : '';
    $('#ktnTanggal').value = k ? String(k.tanggal || '').substring(0, 10) : todayISO();
    $('#ktnJam').value = k ? fmtTime(k.jadwal_posting) : '';
    $('#ktnPlatform').value = k ? (k.platform || 'Instagram') : 'Instagram';
    $('#ktnJenis').value = k ? (k.jenis_konten || 'feed') : 'feed';
    $('#ktnCaption').value = k ? (k.caption || '') : '';
    $('#ktnHashtags').value = k ? (k.hashtags || '') : '';
    $('#ktnMedia').value = k ? (k.media_url || '') : '';
    $('#ktnStatus').value = k ? (k.status || 'draft') : 'draft';
    Modal.open('modalKonten');
  },

  submit: function () {
    var payload = {
      id: $('#ktnId').value || undefined,
      tanggal: $('#ktnTanggal').value,
      jadwal_posting: $('#ktnJam').value,
      platform: $('#ktnPlatform').value,
      jenis_konten: $('#ktnJenis').value,
      caption: $('#ktnCaption').value.trim(),
      hashtags: $('#ktnHashtags').value.trim(),
      media_url: $('#ktnMedia').value.trim(),
      status: $('#ktnStatus').value
    };
    if (!payload.tanggal || !payload.caption) { Toast.warning('Tanggal & caption wajib diisi'); return; }
    btnLoading($('#ktnSubmit'), $('#ktnSubmitText'), true);
    API.call(payload.id ? 'updateKontenSosmed' : 'createKontenSosmed', payload).then(function (r) {
      btnLoading($('#ktnSubmit'), $('#ktnSubmitText'), false, 'Simpan Konten');
      if (r.success) {
        Modal.close('modalKonten');
        Toast.success(r.message || 'Konten tersimpan');
        SosmedModule.load();
      } else Toast.error('Gagal menyimpan', r.error);
    });
  },

  openMetrik: function (k) {
    $('#mtrId').value = k.id;
    $('#mtrInfo').innerHTML = '<b>' + escapeHtml(k.platform) + '</b> · ' + fmtDateShort(k.tanggal) +
      '<br><span style="opacity:.8">' + escapeHtml(String(k.caption || '').substring(0, 90)) + '</span>' +
      '<br>Isi angka dari insight platform — status konten otomatis menjadi <b>tayang</b>.';
    $('#mtrLikes').value = k.likes || '';
    $('#mtrComments').value = k.comments || '';
    $('#mtrShares').value = k.shares || '';
    $('#mtrReach').value = k.reach || '';
    Modal.open('modalMetrik');
  },

  submitMetrik: function () {
    btnLoading($('#mtrSubmit'), $('#mtrSubmitText'), true);
    API.call('updateMetrikSosmed', {
      id: $('#mtrId').value,
      likes: $('#mtrLikes').value, comments: $('#mtrComments').value,
      shares: $('#mtrShares').value, reach: $('#mtrReach').value
    }).then(function (r) {
      btnLoading($('#mtrSubmit'), $('#mtrSubmitText'), false, 'Simpan Metrik');
      if (r.success) {
        Modal.close('modalMetrik');
        Toast.success('Metrik tersimpan');
        SosmedModule.load();
      } else Toast.error('Gagal menyimpan', r.error);
    });
  },

  renderKalender: function () {
    var days = {};
    var WARNA_PF = { Instagram: 'rose', Facebook: 'blue', TikTok: 'violet', 'X/Twitter': 'teal', YouTube: 'rose', 'WhatsApp Channel': 'teal' };
    SosmedModule.list.forEach(function (k) {
      if (String(k.status) === 'batal') return;
      var tgl = String(k.tanggal || '').substring(0, 10);
      if (tgl.indexOf(SosmedModule.bulan) !== 0) return;
      (days[tgl] = days[tgl] || []).push({
        nama: k.platform + ': ' + String(k.caption || '').substring(0, 24),
        jam: fmtTime(k.jadwal_posting), warna: WARNA_PF[k.platform] || 'amber'
      });
    });
    renderMonthCalendar({
      el: '#ssmCalendar', bulan: SosmedModule.bulan, days: days,
      onNav: function (b) {
        SosmedModule.bulan = b;
        $('#ssmBulan').value = b;
        SosmedModule.load();
      },
      onDayClick: function (tgl, items) {
        if (!items.length) return;
        DetailView.show('Konten ' + fmtDateShort(tgl), items.map(function (e) {
          return [e.jam || '—', e.nama];
        }));
      }
    });
  },

  exportCsv: function () {
    if (!SosmedModule.list.length) { Toast.warning('Belum ada data untuk diekspor'); return; }
    var header = ['Tanggal', 'Platform', 'Jenis', 'Caption', 'Hashtags', 'Status', 'Likes', 'Komentar', 'Shares', 'Reach', 'ER %', 'Dibuat oleh'];
    var rows = SosmedModule.list.map(function (k) {
      return [k.tanggal, k.platform, k.jenis_konten, k.caption, k.hashtags, k.status,
              k.likes || 0, k.comments || 0, k.shares || 0, k.reach || 0, k.er || 0, k.created_by];
    });
    downloadCSV('konten-sosmed-' + SosmedModule.bulan + '.csv', header, rows);
    Toast.success('CSV terunduh');
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: MONITORING BERITA (Fase 4) — pencatatan, sentimen & export
   ══════════════════════════════════════════════════════════════════════════ */
var BeritaModule = {
  list: [],
  bulan: '',

  init: function () {
    BeritaModule.bulan = thisMonthISO();
    $('#brtBulan').value = BeritaModule.bulan;
    $('#brtRefreshBtn').addEventListener('click', function () { BeritaModule.load(); Toast.info('Data berita dimuat ulang'); });
    $('#brtAddBtn').addEventListener('click', function () { BeritaModule.openForm(null); });
    $('#brtExportBtn').addEventListener('click', BeritaModule.exportCsv);
    $('#brtBulan').addEventListener('change', function () {
      BeritaModule.bulan = $('#brtBulan').value || thisMonthISO();
      BeritaModule.load();
    });
    $('#brtFilterSentimen').addEventListener('change', BeritaModule.renderTable);
    $('#brtSubmit').addEventListener('click', BeritaModule.submit);
    $('#tlSubmit').addEventListener('click', BeritaModule.submitTindakLanjut);
  },

  load: function () {
    API.call('getBerita', { bulan: BeritaModule.bulan }).then(function (r) {
      if (r.success) { BeritaModule.list = r.data || []; BeritaModule.renderTable(); }
      else Toast.error('Gagal memuat berita', r.error);
    });
    API.call('getBeritaStats', { bulan: BeritaModule.bulan }).then(function (r) {
      if (!r.success) return;
      var d = r.data || {};
      $('#brtStats').innerHTML = [
        statCardHtml({ cls: 'stat-teal',  icon: 'news',  val: d.total,   label: 'Pemberitaan Bulan Ini' }),
        statCardHtml({ cls: 'stat-blue',  icon: 'check', val: d.positif, label: 'Sentimen Positif' }),
        statCardHtml({ cls: 'stat-amber', icon: 'alert', val: d.negatif, label: 'Sentimen Negatif' }),
        statCardHtml({ cls: (d.negatif_open || 0) > 0 ? 'stat-rose' : 'stat-teal', icon: 'shield',
          val: d.negatif_open || 0, label: 'Negatif Belum Ditindaklanjuti' })
      ].join('');
      renderIcons($('#brtStats'));
    });
  },

  sentimenBadge: function (s) {
    s = String(s || 'netral').toLowerCase();
    var cls = s === 'positif' ? 'badge-done' : s === 'negatif' ? 'badge-cancelled' : 'badge-neutral';
    var lbl = s.charAt(0).toUpperCase() + s.slice(1);
    return '<span class="badge ' + cls + '">' + lbl + '</span>';
  },

  /* Status penanganan pemberitaan (loop tindak lanjut V6.3) */
  penangananBadge: function (st) {
    st = String(st || 'tercatat').toLowerCase();
    if (st === 'selesai') return '<span class="badge badge-done">Selesai</span>';
    if (st === 'proses') return '<span class="badge badge-pending">Proses</span>';
    return '<span class="badge badge-neutral">Tercatat</span>';
  },

  renderTable: function () {
    var f = $('#brtFilterSentimen').value;
    var rows = BeritaModule.list.filter(function (b) { return !f || String(b.sentimen) === f; });
    var tbody = $('#brtTableBody');
    if (!rows.length) {
      tbody.innerHTML = emptyRow(6, 'news', 'Belum ada pemberitaan',
        'Catat setiap pemberitaan media tentang kantor untuk arsip & analisis.');
      renderIcons(tbody);
      return;
    }
    tbody.innerHTML = rows.map(function (b) {
      var link = b.link && String(b.link).indexOf('http') === 0
        ? '<a class="chip" href="' + escapeHtml(b.link) + '" target="_blank" rel="noopener">' + iconSvg('link') + ' Buka</a>'
        : '<span class="text-muted" style="font-size:12px">—</span>';
      return '<tr>' +
        '<td style="white-space:nowrap;font-size:12.5px">' + fmtDateShort(b.tanggal_tayang) + '</td>' +
        '<td style="font-size:12.5px"><div style="font-weight:600">' + escapeHtml(b.media) + '</div>' +
        '<div class="text-muted" style="font-size:11px;text-transform:capitalize">' + escapeHtml(b.jenis_media || '') + '</div></td>' +
        '<td style="max-width:300px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500" title="' +
          escapeHtml(b.judul || '') + '">' + escapeHtml(b.judul || '') + '</div>' +
        (b.kategori ? '<div class="text-muted" style="font-size:11px">' + escapeHtml(b.kategori) + '</div>' : '') + '</td>' +
        '<td>' + BeritaModule.sentimenBadge(b.sentimen) +
          (String(b.sentimen).toLowerCase() === 'negatif'
            ? '<div style="margin-top:4px">' + BeritaModule.penangananBadge(b.status) + '</div>' : '') + '</td>' +
        '<td>' + link + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' + (function () {
          var boleh = isApprover() || String(b.input_by) === String((Auth.user && (Auth.user.nama || Auth.user.username)) || '');
          var a = '<button class="btn btn-ghost btn-sm" data-ndet="' + escapeHtml(b.id) + '">Detail</button>';
          if (String(b.sentimen).toLowerCase() === 'negatif' && String(b.status || 'tercatat') !== 'selesai' && boleh) {
            a += ' <button class="btn btn-primary btn-sm" data-ntl="' + escapeHtml(b.id) + '">Tindak Lanjut</button>';
          }
          if (boleh) {
            a += ' <button class="btn btn-outline btn-sm" data-nedit="' + escapeHtml(b.id) + '">Edit</button>' +
                 ' <button class="btn btn-danger btn-sm" data-ndel="' + escapeHtml(b.id) + '">Hapus</button>';
          }
          return a;
        })() + '</td>' +
      '</tr>';
    }).join('');
    renderIcons(tbody);

    $all('[data-ndet]', tbody).forEach(function (b) {
      b.addEventListener('click', function () { BeritaModule.showDetail(b.getAttribute('data-ndet')); });
    });
    $all('[data-ntl]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var n = BeritaModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-ntl'); });
        if (n) BeritaModule.openTindakLanjut(n);
      });
    });
    $all('[data-nedit]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        var n = BeritaModule.list.find(function (x) { return String(x.id) === b.getAttribute('data-nedit'); });
        if (n) BeritaModule.openForm(n);
      });
    });
    $all('[data-ndel]', tbody).forEach(function (b) {
      b.addEventListener('click', function () {
        Confirm.ask('Hapus pemberitaan?', 'Catatan hilang permanen dari arsip.', function () {
          apiKlikSekali(b, 'deleteBerita', { id: b.getAttribute('data-ndel') }).then(function (r) {
            if (r.success) { Toast.success('Pemberitaan dihapus'); BeritaModule.load(); }
            else Toast.error('Gagal menghapus', r.error);
          });
        });
      });
    });
  },

  showDetail: function (id) {
    var b = BeritaModule.list.find(function (x) { return String(x.id) === String(id); });
    if (!b) return;
    var pairs = [
      ['Media', b.media + (b.jenis_media ? ' · ' + b.jenis_media : '')],
      ['Tanggal Tayang', fmtDateShort(b.tanggal_tayang)],
      ['Judul', b.judul],
      ['Sentimen', BeritaModule.sentimenBadge(b.sentimen), { html: true }],
      ['Kategori', b.kategori || '—'],
      ['Ringkasan', b.ringkasan || '—'],
      ['Penanganan', BeritaModule.penangananBadge(b.status), { html: true }],
      ['Catatan Tindak Lanjut', b.catatan || '—'],
      ['PIC', b.pic || '—'],
      ['Dicatat oleh', b.input_by || '—']
    ];
    if (b.link && String(b.link).indexOf('http') === 0) {
      pairs.push(['Link', '<a class="chip" href="' + escapeHtml(b.link) + '" target="_blank" rel="noopener">' +
        iconSvg('link') + ' Buka berita</a>', { html: true }]);
    }
    DetailView.show('Pemberitaan Media', pairs);
  },

  openTindakLanjut: function (b) {
    $('#tlId').value = b.id;
    $('#tlInfo').innerHTML = '<span class="ic">' + iconSvg('news') + '</span><div><b>' +
      escapeHtml(b.judul || '') + '</b><br><span style="color:var(--text-secondary)">' +
      escapeHtml(b.media || '') + ' · ' + fmtDateShort(b.tanggal_tayang) + '</span></div>';
    $('#tlStatus').value = ['proses', 'selesai'].indexOf(String(b.status)) !== -1 ? String(b.status) : 'proses';
    $('#tlCatatan').value = b.catatan || '';
    Modal.open('modalTindakLanjut');
  },

  submitTindakLanjut: function () {
    var payload = { id: $('#tlId').value, status: $('#tlStatus').value, catatan: $('#tlCatatan').value.trim() };
    if (!payload.id) return;
    btnLoading($('#tlSubmit'), $('#tlSubmitText'), true);
    API.call('updateBerita', payload).then(function (r) {
      btnLoading($('#tlSubmit'), $('#tlSubmitText'), false, 'Simpan Tindak Lanjut');
      if (r.success) {
        Modal.close('modalTindakLanjut');
        Toast.success('Tindak lanjut tersimpan');
        BeritaModule.load();
      } else Toast.error('Gagal menyimpan', r.error);
    });
  },

  openForm: function (b) {
    $('#brtModalTitle').textContent = b ? 'Edit Pemberitaan' : 'Catat Pemberitaan';
    $('#brtId').value = b ? b.id : '';
    $('#brtTanggal').value = b ? String(b.tanggal_tayang || '').substring(0, 10) : todayISO();
    $('#brtJenisMedia').value = b ? (b.jenis_media || 'online') : 'online';
    $('#brtMedia').value = b ? (b.media || '') : '';
    $('#brtJudul').value = b ? (b.judul || '') : '';
    $('#brtSentimen').value = b ? (b.sentimen || 'netral') : 'netral';
    $('#brtKategori').value = b ? (b.kategori || '') : '';
    $('#brtLink').value = b ? (b.link || '') : '';
    $('#brtRingkasan').value = b ? (b.ringkasan || '') : '';
    Modal.open('modalBerita');
  },

  submit: function () {
    var payload = {
      id: $('#brtId').value || undefined,
      tanggal_tayang: $('#brtTanggal').value,
      jenis_media: $('#brtJenisMedia').value,
      media: $('#brtMedia').value.trim(),
      judul: $('#brtJudul').value.trim(),
      sentimen: $('#brtSentimen').value,
      kategori: $('#brtKategori').value.trim(),
      link: $('#brtLink').value.trim(),
      ringkasan: $('#brtRingkasan').value.trim()
    };
    if (!payload.tanggal_tayang || !payload.media || !payload.judul) {
      Toast.warning('Lengkapi dulu', 'Tanggal, media & judul wajib diisi.');
      return;
    }
    btnLoading($('#brtSubmit'), $('#brtSubmitText'), true);
    API.call(payload.id ? 'updateBerita' : 'createBerita', payload).then(function (r) {
      btnLoading($('#brtSubmit'), $('#brtSubmitText'), false, 'Simpan Pemberitaan');
      if (r.success) {
        Modal.close('modalBerita');
        Toast.success(r.message || 'Pemberitaan tersimpan');
        BeritaModule.load();
      } else Toast.error('Gagal menyimpan', r.error);
    });
  },

  exportCsv: function () {
    if (!BeritaModule.list.length) { Toast.warning('Belum ada data untuk diekspor'); return; }
    var header = ['Tanggal Tayang', 'Media', 'Jenis', 'Judul', 'Kategori', 'Sentimen', 'Link', 'Ringkasan', 'PIC'];
    var rows = BeritaModule.list.map(function (b) {
      return [b.tanggal_tayang, b.media, b.jenis_media, b.judul, b.kategori, b.sentimen, b.link, b.ringkasan, b.pic];
    });
    downloadCSV('monitoring-berita-' + BeritaModule.bulan + '.csv', header, rows);
    Toast.success('CSV terunduh');
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: ECO OFFICE (Fase 4) — checklist 20 item, riwayat, leaderboard
   ══════════════════════════════════════════════════════════════════════════ */
var EcoModule = {
  items: [],
  riwayat: [],

  init: function () {
    $('#ecoRefreshBtn').addEventListener('click', function () { EcoModule.load(); Toast.info('Eco Office dimuat ulang'); });
    $('#ecoSubmit').addEventListener('click', EcoModule.submit);
    $('#ecoBulan').value = thisMonthISO();
    $('#ecoLbBulan').value = thisMonthISO();
    $('#ecoBulan').addEventListener('change', EcoModule.loadRiwayat);
    $('#ecoLbBulan').addEventListener('change', EcoModule.loadLeaderboard);
    initTabs('#ecoTabs', '[data-view-panel="eco"]');
  },

  load: function () {
    EcoModule.loadItems();
    EcoModule.loadStats();
    EcoModule.loadRiwayat();
    EcoModule.loadTemuan();
    EcoModule.loadLeaderboard();
  },

  /* V6.5 — LOOP TEMUAN: item terlewat menjadi pekerjaan yang harus dituntaskan */
  loadTemuan: function () {
    API.call('getEcoTemuan').then(function (r) {
      if (!r.success) return;
      var badge = $('#ecoTemuanBadge');
      if (badge) {
        badge.textContent = r.open || '';
        badge.style.display = r.open ? '' : 'none';
      }
      var tbody = $('#ecoTemuanBody');
      if (!tbody) return;
      var rows = r.data || [];
      if (!rows.length) {
        tbody.innerHTML = emptyRow(5, 'check', 'Tidak ada temuan',
          'Item checklist yang terlewat akan otomatis muncul di sini untuk ditindaklanjuti.');
        renderIcons(tbody);
        return;
      }
      tbody.innerHTML = rows.map(function (t) {
        var open = String(t.status) === 'open';
        var status = open
          ? '<span class="badge badge-cancelled">Terbuka</span>'
          : '<span class="badge badge-done">Selesai</span>' +
            (t.tindak_lanjut ? '<div class="text-muted" style="font-size:11px;max-width:240px">' + escapeHtml(t.tindak_lanjut) +
              (t.penindak ? ' — ' + escapeHtml(t.penindak) : '') + '</div>' : '');
        return '<tr>' +
          '<td style="white-space:nowrap;font-size:12.5px">' + fmtDateShort(t.tanggal) +
            '<div class="text-muted" style="font-size:11px;text-transform:capitalize">' + escapeHtml(t.shift || '') + '</div></td>' +
          '<td style="font-size:12.5px"><b>#' + escapeHtml(String(t.item_no)) + '</b> ' + escapeHtml(t.item_label || '') + '</td>' +
          '<td style="font-size:12.5px">' + escapeHtml(t.pelapor || '—') + '</td>' +
          '<td>' + status + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' +
            (open ? '<button class="btn btn-success btn-sm" data-etm="' + escapeHtml(t.id) + '">' + iconSvg('check','btn-icon') + ' Tandai Beres</button>' : '') +
          '</td></tr>';
      }).join('');
      $all('[data-etm]', tbody).forEach(function (b) {
        b.addEventListener('click', function () {
          var tindak = prompt('Apa yang sudah dilakukan? (mis. kran diperbaiki, lampu dimatikan)') || '';
          apiKlikSekali(b, 'selesaikanEcoTemuan', { id: b.getAttribute('data-etm'), tindak_lanjut: tindak }).then(function (r2) {
            if (r2.success) { Toast.success(r2.message || 'Temuan selesai'); EcoModule.loadTemuan(); EcoModule.loadStats(); }
            else Toast.error('Gagal', r2.error);
          });
        });
      });
    });
  },

  loadItems: function () {
    if (EcoModule.items.length) { EcoModule.renderChecklist(); return; }
    API.call('getEcoItems').then(function (r) {
      if (r.success) { EcoModule.items = r.data || []; EcoModule.renderChecklist(); }
      else Toast.error('Gagal memuat daftar item', r.error);
    });
  },

  renderChecklist: function () {
    $('#ecoItems').innerHTML = EcoModule.items.map(function (label, i) {
      var no = i + 1;
      var key = 'item_' + (no < 10 ? '0' + no : no);
      return '<label class="check-item" data-key="' + key + '">' +
        '<input type="checkbox">' +
        '<span class="ck-no">' + no + '</span>' +
        '<span>' + escapeHtml(label) + '</span>' +
      '</label>';
    }).join('');
    $all('#ecoItems input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        cb.closest('.check-item').classList.toggle('is-checked', cb.checked);
        EcoModule.updateRing();
      });
    });
    EcoModule.updateRing();
  },

  updateRing: function () {
    var total = $all('#ecoItems input:checked').length;
    var pct = Math.round(total / 20 * 100);
    $('#ecoRing').style.setProperty('--pct', pct);
    $('#ecoRingVal').textContent = pct;
    $('#ecoCount').textContent = total;
  },

  submit: function () {
    var items = {};
    $all('#ecoItems .check-item').forEach(function (el) {
      items[el.getAttribute('data-key')] = el.querySelector('input').checked ? 1 : 0;
    });
    var terceklis = Object.keys(items).filter(function (k) { return items[k]; }).length;
    Confirm.ask('Simpan checklist shift ' + $('#ecoShift').value + '?',
      terceklis + ' dari 20 item terceklis (skor ' + Math.round(terceklis / 20 * 100) + '). Checklist tercatat atas nama Anda dan tidak bisa diisi ulang untuk shift yang sama.',
      function () {
        btnLoading($('#ecoSubmit'), $('#ecoSubmitText'), true);
        API.call('createEcoOffice', {
          shift: $('#ecoShift').value, items: items, catatan: $('#ecoCatatan').value.trim()
        }).then(function (r) {
          btnLoading($('#ecoSubmit'), $('#ecoSubmitText'), false, 'Simpan Checklist');
          if (r.success) {
            Toast.success(r.message || 'Checklist tersimpan');
            if (r.temuan_baru) Toast.warning(r.temuan_baru + ' temuan baru tercatat',
              'Item yang terlewat masuk tab Temuan — tuntaskan lalu tandai beres.');
            $('#ecoCatatan').value = '';
            $all('#ecoItems input').forEach(function (cb) {
              cb.checked = false;
              cb.closest('.check-item').classList.remove('is-checked');
            });
            EcoModule.updateRing();
            EcoModule.loadStats();
            EcoModule.loadRiwayat();
            EcoModule.loadTemuan();
            EcoModule.loadLeaderboard();
          } else Toast.error('Gagal menyimpan', r.error);
        });
      });
  },

  loadStats: function () {
    API.call('getEcoOfficeStats', { bulan: thisMonthISO() }).then(function (r) {
      if (!r.success) return;
      var d = r.data || {};
      $('#ecoStats').innerHTML = [
        statCardHtml({ cls: 'stat-teal',  icon: 'leaf',  val: (d.skor_hari_ini || 0) + '/100', label: 'Skor Hari Ini' }),
        statCardHtml({ cls: 'stat-blue',  icon: 'chart', val: (d.rata_skor || 0) + '/100',     label: 'Rata-rata Bulan Ini' }),
        statCardHtml({ cls: 'stat-amber', icon: 'check', val: d.jumlah_checklist || 0,          label: 'Checklist Terisi' }),
        statCardHtml({ cls: 'stat-violet', icon: 'calendar', val: d.hari_terisi || 0,           label: 'Hari Terpantau' })
      ].join('');
      renderIcons($('#ecoStats'));
      EcoModule.renderInsight(d);
    });
  },

  /* Insight perbaikan perilaku: status shift hari ini, item terlemah, tren 14 hari */
  renderInsight: function (d) {
    var el = $('#ecoInsight');
    if (!el) return;
    var shiftAda = d.shift_hari_ini || [];
    var pagi = shiftAda.indexOf('pagi') !== -1, sore = shiftAda.indexOf('sore') !== -1;
    var pill = function (label, ok) {
      return '<span class="pd-pill ' + (ok ? '' : 'warn') + '">' + iconSvg(ok ? 'check' : 'clock') +
        ' ' + label + ': <b>' + (ok ? 'sudah diisi' : 'belum diisi') + '</b></span>';
    };
    var pillTemuan = (d.temuan_open || 0) > 0
      ? '<span class="pd-pill danger"><span class="pd-dot"></span> Temuan terbuka: <b>' + d.temuan_open + '</b> — buka tab Temuan</span>'
      : '';
    var html = '<div class="card"><div class="card-body">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
      pill('Shift pagi hari ini', pagi) + pill('Shift sore hari ini', sore) + pillTemuan + '</div>';
    if (d.item_lemah && d.item_lemah.length) {
      html += '<div class="pd-insight neg" style="margin-bottom:10px"><span class="ic">' + iconSvg('alert') + '</span><div>' +
        'Paling sering terlewat bulan ini: ' + d.item_lemah.map(function (it) {
          return '<b>#' + it.no + ' ' + escapeHtml(it.label) + '</b> (' + it.persen + '%)';
        }).join(' · ') + ' — jadikan fokus patroli shift berikutnya.</div></div>';
    }
    html += '<div id="ecoTren"></div></div></div>';
    el.innerHTML = html;
    renderIcons(el);
    // Sparkline skor 14 hari — pakai mesin grafik Pusat Data
    if (d.tren && d.tren.length && typeof DashboardModule !== 'undefined') {
      var punyaData = d.tren.some(function (t) { return t.skor != null; });
      if (punyaData) {
        DashboardModule.lineChart($('#ecoTren'), {
          labels: d.tren.map(function (t) { return t.tanggal; }),
          series: [{ name: 'Skor eco', color: '#14b8a6', values: d.tren.map(function (t) { return t.skor; }) }],
          h: 120
        });
      } else {
        $('#ecoTren').innerHTML = '<div class="pd-empty">Grafik tren muncul setelah beberapa hari checklist terisi.</div>';
      }
    }
    // Kemudahan kecil bermakna: bila pagi sudah terisi, langsung siapkan shift sore
    if (pagi && !sore) $('#ecoShift').value = 'sore';
  },

  loadRiwayat: function () {
    API.call('getEcoOffice', { bulan: $('#ecoBulan').value || thisMonthISO() }).then(function (r) {
      if (!r.success) { Toast.error('Gagal memuat riwayat', r.error); return; }
      EcoModule.riwayat = r.data || [];
      var tbody = $('#ecoTableBody');
      if (!EcoModule.riwayat.length) {
        tbody.innerHTML = emptyRow(5, 'leaf', 'Belum ada checklist',
          'Isi checklist pertama di tab "Isi Checklist".');
        renderIcons(tbody);
        return;
      }
      tbody.innerHTML = EcoModule.riwayat.map(function (e) {
        var skor = parseInt(e.total_score, 10) || 0;
        var warna = skor >= 80 ? 'var(--success)' : skor >= 60 ? 'var(--warning)' : 'var(--danger)';
        return '<tr>' +
          '<td style="white-space:nowrap;font-size:12.5px">' + fmtDateShort(e.tanggal) + '</td>' +
          '<td style="text-transform:capitalize;font-size:12.5px">' + escapeHtml(e.shift) + '</td>' +
          '<td style="font-size:12.5px">' + escapeHtml(e.nama_checker || '—') + '</td>' +
          '<td><b style="color:' + warna + '">' + skor + '</b><span class="text-muted" style="font-size:11px">/100</span></td>' +
          '<td style="font-size:12px;max-width:260px">' + escapeHtml(e.catatan || '—') + '</td>' +
        '</tr>';
      }).join('');
    });
  },

  loadLeaderboard: function () {
    API.call('getEcoOfficeLeaderboard', { bulan: $('#ecoLbBulan').value || thisMonthISO() }).then(function (r) {
      if (!r.success) return;
      var board = r.data || [];
      var box = $('#ecoLeaderboard');
      if (!board.length) {
        box.innerHTML = emptyBoxHtml('star', 'Belum ada data leaderboard bulan ini.');
        renderIcons(box);
        return;
      }
      box.innerHTML = board.map(function (p, i) {
        return '<div class="rank-item rk-' + (i + 1) + '">' +
          '<div class="rk-no">' + (i + 1) + '</div>' +
          '<div class="rk-nama">' + escapeHtml(p.nama) +
            '<div class="rk-sub">' + p.jumlah + ' checklist</div></div>' +
          '<div class="rk-val">' + p.rata + '<span style="font-size:11px;color:var(--slate-400)">/100</span></div>' +
        '</div>';
      }).join('');
    });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   MODUL: LAPORAN & EXPORT (Fase 4) — pratinjau, CSV, cetak
   ══════════════════════════════════════════════════════════════════════════ */
var LaporanModule = {
  types: [],
  hasil: null,

  init: function () {
    $('#lapTampilBtn').addEventListener('click', LaporanModule.tampil);
    $('#lapCsvBtn').addEventListener('click', LaporanModule.unduhCsv);
    var xlsBtn = document.getElementById('lapXlsBtn');
    if (xlsBtn) xlsBtn.addEventListener('click', LaporanModule.unduhExcel); // V7.11
    $('#lapCetakBtn').addEventListener('click', LaporanModule.cetak);
    var eks = document.getElementById('cetEksekusi');
    if (eks) eks.addEventListener('click', LaporanModule.cetakEksekusi);
    var awal = todayISO().substring(0, 8) + '01';
    $('#lapDari').value = awal;
    $('#lapSampai').value = todayISO();
  },

  load: function () {
    if (LaporanModule.types.length) return;
    API.call('getLaporanTypes').then(function (r) {
      if (!r.success) { Toast.error('Gagal memuat jenis laporan', r.error); return; }
      LaporanModule.types = r.data || [];
      $('#lapModul').innerHTML = LaporanModule.types.map(function (t) {
        return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.label) + '</option>';
      }).join('');
    });
  },

  tampil: function () {
    var modul = $('#lapModul').value;
    if (!modul) { Toast.warning('Pilih jenis laporan'); return; }
    btnLoading($('#lapTampilBtn'), $('#lapTampilText'), true);
    API.call('exportLaporan', {
      modul: modul, dari: $('#lapDari').value, sampai: $('#lapSampai').value
    }).then(function (r) {
      btnLoading($('#lapTampilBtn'), $('#lapTampilText'), false, 'Tampilkan');
      if (!r.success) { Toast.error('Gagal menarik data', r.error); return; }
      LaporanModule.hasil = r;
      $('#lapCount').textContent = r.total + ' baris';
      LaporanModule.renderRingkas(r);
      $('#lapCsvBtn').disabled = !r.total;
      var xlsBtn = document.getElementById('lapXlsBtn');
      if (xlsBtn) xlsBtn.disabled = !r.total; // V7.11
      $('#lapCetakBtn').disabled = !r.total;
      $('#lapHead').innerHTML = '<tr>' + r.header.map(function (h) {
        return '<th style="white-space:nowrap">' + escapeHtml(h.replace(/_/g, ' ')) + '</th>';
      }).join('') + '</tr>';
      var preview = r.rows.slice(0, 50);
      $('#lapBody').innerHTML = preview.length
        ? preview.map(function (row) {
            return '<tr>' + row.map(function (c) {
              return '<td style="font-size:12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' +
                escapeHtml(c) + '">' + escapeHtml(c) + '</td>';
            }).join('') + '</tr>';
          }).join('') +
          (r.total > 50 ? '<tr><td colspan="' + r.header.length + '" class="text-muted" style="font-size:12px;text-align:center;padding:10px">Pratinjau 50 baris pertama — unduh CSV untuk data lengkap (' + r.total + ' baris).</td></tr>' : '')
        : '<tr><td colspan="' + r.header.length + '" class="text-muted" style="text-align:center;padding:24px">Tidak ada data pada rentang tanggal tersebut.</td></tr>';
    });
  },

  /* V6.5 — ringkasan eksekutif di atas pratinjau */
  renderRingkas: function (r) {
    var wrap = $('#lapRingkasWrap');
    if (!wrap) return;
    if (!r.total || !(r.ringkasan || []).length) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    $('#lapRingkas').innerHTML = (r.ringkasan || []).map(function (x) {
      return '<span class="pd-pill"><b>' + escapeHtml(x.val) + '</b>&nbsp;' + escapeHtml(x.label) + '</span>';
    }).join('');
    $('#lapInsight').innerHTML = (r.insight || []).map(function (t) {
      return '<div class="pd-insight net" style="margin-bottom:6px"><span class="ic">' + iconSvg('info') + '</span><div>' + escapeHtml(t) + '</div></div>';
    }).join('');
    renderIcons($('#lapInsight'));
  },

  unduhCsv: function () {
    var h = LaporanModule.hasil;
    if (!h || !h.total) return;
    var nama = (h.label || 'laporan').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadCSV(nama + '_' + ($('#lapDari').value || 'awal') + '_sd_' + ($('#lapSampai').value || 'akhir') + '.csv', h.header, h.rows);
    Toast.success('CSV terunduh', 'Buka dengan Excel / Google Sheets.');
  },

  /* V7.11 — Excel BERGAYA: kop GESIT + judul/periode + kartu ringkasan +
     tabel berkepala teal & baris selang-seling (helper downloadExcel). */
  unduhExcel: function () {
    var h = LaporanModule.hasil;
    if (!h || !h.total) return;
    var dari = $('#lapDari').value || 'awal', sampai = $('#lapSampai').value || 'akhir';
    var nama = (h.label || 'laporan').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadExcel(nama + '_' + dari + '_sd_' + sampai + '.xls',
      { judul: 'Laporan ' + (h.label || ''), sub: 'Periode ' + dari + ' s.d. ' + sampai,
        ringkasan: h.ringkasan || [] },
      h.header, h.rows);
    Toast.success('Excel terunduh', 'Kop, ringkasan & tabel berwarna ikut terbawa. Bila Excel menanyakan format saat membuka, pilih Yes/Ya.');
  },

  /* ═══ V6.6 — CETAK DENGAN PENGATURAN (font, margin, kertas, orientasi, ttd) ═══ */
  PREFS_KEY: 'gesit_cetak_prefs',

  bacaPrefs: function () {
    try { return JSON.parse(localStorage.getItem(LaporanModule.PREFS_KEY) || '{}'); } catch (e) { return {}; }
  },

  cetak: function () {
    var h = LaporanModule.hasil;
    if (!h || !h.total) return;
    var p = LaporanModule.bacaPrefs();
    if (p.font) $('#cetFont').value = p.font;
    if (p.margin) $('#cetMargin').value = p.margin;
    if (p.kertas) $('#cetKertas').value = p.kertas;
    if (p.orientasi) $('#cetOrientasi').value = p.orientasi;
    if (p.ringkas !== undefined) $('#cetRingkas').checked = !!p.ringkas;
    if (p.insight !== undefined) $('#cetInsight').checked = !!p.insight;
    if (p.ttd !== undefined) $('#cetTtd').checked = !!p.ttd;
    if (p.mengetahuiJab) $('#cetMengetahuiJab').value = p.mengetahuiJab;
    if (p.mengetahuiNama) $('#cetMengetahuiNama').value = p.mengetahuiNama;
    $('#cetSubjudul').value = '';
    Modal.open('modalCetak');
  },

  cetakEksekusi: function () {
    var h = LaporanModule.hasil;
    if (!h || !h.total) return;
    var p = {
      font: $('#cetFont').value,
      margin: Math.min(Math.max(parseInt($('#cetMargin').value, 10) || 12, 5), 30),
      kertas: $('#cetKertas').value,
      orientasi: $('#cetOrientasi').value,
      ringkas: $('#cetRingkas').checked,
      insight: $('#cetInsight').checked,
      ttd: $('#cetTtd').checked,
      mengetahuiJab: $('#cetMengetahuiJab').value.trim(),
      mengetahuiNama: $('#cetMengetahuiNama').value.trim()
    };
    try { localStorage.setItem(LaporanModule.PREFS_KEY, JSON.stringify(p)); } catch (e) { /* privat mode */ }

    var w = window.open('', '_blank');
    if (!w) { Toast.error('Popup diblokir', 'Izinkan popup untuk mencetak.'); return; }
    Modal.close('modalCetak');

    var esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var fs = parseFloat(p.font) || 10.5;
    var KERTAS = { A4: '210mm 297mm', F4: '215mm 330mm', Letter: '216mm 279mm', Legal: '216mm 356mm' };
    var dim = (KERTAS[p.kertas] || KERTAS.A4).split(' ');
    var size = p.orientasi === 'landscape' ? dim[1] + ' ' + dim[0] : dim[0] + ' ' + dim[1];

    // Kolom angka rata kanan: bila ≥70% sel terisi berupa angka murni
    var numerik = h.header.map(function (_, ci) {
      var isi = 0, angka = 0;
      h.rows.forEach(function (r) {
        var v = String(r[ci] == null ? '' : r[ci]).trim();
        if (!v) return;
        isi++;
        if (/^-?[\d.,]+$/.test(v)) angka++;
      });
      return isi > 0 && angka / isi >= 0.7;
    });

    var dari = $('#lapDari').value || '—', sampai = $('#lapSampai').value || '—';
    var pencetak = (Auth.user && (Auth.user.nama || Auth.user.username)) || '—';
    var kini = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    var tglSurat = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    var subjudul = $('#cetSubjudul').value.trim();

    var kartu = p.ringkas ? (h.ringkasan || []).map(function (x) {
      return '<div class="k"><div class="kv">' + esc(x.val) + '</div><div class="kl">' + esc(x.label) + '</div></div>';
    }).join('') : '';
    var insight = (p.insight && (h.insight || []).length)
      ? '<div class="sect">Catatan Analisis</div><ul class="ins">' +
        h.insight.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
      : '';
    var ttd = '';
    if (p.ttd) {
      var kiri = p.mengetahuiNama
        ? '<div class="kotak">Mengetahui,<br>' + esc(p.mengetahuiJab || '&nbsp;') + '<div class="garis">' + esc(p.mengetahuiNama) + '</div></div>'
        : '<div></div>';
      ttd = '<div class="ttd">' + kiri +
        '<div class="kotak">Bengkulu, ' + esc(tglSurat) + '<br>Yang mencetak,<div class="garis">' + esc(pencetak) + '</div></div></div>';
    }

    var html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>' + esc(h.label) + '</title><style>' +
      '@page{size:' + size + ';margin:' + p.margin + 'mm}' +
      '*{box-sizing:border-box}body{font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;margin:0;font-size:' + fs + 'px;line-height:1.45}' +
      '.kop{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double #0d9488;padding-bottom:10px}' +
      '.kop .b1{font-size:' + (fs + 9) + 'px;font-weight:800;letter-spacing:1px;color:#0f766e}' +
      '.kop .b2{font-size:' + (fs - 0.5) + 'px;color:#475569;margin-top:2px;line-height:1.35}' +
      '.kop .kanan{text-align:right;font-size:' + (fs - 1.5) + 'px;color:#64748b}' +
      'h1{font-size:' + (fs + 6) + 'px;margin:16px 0 1px;letter-spacing:.2px}' +
      '.sub{font-size:' + (fs + 1) + 'px;color:#334155;font-weight:600;margin:0 0 2px}' +
      '.periode{color:#475569;font-size:' + fs + 'px;margin:0 0 12px}' +
      '.meta{display:flex;gap:22px;font-size:' + (fs - 1) + 'px;color:#64748b;margin-bottom:14px;flex-wrap:wrap}.meta b{color:#0f172a}' +
      '.kartu{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:14px}' +
      '.k{border:1px solid #e2e8f0;border-left:4px solid #0d9488;border-radius:7px;padding:7px 13px;min-width:104px;background:#f8fafc;page-break-inside:avoid}' +
      '.kv{font-size:' + (fs + 5) + 'px;font-weight:800;color:#0f766e}' +
      '.kl{font-size:' + (fs - 2) + 'px;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-top:1px}' +
      '.sect{font-size:' + (fs - 0.5) + 'px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:#0f766e;margin:14px 0 5px;border-bottom:1px solid #ccfbf1;padding-bottom:2px}' +
      'ul.ins{margin:0 0 12px 17px;padding:0}ul.ins li{margin-bottom:3px;color:#334155}' +
      'table{border-collapse:collapse;width:100%;margin-top:3px}thead{display:table-header-group}tr{page-break-inside:avoid}' +
      'th,td{border:1px solid #cbd5e1;padding:3.5px 6px;text-align:left;vertical-align:top;word-break:break-word}' +
      'th{background:#0d9488;color:#fff;font-size:' + (fs - 2) + 'px;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}' +
      'tbody tr:nth-child(even){background:#f0fdfa}td{font-size:' + (fs - 1) + 'px}td.num{text-align:right;font-variant-numeric:tabular-nums}' +
      '.ttd{display:flex;justify-content:space-between;margin-top:30px;page-break-inside:avoid}' +
      '.ttd .kotak{text-align:center;font-size:' + fs + 'px;min-width:220px}.ttd .garis{margin-top:58px;border-top:1px solid #0f172a;padding-top:4px;font-weight:700}' +
      '.foot{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:5px;font-size:' + (fs - 2.5) + 'px;color:#94a3b8;display:flex;justify-content:space-between}' +
      '@media print{.k,th,tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
      '</style></head><body>' +
      '<div class="kop"><div><div class="b1">GESIT</div><div class="b2">Gerbang Elektronik Sistem Informasi Terpadu<br>BPJS Kesehatan Kantor Cabang Bengkulu</div></div>' +
      '<div class="kanan">Dokumen dihasilkan otomatis<br>' + esc(kini) + '</div></div>' +
      '<h1>Laporan ' + esc(h.label) + '</h1>' +
      (subjudul ? '<p class="sub">' + esc(subjudul) + '</p>' : '') +
      '<p class="periode">Periode ' + esc(dari) + ' s.d. ' + esc(sampai) + '</p>' +
      '<div class="meta"><span>Jumlah data: <b>' + h.total + '</b></span><span>Dicetak oleh: <b>' + esc(pencetak) + '</b></span>' +
      '<span>Kertas: <b>' + esc(p.kertas) + ' ' + (p.orientasi === 'landscape' ? 'mendatar' : 'tegak') + '</b></span></div>' +
      (kartu ? '<div class="sect">Ringkasan Eksekutif</div><div class="kartu">' + kartu + '</div>' : '') +
      insight +
      '<div class="sect">Rincian Data</div>' +
      '<table><thead><tr>' + h.header.map(function (c) { return '<th>' + esc(c.replace(/_/g, ' ')) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      h.rows.map(function (row) {
        return '<tr>' + row.map(function (c, ci) {
          return '<td' + (numerik[ci] ? ' class="num"' : '') + '>' + esc(c) + '</td>';
        }).join('') + '</tr>';
      }).join('') +
      '</tbody></table>' +
      ttd +
      '<div class="foot"><span>GESIT V6.6 · BPJS Kesehatan KC Bengkulu</span><span>Dicetak dari modul Laporan &amp; Export</span></div>' +
      '</body></html>';
    w.document.write(html);
    w.document.close();
    setTimeout(function () { w.print(); }, 400);
  }
};


/* ══════════════════════════════════════════════════════════════════════════
   11B. TOPBAR INFORMATIF (V6.7)
   Masalah lama: topbar menampilkan judul + subjudul halaman — persis
   menduplikasi header halaman tepat di bawahnya. Kini topbar memuat info
   yang TIDAK ada di tempat lain:
   • Tanggal lengkap + jam berjalan (kiri).
   • Chip "N menunggu persetujuan" untuk kabag/admin — klik = lompat ke
     Pusat Persetujuan (angka ikut mekanisme badge ApprovalModule).
   • Saat halaman digulir dan header halaman keluar layar, slot kiri
     berganti mulus menjadi judul halaman aktif — konteks tanpa duplikasi.
   Semua elemen bersifat opsional (null-safe) sampai Index.html diperbarui.
   ══════════════════════════════════════════════════════════════════════════ */
var Topbar = {
  pageTitle: '',

  init: function () {
    var bar = document.querySelector('.topbar');
    if (bar) {
      var onScroll = function () {
        bar.classList.toggle('is-scrolled', (window.scrollY || 0) > 84);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    var chip = $('#topbarApprovalChip');
    if (chip) chip.addEventListener('click', function () { Router.go('approval'); });
    Topbar.tickDate();
  },

  tickDate: function () {
    var d = $('#topbarDate');
    if (d) d.textContent = tanggalIndo();
  },

  setPage: function (meta) {
    Topbar.pageTitle = (meta && meta.title) || '';
    var t = $('#topbarPageTitle');
    if (t) t.textContent = Topbar.pageTitle;
  },

  /** Dipanggil ApprovalModule.updateBadge — satu sumber angka utk nav & topbar. */
  setApproval: function (n) {
    var chip = $('#topbarApprovalChip');
    if (!chip) return;
    chip.style.display = n > 0 ? '' : 'none';
    var c = $('#topbarApprovalCount');
    if (c) c.textContent = n;
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   12. APP — inisialisasi & orkestrasi
   ══════════════════════════════════════════════════════════════════════════ */
var App = {
  clockTimer: null,

  init: function () {
    BootGuard.arm(25000);
    renderIcons(document);
    // Satu modul gagal init ≠ seluruh aplikasi mati di layar loading.
    var initSafe = function (name, fn) {
      try { fn(); }
      catch (e) {
        if (window.console) console.error('Init modul ' + name + ' gagal: ' + e.message);
      }
    };
    initSafe('Auth', Auth.init);
    initSafe('Router', Router.init);
    initSafe('Sidebar', Sidebar.init);
    initSafe('Confirm', Confirm.init);
    initSafe('UserMenu', UserMenu.init);
    initSafe('Password', PasswordModule.init);
    initSafe('Digitamu', DigitamuModule.init);
    initSafe('Users', UsersModule.init);
    initSafe('Reject', Reject.init);
    initSafe('Kendaraan', KendaraanModule.init);
    initSafe('Ruangan', RuanganModule.init);
    initSafe('ATK', ATKModule.init);
    initSafe('Approval', ApprovalModule.init);
    initSafe('Magang', MagangModule.init);
    initSafe('TAD', TADModule.init);
    initSafe('Security', SecurityModule.init);
    initSafe('Agenda', AgendaModule.init);
    initSafe('Budaya', BudayaModule.init);
    initSafe('Sosmed', SosmedModule.init);
    initSafe('Berita', BeritaModule.init);
    initSafe('Eco', EcoModule.init);
    initSafe('Laporan', LaporanModule.init);
    initSafe('KirimPesan', KirimPesan.init);
    initSafe('SettingsApp', SettingsApp.init);
    initSafe('MagangSelf', MagangSelfModule.init);
    // Audit V6.7: TadSelfModule.init TIDAK PERNAH terdaftar — tombol presensi,
    // izin/cuti, lembur & tab di Portal TAD mati total meski halamannya tampil.
    initSafe('TadSelf', TadSelfModule.init);
    initSafe('Topbar', Topbar.init);
    initSafe('PublicLink', PublicLink.init);

    // Tombol tutup modal generik
    $all('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { Modal.close(b.getAttribute('data-close')); });
    });
    // Klik backdrop = tutup
    $all('.modal-backdrop').forEach(function (bd) {
      bd.addEventListener('click', function (e) {
        if (e.target === bd && bd.id !== 'modalConfirm') Modal.close(bd.id);
      });
    });
    // ESC = tutup modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') Modal.closeAll();
    });

    $('#dashRefreshBtn').addEventListener('click', function () {
      DashboardModule.load();
      Toast.info('Pusat Data dimuat ulang');
    });

    console.log('GESIT V6.6 — Runtime siap');
    Auth.boot();
  },

  onUserReady: function () {
    var u = Auth.user;
    var inisial = (u.nama || u.username || '?').trim().split(/\s+/)
      .slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    $('#userAvatar').textContent = inisial;
    $('#userName').textContent = u.nama || u.username;
    $('#userRole').textContent = (u.role || '').replace('_', ' ');
    $('#dashGreetName').textContent = (u.nama || u.username).split(' ')[0];

    // Tampilkan menu admin bila role sesuai
    var isAdmin = ['admin', 'super_admin'].indexOf(String(u.role).toLowerCase()) !== -1;
    $all('[data-admin]').forEach(function (n) {
      n.classList.toggle('hidden', !isAdmin);
    });

    // Tampilkan elemen persetujuan (Pusat Persetujuan, tombol setujui/tolak) untuk kabag+
    var canApprove = ['kabag', 'admin', 'super_admin'].indexOf(String(u.role).toLowerCase()) !== -1;
    $all('[data-approver]').forEach(function (n) {
      n.classList.toggle('hidden', !canApprove);
    });

    // Elemen aksi lapangan security ([data-security]) untuk security + kabag+
    var canSecurity = ['security', 'kabag', 'admin', 'super_admin'].indexOf(String(u.role).toLowerCase()) !== -1;
    $all('[data-security]').forEach(function (n) {
      n.classList.toggle('hidden', !canSecurity);
    });

    // ── LINGKUP MENU PER-ROLE (audit V6.7) ────────────────────────────────
    // Dulu hanya role "magang" yang diberi Router.allowed; security, driver
    // & cso tetap mendapat tampilan staf lengkap (bug yang dilaporkan).
    // Kini: role portal memakai whitelist ROLE_SCOPE, role kantor (staff/
    // kabag/admin) disaring per-menu lewat Router.canOpen yang mencerminkan
    // whitelist backend — staff tidak lagi melihat menu kabag+ yang hanya
    // menghasilkan galat "tidak memiliki akses".
    var roleLc = String(u.role || '').toLowerCase();
    var scope = ROLE_SCOPE[roleLc] || null;
    Router.allowed = scope ? scope.allowed.slice() : null;

    var isMagangRole = roleLc === 'magang';
    $all('[data-magang-only]').forEach(function (n) { n.classList.toggle('hidden', !isMagangRole); });

    $all('.nav-item').forEach(function (n) {
      var v = n.getAttribute('data-view');
      if (!v) return;
      n.classList.toggle('is-scope-hidden', !Router.canOpen(v));
    });
    // Sembunyikan judul seksi yang seluruh menunya tersembunyi
    (function tidyNavSections() {
      var nav = $('#sidebarNav');
      if (!nav) return;
      var kids = Array.prototype.slice.call(nav.children);
      for (var i = 0; i < kids.length; i++) {
        if (!kids[i].classList.contains('nav-section')) continue;
        var any = false;
        for (var j = i + 1; j < kids.length && !kids[j].classList.contains('nav-section'); j++) {
          if (!kids[j].classList.contains('hidden') && !kids[j].classList.contains('is-scope-hidden')) { any = true; break; }
        }
        kids[i].classList.toggle('is-scope-hidden', !any);
      }
    })();

    // Bundel boot (V6.6): badge Pusat Persetujuan + URL web app dalam SATU
    // round-trip — fallback mulus ke panggilan terpisah bila backend lama.
    API.call('getModuleBundle', { module: 'boot' }).then(function (r) {
      if (r.success && r.data) {
        var d = r.data;
        if (d.app_info && d.app_info.success && d.app_info.data) {
          AppInfo.url = d.app_info.data.url || '';
          // V6.8: status buka/tutup halaman publik → lencana di modal Tautan
          AppInfo.halaman = d.app_info.data.halaman || null;
        }
        if (canApprove && d.approval) ApprovalModule.apply(d.approval);
        // V6.8: badge "Lamaran baru" (sidebar + tab Magang) ikut satu round-trip boot
        if (canApprove && d.lamaran_baru && d.lamaran_baru.success) {
          MagangModule.setLamaranBadge(d.lamaran_baru.data || 0);
        }
      } else {
        if (canApprove) ApprovalModule.load();
        AppInfo.load();
      }
    });

    App.startClock();
    // Beranda per-role: magang → Portal Magang, driver/cso → Portal TAD,
    // security → panel Security; role kantor tetap ke Pusat Data.
    // (Modul view dimuat via Router.go → tidak dipanggil dua kali.)
    Router.go(scope ? scope.landing : 'dashboard');
    if (window.RealtimeNotif) {
    RealtimeNotif.init();
    }
  },

  startClock: function () {
    if (App.clockTimer) clearInterval(App.clockTimer);
    var tick = function () {
      var c = $('#topbarClock'); if (c) c.textContent = jamSekarang();
      var s = $('#sidebarClockDate'); if (s) s.textContent = tanggalIndo().split(', ')[1];
      Topbar.tickDate(); // tanggal ikut segar bila aplikasi dibiarkan melewati tengah malam
    };
    tick();
    App.clockTimer = setInterval(tick, 1000);
  }
};

// Ekspos minimal untuk debugging di console
window.SG = { API: API, Toast: Toast, Auth: Auth, Router: Router, AppInfo: AppInfo };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}
