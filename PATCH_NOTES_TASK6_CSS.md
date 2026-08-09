# Patch Task 6 - CSS Public

File yang diperbaiki:

- `public/css/pwa.css`

Alasan hanya `pwa.css` yang diganti:

- `pwa.css` dimuat paling akhir di `public/index.html`, sehingga paling aman digunakan sebagai override tanpa mengacak cascade CSS besar yang sudah ada.
- Tiga file CSS awal dan tiga file CSS akhir terbaca tanpa parse error.

Fokus patch:

1. Stabilitas layout layar besar.
2. Pencegahan horizontal overflow.
3. Target sentuh minimal 44px untuk tombol, tab, nav item, dan input.
4. Perbaikan login/register mobile agar form panjang tetap bisa digulir dan tidak terpotong.
5. Page actions dibuat lebih nyaman untuk penggunaan satu tangan di mobile.
6. Tabel dibuat overflow horizontal di dalam kontainer, bukan melebar merusak halaman.
7. Pengurangan efek berat di perangkat touch untuk mengurangi jank.

Setelah replace file, lakukan hard refresh:

```text
Ctrl + F5
```

Lalu cek halaman login, dashboard, manajemen user, dan salah satu tabel data di mobile dan desktop.
