# Patch Final Login Cleanup GESIT

## Audit ringkas

Masalah yang terlihat setelah deploy:

1. Layout login berubah-ubah saat field username/password difokuskan.
2. Beberapa patch CSS sebelumnya menumpuk di `pwa.css`, sehingga aturan saling override.
3. Ada hotfix terpisah `login-stability-hotfix.css/js`, tetapi pemanggilannya sempat tidak masuk index, lalu trap autofill sempat dobel.
4. Error `503 /api` adalah masalah backend/env dan bukan penyebab layout login.

## Inti masalah

Inti masalah layout adalah kombinasi aturan CSS login yang saling bertabrakan:

- pseudo element orb dan efek glass/backdrop-filter,
- scroll internal `.login-card`,
- aturan hotfix lama yang menambahkan `max-height`, `overflow`, `contain`, dan `display` secara berulang,
- input login yang memicu autofill/browser password manager.

## Strategi final

1. Bersihkan blok HOTFIX lama dari `public/css/pwa.css`.
2. Hapus link/script eksperimen `login-stability-hotfix` dari `index.html`.
3. Hapus input `login-autofill-trap` manual yang dobel.
4. Pasang satu final override saja:
   - `public/css/login-final-fix.css`
   - `public/js/login-final-fix.js`
5. JS final membuat trap runtime tepat 2 input, sehingga tidak perlu input trap manual di HTML.

## Cara pasang

Extract ZIP ke root project, lalu jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\apply-final-login-cleanup.ps1
```

Verifikasi:

```powershell
Select-String -Path ".\public\index.html" -Pattern "login-final-fix|login-stability-hotfix|login-autofill-trap"
Select-String -Path ".\public\css\pwa.css" -Pattern "HOTFIX V2|HOTFIX V3|HOTFIX GESIT LOGIN"
```

Hasil yang benar:

- `index.html` hanya menampilkan `login-final-fix.css` dan `login-final-fix.js`.
- Tidak ada `login-stability-hotfix`.
- Tidak ada `login-autofill-trap` manual di HTML.
- `pwa.css` tidak lagi punya blok HOTFIX lama.

Commit dan push:

```powershell
git add -A
git commit -m "Final cleanup login layout fix"
git push origin main
```
