# Patch Task 8 - Migrasi Backend Netlify ke Cloudflare Pages Functions

## Isi patch

- `functions/api.js`
- `public/js/api-adapter.js`
- `wrangler.toml`

## Tujuan

Patch ini memindahkan endpoint API dari Netlify Function:

```text
/.netlify/functions/api
```

menjadi Cloudflare Pages Function:

```text
/api
```

## Cara pasang

1. Salin `functions/api.js` ke root project.
2. Salin `wrangler.toml` ke root project.
3. Salin `public/js/api-adapter.js` ke `public/js/`.
4. Di `index.html`, muat adapter ini setelah `scripts-1-inti-fase1.js` dan sebelum `scripts-4-fase4-app.js`:

```html
<script src="/js/scripts-1-inti-fase1.js"></script>
<script>
  window.GESIT_API_ENDPOINT = '/api';
</script>
<script src="/js/api-adapter.js"></script>
```

Jangan muat `netlify-adapter.js` bersamaan dengan `api-adapter.js` karena keduanya sama-sama mengganti `API.call`.

## Environment variable Cloudflare

Set di Cloudflare Pages > Settings > Environment variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
JWT_EXPIRES_IN=12h
JWT_ISSUER=gesit-api
JWT_AUDIENCE=gesit-pwa
SESSION_HOURS=12
ALLOWED_ORIGIN=*
```

Opsional fallback Apps Script:

```text
GAS_WEB_APP_URL
GAS_TIMEOUT_MS=25000
```

## Catatan keamanan

- Jangan commit `.env` asli ke GitHub.
- Nilai `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, dan `GAS_WEB_APP_URL` sebaiknya disimpan sebagai secret/environment variable di Cloudflare, bukan di source code.

## Catatan kompatibilitas

Project ini masih memakai CommonJS (`require`) dan dependency Node seperti `jsonwebtoken`, `crypto`, dan `bcryptjs`. Karena itu `wrangler.toml` mengaktifkan:

```toml
compatibility_flags = ["nodejs_compat"]
```

## Temuan yang perlu dilanjutkan

Ada potensi mismatch tabel realtime notification:

- `src/actions/notifications.js` menyimpan ke tabel `notifications`.
- `public/js/realtime-notifications.js` sebelumnya mendengar tabel `app_notifications`.

Jika realtime akan dipakai, samakan salah satu:

- ubah frontend subscribe ke `notifications`, atau
- ubah backend insert ke `app_notifications`.

Patch Task 7 sebelumnya sudah memperbaiki filter notifikasi agar tidak semua user menerima semua notifikasi.
