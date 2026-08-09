'use strict';
/* ════════════════════════════════════════════════════════════════════════════
   GESIT V6 — JS FASE 5.1: REGISTRASI MANDIRI + KONFIRMASI TELEGRAM
   Isi   : RegisterModule (form daftar + panel konfirmasi + polling status),
           MyTelegram (menu "Hubungkan Telegram" utk user login),
           tombol "Aktifkan Bot" di Pengaturan Aplikasi (admin)
   Urutan: file ke-5 — dimuat SETELAH Scripts_4 (berbagi scope global)
   ════════════════════════════════════════════════════════════════════════════ */

/* ── MODUL: REGISTRASI MANDIRI (halaman login) ────────────────────────────── */
var RegisterModule = {
  POLL_MS: 5000,
  POLL_MAX_MS: 15 * 60 * 1000,
  pollTimer: null,
  pollUserId: null,
  pollSejak: 0,
  lastUsername: '',

  init: function () {
    var wire = function (id, fn) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };
    wire('btnShowRegister', RegisterModule.show);
    wire('btnBackLogin', RegisterModule.backToLogin);
    wire('regSubmit', RegisterModule.submit);
    wire('tgBackLogin', RegisterModule.backToLogin);
    wire('tgDoneLogin', RegisterModule.backToLogin);
    wire('tgRetryBtn', function () {
      if (RegisterModule.pollUserId) RegisterModule.startPoll(RegisterModule.pollUserId);
    });
    var p2 = document.getElementById('regPassword2');
    if (p2) p2.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') RegisterModule.submit();
    });
  },

  /* — navigasi antar kartu di halaman login — */
  swapCard: function (show) {
    ['loginCard', 'registerCard', 'tgConfirmCard'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== show);
    });
  },

  show: function () {
    var err = $('#regError'); if (err) err.classList.remove('is-visible');
    RegisterModule.swapCard('registerCard');
    var fine = true;
    try { fine = !window.matchMedia || window.matchMedia('(pointer: fine)').matches; } catch (e) {}
    if (fine) setTimeout(function () { var f = $('#regNama'); if (f) f.focus(); }, 150);
  },

  backToLogin: function () {
    RegisterModule.stopPoll();
    RegisterModule.swapCard('loginCard');
    if (RegisterModule.lastUsername) {
      $('#loginUsername').value = RegisterModule.lastUsername;
      var fine = true;
      try { fine = !window.matchMedia || window.matchMedia('(pointer: fine)').matches; } catch (e) {}
      if (fine) setTimeout(function () { $('#loginPassword').focus(); }, 150);
    }
  },

  regErr: function (msg) {
    var box = $('#regError');
    if (!box) return;
    box.textContent = msg;
    box.classList.add('is-visible');
  },

  submit: function () {
    var box = $('#regError'); if (box) box.classList.remove('is-visible');

    var nama = $('#regNama').value.trim();
    var username = $('#regUsername').value.trim();
    var email = $('#regEmail').value.trim();
    var noHp = $('#regNoHp').value.trim();
    var bagian = $('#regBagian').value;
    var pass = $('#regPassword').value;
    var pass2 = $('#regPassword2').value;

    if (!nama || !username || !pass) return RegisterModule.regErr('Nama lengkap, username, dan password wajib diisi.');
    if (!/^[a-z0-9._]{3,20}$/i.test(username)) return RegisterModule.regErr('Username 3–20 karakter, hanya huruf/angka/titik/garis bawah.');
    if (pass.length < 8) return RegisterModule.regErr('Password minimal 8 karakter.');
    if (pass !== pass2) return RegisterModule.regErr('Konfirmasi password tidak sama.');

    var btn = $('#regSubmit'), txt = $('#regSubmitText');
    btnLoading(btn, txt, true);

    API.call('publicRegisterUser', {
      nama_lengkap: nama, username: username, email: email,
      no_hp: noHp, bagian: bagian, password: pass,
      // Audit V7.2: select #regJabatan dulu tidak pernah dikirim — pilihan
      // pendaftar diabaikan diam-diam dan semua akun jatuh ke role default.
      jabatan: ($('#regJabatan') && $('#regJabatan').value) || ''
    }).then(function (res) {
      btnLoading(btn, txt, false, 'Daftar & Lanjut ke Telegram');
      if (!res.success) return RegisterModule.regErr(res.error || 'Registrasi gagal.');
      RegisterModule.lastUsername = username;
      RegisterModule.showConfirm(res.data || {}, {
        judul: 'Satu Langkah Lagi',
        teks: 'Akun <b>' + escapeHtml(username) + '</b> berhasil dibuat. ' +
              'Hubungkan Telegram Anda agar akun <b>aktif</b> dan notifikasi aplikasi bisa terkirim.'
      });
    });
  },

  /* — panel konfirmasi Telegram (dipakai registrasi baru & lanjutan dari login) — */
  showConfirm: function (d, opts) {
    opts = opts || {};
    RegisterModule.swapCard('tgConfirmCard');

    $('#tgConfTitle').textContent = opts.judul || 'Konfirmasi Telegram';
    $('#tgConfText').innerHTML = opts.teks ||
      'Hubungkan Telegram Anda untuk mengaktifkan akun & menerima notifikasi.';
    $('#tgBotName').textContent = d.bot_username ? '@' + d.bot_username : '—';

    var a = $('#tgOpenBtn');
    if (a) {
      a.href = d.telegram_url || '#';
      a.classList.toggle('hidden', !d.telegram_url);
    }
    $('#tgDoneBlock').classList.add('hidden');
    $('#tgStatusRow').classList.remove('hidden');
    $('#tgRetryBtn').classList.add('hidden');
    $('#tgStatusText').textContent = 'Menunggu konfirmasi dari Telegram…';

    if (d.user_id) RegisterModule.startPoll(d.user_id);
  },

  startPoll: function (userId) {
    RegisterModule.stopPoll();
    RegisterModule.pollUserId = userId;
    RegisterModule.pollSejak = Date.now();
    $('#tgStatusRow').classList.remove('hidden');
    $('#tgRetryBtn').classList.add('hidden');
    RegisterModule.pollTimer = setInterval(RegisterModule.pollTick, RegisterModule.POLL_MS);
    RegisterModule.pollTick();
  },

  stopPoll: function () {
    if (RegisterModule.pollTimer) { clearInterval(RegisterModule.pollTimer); RegisterModule.pollTimer = null; }
  },

  pollTick: function () {
    var card = document.getElementById('tgConfirmCard');
    if (!card || card.classList.contains('hidden')) return RegisterModule.stopPoll();

    if (Date.now() - RegisterModule.pollSejak > RegisterModule.POLL_MAX_MS) {
      RegisterModule.stopPoll();
      $('#tgStatusText').textContent = 'Belum ada konfirmasi. Tekan tombol Telegram di atas, lalu cek lagi.';
      $('#tgRetryBtn').classList.remove('hidden');
      return;
    }

    // Mode polling: pompa pesan masuk dulu supaya /start diproses seketika
    API.call('pompaTelegram', {});
    API.call('publicCekTelegramLink', { user_id: RegisterModule.pollUserId }).then(function (res) {
      if (!res.success || !res.data) return; // coba lagi di tick berikutnya
      var d = res.data;
      if (!d.linked) return;

      RegisterModule.stopPoll();
      $('#tgStatusRow').classList.add('hidden');
      var done = $('#tgDoneBlock');
      done.classList.remove('hidden');

      if (d.aktif) {
        $('#tgDoneTitle').textContent = 'Telegram Terhubung — Akun Aktif!';
        $('#tgDoneText').textContent = 'Silakan login untuk mulai menggunakan aplikasi.';
        $('#tgDoneLogin').classList.remove('hidden');
      } else if (d.status === 'pending_admin') {
        $('#tgDoneTitle').textContent = 'Telegram Terhubung ✓';
        $('#tgDoneText').textContent = 'Akun Anda menunggu persetujuan administrator. Kabar aktivasi akan dikirim lewat Telegram.';
        $('#tgDoneLogin').classList.add('hidden');
      } else {
        $('#tgDoneTitle').textContent = 'Telegram Terhubung ✓';
        $('#tgDoneText').textContent = 'Notifikasi aplikasi akan dikirim ke Telegram Anda.';
        $('#tgDoneLogin').classList.remove('hidden');
      }
    });
  },

  /* — dipanggil dari Auth.login saat akun berstatus pending_telegram — */
  resumeFromLogin: function (username, password) {
    RegisterModule.lastUsername = username;
    API.call('publicResumeTelegramLink', { username: username, password: password }).then(function (res) {
      if (!res.success) {
        var errBox = $('#loginError');
        errBox.textContent = res.error || 'Gagal melanjutkan konfirmasi Telegram.';
        errBox.classList.add('is-visible');
        return;
      }
      RegisterModule.showConfirm(res.data || {}, {
        judul: 'Selesaikan Konfirmasi Telegram',
        teks: 'Akun <b>' + escapeHtml(username) + '</b> sudah ada namun <b>belum aktif</b>. ' +
              'Tekan tombol di bawah, lalu tekan <b>START</b> di Telegram untuk mengaktifkannya.'
      });
    });
  }
};

