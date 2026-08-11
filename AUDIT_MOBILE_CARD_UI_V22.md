# GESIT V22 Mobile Card UI and Admin User Management

Versi: 2026.08.11.19

## Keputusan sesuai arahan

- Banner penjelas seperti `Fokus Fokus` dihapus dan tidak dimuat lagi.
- Theme warna role tambahan dari V20/V21 tidak dimuat lagi.
- Fokus diarahkan ke peningkatan UI/CS mobile: tabel desktop dikemas menjadi kartu/list mobile.
- Bottom nav Super Admin/Admin tidak lagi memakai tombol Profil yang tidak jelas hasilnya. Tombol tersebut menjadi **User** dan membuka **Manajemen User** jika akses tersedia.

## Peningkatan mobile

- Tabel di PWA mobile otomatis menjadi kartu dengan label field. Desktop tetap tabel.
- Halaman Manajemen User mendapat toolbar mobile: pencarian, filter Semua/Aktif/Nonaktif, dan row kartu dengan avatar inisial.
- Header dan tombol aksi mobile dibuat lebih ringkas, sesuai layar kecil.

## Safety

- Tidak memakai MutationObserver.
- Tidak memakai setInterval.
- Tidak monkey-patch Router.
- Tidak mengubah business logic dan skema data.
- Validasi `node --check` dilakukan pada script utama.
