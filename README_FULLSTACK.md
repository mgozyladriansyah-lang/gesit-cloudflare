# GESIT Fullstack PWA + Supabase Starter

Paket ini menggabungkan:

1. Frontend PWA GESIT siap deploy Netlify.
2. Netlify Function API dispatcher.
3. Backend starter Supabase/PostgreSQL.
4. Fallback sementara ke Google Apps Script untuk action yang belum dimigrasikan.

## Arsitektur

```text
User
  ↓
GESIT PWA di Netlify
  ↓
/.netlify/functions/api
  ↓
Action sudah dimigrasikan → Supabase PostgreSQL
Action belum dimigrasikan → fallback Google Apps Script
```

## Environment Variables Netlify

Wajib:

```text
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx
JWT_SECRET=minimal_32_karakter_random
```

Sementara, untuk fallback modul lama:

```text
GAS_WEB_APP_URL=https://script.google.com/macros/s/xxxx/exec
```

Opsional:

```text
JWT_EXPIRES_IN=12h
```

## Urutan Setup

1. Buat project Supabase.
2. Jalankan SQL migration di folder `supabase/migrations` secara berurutan:
   - `0001_core_auth_audit.sql`
   - `0002_priority_modules.sql`
   - `0003_seed_admin_template.sql`
3. Generate password hash admin:

```bash
npm install
npm run hash -- "PasswordAdminYangKuat"
```

4. Paste hash ke `0003_seed_admin_template.sql`, lalu jalankan seed admin.
5. Deploy folder ini ke Netlify.
6. Set Environment Variables.
7. Test action health:

```bash
curl -X POST https://DOMAIN-NETLIFY-ANDA/.netlify/functions/api \
  -H "content-type: application/json" \
  -d '{"action":"health","data":{}}'
```

Jika sukses, response akan seperti:

```json
{"success":true,"status":"ok","backend":"supabase-postgres"}
```

## Status Migrasi

Action yang sudah ditangani backend baru:

- `health`
- `login`
- `checkSession`
- `logout`
- `me`

Action lainnya tetap diteruskan ke Apps Script selama `GAS_WEB_APP_URL` masih diisi.

## PWA

Paket ini sudah berisi:

- `public/manifest.webmanifest`
- `public/service-worker.js`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- tombol `Unduh Aplikasi GESIT` di login

## Catatan Produksi

- Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` di frontend.
- Service role hanya dipakai di Netlify Function.
- Sebelum produksi penuh, migrasikan User Management dan Approval Center terlebih dahulu.
- Setelah semua action pindah, hapus `GAS_WEB_APP_URL` agar aplikasi tidak tergantung Apps Script lagi.


## Patch UI/UX terbaru

- Tombol install PWA tidak lagi memakai emoji, tetapi SVG icon internal `download`.
- Error environment Supabase tidak lagi ditampilkan mentah ke user login.
- Bila Supabase belum dikonfigurasi tetapi `GAS_WEB_APP_URL` tersedia, login/action yang sudah dimigrasikan akan fallback ke Apps Script sementara.
- Beberapa emoji lama di UI diganti menjadi SVG icon atau teks profesional.


## Patch PWA update v5

- Service worker memakai cache `gesit-pwa-v5` agar deploy baru tidak tertahan cache lama.
- Aplikasi menampilkan banner `Versi baru tersedia` ketika service worker baru sudah siap.
- User cukup memilih `Perbarui Sekarang`; aplikasi akan mengaktifkan service worker baru dan reload otomatis.
- Navigasi utama memakai network-first fallback cache, sedangkan asset memakai cache-first dengan refresh background.


## Patch v6 - User Management Supabase

Action user berikut sudah dimigrasikan ke backend Supabase/PostgreSQL:

- `getUsers`
- `createUser`
- `updateUser`
- `resetUserPassword`
- `deleteUser`
- `changePassword`

Catatan: `deleteUser` memakai soft delete agar relasi historis dan audit trail tidak rusak. Action user menulis audit log ke tabel `audit_logs`.


## Patch v7 - Mapping Database SEGALO

Patch v7 menambahkan migration Supabase berdasarkan struktur `Segalo (1).pdf`:

- `0004_segalo_master_data.sql`
- `0005_segalo_operational_modules.sql`
- `0006_segalo_notifications_audit_settings.sql`
- `docs/schema-mapping-segalo-to-supabase.md`

Jalankan migration ini setelah `0001`, `0002`, `0003` bila ingin Supabase siap menerima impor data dari spreadsheet lama.