/* ── MODUL: HUBUNGKAN TELEGRAM SAYA (user yang sudah login) ───────────────── */
var MyTelegram = {
  pollTimer: null,

  init: function () {
    var btn = document.getElementById('menuTelegram');
    if (btn) btn.addEventListener('click', function () {
      if (typeof UserMenu !== 'undefined' && UserMenu.close) UserMenu.close();
      MyTelegram.open();
    });
  },

  open: function () {
    MyTelegram.stopPoll();
    var st = $('#myTgStatus');
    st.className = 'alert alert-info mb-2';
    st.textContent = 'Memuat status…';
    $('#myTgOpenBtn').classList.add('hidden');
    $('#myTgWait').classList.add('hidden');
    Modal.open('modalTelegramLink');

    API.call('getTelegramLinkSelf').then(function (res) {
      if (!res.success) {
        st.className = 'alert alert-warning mb-2';
        st.textContent = res.error || 'Gagal memuat tautan Telegram.';
        return;
      }
      var d = res.data || {};
      var a = $('#myTgOpenBtn');
      a.href = d.telegram_url || '#';
      a.classList.remove('hidden');

      if (d.terhubung) {
        st.className = 'alert alert-info mb-2';
        st.innerHTML = iconSvg('check','btn-icon') + ' Telegram Anda <b>sudah terhubung</b> (bot ' +
          escapeHtml(d.bot_username ? '@' + d.bot_username : '') + ').<br>' +
          'Gunakan tombol di bawah hanya bila ingin menghubungkan ulang / pindah akun Telegram.';
      } else {
        st.className = 'alert alert-warning mb-2';
        st.innerHTML = iconSvg('alert','btn-icon') + ' Telegram Anda <b>belum terhubung</b> — notifikasi persetujuan belum bisa dikirim ke Anda.<br>' +
          'Tekan tombol di bawah, lalu tekan <b>START</b> di Telegram (bot ' +
          escapeHtml(d.bot_username ? '@' + d.bot_username : '') + ').';
        $('#myTgWait').classList.remove('hidden');
        MyTelegram.startPoll();
      }
    });
  },

  startPoll: function () {
    MyTelegram.stopPoll();
    MyTelegram.pollTimer = setInterval(function () {
      var bd = document.getElementById('modalTelegramLink');
      if (!bd || !bd.classList.contains('is-open')) return MyTelegram.stopPoll();
      if (!Auth.user) return MyTelegram.stopPoll();

      API.call('pompaTelegram', {});
      API.call('publicCekTelegramLink', { user_id: Auth.user.id }).then(function (res) {
        if (res.success && res.data && res.data.linked) {
          MyTelegram.stopPoll();
          var st = $('#myTgStatus');
          st.className = 'alert alert-info mb-2';
          st.innerHTML = iconSvg('check','btn-icon') + ' <b>Berhasil!</b> Telegram Anda kini terhubung — notifikasi aplikasi akan dikirim ke chat pribadi Anda.';
          $('#myTgWait').classList.add('hidden');
          Toast.success('Telegram terhubung');
        }
      });
    }, 5000);
  },

  stopPoll: function () {
    if (MyTelegram.pollTimer) { clearInterval(MyTelegram.pollTimer); MyTelegram.pollTimer = null; }
  }
};

