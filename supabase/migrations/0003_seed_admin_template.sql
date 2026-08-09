-- Seed admin awal.
-- 1) Ganti email/nama/username.
-- 2) Generate password hash dengan script docs/create-password-hash.js.
-- 3) Paste hasil hash ke password_hash.

insert into app_users (username, email, nama, role, password_hash, status)
values ('admin', 'admin@example.com', 'Administrator GESIT', 'super_admin', '$2a$12$REPLACE_WITH_BCRYPT_HASH', 'active')
on conflict (username) do nothing;
