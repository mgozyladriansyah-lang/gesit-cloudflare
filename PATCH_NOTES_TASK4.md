# Patch Task 4 - Users dan Notifications

File yang diganti:

- `src/actions/users.js`
- `src/actions/notifications.js`
- `package.json`

Catatan:

- `users.js` disesuaikan dengan tabel `app_users`, `app_sessions`, dan `audit_logs`.
- `notifications.js` dipindahkan dari tabel `app_notifications` ke tabel `notifications`, karena struktur SQL yang tersedia membuat tabel `notifications`.
- `package.json` diperbarui supaya `npm run check` juga mengecek `health.js`, `notifications.js`, dan `users.js`.

Setelah replace file, jalankan:

```bash
npm run check
```