/* ── PENGATURAN (admin): tombol "Aktifkan Bot" + "Cek Status Bot" ─────────── */
var SettingsFase5 = {
  init: function () {
    var btn = document.getElementById('setAktifkanBot');
    if (btn) btn.addEventListener('click', function () {
      btnLoading(btn, $('#setAktifkanBotText'), true);
      // Simpan pengaturan dulu supaya token & saklar terbaru yang dipakai,
      // lalu serahkan pemilihan jalur (webhook/polling) ke otak sadar-302.
      API.call('updateSettings', SettingsApp.payload()).then(function () {
        return API.call('ensureTelegramDelivery', { mode: 'auto' });
      }).then(function (r) {
        btnLoading(btn, $('#setAktifkanBotText'), false, 'Aktifkan Bot (otomatis)');
        var box = document.getElementById('setBotStatus');
        if (r.success) {
          Toast.success('Bot aktif — jalur: ' + r.mode.toUpperCase());
          if (box) {
            box.classList.remove('hidden');
            box.className = 'alert alert-info mt-1';
            box.innerHTML = '<b>Jalur masuk: ' + escapeHtml(r.mode.toUpperCase()) + '</b><br>• ' +
              (r.aksi || []).map(escapeHtml).join('<br>• ');
          }
        } else {
          Toast.error('Gagal mengaktifkan bot', r.error);
        }
      });
    });

    var cek = document.getElementById('setCekBot');
    if (cek) cek.addEventListener('click', SettingsFase5.cekStatus);

    var diag = document.getElementById('setDiagBot');
    if (diag) diag.addEventListener('click', SettingsFase5.diagnosa);
  },

  /* Diagnosa lengkap — checklist ok/warn/fail + solusi per butir */
  diagnosa: function () {
    var diag = document.getElementById('setDiagBot');
    var box = document.getElementById('setBotStatus');
    if (!box) return;
    if (diag) btnLoading(diag, $('#setDiagBotText'), true);
    box.classList.remove('hidden');
    box.className = 'alert alert-info mt-1';
    box.textContent = 'Mendiagnosa koneksi bot…';
    API.call('diagnosaTelegram', {}).then(function (r) {
      if (diag) btnLoading(diag, $('#setDiagBotText'), false, 'Diagnosa Lengkap');
      if (!r.success) {
        box.className = 'alert alert-warning mt-1';
        box.textContent = r.error || 'Diagnosa gagal.';
        return;
      }
      var ic = { ok: iconSvg('check','btn-icon'), warn: iconSvg('alert','btn-icon'), fail: iconSvg('x','btn-icon') };
      box.className = 'alert ' + (/masalah/.test(r.kesimpulan) ? 'alert-warning' : 'alert-info') + ' mt-1';
      box.innerHTML = '<b>' + escapeHtml(r.kesimpulan) + '</b><br>' +
        (r.checks || []).map(function (c) {
          return (ic[c.status] || '•') + ' <b>' + escapeHtml(c.label) + '</b> — ' + escapeHtml(c.detail) +
            (c.solusi ? '<br><span style="color:var(--text-secondary);padding-left:20px">↳ ' + escapeHtml(c.solusi) + '</span>' : '');
        }).join('<br>');
    });
  },

  /* Tampilkan hasil getWebhookInfo di kotak #setBotStatus (debug bot bisu) */
  cekStatus: function () {
    var cek = document.getElementById('setCekBot');
    var box = document.getElementById('setBotStatus');
    if (!box) return;
    if (cek) btnLoading(cek, $('#setCekBotText'), true);
    box.className = 'alert alert-info mt-1';
    box.textContent = 'Memeriksa status bot…';

    API.call('getWebhookInfo').then(function (r) {
      if (cek) btnLoading(cek, $('#setCekBotText'), false, 'Cek Status Bot');
      if (!r.success) {
        box.className = 'alert alert-warning mt-1';
        box.innerHTML = iconSvg('x','btn-icon') + ' ' + escapeHtml(r.error || 'Gagal membaca status bot.');
        return;
      }
      var d = r.data || {};
      var terpasang = d.url_terpasang && d.url_terpasang !== '(belum ada)';
      var rows = [];
      rows.push('<b>Bot:</b> ' + escapeHtml(d.bot_username ? '@' + String(d.bot_username).replace(/^@/, '') : '—'));
      rows.push('<b>Webhook:</b> ' + (terpasang
        ? iconSvg('check','btn-icon') + ' terpasang<br><span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;word-break:break-all">' + escapeHtml(d.url_terpasang) + '</span>'
        : iconSvg('x','btn-icon') + ' <b>belum terpasang</b> — tekan "Aktifkan Bot" di sebelah.'));
      rows.push('<b>Antrean update:</b> ' + escapeHtml(String(d.antrean_update || 0)));
      if (d.error_terakhir) {
        rows.push('<b>Error terakhir dari Telegram:</b> <span style="color:var(--danger,#dc2626)">' + escapeHtml(d.error_terakhir) + '</span>');
      }
      box.className = 'alert ' + (terpasang && !d.error_terakhir ? 'alert-info' : 'alert-warning') + ' mt-1';
      box.innerHTML = rows.join('<br>');
    });
  }
};

/* ── INIT FASE 5.1 (setelah modul-modul inti siap) ────────────────────────── */
(function () {
  var initFase5 = function () {
    var safe = function (name, fn) {
      try { fn(); } catch (e) {
        if (window.console) console.error('Init modul ' + name + ' gagal: ' + e.message);
      }
    };
    safe('Register', RegisterModule.init);
    safe('MyTelegram', MyTelegram.init);
    safe('SettingsFase5', SettingsFase5.init);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFase5);
  } else {
    initFase5();
  }
})();
