-- Migration 0004: master data SEGALO/GESIT dari struktur spreadsheet lama.
-- Aman dijalankan berulang karena memakai create table if not exists.

create table if not exists telegram_users (
  id uuid primary key default gen_random_uuid(),
  telegram_username text,
  telegram_chat_id text unique,
  user_id uuid references app_users(id) on delete set null,
  username text,
  nama_lengkap text,
  role text,
  bagian text,
  status record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_telegram_users_updated_at on telegram_users;
create trigger trg_telegram_users_updated_at before update on telegram_users
for each row execute function set_updated_at();

create table if not exists tad_personnel (
  id text primary key,
  nama text not null,
  kategori text not null,
  no_hp text,
  email citext,
  alamat text,
  alamat_sekarang text,
  nik text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  golongan_darah text,
  pendidikan_terakhir text,
  kontak_darurat_nama text,
  kontak_darurat_hp text,
  foto_url text,
  status record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_tad_personnel_updated_at on tad_personnel;
create trigger trg_tad_personnel_updated_at before update on tad_personnel
for each row execute function set_updated_at();

create table if not exists magang_participants (
  id text primary key,
  nama text not null,
  nim text,
  universitas text,
  jurusan text,
  no_hp text,
  email citext,
  alamat_domisili text,
  alamat_sekarang text,
  periode_mulai date,
  periode_selesai date,
  bagian text,
  pembimbing text,
  foto_url text,
  status record_status not null default 'active',
  catatan text,
  sertifikat_nomor text,
  sertifikat_url text,
  nik text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  golongan_darah text,
  pendidikan_terakhir text,
  kontak_darurat_nama text,
  kontak_darurat_hp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_magang_participants_updated_at on magang_participants;
create trigger trg_magang_participants_updated_at before update on magang_participants
for each row execute function set_updated_at();

create table if not exists security_officers (
  id text primary key,
  nama text not null,
  no_hp text,
  email citext,
  alamat text,
  alamat_sekarang text,
  nik text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  golongan_darah text,
  pendidikan_terakhir text,
  kontak_darurat_nama text,
  kontak_darurat_hp text,
  area_tugas text,
  foto_url text,
  status record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_security_officers_updated_at on security_officers;
create trigger trg_security_officers_updated_at before update on security_officers
for each row execute function set_updated_at();

create table if not exists drivers (
  id text primary key,
  nama text not null,
  no_hp text,
  email citext,
  alamat text,
  alamat_sekarang text,
  no_sim text,
  masa_berlaku_sim date,
  kategori text,
  nik text,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  golongan_darah text,
  pendidikan_terakhir text,
  kontak_darurat_nama text,
  kontak_darurat_hp text,
  foto_url text,
  status record_status not null default 'active',
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_drivers_updated_at on drivers;
create trigger trg_drivers_updated_at before update on drivers
for each row execute function set_updated_at();

-- Lengkapi master_kendaraan yang sudah dibuat di migration 0002 agar cocok dengan spreadsheet.
alter table if exists master_kendaraan add column if not exists nopol text;
alter table if exists master_kendaraan add column if not exists merk text;
alter table if exists master_kendaraan add column if not exists type text;
alter table if exists master_kendaraan add column if not exists tahun int;
alter table if exists master_kendaraan add column if not exists warna text;
alter table if exists master_kendaraan add column if not exists no_rangka text;
alter table if exists master_kendaraan add column if not exists no_mesin text;
alter table if exists master_kendaraan add column if not exists kategori text;
alter table if exists master_kendaraan add column if not exists kapasitas int;
alter table if exists master_kendaraan add column if not exists foto text;
alter table if exists master_kendaraan add column if not exists km_terakhir int;
alter table if exists master_kendaraan add column if not exists tgl_pajak date;
alter table if exists master_kendaraan add column if not exists tgl_stnk date;
alter table if exists master_kendaraan add column if not exists catatan text;
create index if not exists idx_master_kendaraan_nopol on master_kendaraan(nopol);

-- Lengkapi master_ruangan agar cocok dengan spreadsheet.
alter table if exists master_ruangan add column if not exists nama_ruangan text;
alter table if exists master_ruangan add column if not exists lantai text;
alter table if exists master_ruangan add column if not exists fasilitas text;
alter table if exists master_ruangan add column if not exists foto text;

-- Lengkapi pimpinan/PIC bagian dengan kolom spreadsheet.
alter table if exists pimpinan add column if not exists kode_jabatan text;
alter table if exists pimpinan add column if not exists ketersediaan_status text;
alter table if exists pimpinan add column if not exists ketersediaan_catatan text;
alter table if exists pimpinan add column if not exists ketersediaan_tanggal date;
alter table if exists pimpinan add column if not exists ketersediaan_oleh text;

create index if not exists idx_telegram_users_chat on telegram_users(telegram_chat_id);
create index if not exists idx_drivers_status on drivers(status);
create index if not exists idx_magang_status on magang_participants(status);
create index if not exists idx_tad_status on tad_personnel(status);
create index if not exists idx_security_status on security_officers(status);

alter table telegram_users enable row level security;
alter table tad_personnel enable row level security;
alter table magang_participants enable row level security;
alter table security_officers enable row level security;
alter table drivers enable row level security;
