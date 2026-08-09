# GESIT Netlify PWA Ready

Paket ini sudah diperiksa ulang dan ditambah dukungan PWA.

## Setelah upload ke Netlify
Tambahkan Environment Variable:

GAS_WEB_APP_URL=https://script.google.com/macros/s/XXXXXXXXXXXX/exec

Lalu redeploy.

## Fitur PWA
- `public/manifest.webmanifest`
- `public/service-worker.js`
- ikon 192 dan 512 px
- tombol `Unduh Aplikasi GESIT` di halaman login
- fallback instruksi manual untuk browser yang tidak mengirim `beforeinstallprompt`

## Catatan
Backend tetap menggunakan Google Apps Script. Telegram webhook tetap lebih aman mengarah ke Apps Script Web App URL.
