-- GESIT Proper Backend Starter
-- Migration 0001: fondasi produksi PostgreSQL/Supabase
-- Jalankan di Supabase SQL Editor atau via supabase db push.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- Role aplikasi mengikuti role lama GESIT agar frontend tidak langsung patah.
do $$ begin
  create type app_role as enum ('staff','kabag','admin','super_admin','security','driver','cso','magang');
exception when duplicate_object then null; end $$;

do $$ begin
  create type record_status as enum ('active','inactive','pending','deleted');
exception when duplicate_object then null; end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username citext unique not null,
  email citext unique,
  password_hash text,
  nama text not null,
  role app_role not null default 'staff',
  department text,
  jabatan text,
  no_hp text,
  telegram_chat_id text,
  status record_status not null default 'active',
  force_password_change boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip_address inet,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid references app_users(id) on delete set null,
  action text not null,
  module text,
  record_table text,
  record_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists app_files (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  owner_table text,
  owner_id text,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_bucket text not null default 'gesit-files',
  storage_path text not null,
  public_url text,
  uploaded_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  channel text not null default 'app',
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_app_users_updated_at on app_users;
create trigger trg_app_users_updated_at before update on app_users
for each row execute function set_updated_at();

-- Index yang wajib ada sejak awal.
create index if not exists idx_app_users_role on app_users(role);
create index if not exists idx_app_users_status on app_users(status);
create index if not exists idx_sessions_user_expires on app_sessions(user_id, expires_at);
create index if not exists idx_audit_logs_user_time on audit_logs(user_id, created_at desc);
create index if not exists idx_audit_logs_module_time on audit_logs(module, created_at desc);
create index if not exists idx_files_owner on app_files(owner_table, owner_id);
create index if not exists idx_notifications_user_unread on notifications(user_id, created_at desc) where read_at is null;

-- RLS: service_role tetap bisa akses penuh dari backend. Client direct access ditutup dulu.
alter table app_users enable row level security;
alter table app_sessions enable row level security;
alter table audit_logs enable row level security;
alter table app_files enable row level security;
alter table notifications enable row level security;
