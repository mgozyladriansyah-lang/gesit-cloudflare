-- Migration 0005: modul operasional dari struktur spreadsheet SEGALO/GESIT.

do $$ begin
  create type workflow_status as enum ('draft','pending','approved','rejected','cancelled','done','review','closed');
exception when duplicate_object then null; end $$;

create table if not exists presensi_tad (
  id text primary key,
  tanggal date not null,
  tad_id text references tad_personnel(id) on delete set null,
  nama text,
  kategori text,
  jam_masuk timestamptz,
  jam_pulang timestamptz,
  foto_masuk text,
  foto_pulang text,
  lokasi_masuk text,
  lokasi_pulang text,
  status text,
  keterangan text,
  created_at timestamptz not null default now()
);

create table if not exists izin_tad (
  id text primary key,
  created_at timestamptz not null default now(),
  tad_id text references tad_personnel(id) on delete set null,
  nama text,
  kategori text,
  jenis text,
  tgl_mulai date,
  tgl_selesai date,
  alasan text,
  lampiran_url text,
  status text not null default 'pending',
  catatan_admin text,
  diproses_oleh text,
  tgl_proses timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_izin_tad_updated_at on izin_tad;
create trigger trg_izin_tad_updated_at before update on izin_tad
for each row execute function set_updated_at();

create table if not exists lembur_tad (
  id text primary key,
  created_at timestamptz not null default now(),
  tad_id text references tad_personnel(id) on delete set null,
  nama text,
  kategori text,
  jenis text,
  tanggal date,
  jam_mulai time,
  jam_selesai time,
  uraian text,
  lampiran_url text,
  status text not null default 'pending',
  catatan_admin text,
  diproses_oleh text,
  tgl_proses timestamptz,
  updated_at timestamptz not null default now(),
  tanggal_selesai date,
  bukti_url text,
  bukti_at timestamptz,
  nomor_surat text,
  ttd_url text
);

drop trigger if exists trg_lembur_tad_updated_at on lembur_tad;
create trigger trg_lembur_tad_updated_at before update on lembur_tad
for each row execute function set_updated_at();

create table if not exists magang_applications (
  id text primary key,
  tanggal date,
  waktu time,
  nama_lengkap text not null,
  email citext,
  no_hp text,
  institusi text,
  jurusan text,
  jenjang text,
  periode_mulai date,
  periode_selesai date,
  bagian_diminati text,
  motivasi text,
  cv_url text,
  cv_nama text,
  status text not null default 'pending',
  catatan_admin text,
  diproses_oleh text,
  tgl_proses timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_magang_applications_updated_at on magang_applications;
create trigger trg_magang_applications_updated_at before update on magang_applications
for each row execute function set_updated_at();

create table if not exists izin_magang (
  id text primary key,
  created_at timestamptz not null default now(),
  magang_id text references magang_participants(id) on delete set null,
  nama text,
  jenis text,
  tgl_mulai date,
  tgl_selesai date,
  alasan text,
  lampiran_url text,
  status text not null default 'pending',
  catatan_admin text,
  diproses_oleh text,
  tgl_proses timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists presensi_magang (
  id text primary key,
  tanggal date not null,
  magang_id text references magang_participants(id) on delete set null,
  nama text,
  jam_masuk timestamptz,
  jam_pulang timestamptz,
  foto_masuk text,
  foto_pulang text,
  lokasi_masuk text,
  lokasi_pulang text,
  status text,
  keterangan text,
  created_at timestamptz not null default now()
);

create table if not exists logbook_magang (
  id text primary key,
  tanggal date,
  magang_id text references magang_participants(id) on delete set null,
  nama text,
  kegiatan text,
  hasil text,
  foto text,
  status_review text,
  review_by text,
  review_date timestamptz,
  catatan_review text,
  created_at timestamptz not null default now()
);

create table if not exists buku_tamu (
  id text primary key,
  tanggal date,
  waktu_masuk timestamptz,
  nama text not null,
  nik text,
  no_hp text,
  instansi text,
  keperluan text,
  tujuan_bagian text,
  pic text,
  no_antrian text,
  status text,
  waktu_selesai timestamptz,
  foto text,
  catatan text,
  input_by text,
  created_at timestamptz not null default now()
);

create table if not exists antrian_tamu (
  id text primary key,
  tanggal date,
  no_antrian text,
  tamu_id text references buku_tamu(id) on delete cascade,
  nama_tamu text,
  tujuan text,
  status text,
  waktu_panggil timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists bbm_kendaraan (
  id text primary key,
  tanggal date,
  kendaraan_id uuid references master_kendaraan(id) on delete set null,
  nopol text,
  driver_id text references drivers(id) on delete set null,
  nama_driver text,
  odometer int,
  jumlah_liter numeric(12,2),
  harga_per_liter numeric(14,2),
  total_biaya numeric(14,2),
  jenis_bbm text,
  spbu text,
  bukti_struk text,
  catatan text,
  input_by text,
  created_at timestamptz not null default now()
);

-- Lengkapi peminjaman_kendaraan yang sudah ada agar cocok dengan spreadsheet booking kendaraan.
alter table if exists peminjaman_kendaraan add column if not exists tanggal_pengajuan date;
alter table if exists peminjaman_kendaraan add column if not exists pemohon text;
alter table if exists peminjaman_kendaraan add column if not exists bagian text;
alter table if exists peminjaman_kendaraan add column if not exists tanggal_pakai date;
alter table if exists peminjaman_kendaraan add column if not exists jam_berangkat time;
alter table if exists peminjaman_kendaraan add column if not exists jam_kembali time;
alter table if exists peminjaman_kendaraan add column if not exists jumlah_penumpang int;
alter table if exists peminjaman_kendaraan add column if not exists nopol text;
alter table if exists peminjaman_kendaraan add column if not exists driver_id text;
alter table if exists peminjaman_kendaraan add column if not exists nama_driver text;
alter table if exists peminjaman_kendaraan add column if not exists km_berangkat int;
alter table if exists peminjaman_kendaraan add column if not exists km_kembali int;
alter table if exists peminjaman_kendaraan add column if not exists selesai_at timestamptz;

create table if not exists patrol_checkpoints (
  id text primary key,
  nama_checkpoint text not null,
  lokasi text,
  lantai text,
  qr_code text,
  urutan int,
  status record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists patrol_schedules (
  id text primary key,
  security_id text references security_officers(id) on delete set null,
  nama text,
  tanggal date,
  shift text,
  status text,
  catatan text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patrol_logs (
  id text primary key,
  tanggal date,
  waktu time,
  security_id text references security_officers(id) on delete set null,
  nama_security text,
  checkpoint_id text references patrol_checkpoints(id) on delete set null,
  nama_checkpoint text,
  shift text,
  kondisi text,
  catatan text,
  foto text,
  gps text,
  created_at timestamptz not null default now()
);

create index if not exists idx_presensi_tad_tanggal on presensi_tad(tanggal);
create index if not exists idx_izin_tad_status on izin_tad(status, tgl_mulai);
create index if not exists idx_lembur_tad_status on lembur_tad(status, tanggal);
create index if not exists idx_magang_app_status on magang_applications(status, created_at desc);
create index if not exists idx_izin_magang_status on izin_magang(status, tgl_mulai);
create index if not exists idx_buku_tamu_tanggal on buku_tamu(tanggal, status);
create index if not exists idx_bbm_tanggal on bbm_kendaraan(tanggal desc);
create index if not exists idx_patrol_logs_tanggal on patrol_logs(tanggal, shift);

alter table presensi_tad enable row level security;
alter table izin_tad enable row level security;
alter table lembur_tad enable row level security;
alter table magang_applications enable row level security;
alter table izin_magang enable row level security;
alter table presensi_magang enable row level security;
alter table logbook_magang enable row level security;
alter table buku_tamu enable row level security;
alter table antrian_tamu enable row level security;
alter table bbm_kendaraan enable row level security;
alter table patrol_checkpoints enable row level security;
alter table patrol_schedules enable row level security;
alter table patrol_logs enable row level security;
