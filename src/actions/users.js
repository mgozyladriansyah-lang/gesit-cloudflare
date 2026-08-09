'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const { requireRole, publicUser } = require('../lib/security');

const ADMIN_ROLES = Object.freeze(['admin', 'super_admin']);
const VALID_ROLES = Object.freeze(['staff', 'kabag', 'admin', 'super_admin', 'security', 'driver', 'cso', 'magang']);
const STATUS_MAP = Object.freeze({
  active: 'active',
  aktif: 'active',
  inactive: 'inactive',
  nonaktif: 'inactive',
  pending_admin: 'pending',
  pending_telegram: 'pending',
  pending: 'pending',
  deleted: 'deleted'
});

const USER_SELECT = 'id,username,email,nama,role,department,bagian,jabatan,no_hp,telegram_chat_id,status,last_login_at,created_at,updated_at,force_password_change,login_attempts,locked_until,magang_id';
const FULL_USER_SELECT = USER_SELECT + ',password_hash';

function cleanText(value, max = 255) {
  return String(value || '').trim().slice(0, max);
}

function cleanNullable(value, max = 255) {
  const text = cleanText(value, max);
  return text || null;
}

function normalizeStatus(value) {
  return STATUS_MAP[String(value || '').toLowerCase()] || 'active';
}

function normalizeRole(value) {
  const role = String(value || 'staff').toLowerCase().trim();
  return VALID_ROLES.includes(role) ? role : 'staff';
}

function normalizeUsername(value) {
  return cleanText(value, 180).toLowerCase();
}

function normalizeEmail(value) {
  return cleanText(value, 180).toLowerCase() || null;
}

