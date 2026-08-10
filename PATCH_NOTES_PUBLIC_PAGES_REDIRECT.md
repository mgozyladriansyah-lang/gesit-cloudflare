# GESIT Public Pages Redirect Patch

## Masalah

Saat tombol **Buka** pada modal **Tautan Halaman Publik** diklik, browser membuka URL Cloudflare seperti:

```text
https://gesit-cloudflare.pages.dev/?page=checkin
```

Karena halaman publik `?page=...` masih berasal dari Apps Script `doGet`, Cloudflare static app hanya memuat SPA biasa dan akhirnya kembali ke login. Itu membuat pengguna mengira tautan publik rusak.

## Perbaikan

Patch ini menambahkan Cloudflare Pages Function catch-all:

```text
functions/[[path]].js
```

Fungsi ini akan menangkap request GET yang memiliki query `page` publik:

- `checkin`
- `checkin-bbm`
- `checkin-tad`
- `checkin-magang`
- `lamaran-magang`
- `presensi-magang`

Lalu redirect ke URL Apps Script dari environment variable:

```text
GAS_WEB_APP_URL
```

Dengan begitu link Cloudflare tetap boleh dibagikan, tetapi pengunjung diarahkan ke halaman publik GAS yang memang tidak butuh login.

## Wajib diset di Cloudflare

Tambahkan Environment Variable di Production dan Preview bila memakai preview URL:

```text
GAS_WEB_APP_URL = https://script.google.com/macros/s/xxxxx/exec
```

## Cara deploy

```powershell
git add -A
git commit -m "Fix public page links redirect"
git push origin main
```

Setelah Cloudflare deploy sukses, tes:

```text
https://gesit-cloudflare.pages.dev/?page=checkin
```

Hasil benar: browser redirect ke URL Apps Script `.../exec?page=checkin`, bukan kembali ke login GESIT.
