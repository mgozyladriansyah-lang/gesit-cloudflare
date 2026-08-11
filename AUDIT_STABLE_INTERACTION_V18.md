# GESIT V18 Stable Interaction Recovery

Versi: 2026.08.11.15

## Temuan dari screenshot

Setelah tombol **Keluar** diklik, browser menampilkan dialog native **Halaman tidak merespons**. Ini menunjukkan main thread JavaScript terkunci, bukan sekadar tombol tidak menerima klik.

## Penyebab yang paling mungkin

V17 masih terlalu agresif karena memadukan buka/tutup overlay, body class, style overflow, callback confirm, dan sinkronisasi view dalam satu event cycle. Ketika terjadi klik logout, perubahan class/style/modal memicu rantai handler lain dari patch lama sehingga halaman dapat hang.

## Keputusan V18

- `gesit-ui-state-manager.js` tidak dimuat lagi dari `index.html`.
- `overlay-state-fix.js` dan `logout-menu-fix.js` juga tetap tidak dimuat.
- Diganti dengan `stable-interaction-recovery.js`.
- Controller baru **tidak menggunakan MutationObserver**, **tidak menggunakan setInterval**, dan **tidak monkey-patch Router**.
- Logout sementara memakai `window.confirm()` native agar tidak menyentuh modal custom yang memicu loop.

## File utama

```text
public/index.html
public/service-worker.js
public/pwa-changelog.json
public/js/stable-interaction-recovery.js
public/js/pwa-version.js
public/css/ui-harmony.css
```

## Baseline lanjutan

Setelah V18 stabil, baru custom confirm modal boleh dibangun ulang secara terpisah dengan prinsip satu event, satu state, dan tanpa observer loop.