function userRow(row) {
  if (!row) return null;
  const bagian = row.bagian || row.department || '';
  return {
    id: row.id,
    username: row.username,
    nama_lengkap: row.nama,
    nama: row.nama,
    email: row.email || '',
    no_hp: row.no_hp || '',
    role: row.role,
    bagian,
    department: row.department || bagian || '',
    jabatan: row.jabatan || '',
    telegram_chat_id: row.telegram_chat_id || '',
    status: row.status === 'pending' ? 'pending_admin' : row.status,
    force_password_change: Boolean(row.force_password_change),
    login_attempts: Number(row.login_attempts || 0),
    locked_until: row.locked_until || null,
    magang_id: row.magang_id || '',
    last_login: row.last_login_at ? new Date(row.last_login_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || ''
  };
}

function assertAdmin(actor) {
  requireRole(actor, ADMIN_ROLES);
}

function isSuperAdmin(actor) {
  return String(actor && actor.role || '') === 'super_admin';
}

function assertCanManageTarget(actor, target) {
  assertAdmin(actor);
  if (String(target.role || '') === 'super_admin' && !isSuperAdmin(actor)) {
    const err = new Error('Hanya super admin yang dapat mengelola akun super admin.');
    err.statusCode = 403;
    throw err;
  }
}

function isDuplicateError(error) {
  const message = String(error && error.message || '');
  const code = String(error && error.code || '');
  return code === '23505' || /duplicate|unique/i.test(message);
}

async function getTarget(db, id) {
  const { data, error } = await db.from('app_users').select(FULL_USER_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error('User tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  return data;
}

async function audit(db, context, action, targetId, beforeData, afterData) {
  try {
    await db.from('audit_logs').insert({
      user_id: context.authUser && (context.authUser.sub || context.authUser.id) || null,
      action,
      module: 'users',
      record_table: 'app_users',
      record_id: targetId || null,
      before_data: beforeData || null,
      after_data: afterData || null,
      ip_address: cleanNullable(context.ip, 80),
      user_agent: cleanNullable(context.userAgent, 500)
    });
  } catch (e) {
    console.warn('[audit users]', e.message);
  }
}

async function ensureNotLastSuperAdmin(db, targetUser) {
  if (!targetUser || targetUser.role !== 'super_admin' || targetUser.status === 'deleted') return;

  const { count, error } = await db
    .from('app_users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'super_admin')
    .neq('status', 'deleted');

  if (error) throw error;
  if ((count || 0) <= 1) {
    const err = new Error('Minimal harus ada satu akun super admin aktif/non-deleted.');
    err.statusCode = 400;
    throw err;
  }
}

async function getUsers(data = {}, context = {}) {
  assertAdmin(context.authUser);
  const db = getSupabaseAdmin();

  const search = cleanText(data.search, 120).toLowerCase();
  const role = data.role ? normalizeRole(data.role) : '';
  const status = data.status ? normalizeStatus(data.status) : '';
  const limit = Math.min(Math.max(Number(data.limit || 100), 1), 500);
  const offset = Math.max(Number(data.offset || 0), 0);

  let query = db
    .from('app_users')
    .select(USER_SELECT, { count: 'exact' })
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) query = query.eq('role', role);
  if (status && status !== 'deleted') query = query.eq('status', status);
  if (search) {
    query = query.or('username.ilike.%' + search + '%,email.ilike.%' + search + '%,nama.ilike.%' + search + '%,bagian.ilike.%' + search + '%,department.ilike.%' + search + '%');
  }

  const { data: rows, error, count } = await query;
  if (error) throw error;

  return { success: true, data: (rows || []).map(userRow), total: count || 0, limit, offset };
}

async function createUser(data = {}, context = {}) {
  assertAdmin(context.authUser);
  const db = getSupabaseAdmin();

  const username = normalizeUsername(data.username);
  const password = String(data.password || '');
  const nama = cleanText(data.nama_lengkap || data.nama, 180);
  const role = normalizeRole(data.role);
  const status = normalizeStatus(data.status || 'active');
  const email = normalizeEmail(data.email);
  const bagian = cleanNullable(data.bagian || data.department, 180);

  if (!username || !password || !nama) {
    return { success: false, error: 'Username, password, dan nama wajib diisi.' };
  }
  if (!/^[a-z0-9._-]{3,180}$/.test(username)) {
    return { success: false, error: 'Username hanya boleh berisi huruf kecil, angka, titik, underscore, atau strip, minimal 3 karakter.' };
  }
  if (role === 'super_admin' && !isSuperAdmin(context.authUser)) {
    return { success: false, error: 'Hanya super admin yang dapat membuat akun super admin.' };
  }
  if (password.length < 8) {
    return { success: false, error: 'Password minimal 8 karakter.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const payload = {
    username,
    password_hash: passwordHash,
    nama,
    email,
    no_hp: cleanNullable(data.no_hp, 40),
    role,
    department: bagian,
    bagian,
    jabatan: cleanNullable(data.jabatan, 120),
    telegram_chat_id: cleanNullable(data.telegram_chat_id, 120),
    status,
    force_password_change: Boolean(data.force_password_change)
  };

  if (data.magang_id !== undefined) payload.magang_id = cleanNullable(data.magang_id, 80);

  const { data: row, error } = await db.from('app_users').insert(payload).select(USER_SELECT).single();
  if (error) {
    if (isDuplicateError(error)) return { success: false, error: 'Username atau email sudah digunakan.' };
    throw error;
  }

  await audit(db, context, 'createUser', row.id, null, userRow(row));
  return { success: true, data: userRow(row) };
}

async function updateUser(data = {}, context = {}) {
  assertAdmin(context.authUser);
  const db = getSupabaseAdmin();
  const id = cleanText(data.id, 80);
  if (!id) return { success: false, error: 'ID user wajib diisi.' };

  const before = await getTarget(db, id);
  assertCanManageTarget(context.authUser, before);

  const patch = {};
  if (data.nama_lengkap !== undefined || data.nama !== undefined) patch.nama = cleanText(data.nama_lengkap || data.nama, 180);
  if (data.email !== undefined) patch.email = normalizeEmail(data.email);
  if (data.no_hp !== undefined) patch.no_hp = cleanNullable(data.no_hp, 40);
  if (data.jabatan !== undefined) patch.jabatan = cleanNullable(data.jabatan, 120);
  if (data.telegram_chat_id !== undefined) patch.telegram_chat_id = cleanNullable(data.telegram_chat_id, 120);
  if (data.magang_id !== undefined) patch.magang_id = cleanNullable(data.magang_id, 80);
  if (data.force_password_change !== undefined) patch.force_password_change = Boolean(data.force_password_change);

  if (data.bagian !== undefined || data.department !== undefined) {
    const bagian = cleanNullable(data.bagian || data.department, 180);
    patch.bagian = bagian;
    patch.department = bagian;
  }

  if (data.status !== undefined) {
    const nextStatus = normalizeStatus(data.status);
    if (nextStatus === 'deleted') await ensureNotLastSuperAdmin(db, before);
    patch.status = nextStatus;
  }

  if (data.role !== undefined) {
    const newRole = normalizeRole(data.role);
    if (newRole === 'super_admin' && !isSuperAdmin(context.authUser)) {
      return { success: false, error: 'Hanya super admin yang dapat memberi role super admin.' };
    }
    if (before.role === 'super_admin' && newRole !== 'super_admin') {
      await ensureNotLastSuperAdmin(db, before);
    }
    patch.role = newRole;
  }

  if (!Object.keys(patch).length) return { success: true, data: userRow(before) };

  const { data: row, error } = await db.from('app_users').update(patch).eq('id', id).select(USER_SELECT).single();
  if (error) {
    if (isDuplicateError(error)) return { success: false, error: 'Email sudah digunakan.' };
    throw error;
  }

  await audit(db, context, 'updateUser', id, userRow(before), userRow(row));
  return { success: true, data: userRow(row) };
}

function makePassword() {
  return 'Gesit-' + crypto.randomBytes(4).toString('hex');
}

async function resetUserPassword(data = {}, context = {}) {
  assertAdmin(context.authUser);
  const db = getSupabaseAdmin();
  const id = cleanText(data.id, 80);
  if (!id) return { success: false, error: 'ID user wajib diisi.' };

  const before = await getTarget(db, id);
  assertCanManageTarget(context.authUser, before);

  const newPassword = makePassword();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const { data: row, error } = await db
    .from('app_users')
    .update({ password_hash: passwordHash, force_password_change: true, login_attempts: 0, locked_until: null, status: before.status === 'deleted' ? 'active' : before.status })
    .eq('id', id)
    .select(USER_SELECT)
    .single();

  if (error) throw error;

  await db.from('app_sessions').update({ revoked_at: new Date().toISOString() }).eq('user_id', id).is('revoked_at', null);
  await audit(db, context, 'resetUserPassword', id, { username: before.username }, { username: row.username, force_password_change: true });
  return { success: true, newPassword };
}

async function deleteUser(data = {}, context = {}) {
  requireRole(context.authUser, ['super_admin']);
  const db = getSupabaseAdmin();
  const id = cleanText(data.id, 80);
  if (!id) return { success: false, error: 'ID user wajib diisi.' };
  if (id === (context.authUser && (context.authUser.sub || context.authUser.id))) {
    return { success: false, error: 'Akun sendiri tidak dapat dihapus.' };
  }

  const before = await getTarget(db, id);
  await ensureNotLastSuperAdmin(db, before);

  const deletedSuffix = '__deleted__' + Date.now();
  const { data: row, error } = await db
    .from('app_users')
    .update({
      status: 'deleted',
      username: String(before.username || 'user') + deletedSuffix,
      email: null,
      telegram_chat_id: null,
      locked_until: null
    })
    .eq('id', id)
    .select(USER_SELECT)
    .single();

  if (error) throw error;

  await db.from('app_sessions').update({ revoked_at: new Date().toISOString() }).eq('user_id', id).is('revoked_at', null);
  await audit(db, context, 'deleteUser', id, userRow(before), { status: 'deleted' });
  return { success: true, data: { id: row.id } };
}

async function changePassword(data = {}, context = {}) {
  const db = getSupabaseAdmin();
  const userId = context.authUser && (context.authUser.sub || context.authUser.id);
  const oldPassword = String(data.old_password || '');
  const newPassword = String(data.new_password || '');

  if (!userId) return { success: false, sessionExpired: true, error: 'Sesi tidak valid.' };
  if (!oldPassword || !newPassword) return { success: false, error: 'Password lama dan baru wajib diisi.' };
  if (newPassword.length < 8) return { success: false, error: 'Password baru minimal 8 karakter.' };
  if (oldPassword === newPassword) return { success: false, error: 'Password baru tidak boleh sama dengan password lama.' };

  const { data: user, error } = await db.from('app_users').select(FULL_USER_SELECT).eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!user || user.status !== 'active') return { success: false, sessionExpired: true, error: 'Sesi tidak valid.' };

  const isValidOldPassword = Boolean(user.password_hash) && await bcrypt.compare(oldPassword, user.password_hash);
  if (!isValidOldPassword) return { success: false, error: 'Password lama tidak sesuai.' };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const { error: upErr } = await db
    .from('app_users')
    .update({ password_hash: passwordHash, force_password_change: false, login_attempts: 0, locked_until: null })
    .eq('id', userId);

  if (upErr) throw upErr;

  await db.from('app_sessions').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).is('revoked_at', null).neq('token_hash', data.__token ? require('../lib/security').sha256(data.__token) : '');
  await audit(db, context, 'changePassword', userId, null, { username: user.username });
  return { success: true, message: 'Password berhasil diperbarui.' };
}

module.exports = { getUsers, createUser, updateUser, resetUserPassword, deleteUser, changePassword };
