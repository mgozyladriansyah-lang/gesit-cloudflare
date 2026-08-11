/* ══════════════════════════════════════════════════════════════════════════
   SCRIPTS 6 — TUR PANDUAN (TOUR GUIDE)
   ══════════════════════════════════════════════════════════════════════════
   • Tur interaktif per halaman: elemen disorot (spotlight) + kartu penjelasan
     langkah-demi-langkah, tombol Sebelumnya/Selanjutnya/Lewati, dukungan
     keyboard (←, →, Esc).
   • Langkah yang elemennya tersembunyi (beda role / tab belum aktif) DILEWATI
     otomatis — tur selalu cocok dengan apa yang benar-benar dilihat user.
   • Dibuka lewat tombol "?" di topbar. Saat login pertama di perangkat itu,
     tur ORIENTASI tata letak berjalan otomatis satu kali (ditandai di
     localStorage bila tersedia; gagal-diam bila sandbox melarang).
   ══════════════════════════════════════════════════════════════════════════ */

/* ── LANGKAH TUR PER HALAMAN ──
   sel: selector elemen yang disorot (null = kartu di tengah layar).
   Teks ditulis presisi: apa fungsinya, siapa yang memakai, dan alurnya. */
var TOUR_STEPS = {

  intro: [
    { sel: null, judul: 'Selamat datang di GESIT',
      isi: '<b>GESIT</b> — Gerbang Elektronik Sistem Informasi Terpadu: tamu, kendaraan, ruangan, ATK, magang, tenaga alih daya, security, agenda, sosmed, hingga laporan, plus <b>briefing pagi otomatis ke Telegram</b> setiap hari kerja. Tur singkat ini mengenalkan tata letak utama — setelah itu, setiap halaman punya tur rincinya sendiri lewat tombol <b>?</b> di kanan atas.' },
    { sel: '#sidebarNav', judul: 'Menu Navigasi',
      isi: 'Semua modul ada di sini, dikelompokkan per fungsi. <b>Menu yang tampil menyesuaikan role Anda</b> — misalnya driver melihat Portal TAD, Kendaraan & Eco Office, sedangkan admin melihat semuanya. Klik salah satu untuk berpindah halaman.' },
    { sel: '#topbarContext', judul: 'Bilah Atas Pintar',
      isi: 'Menampilkan <b>tanggal & jam</b> saat ini. Begitu Anda menggulir ke bawah dan judul halaman keluar layar, bilah ini otomatis berganti menjadi <b>judul halaman aktif</b> — konteks selalu terjaga tanpa mengulang informasi. Kabag/Admin juga melihat chip <b>persetujuan menunggu</b> di sebelah kanan; klik untuk langsung ke Pusat Persetujuan.' },
    { sel: '#tourHelpBtn', judul: 'Tombol Bantuan (?)',
      isi: 'Ini kunci utamanya: <b>di halaman mana pun</b>, klik tombol ini untuk memulai tur panduan yang menjelaskan detail halaman tersebut langkah demi langkah.' },
    { sel: '#userChip', judul: 'Menu Akun',
      isi: 'Klik nama Anda untuk: <b>Ganti Password</b>, <b>Hubungkan Telegram</b> (agar notifikasi persetujuan masuk ke chat pribadi), dan <b>Keluar</b>. Admin juga menemukan pintasan ke halaman Pengaturan di sini.' }
  ],

  dashboard: [
    { sel: '#pdHariIni', judul: 'Denyut Hari Ini',
      isi: 'Kondisi kantor saat ini dalam satu baris: tamu, antrian aktif, presensi masuk, pengajuan menunggu, insiden terbuka, hingga stok ATK menipis. Titik <b>kuning/merah</b> menandai hal yang butuh perhatian sekarang.' },
    { sel: '#pdKpi', judul: 'Indikator Efektivitas Utama',
      isi: 'Empat bukti dampak aplikasi, selalu dibandingkan bulan lalu: <b>Transaksi Digital</b> (adopsi), <b>Kecepatan Keputusan</b> (jam dari diajukan sampai diputus), <b>Waktu Tunggu Antrian</b>, dan <b>Antrian Terselesaikan</b>. Chip <b>hijau</b> selalu berarti membaik — untuk ukuran waktu, justru <b>panah turun yang hijau</b> karena makin cepat makin baik.' },
    { sel: '#pdTren', judul: 'Aktivitas 14 Hari Terakhir',
      isi: 'Tiga garis sekaligus: <b>Tamu</b>, <b>Layanan kantor</b> (booking kendaraan/ruangan, ATK, BBM), dan <b>Presensi digital</b>. Arahkan kursor ke titik untuk angka pastinya — pola hari sibuk/sepi langsung terlihat.' },
    { sel: '#pdDonutBagian', judul: 'Tamu per Bagian',
      isi: 'Distribusi tujuan kunjungan tamu bulan berjalan — bagian mana yang paling banyak dikunjungi, lengkap dengan persentasenya.' },
    { sel: '#pdEfektif', judul: 'Tren Efektivitas 6 Bulan',
      isi: 'Inilah bukti jangka panjangnya: rata-rata <b>kecepatan keputusan</b> dan <b>waktu tunggu antrian</b> per bulan. <b>Garis yang menurun = pelayanan makin cepat</b> sejak aplikasi dipakai. Data janggal (mis. pengajuan menggantung berbulan-bulan) otomatis dikeluarkan dari rata-rata.' },
    { sel: '#pdDonutApproval', judul: 'Persetujuan & Sumber Daya',
      isi: 'Nasib seluruh pengajuan bulan ini (disetujui / menunggu / ditolak) plus bar <b>anggaran BBM</b>, <b>skor Eco Office</b>, dan <b>citra pemberitaan</b> — kesehatan sumber daya kantor dalam satu panel.' },
    { sel: '#pdTabelModul', judul: 'Tabel Ringkasan Modul',
      isi: 'Jumlah transaksi tiap modul: bulan ini vs bulan lalu, chip perubahan, dan porsi kontribusinya. Modul yang jarang dipakai langsung kelihatan — bahan evaluasi pemanfaatan aplikasi.' },
    { sel: '#pdInsight', judul: 'Insight Otomatis',
      isi: 'Sistem membaca angka-angka di atas lalu menuliskan temuan pentingnya dalam bahasa sehari-hari — capaian ditandai <b>hijau</b>, hal yang perlu ditindaklanjuti ditandai <b>merah</b>. Jujur dua arah: membaik maupun memburuk sama-sama dilaporkan.' },
    { sel: '#dashRefreshBtn', judul: 'Muat Ulang & Pembaruan Otomatis',
      isi: 'Seluruh halaman ini diambil dalam <b>satu panggilan ringan</b> dan menyegarkan diri tiap ±3 menit. Tombol ini memaksa pembaruan seketika, misalnya setelah Anda selesai menginput data.' }
  ],

  digitamu: [
    { sel: '#tamuAddBtn', judul: 'Daftarkan Tamu',
      isi: 'Pintu masuk utama: catat tamu baru (nama, instansi, keperluan, tujuan bagian, foto) — sistem langsung memberi <b>nomor antrian otomatis</b> sesuai bagian tujuan.' },
    { sel: '#tamuStats', judul: 'Statistik Tamu Hari Ini',
      isi: 'Total tamu, sedang menunggu, sedang dilayani, dan selesai — terbarui setiap ada perubahan status.' },
    { sel: '#listWaiting', judul: 'Antrian Menunggu',
      isi: 'Daftar tamu yang belum dipanggil, urut nomor antrian. Klik <b>Panggil</b> untuk memindahkannya ke kolom "Dilayani". Tombol <b>✈ Teruskan</b> (kabag+) mengirim Telegram ke <b>pegawai yang dituju tamu</b> — pengganti layar TV antrian yang sudah dipensiunkan. Setiap check-in mandiri tamu juga otomatis dikabarkan ke grup Telegram admin.' },
    { sel: '#listServing', judul: 'Sedang Dilayani',
      isi: 'Tamu yang sedang ditangani petugas. Klik <b>Selesai</b> saat pelayanan tuntas agar waktu selesainya tercatat.' },
    { sel: '#tamuSearch', judul: 'Pencarian & Riwayat',
      isi: 'Cari tamu berdasarkan nama/instansi. Tabel di bawahnya adalah riwayat lengkap kunjungan beserta statusnya.' }
  ],

  kendaraan: [
    { sel: '#kndStats', judul: 'Statistik Kendaraan',
      isi: 'Jumlah booking hari ini, kendaraan tersedia, dan pengajuan yang menunggu persetujuan.' },
    { sel: '#kndTabs', judul: 'Tiga Tab: Peminjaman, BBM & Servis Berkala',
      isi: '<b>Peminjaman</b>: pengajuan kendaraan dinas → disetujui kabag → KM berangkat/kembali dicatat driver. <b>BBM</b>: pengisian bahan bakar + struk & odometer. <b>Servis Berkala</b> (baru): laporan KM driver dirakit otomatis menjadi keputusan kapan tiap kendaraan harus diservis — jatuh tempo berdasarkan KM ATAU waktu, mana yang lebih dulu; kendaraan jatuh tempo juga ditagih lewat briefing pagi. Tombol <b>Catat Servis</b> memulai ulang hitungannya.' },
    { sel: '#kndAddBtn', judul: 'Ajukan Peminjaman',
      isi: 'Buat pengajuan baru. Setelah dikirim, notifikasi otomatis masuk ke grup Telegram approver; status bisa dipantau di tabel.' },
    { sel: '#kndFilterStatus', judul: 'Filter Status',
      isi: 'Saring daftar booking: menunggu, disetujui, ditolak, atau selesai.' }
  ],

  ruangan: [
    { sel: '#rgnJadwalTgl', judul: 'Jadwal Ruangan per Tanggal',
      isi: 'Pilih tanggal untuk melihat pemakaian seluruh ruang rapat hari itu — bentrok jadwal langsung terlihat sebelum mengajukan.' },
    { sel: '#rgnAddBtn', judul: 'Booking Ruangan',
      isi: 'Ajukan pemakaian ruangan: tanggal, jam mulai–selesai, keperluan, jumlah peserta, peralatan & konsumsi. Sistem menolak jam yang bertabrakan dengan booking lain yang sudah disetujui.' },
    { sel: '#rgnFilterStatus', judul: 'Daftar & Status Pengajuan',
      isi: 'Semua pengajuan beserta statusnya. Approver (kabag+) memutuskan lewat Pusat Persetujuan, dan hasilnya tampil di sini.' }
  ],

  atk: [
    { sel: '#atkStats', judul: 'Ringkasan ATK',
      isi: 'Total jenis barang, stok menipis (di bawah batas minimum), dan permintaan yang menunggu.' },
    { sel: '#atkTabs', judul: 'Tiga Tab ATK',
      isi: '<b>Stok</b>: master barang & jumlah tersedia — admin bisa menambah/koreksi stok. <b>Permintaan</b>: pengajuan barang oleh pegawai → disetujui → stok terpotong otomatis saat diambil. <b>Analisis</b>: grafik barang paling sering diminta & nilai pemakaian per bulan.' },
    { sel: '#atkRequestBtn', judul: 'Minta ATK',
      isi: 'Buat permintaan barang (bisa beberapa item sekaligus). Notifikasi masuk ke approver, dan Anda mendapat kabar saat disetujui/siap diambil.' },
    { sel: '#atkSearch', judul: 'Cari Barang',
      isi: 'Temukan barang di daftar stok berdasarkan nama atau kode.' }
  ],

  approval: [
    { sel: '#apvFilter', judul: 'Pusat Persetujuan — Satu Pintu',
      isi: 'Semua pengajuan yang menunggu keputusan berkumpul di sini: kendaraan, ruangan, ATK, izin/cuti & lembur TAD, hingga izin magang. Gunakan filter ini untuk menyaring per modul.' },
    { sel: '#apvList', judul: 'Kartu Pengajuan',
      isi: 'Setiap kartu memuat rincian lengkap + tombol <b>Setujui / Tolak</b>. Saat memutuskan, Anda bisa menulis catatan dan memilih penugasan (mis. driver & kendaraan untuk booking). Pemohon otomatis diberi tahu via Telegram/email.' },
    { sel: '#apvPesanBtn', judul: 'Kirim Pesan',
      isi: 'Kirim pesan manual ke pemohon, grup Telegram, subscriber, atau email — misalnya meminta kelengkapan data sebelum menyetujui.' }
  ],

  magang: [
    { sel: '#mgStats', judul: 'Statistik Magang',
      isi: 'Peserta aktif, hadir hari ini, logbook menunggu review, dan tugas berjalan.' },
    { sel: '#mgTabs', judul: 'Tab Pengelolaan Magang',
      isi: '<b>Peserta</b>: data lengkap + sertifikat. <b>Presensi</b>: rekap harian check-in/out berfoto & lokasi. <b>Logbook</b>: catatan kegiatan harian peserta untuk direview pembimbing. <b>Tugas</b>: penugasan + penilaian. <b>Izin</b>: pengajuan sakit/izin peserta.' },
    { sel: '#mgAddBtn', judul: 'Tambah Peserta',
      isi: 'Daftarkan peserta magang baru — atau terima otomatis dari form lamaran publik (?page=lamaran-magang) yang masuk.' },
    { sel: '#mgPresManualBtn', judul: 'Presensi Manual',
      isi: 'Untuk kondisi khusus (HP peserta bermasalah), admin bisa mencatatkan presensi secara manual di sini.' }
  ],

  'magang-self': [
    { sel: '#msNama', judul: 'Portal Magang — Identitas Anda',
      isi: 'Kartu identitas Anda sebagai peserta: nama, kampus, periode, dan status keaktifan.' },
    { sel: '#msForm', judul: 'Presensi Harian',
      isi: 'Check-in saat datang & check-out saat pulang: <b>wajib selfie</b> dan hanya bisa dilakukan <b>di area kantor</b> (GPS). Riwayat 30 hari terakhir tampil di bawah, sadar kalender libur.' },
    { sel: '#msTabs', judul: 'Tab Portal',
      isi: '<b>Presensi</b>, <b>Logbook</b> (isi kegiatan harian Anda — direview pembimbing), <b>Tugas</b> (kerjakan & unggah hasil), <b>Izin/Sakit</b> (ajukan dengan lampiran surat), dan <b>Data Saya</b>.' }
  ],

  'tad-self': [
    { sel: '#tsNama', judul: 'Portal TAD — Identitas Anda',
      isi: 'Portal mandiri untuk Tenaga Alih Daya (Driver, CSO, Security): identitas, presensi, izin/cuti, lembur/SKPD, dan data diri.' },
    { sel: '#tsTabPresensi', judul: 'Tab Presensi (Driver & CSO)',
      isi: 'Satu tombol pintar: klik pertama = <b>masuk</b>, klik berikutnya = <b>pulang</b>. Wajib foto & berada di area kantor. Riwayat 30 hari sadar kalender: hari libur tidak dihitung tanpa-catatan. <i>Catatan: personel Security tidak melihat tab ini — presensi shift Security lewat halaman Security.</i>' },
    { sel: '#tsTabs', judul: 'Tab Lainnya',
      isi: '<b>Izin/Cuti</b>: ajukan dengan rentang tanggal & lampiran — bila disetujui, presensi Anda otomatis terisi. <b>Lembur/SKPD</b>: rencana kegiatan (bisa multi-hari, maks 14 hari) → disetujui → <b>Surat Tugas digital ber-TTD</b> terbit → unggah <b>bukti foto</b> setelah pelaksanaan. <b>Data Saya</b>: profil lengkap yang bisa Anda perbarui sendiri.' }
  ],

  tad: [
    { sel: '#tadStats', judul: 'Ringkasan TAD',
      isi: 'Kehadiran hari ini per kategori (Security, Driver, Cleaning Service) & pengajuan menunggu.' },
    { sel: '#tadTabs', judul: 'Tab Pengelolaan (Kabag+)',
      isi: '<b>Presensi</b>: rekap harian semua personel. <b>Rekap Bulanan</b>: kehadiran per personel per bulan — siap untuk penggajian. <b>Izin/Cuti</b> & <b>Lembur/SKPD</b>: pantau seluruh pengajuan + surat tugas & bukti foto. <b>Personel</b>: data master lengkap tiap kategori.' },
    { sel: '#tadFilterKategori', judul: 'Filter Kategori',
      isi: 'Saring tampilan hanya Security, Driver, atau Cleaning Service.' }
  ],

  security: [
    { sel: '#secStats', judul: 'Ringkasan Security',
      isi: 'Personel aktif, hadir hari ini, insiden belum selesai, dan patroli hari ini.' },
    { sel: '#secMasukBtn', judul: 'Presensi Masuk Shift',
      isi: 'Personel security absen di sini (bukan di Portal TAD): pilih shift (Pagi 07.00–15.00 / Sore 15.00–23.00 / Malam 23.00–07.00), <b>wajib foto eviden</b>, dan <b>hanya bisa di area kantor</b> (GPS). Setiap presensi otomatis terkirim ke grup Telegram security lengkap foto + titik lokasi. Presensi pada hari libur nasional otomatis berstatus <b>Lembur</b>.' },
    { sel: '#secTabs', judul: 'Empat Tab Security',
      isi: '<b>Presensi</b>: daftar shift hari ini + tombol keluar/serah terima. <b>Jadwal Shift</b>: pola rotasi <b>2 hari pagi → 2 hari malam → 2 hari libur</b> (Sabtu/Minggu hari biasa) dengan indikator kepatuhan: Pagi & Malam masing-masing minimal 2 personel/hari; libur nasional = piket 2 personel (lembur). Kabag punya tombol "Terapkan Pola 2-2-2" untuk mengisi otomatis. <b>Insiden</b>: laporan kejadian (wajib foto, GPS otomatis, terkirim ke grup). <b>Patroli</b>: catat kunjungan checkpoint berfoto.' },
    { sel: '#secPresTgl', judul: 'Lihat Tanggal Lain',
      isi: 'Ganti tanggal untuk memeriksa presensi shift hari sebelumnya.' }
  ],

  agenda: [
    { sel: '#agdHariIni', judul: 'Panel Hari Ini & Besok',
      isi: 'Jawaban tercepat untuk "pimpinan ada acara apa hari ini?". Tombol <b>Salin agenda hari ini</b> menyalin ringkasan siap-tempel ke grup WhatsApp/Telegram.' },
    { sel: '#agdStats', judul: 'Ringkasan Agenda',
      isi: 'Total bulan ini, agenda hari ini, yang masih terjadwal, dan yang batal.' },
    { sel: '#agdAddBtn', judul: 'Tambah Agenda — Multi-Pimpinan',
      isi: 'Centang <b>lebih dari satu pimpinan</b> sekaligus (Kepala Cabang + kabag pendamping). Deteksi bentrok berlaku per pimpinan terpilih, dan lokasi dicek terhadap Booking Ruangan. Tombol <b>Ingatkan</b> di tabel mengirim detail agenda langsung ke Telegram pribadi tiap pimpinan (fallback email dari Kelola Pimpinan). Tombol <b>Duplikat</b> mempercepat agenda berulang.' },
    { sel: '#agdTabs', judul: 'Tampilan Daftar & Kalender',
      isi: 'Lihat sebagai tabel (bisa difilter status/bulan) atau kalender bulanan untuk gambaran visual. Agenda hari ini juga otomatis masuk <b>briefing pagi Telegram</b>.' },
    { sel: '#agdPimpinanBtn', judul: 'Kelola Pimpinan',
      isi: 'Admin menambah/mengubah daftar pimpinan yang agendanya dikelola.' }
  ],

  budaya: [
    { sel: '#bdyHariIni', judul: 'Kegiatan Hari Ini + Catat Keterlaksanaan',
      isi: 'Kegiatan rutin yang jatuh hari ini tampil di sini — tandai <b>Terlaksana</b> atau <b>Tidak</b> (dengan alasan). Dari situ terhitung <b>persentase keterlaksanaan bulanan</b> dan kegiatan yang paling sering terlewat: kalender berubah jadi alat akuntabilitas, bukan pajangan.' },
    { sel: '#bdyAddBtn', judul: 'Tambah Kegiatan Budaya',
      isi: 'Kegiatan rutin kantor (apel, senam, doa bersama, briefing) — bisa disetel <b>berulang</b> harian/mingguan/bulanan dengan warna penanda.' },
    { sel: '#bdyTabs', judul: 'Kalender & Daftar',
      isi: 'Kalender memperlihatkan seluruh kegiatan sebulan (gabungan dengan agenda pimpinan); tab Daftar untuk mengelola satu per satu.' }
  ],

  sosmed: [
    { sel: '#ssmStats', judul: 'Ringkasan + Deteksi Terlambat',
      isi: 'Selain jumlah per status, kartu <b>Terlambat Tayang</b> menghitung konten yang lewat tanggal tapi belum tayang — tunggakan nyata yang juga dikirim di briefing pagi.' },
    { sel: '#ssmSorot', judul: 'Sorotan',
      isi: 'Peringatan tunggakan + <b>konten terbaik bulan ini</b> (engagement tertinggi) sebagai acuan konten berikutnya.' },
    { sel: '#ssmAddBtn', judul: 'Rencanakan Konten',
      isi: 'Platform, jenis, caption, hashtag, jadwal. Di tabel ada tombol <b>Salin</b> (caption + hashtag siap-tempel saat posting), <b>→ Jadwalkan</b> untuk draft, dan <b>Metrik</b> untuk mengisi performa setelah tayang.' },
    { sel: '#ssmTabs', judul: 'Daftar & Kalender Konten',
      isi: 'Pantau pipeline konten sebagai tabel atau kalender publikasi bulanan.' },
    { sel: '#ssmExportBtn', judul: 'Export',
      isi: 'Unduh data konten & metrik ke CSV untuk laporan.' }
  ],

  berita: [
    { sel: '#brtStats', judul: 'Ringkasan + Tunggakan',
      isi: 'Sentimen bulan berjalan plus kartu <b>Negatif Belum Ditindaklanjuti</b> — dihitung dari seluruh arsip, karena berita negatif lama yang menggantung justru paling berbahaya.' },
    { sel: '#brtAddBtn', judul: 'Catat Pemberitaan',
      isi: 'Rekam berita yang menyebut kantor: media, judul, kategori, <b>sentimen</b>, tautan & bukti tayang.' },
    { sel: '#brtFilterSentimen', judul: 'Tindak Lanjut & Export',
      isi: 'Baris berita negatif punya tombol <b>Tindak Lanjut</b>: catat status penanganan (proses → selesai) beserta langkahnya. Belum selesai? Muncul terus di briefing pagi sampai dituntaskan.' }
  ],

  eco: [
    { sel: '#ecoInsight', judul: 'Insight & Loop Temuan',
      isi: 'Status <b>shift hari ini</b>, <b>3 item paling sering terlewat</b>, dan tren skor 14 hari. Yang baru: item yang terlewat otomatis menjadi <b>Temuan terbuka</b> di tab Temuan — siapa pun (petugas kebersihan maupun pegawai) menuntaskannya lalu menandai beres dengan catatan tindak lanjut. Checklist berhenti jadi sekadar angka: ia menghasilkan pekerjaan yang jelas, dan temuan menggantung ditagih briefing pagi.' },
    { sel: '#ecoShift', judul: 'Checklist Eco Office',
      isi: 'Checklist harian hemat energi & kerapian yang diisi petugas per shift — bila shift pagi sudah terisi, pilihan otomatis pindah ke sore.' },
    { sel: '#ecoRing', judul: 'Skor Kepatuhan',
      isi: 'Persentase item terpenuhi hari itu — langsung terhitung saat Anda mencentang.' },
    { sel: '#ecoTabs', judul: 'Riwayat & Peringkat',
      isi: 'Riwayat pengisian per bulan dan papan peringkat petugas paling rajin.' }
  ],

  laporan: [
    { sel: '#lapModul', judul: 'Pilih Modul Sumber',
      isi: 'Tarik data lintas modul dari satu tempat: tamu, kendaraan, BBM, ruangan, ATK, presensi magang/TAD/security, insiden, dan lainnya.' },
    { sel: '#lapDari', judul: 'Rentang Tanggal',
      isi: 'Batasi data pada periode tertentu — misalnya satu bulan untuk laporan bulanan.' },
    { sel: '#lapTampilBtn', judul: 'Tampilkan → Ringkasan, CSV / Cetak',
      isi: 'Klik <b>Tampilkan</b>: selain pratinjau, muncul <b>Ringkasan Eksekutif</b> (total, sebaran status/kategori, penjumlahan biaya) plus <b>Catatan Analisis</b> otomatis. <b>Cetak</b> membuka <b>Pengaturan Cetak</b>: ukuran font, margin, kertas (A4/F4/Letter/Legal), orientasi tegak/mendatar, subjudul, serta blok "Mengetahui" (KABAG) — pilihan tersimpan otomatis untuk pencetakan berikutnya. Hasilnya dokumen berkop GESIT dengan kartu ringkasan, tabel rapi berulang tiap halaman, kolom angka rata kanan, dan blok tanda tangan — siap disodorkan ke pimpinan tanpa diedit lagi.' }
  ],

  users: [
    { sel: '#userAddBtn', judul: 'Tambah User',
      isi: 'Buat akun baru dan pilih role-nya: <b>staff</b> (layanan kantor), <b>driver / cso / security</b> (portal tugas masing-masing), <b>kabag</b> (persetujuan & data SDM), <b>admin</b> (semua + pengaturan). Akses menu tiap role dibatasi otomatis (least-privilege).' },
    { sel: '#userTableBody', judul: 'Kelola Akun',
      isi: 'Ubah role, reset password, non-aktifkan akun, dan lihat login terakhir. Akun hasil <b>pendaftaran mandiri</b> juga muncul di sini untuk diaktifkan bila pengaturan mensyaratkan persetujuan admin.' }
  ],

  pengaturan: [
    { sel: '#setTabs', judul: 'Pengaturan Aplikasi — Peta Tab',
      isi: '<b>Telegram & Bot</b>: token bot, aktivasi webhook, Chat ID 3 grup + tombol Tes per grup. <b>Email</b>: saklar fallback + tes kirim. <b>Presensi & Lokasi</b>: geofence (koordinat kantor & radius). <b>Kalender & Libur</b>: koreksi hari libur. <b>Registrasi Akun</b>: buka/tutup pendaftaran & lamaran magang. <b>Dokumen & Surat</b>: penandatangan sertifikat/surat tugas. <b>Diagnosa & Log</b>: cek kesehatan komunikasi + riwayat pengiriman.' },
    { sel: '#setBotToken', judul: 'Bot Token (Tersamar)',
      isi: 'Token dari @BotFather. Demi keamanan, token tersimpan <b>tidak pernah dikirim kembali ke browser</b> — kolom ini selalu kosong; isi hanya bila mengganti token, kosongkan untuk tetap memakai yang lama. Tombol <b>Hapus</b> untuk mencabutnya.' },
    { sel: '#setAktifkanBot', judul: 'Aktifkan, Diagnosa & Cek Bot',
      isi: '<b>Aktifkan Bot (otomatis)</b> memilih sendiri jalur terbaik: webhook (instan) — atau, bila Telegram menolak respons Apps Script (error 302), otomatis beralih ke <b>polling berkala (tiap 1 menit)</b>, membuang antrean lama, dan mengingat pilihannya 7 hari. <b>Diagnosa Lengkap</b> memeriksa token, jalur masuk, konflik mode, antrean, sirkuit anti-spam, hingga kelengkapan grup — setiap masalah tampil bersama solusinya. Penjaga harian juga memeriksa & memperbaiki jalur otomatis, lalu melapor ke email admin.' },
    { sel: '#setGrupAdmin', judul: 'Chat ID Grup + Tombol Tes',
      isi: 'Isi Chat ID tiap grup (masukkan bot ke grup → ketik <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace">/id</span> → salin angka balasannya). Tombol <b>Tes</b> di samping tiap kolom menyimpan pengaturan lalu mengirim pesan percobaan — bila gagal, penyebab & solusinya ditampilkan, sehingga kesalahan konfigurasi tidak pernah sampai menjadi error di pengguna lain.' },
    { sel: '#setSubmit', judul: 'Simpan dengan Validasi',
      isi: 'Semua isian divalidasi sebelum tersimpan: format token, Chat ID harus angka, koordinat & radius masuk akal, format hari libur benar. Isian salah <b>ditolak dengan pesan jelas</b>, bukan tersimpan diam-diam.' },
    { sel: '#setReloadBtn', judul: 'Diagnosa & Log (tab terakhir)',
      isi: 'Jangan lewatkan tab <b>Diagnosa & Log</b>: satu klik memeriksa token, webhook, kelengkapan grup, kuota email, dan kegagalan kirim 7 hari terakhir — lengkap dengan log setiap notifikasi beserta alasan gagalnya.' }
  ]
};

