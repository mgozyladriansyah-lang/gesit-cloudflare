# Patch Task 4 - users.js

File yang diperbaiki:

- `src/actions/users.js`

Fokus perbaikan:

- Menyesuaikan field `app_users` dengan migration SQL 0001 dan 0006.
- Mendukung `department` dan `bagian` bersamaan agar kompatibel dengan data lama dan struktur baru.
- Menambahkan validasi username.
- Menambahkan validasi self-protection agar admin tidak menonaktifkan atau menurunkan role akun sendiri.
- Menambahkan dukungan field `jabatan`, `telegram_chat_id`, `foto`, `magang_id`, `login_attempts`, dan `locked_until`.
- Membatasi limit query user maksimal 500 row.
- Menambahkan pencarian user sederhana berdasarkan username, nama, atau email.
- Memperkuat reset password dengan reset `login_attempts` dan `locked_until`.
- Memperkuat soft delete dengan penghapusan `email`, `telegram_chat_id`, dan revoke session.

Setelah replace file, jalankan:

```bash
npm run check
```
