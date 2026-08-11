# GESIT V20 SVG Icon Standard and Role Mobile Priority

Versi: 2026.08.11.17

## Arahan desain

- Tidak ada logo atau icon berbasis emoji pada patch baru.
- Mode mobile memprioritaskan informasi utama sesuai bottom nav yang diklik.
- Warna role dibuat konsisten agar tidak bertabrakan antar komponen.
- Patch dibuat defensif: tidak menambah MutationObserver, tidak menambah setInterval, dan tidak monkey-patch Router.

## Perubahan utama

1. `safe-public-link.js` diganti ke SVG-only.
2. `notification-center.js` fallback bell tidak lagi emoji.
3. `index.html` hero Telegram tidak lagi emoji pesawat, diganti SVG.
4. `mobile-priority-role-theme.js` ditambahkan sebagai controller ringan berbasis event.
5. `role-theme-priority.css` ditambahkan untuk role color system dan prioritas konten mobile.
6. `role-mobile-ux.js` lama tidak lagi dimuat dari index untuk mengurangi risiko observer/timer dan duplikasi render.

## Potensi risiko yang dihindari

- Tidak memakai modal custom baru.
- Tidak mengubah fungsi bisnis dan data.
- Tidak memodifikasi router utama.
- Tidak menghapus file lama, hanya tidak memuat file yang berisiko.
- Semua script utama divalidasi dengan `node --check`.
