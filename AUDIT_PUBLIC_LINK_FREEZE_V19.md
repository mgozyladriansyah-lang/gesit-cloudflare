# GESIT V19 Safe Public Link and Mobile UX Refine

Versi: 2026.08.11.16

## Masalah

Di mode mobile, klik tombol **Halaman Publik** pada Beranda membuat aplikasi freeze. Tombol lama menjalankan `PublicLink.open()` yang membangun konten lalu membuka `modalPublicLink`. Karena beberapa patch sebelumnya juga mengatur modal, overlay, body overflow, dan scroll lock, pembukaan modal ini masih berpotensi mengunci UI.

## Solusi V19

- Menambahkan `public/js/safe-public-link.js`.
- Klik `[data-publink]` dicegat lebih awal, lalu diarahkan ke panel ringan `#gesitPublicLinkPanel`.
- Tidak memakai `Modal.open()`, `MutationObserver`, `setInterval`, iframe, atau request API tambahan.
- `PublicLink.open` dipatch ke versi aman sebagai fallback.
- Menambahkan `public/css/mobile-ux-refine.css` untuk desain mobile lebih proper, natural, dan efisien.

## File utama

```text
public/index.html
public/service-worker.js
public/pwa-changelog.json
public/js/safe-public-link.js
public/js/pwa-version.js
public/css/mobile-ux-refine.css
```