/* ── MESIN TUR ──
   V6.7 — dirombak agar presisi di HP:
   • Elemen di dalam sidebar off-canvas (mobile) dulu dianggap "tampil" oleh
     getBoundingClientRect (lebar > 0 walau tergeser -100%) sehingga spotlight
     menyorot area kosong. Kini visibilitas juga memeriksa irisan horizontal
     dengan viewport; khusus elemen sidebar, tur MEMBUKA sidebar otomatis
     lalu menutupnya kembali saat berpindah langkah.
   • Kartu penjelasan menjadi bottom-sheet di layar sempit (jangkauan jempol),
     dengan isi yang bisa digulir bila teks panjang.
   • Posisi spotlight MENGIKUTI scroll/resize (rAF-throttle) — tidak lagi
     meleset saat pengguna menggulir atau address-bar HP berubah tinggi.
   • Perpindahan langkah menunggu scrollIntoView benar-benar BERHENTI
     (deteksi posisi stabil), bukan tebakan 320 ms yang sering kalah cepat
     dari animasi gulir HP.
   • Geser kiri/kanan pada kartu = Selanjutnya/Sebelumnya.                  */
var TourGuide = {
  aktif: false,
  steps: [],
  idx: 0,
  _spot: null, _tip: null, _blocker: null,
  _onKey: null, _onResize: null, _onScroll: null,
  _sbDibukaTur: false,
  _rafPending: false,

  _isMobile: function () {
    try { return window.matchMedia('(max-width: 768px)').matches; }
    catch (e) { return window.innerWidth <= 768; }
  },

  _inSidebar: function (el) {
    if (!el) return false;
    if (el.closest) return !!el.closest('.sidebar');
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('sidebar')) return true;
      el = el.parentNode;
    }
    return false;
  },

  _sidebarTerbuka: function () {
    var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
    return !!(sb && sb.classList.contains('is-open'));
  },

  /* Elemen dianggap bisa dituju bila punya dimensi DAN
     (beririsan dengan viewport secara horizontal ATAU berada di sidebar —
      sidebar bisa kami buka sendiri di HP). */
  _visible: function (el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (r.width <= 2 || r.height <= 2) return false;
    try {
      var cs = window.getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    } catch (e) {}
    var vw = window.innerWidth;
    var diLayar = r.right > 0 && r.left < vw;
    if (diLayar) return true;
    return TourGuide._inSidebar(el); // off-canvas kiri = sidebar tertutup (mobile)
  },

  _bukaSidebar: function () {
    var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
    if (!sb || sb.classList.contains('is-open')) return false;
    sb.classList.add('is-open');
    TourGuide._sbDibukaTur = true;
    return true; // baru dibuka → beri waktu transisi
  },

  _tutupSidebarBilaPerlu: function () {
    if (!TourGuide._sbDibukaTur) return;
    var sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
    if (sb) sb.classList.remove('is-open');
    var ov = document.getElementById('sidebarOverlay');
    if (ov) ov.classList.remove('is-visible');
    TourGuide._sbDibukaTur = false;
  },

  start: function (view, denganIntro) {
    TourGuide.end(); // bersihkan tur sebelumnya
    var daftar = [];
    if (denganIntro) daftar = daftar.concat(TOUR_STEPS.intro || []);
    daftar = daftar.concat(TOUR_STEPS[view] || []);
    // saring langkah yang elemennya tidak tampil untuk role/tab saat ini
    TourGuide.steps = daftar.filter(function (st) {
      if (!st.sel) return true;
      return TourGuide._visible(document.querySelector(st.sel));
    });
    if (!TourGuide.steps.length) {
      Toast.info('Belum ada panduan untuk halaman ini');
      return;
    }
    TourGuide.aktif = true;
    document.body.classList.add('gesit-tour-active');
    TourGuide.idx = 0;

    TourGuide._blocker = document.createElement('div');
    TourGuide._blocker.className = 'tour-blocker is-active';
    TourGuide._spot = document.createElement('div');
    TourGuide._spot.className = 'tour-spot is-active';
    TourGuide._tip = document.createElement('div');
    TourGuide._tip.className = 'tour-tip';
    // sembunyikan sampai posisi pertama terhitung — mencegah kedip di (0,0)
    TourGuide._spot.style.visibility = 'hidden';
    TourGuide._tip.style.visibility = 'hidden';
    document.body.appendChild(TourGuide._blocker);
    document.body.appendChild(TourGuide._spot);
    document.body.appendChild(TourGuide._tip);

    TourGuide._onKey = function (e) {
      if (!TourGuide.aktif) return;
      if (e.key === 'Escape') TourGuide.end();
      else if (e.key === 'ArrowRight') TourGuide.next();
      else if (e.key === 'ArrowLeft') TourGuide.prev();
    };
    // Reposisi ringan (geometri saja) saat scroll/resize — spotlight tetap
    // menempel pada elemennya walau pengguna menggulir di balik tur.
    var reposisi = function () {
      if (!TourGuide.aktif || TourGuide._rafPending) return;
      TourGuide._rafPending = true;
      requestAnimationFrame(function () {
        TourGuide._rafPending = false;
        if (TourGuide.aktif) TourGuide._place();
      });
    };
    TourGuide._onResize = reposisi;
    TourGuide._onScroll = reposisi;
    document.addEventListener('keydown', TourGuide._onKey);
    window.addEventListener('resize', TourGuide._onResize);
    window.addEventListener('scroll', TourGuide._onScroll, true); // capture: ikut scroller dalam
    if (window.visualViewport) {
      try { window.visualViewport.addEventListener('resize', TourGuide._onResize); } catch (e) {}
    }

    // Geser kiri/kanan pada kartu untuk navigasi (HP)
    (function (tip) {
      var x0 = null, y0 = null;
      tip.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) { x0 = null; return; }
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      }, { passive: true });
      tip.addEventListener('touchend', function (e) {
        if (x0 === null || !e.changedTouches.length) return;
        var dx = e.changedTouches[0].clientX - x0;
        var dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) TourGuide.next(); else TourGuide.prev();
        }
      }, { passive: true });
    })(TourGuide._tip);

    TourGuide.render(true);
  },

  /* Tunggu elemen berhenti bergerak (scroll smooth selesai) sebelum menyorot.
     Maks ±900 ms — jauh lebih andal dari tebakan waktu tetap di HP. */
  _setelahDiam: function (el, cb) {
    var terakhir = null, stabil = 0, mulai = Date.now();
    var cek = function () {
      if (!TourGuide.aktif) return;
      var y = el.getBoundingClientRect().top;
      if (terakhir !== null && Math.abs(y - terakhir) < 1) stabil++; else stabil = 0;
      terakhir = y;
      if (stabil >= 2 || Date.now() - mulai > 900) { cb(); return; }
      requestAnimationFrame(cek);
    };
    requestAnimationFrame(cek);
  },

  render: function (gulir) {
    var st = TourGuide.steps[TourGuide.idx];
    if (!st) { TourGuide.end(); return; }
    var el = st.sel ? document.querySelector(st.sel) : null;

    // Kelola sidebar (mobile): buka bila langkah menyorot isi sidebar,
    // tutup kembali begitu langkah keluar dari sidebar.
    var jeda = 0;
    if (el && TourGuide._inSidebar(el)) {
      if (TourGuide._isMobile() && !TourGuide._sidebarTerbuka()) {
        if (TourGuide._bukaSidebar()) jeda = 280; // tunggu transisi sidebar
      }
    } else {
      TourGuide._tutupSidebarBilaPerlu();
    }

    var lanjut = function () {
      TourGuide._renderCard(st);
      if (el && gulir && !TourGuide._inSidebar(el)) {
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        catch (e) { el.scrollIntoView(); }
        try { var sc=document.querySelector('.main'); if(sc){ var er=el.getBoundingClientRect(); var sr=sc.getBoundingClientRect(); sc.scrollTop += (er.top - sr.top) - (sr.height/2) + (er.height/2); } } catch(e) {}
        TourGuide._setelahDiam(el, function () { TourGuide._place(); });
      } else {
        TourGuide._place();
      }
    };
    if (jeda) setTimeout(lanjut, jeda); else lanjut();
  },

  /* Bangun ISI kartu — hanya saat berganti langkah (bukan tiap scroll) */
  _renderCard: function (st) {
    var tip = TourGuide._tip;
    if (!tip) return;
    var akhir = TourGuide.idx === TourGuide.steps.length - 1;
    tip.innerHTML =
      '<div class="tour-tip-step">Langkah ' + (TourGuide.idx + 1) + ' dari ' + TourGuide.steps.length + '</div>' +
      '<div class="tour-tip-title">' + st.judul + '</div>' +
      '<div class="tour-tip-body">' + st.isi + '</div>' +
      '<div class="tour-tip-actions">' +
      '<button class="tour-tip-skip" id="tourSkip">Lewati tur</button>' +
      '<button class="tour-btn" id="tourPrev"' + (TourGuide.idx === 0 ? ' disabled' : '') + '>&#8592; Sebelumnya</button>' +
      '<button class="tour-btn tour-btn-primary" id="tourNext">' + (akhir ? 'Selesai ' + iconSvg('check','btn-icon') : 'Selanjutnya') + '</button>' +
      '</div>';
    var bSkip = tip.querySelector('#tourSkip');
    var bPrev = tip.querySelector('#tourPrev');
    var bNext = tip.querySelector('#tourNext');
    if (bSkip) bSkip.addEventListener('click', TourGuide.end);
    if (bPrev) bPrev.addEventListener('click', TourGuide.prev);
    if (bNext) bNext.addEventListener('click', TourGuide.next);
  },

  /* Tempatkan GEOMETRI spotlight + kartu — murah, aman dipanggil tiap scroll */
  _place: function () {
    var st = TourGuide.steps[TourGuide.idx];
    var spot = TourGuide._spot, tip = TourGuide._tip;
    if (!st || !spot || !tip) return;
    var el = st.sel ? document.querySelector(st.sel) : null;
    var vw = window.innerWidth, vh = window.innerHeight;
    var mobile = TourGuide._isMobile();
    var r = null;

    if (el && TourGuide._visible(el) &&
        (!TourGuide._inSidebar(el) || !mobile || TourGuide._sidebarTerbuka())) {
      r = el.getBoundingClientRect();
      spot.classList.remove('tour-spot-center');
      var sTop = Math.max(r.top - 6, 4);
      var sLeft = Math.max(r.left - 6, 4);
      spot.style.top = sTop + 'px';
      spot.style.left = sLeft + 'px';
      spot.style.width = Math.min(r.width + 12, vw - sLeft - 4) + 'px';
      spot.style.height = Math.min(r.height + 12, vh - 8) + 'px';
    } else {
      // kartu tengah (langkah tanpa target / target tak terjangkau)
      spot.classList.add('tour-spot-center');
      spot.style.top = (vh / 2) + 'px';
      spot.style.left = (vw / 2) + 'px';
      spot.style.width = '0px';
      spot.style.height = '0px';
      r = null;
    }

    if (mobile) {
      // BOTTOM SHEET: posisi tetap di bawah, mudah dijangkau jempol —
      // CSS .is-sheet yang mengatur left/right/bottom; bersihkan inline.
      tip.classList.add('is-sheet');
      tip.style.top = ''; tip.style.left = ''; tip.style.width = '';
      spot.style.visibility = 'visible';
      tip.style.visibility = 'visible';
      return;
    }
    tip.classList.remove('is-sheet');

    var tw = Math.min(350, vw - 28);
    tip.style.width = tw + 'px';
    var th = tip.offsetHeight || 180;
    var top, left;
    if (r) {
      if (r.bottom + th + 22 < vh) top = r.bottom + 14;
      else if (r.top - th - 22 > 0) top = r.top - th - 14;
      else top = Math.max(12, (vh - th) / 2);
      left = Math.min(Math.max(12, r.left), vw - tw - 12);
    } else {
      top = Math.max(12, (vh - th) / 2);
      left = (vw - tw) / 2;
    }
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    spot.style.visibility = 'visible';
    tip.style.visibility = 'visible';
  },

  next: function () {
    if (TourGuide.idx >= TourGuide.steps.length - 1) { TourGuide.end(); return; }
    TourGuide.idx++;
    TourGuide.render(true);
  },

  prev: function () {
    if (TourGuide.idx === 0) return;
    TourGuide.idx--;
    TourGuide.render(true);
  },

  end: function () {
    TourGuide.aktif = false;
    document.body.classList.remove('gesit-tour-active');
    document.body.classList.remove('gesit-tour-active');
    TourGuide._tutupSidebarBilaPerlu();
    ['_blocker', '_spot', '_tip'].forEach(function (k) {
      if (TourGuide[k] && TourGuide[k].parentNode) TourGuide[k].parentNode.removeChild(TourGuide[k]);
      TourGuide[k] = null;
    });
    if (TourGuide._onKey) { document.removeEventListener('keydown', TourGuide._onKey); TourGuide._onKey = null; }
    if (TourGuide._onResize) {
      window.removeEventListener('resize', TourGuide._onResize);
      if (window.visualViewport) {
        try { window.visualViewport.removeEventListener('resize', TourGuide._onResize); } catch (e) {}
      }
      TourGuide._onResize = null;
    }
    if (TourGuide._onScroll) { window.removeEventListener('scroll', TourGuide._onScroll, true); TourGuide._onScroll = null; }
  },

  /* ── Tur orientasi otomatis SEKALI untuk pengguna baru di perangkat ini ── */
  _sudahOtomatis: false,
  _tandaTersimpan: function () {
    try { return localStorage.getItem('sg_tour_intro') === '1'; } catch (e) { return TourGuide._sudahOtomatis; }
  },
  _simpanTanda: function () {
    TourGuide._sudahOtomatis = true;
    try { localStorage.setItem('sg_tour_intro', '1'); } catch (e) { /* sandbox melarang — cukup tanda memori */ }
  },
  autoMaybe: function (view) {
    if (TourGuide._sudahOtomatis || TourGuide._tandaTersimpan()) return;
    if (!window.Auth || !Auth.user) return;
    TourGuide._simpanTanda();
    // beri waktu data & ikon halaman selesai dirender
    setTimeout(function () { TourGuide.start(view, true); }, 900);
  }
};

/* ── PEMASANGAN: tombol "?" + auto-tur setelah login pertama ── */
(function () {
  var pasangTour = function () {
    var btn = document.getElementById('tourHelpBtn');
    if (btn) btn.addEventListener('click', function () {
      TourGuide.start(Router.current || 'dashboard', false);
    });
    // Bungkus Router.go agar tur orientasi berjalan otomatis sekali setelah login
    if (window.Router && Router.go && !Router._tourWrapped) {
      var asli = Router.go;
      Router.go = function (view) {
        asli(view);
        TourGuide.autoMaybe(Router.current);
      };
      Router._tourWrapped = true;
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pasangTour);
  } else {
    pasangTour();
  }
})();

// Ekspos untuk debugging
window.TourGuide = TourGuide;
