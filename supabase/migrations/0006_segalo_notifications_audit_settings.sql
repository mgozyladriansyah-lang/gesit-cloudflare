-- Migration 0006: notifikasi, settings, dan log legacy SEGALO/GESIT.

create table if not exists notification_logs (
  id text primary key,
  tanggal date,
  waktu time,
  jenis text,
  penerima text,
  ref_modul text,
  ref_id text,
  judul text,
  pesan text,
  status text,
  error text,
  oleh text,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id text primary key,
  created_at timestamptz not null default now(),
  jalur text,
  audiens text,
  dari_user_id text,
  dari_nama text,
  dari_chat_id text,
  peran text,
  pesan text,
  lampiran_url text,
  ref_id text,
  status text,
  terkirim int default 0,
  gagal int default 0,
  dibalas_oleh text,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_chat_messages_updated_at on chat_messages;
create trigger trg_chat_messages_updated_at before update on chat_messages
for each row execute function set_updated_at();

create table if not exists legacy_activity_logs (
  id text primary key,
  tanggal date,
  waktu time,
  user_id text,
  username text,
  aksi text,
  modul text,
  detail text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value text,
  description text,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_app_settings_updated_at on app_settings;
create trigger trg_app_settings_updated_at before update on app_settings
for each row execute function set_updated_at();

-- Lengkapi table notifikasi baru dengan kolom legacy tanpa menghapus struktur baru.
alter table if exists notifications add column if not exists jenis text;
alter table if exists notifications add column if not exists penerima text;
alter table if exists notifications add column if not exists ref_modul text;
alter table if exists notifications add column if not exists ref_id text;
alter table if exists notifications add column if not exists status text;
alter table if exists notifications add column if not exists error text;
alter table if exists notifications add column if not exists oleh text;

-- Lengkapi app_users untuk mapping penuh spreadsheet user.
alter table if exists app_users add column if not exists bagian text;
alter table if exists app_users add column if not exists foto text;
alter table if exists app_users add column if not exists login_attempts int not null default 0;
alter table if exists app_users add column if not exists locked_until timestamptz;
alter table if exists app_users add column if not exists telegram_token text;
alter table if exists app_users add column if not exists telegram_token_exp timestamptz;
alter table if exists app_users add column if not exists magang_id text;

create index if not exists idx_notification_logs_ref on notification_logs(ref_modul, ref_id);
create index if not exists idx_notification_logs_status on notification_logs(status, created_at desc);
create index if not exists idx_chat_messages_ref on chat_messages(ref_id, created_at desc);
create index if not exists idx_legacy_logs_modul_time on legacy_activity_logs(modul, created_at desc);

alter table notification_logs enable row level security;
alter table chat_messages enable row level security;
alter table legacy_activity_logs enable row level security;
alter table app_settings enable row level security;
