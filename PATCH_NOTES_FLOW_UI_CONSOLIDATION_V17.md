# Audit dan Pemetaan Ulang Alur Patch GESIT V2-V17

Versi: 2026.08.11.14

## Kesimpulan audit

Masalah utama bukan tombol logout saja. Masalah utama adalah banyak patch membuat handler dan CSS untuk area yang sama: user menu, mobile sheet, modal confirm, bottom nav, scroll lock, dan body class. Beberapa patch memperbaiki bug lama, tetapi patch berikutnya menambah listener baru sehingga event bisa saling menutup.

## Peta riwayat patch

- V2-V4: membangun mobile shell, bottom navigation, dan responsive table/modal.
- V5-V6: stabilitas PWA, tour, suara/notifikasi, pusat notifikasi.
- V7-V10: pemulihan interaksi, scroll root, scroll main, dan tour recovery.
- V11: confirm/logout modal diperbaiki.
- V12: footer approval dan action mobile diperbaiki.
- V13: compatibility guard untuk z-index dan body class.
- V14: UI/UX mobile per role.
- V15: overlay auto-close.
- V16: handler khusus logout.
- V17: konsolidasi state dan visual agar V15/V16 tidak lagi menjadi patch terpisah yang saling timpa.

## Keputusan V17

V17 menonaktifkan pemuatan `overlay-state-fix.js` dan `logout-menu-fix.js` dari `index.html`, lalu menggantikannya dengan satu file final:

```text
public/js/gesit-ui-state-manager.js
```

File ini menjadi satu pintu untuk:

- `#userMenu`
- `#mobileMenuSheet`
- `#mobileMenuBackdrop`
- `#modalConfirm`
- `.modal-backdrop.is-open`
- `.tour-tip`
- `#menuLogout`
- body class: `has-sheet-open`, `user-menu-open`, `has-modal-open`, `confirm-modal-open`, `gesit-tour-active`

## Prinsip baru

1. Tidak ada lagi beberapa patch yang sama-sama menangani logout.
2. Event logout ditangkap dari document capture lebih awal, lalu langsung menjalankan confirm logout.
3. Overlay sementara ditutup sebelum modal confirm dibuka.
4. Modal confirm selalu berada di layer paling atas.
5. Role hub tidak ditampilkan berulang di semua tab. Role hub hanya boleh muncul di mobile dashboard saat aman.
6. CSS natural dipindahkan ke layer harmonisasi akhir `ui-harmony.css`.

## File utama

```text
public/index.html
public/service-worker.js
public/pwa-changelog.json
public/js/gesit-ui-state-manager.js
public/js/pwa-version.js
public/css/ui-harmony.css
```
