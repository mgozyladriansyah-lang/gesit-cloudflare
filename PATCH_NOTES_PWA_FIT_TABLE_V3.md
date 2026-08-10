# GESIT PWA Fit & Table Patch V3

Patch ini hanya mengganti `public/css/pwa.css` dengan versi yang ditambahkan lapisan responsif di bagian paling bawah.

Fokus perbaikan:

- Layout PWA/mobile tidak melebar keluar viewport.
- Grid, card, form, page-action, dan tab strip menjadi fit di iPhone SE/layar kecil.
- Tabel scroll horizontal di dalam `.table-wrap`, bukan membuat seluruh halaman melebar.
- Profil magang/TAD, tab Presensi/Logbook/Data Saya/Tugas, tombol check-in, dan upload file lebih aman di layar kecil.
- Modal konfirmasi logout tetap terlihat.
- Tour tooltip dan spotlight dibatasi viewport.

File yang diganti:

- `public/css/pwa.css`

Tidak menambahkan `login-final-fix`, `login-stability-hotfix`, atau trap input login.
