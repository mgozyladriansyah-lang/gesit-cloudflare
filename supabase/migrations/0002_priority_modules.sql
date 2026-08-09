-- Migration 0002: struktur modul prioritas GESIT.
-- Fokus awal: approval, agenda, pimpinan, ruangan, kendaraan, ATK, berita, sosmed, eco office.

do $$ begin
  create type approval_status as enum ('draft','diajukan','disetujui','ditolak','dibatalkan','selesai');
exception when duplicate_object then null; end $$;

do $$ begin
  create type agenda_status as enum ('terjadwal','selesai','batal');
exception when duplicate_object then null; end $$;

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  record_table text,
  record_id text,
  title text not null,
  requester_id uuid references app_users(id) on delete set null,
  approver_id uuid references app_users(id) on delete set null,
  status approval_status not null default 'diajukan',
  payload jsonb not null default '{}'::jsonb,
  decision_note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_approval_updated_at on approval_requests;
create trigger trg_approval_updated_at before update on approval_requests
for each row execute function set_updated_at();

create table if not exists pimpinan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jabatan text not null,
  email citext,
  no_hp text,
  foto_file_id uuid references app_files(id) on delete set null,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_pimpinan_updated_at on pimpinan;
create trigger trg_pimpinan_updated_at before update on pimpinan
for each row execute function set_updated_at();

create table if not exists agenda_pimpinan (
  id uuid primary key default gen_random_uuid(),
  nama_kegiatan text not null,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time,
  jenis text not null default 'internal',
  lokasi text,
  peserta text,
  keterangan text,
  status agenda_status not null default 'terjadwal',
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agenda_pimpinan_peserta (
  agenda_id uuid references agenda_pimpinan(id) on delete cascade,
  pimpinan_id uuid references pimpinan(id) on delete cascade,
  primary key (agenda_id, pimpinan_id)
);

drop trigger if exists trg_agenda_updated_at on agenda_pimpinan;
create trigger trg_agenda_updated_at before update on agenda_pimpinan
for each row execute function set_updated_at();

create table if not exists master_ruangan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kapasitas int,
  lokasi text,
  status record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists peminjaman_ruangan (
  id uuid primary key default gen_random_uuid(),
  ruangan_id uuid references master_ruangan(id) on delete restrict,
  peminjam_id uuid references app_users(id) on delete set null,
  kegiatan text not null,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  status approval_status not null default 'diajukan',
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists master_kendaraan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nomor_polisi text unique,
  jenis text,
  status record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists peminjaman_kendaraan (
  id uuid primary key default gen_random_uuid(),
  kendaraan_id uuid references master_kendaraan(id) on delete restrict,
  peminjam_id uuid references app_users(id) on delete set null,
  tujuan text not null,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time,
  status approval_status not null default 'diajukan',
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists atk_items (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  satuan text,
  stok int not null default 0,
  stok_minimum int not null default 0,
  status record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists atk_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references app_users(id) on delete set null,
  status approval_status not null default 'diajukan',
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists atk_request_items (
  request_id uuid references atk_requests(id) on delete cascade,
  item_id uuid references atk_items(id) on delete restrict,
  qty int not null check (qty > 0),
  primary key (request_id, item_id)
);

create table if not exists konten_sosmed (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jadwal_posting time,
  platform text not null,
  jenis_konten text,
  caption text not null,
  hashtags text,
  media_file_id uuid references app_files(id) on delete set null,
  media_url text,
  status text not null default 'draft',
  likes int default 0,
  comments int default 0,
  shares int default 0,
  reach int default 0,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists monitoring_berita (
  id uuid primary key default gen_random_uuid(),
  tanggal_tayang date not null,
  jenis_media text,
  media text not null,
  judul text not null,
  sentimen text not null default 'netral',
  kategori text,
  link text,
  ringkasan text,
  status text not null default 'tercatat',
  catatan text,
  pic uuid references app_users(id) on delete set null,
  input_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists eco_office_checklists (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  shift text not null,
  checker_id uuid references app_users(id) on delete set null,
  items jsonb not null,
  total_score int not null,
  catatan text,
  created_at timestamptz not null default now(),
  unique(tanggal, shift)
);

create table if not exists eco_office_findings (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid references eco_office_checklists(id) on delete cascade,
  item_no int not null,
  item_label text not null,
  status text not null default 'open',
  tindak_lanjut text,
  penindak_id uuid references app_users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index kinerja query utama.
create index if not exists idx_approval_status_time on approval_requests(status, requested_at desc);
create index if not exists idx_agenda_tanggal_status on agenda_pimpinan(tanggal, status);
create index if not exists idx_ruangan_tanggal_status on peminjaman_ruangan(tanggal, status);
create index if not exists idx_kendaraan_tanggal_status on peminjaman_kendaraan(tanggal, status);
create index if not exists idx_sosmed_tanggal_status on konten_sosmed(tanggal, status);
create index if not exists idx_berita_tanggal_sentimen on monitoring_berita(tanggal_tayang, sentimen);
create index if not exists idx_eco_check_tanggal on eco_office_checklists(tanggal desc);

alter table approval_requests enable row level security;
alter table pimpinan enable row level security;
alter table agenda_pimpinan enable row level security;
alter table agenda_pimpinan_peserta enable row level security;
alter table master_ruangan enable row level security;
alter table peminjaman_ruangan enable row level security;
alter table master_kendaraan enable row level security;
alter table peminjaman_kendaraan enable row level security;
alter table atk_items enable row level security;
alter table atk_requests enable row level security;
alter table atk_request_items enable row level security;
alter table konten_sosmed enable row level security;
alter table monitoring_berita enable row level security;
alter table eco_office_checklists enable row level security;
alter table eco_office_findings enable row level security;
