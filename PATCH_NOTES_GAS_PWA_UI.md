# GESIT GAS/PWA UI Patch

Patch ini dibuat dari file yang diunggah:

- `Index.html`
- `Styles_4_Lanjutan.html`
- `pwa 2.css`

## Isi patch

- `public/index.html`  
  Index lengkap, tetap memakai tombol `pwaInstallBtn`, tetap memuat `pwa-install.js`, dan memakai Cloudflare adapter `/api`.

- `public/css/styles-4-lanjutan.css`  
  Dibuat dari file GAS `Styles_4_Lanjutan.html` dengan wrapper `<style>` dihapus agar cocok untuk folder root project.

- `public/css/pwa.css`  
  Dibuat dari file `pwa 2.css` yang diunggah.

## Pembersihan

Patch ini tidak memakai lagi:

- `login-final-fix.css`
- `login-stability-hotfix.css`
- `login-final-fix.js`
- `login-stability-hotfix.js`
- `login-autofill-trap`

## Setelah replace

Jalankan verifikasi:

```powershell
Select-String -Path ".\public\index.html" -Pattern "login-final-fix|login-stability-hotfix|login-autofill-trap|netlify-adapter"
Select-String -Path ".\public\index.html" -Pattern "pwaInstallBtn|pwa-install|api-adapter|GESIT_API_ENDPOINT"
```

Hasil benar:

- Perintah pertama tidak menampilkan output.
- Perintah kedua menampilkan `pwaInstallBtn`, `pwa-install.js`, `api-adapter.js`, dan `GESIT_API_ENDPOINT`.
