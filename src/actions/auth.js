'use strict';

const bcrypt = require('bcryptjs');
const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const { signToken, verifyToken, sha256, publicUser } = require('../lib/security');

const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);
const USER_SELECT = 'id,username,email,nama,role,department,jabatan,no_hp,status,password_hash,last_login_at,force_password_change';

function cleanText(value, max = 255) {
  return String(value || '').trim().slice(0, max);
}

function cleanLogin(value) {
  return cleanText(value, 180).toLowerCase();
}

async function findUserByLogin(db, loginValue) {
  const byUsername = await db
    .from('app_users')
    .select(USER_SELECT)
    .eq('username', loginValue)
    .maybeSingle();

  if (byUsername.error) throw byUsername.error;
  if (byUsername.data) return byUsername.data;

  const byEmail = await db
    .from('app_users')
    .select(USER_SELECT)
    .eq('email', loginValue)
    .maybeSingle();

  if (byEmail.error) throw byEmail.error;
  return byEmail.data || null;
}

async function login(data = {}, context = {}) {
  const username = cleanLogin(data.username);
  const password = String(data.password || '');

  if (!username || !password) {
    return { success: false, error: 'Username dan password wajib diisi.' };
  }

  const db = getSupabaseAdmin();
  const user = await findUserByLogin(db, username);

  if (!user || user.status !== 'active') {
    return { success: false, error: 'Username atau password salah.' };
  }

  const isValidPassword = Boolean(user.password_hash) && await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return { success: false, error: 'Username atau password salah.' };
  }

  const token = signToken(user);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();

  const { error: sessionError } = await db.from('app_sessions').insert({
    user_id: user.id,
    token_hash: sha256(token),
    user_agent: cleanText(context.userAgent, 500) || null,
    ip_address: cleanText(context.ip, 80) || null,
    expires_at: expiresAt
  });
  if (sessionError) throw sessionError;

  const { error: loginError } = await db
    .from('app_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);
  if (loginError) throw loginError;

  return { success: true, token, user: publicUser(user), expires_at: expiresAt };
}

async function checkSession(data = {}) {
  const token = cleanText(data.token || data.__token, 4096);
  if (!token) return { success: true, valid: false };

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (e) {
    return { success: true, valid: false };
  }

  const db = getSupabaseAdmin();
  const tokenHash = sha256(token);

  const { data: session, error: sessionError } = await db
    .from('app_sessions')
    .select('id,user_id,expires_at,revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (sessionError) throw sessionError;

  const expired = session && new Date(session.expires_at).getTime() < Date.now();
  if (!session || session.revoked_at || expired || String(session.user_id) !== String(decoded.sub)) {
    return { success: true, valid: false };
  }

  const { data: user, error: userError } = await db
    .from('app_users')
    .select(USER_SELECT)
    .eq('id', decoded.sub)
    .maybeSingle();
  if (userError) throw userError;

  if (!user || user.status !== 'active') return { success: true, valid: false };

  return { success: true, valid: true, user: publicUser(user) };
}

async function logout(data = {}) {
  const token = cleanText(data.token || data.__token, 4096);
  if (!token) return { success: true };

  const db = getSupabaseAdmin();
  const { error } = await db
    .from('app_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', sha256(token))
    .is('revoked_at', null);
  if (error) throw error;

  return { success: true };
}

async function me(data) {
  return checkSession(data);
}

module.exports = { login, checkSession, logout, me };
