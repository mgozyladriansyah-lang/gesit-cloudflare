# GESIT PWA Responsive + Modal Fix Patch

Tujuan patch ini:

1. Memperbaiki bug saat klik **Keluar** di mode mobile/PWA: layar redup tetapi dialog konfirmasi tidak terlihat.
2. Menjaga layout PWA setara browser: tabel tetap fit, page action tidak menabrak, modal tidak keluar viewport.
3. Menjaga tour lebih presisi di PWA/mobile dengan batas viewport dan safe-area.
4. Tetap memakai CSS GAS/PWA utama, bukan `login-final-fix` atau `login-stability-hotfix`.

Isi patch:

- `public/index.html`
- `public/css/styles-4-lanjutan.css`
- `public/css/pwa.css`
- `public/js/pwa-ui-guard.js`

Catatan:

- Tombol `pwaInstallBtn` tetap ada.
- `pwa-install.js` tetap ada.
- `api-adapter.js` dan `window.GESIT_API_ENDPOINT = '/api'` tetap ada.
- Tidak ada `login-final-fix`, `login-stability-hotfix`, atau `login-autofill-trap`.
