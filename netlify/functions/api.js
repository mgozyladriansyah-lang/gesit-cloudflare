'use strict';

const { getHandler } = require('../../src/actions');
const { verifyToken, sha256, publicUser } = require('../../src/lib/security');
const { getSupabaseAdmin } = require('../../src/lib/supabaseAdmin');

const CORS_HEADERS = {
  'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-max-age': '86400'
};

exports.handler = async function (event) {
  try {
    if (event.httpMethod === 'OPTIONS') return empty(204);
    if (event.httpMethod !== 'POST') {
      return json(405, { success: false, error: 'Method not allowed' });
    }

    const parsed = safeJson(event.body || '{}');
    if (!parsed.ok) {
      return json(400, { success: false, error: 'Format JSON tidak valid.' });
    }

    const body = parsed.value;
    const action = String(body.action || '').trim();
    const data = body.data && typeof body.data === 'object' ? body.data : {};
    const authHeader = String(event.headers.authorization || event.headers.Authorization || '');
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
    const token = String(body.token || data.token || bearerToken || '').trim();
    data.__token = token;

    if (!action) {
      return json(400, { success: false, error: 'Action wajib diisi.' });
    }

    const handler = getHandler(action);
    if (!handler) return fallbackToLegacyGas(event, action);

    if (!hasSupabaseConfig()) {
      if (process.env.GAS_WEB_APP_URL) return fallbackToLegacyGas(event, action);
      if (action === 'health') {
        return json(200, {
          success: false,
          status: 'setup_required',
          error: 'Backend baru belum dikonfigurasi. Atur SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan JWT_SECRET di Netlify.'
        });
      }
      return json(503, {
        success: false,
        error: 'Layanan sedang disiapkan. Hubungi admin aplikasi.'
      });
    }

    let authUser = null;
    if (handler.auth) {
      const validation = await validateSession(token);
      if (!validation.valid) {
        return json(401, { success: false, sessionExpired: true, error: validation.error || 'Sesi tidak valid.' });
      }
      authUser = validation.authUser;
    }

    const context = {
      authUser,
      ip: getClientIp(event.headers),
      userAgent: event.headers['user-agent'] || null,
      headers: event.headers
    };

    const result = await handler.run(data, context);
    return json(200, result || { success: true });
  } catch (err) {
    console.error('[GESIT API]', err);
    return json(err.statusCode || 500, { success: false, error: safeErrorMessage(err) });
  }
};

async function validateSession(token) {
  if (!token) return { valid: false, error: 'Sesi tidak ditemukan.' };

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (e) {
    return { valid: false, error: 'Sesi tidak valid.' };
  }

  const db = getSupabaseAdmin();
  const { data: session, error: sessionError } = await db
    .from('app_sessions')
    .select('id,user_id,expires_at,revoked_at')
    .eq('token_hash', sha256(token))
    .maybeSingle();
  if (sessionError) throw sessionError;

  const expired = session && new Date(session.expires_at).getTime() < Date.now();
  if (!session || session.revoked_at || expired || String(session.user_id) !== String(decoded.sub)) {
    return { valid: false, error: 'Sesi sudah berakhir.' };
  }

  const { data: user, error: userError } = await db
    .from('app_users')
    .select('id,username,email,nama,role,department,jabatan,no_hp,status,force_password_change')
    .eq('id', decoded.sub)
    .maybeSingle();
  if (userError) throw userError;

  if (!user || user.status !== 'active') {
    return { valid: false, error: 'Akun tidak aktif.' };
  }

  return {
    valid: true,
    authUser: {
      sub: user.id,
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      public: publicUser(user)
    }
  };
}

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.JWT_SECRET);
}

function safeErrorMessage(err) {
  const msg = (err && err.message) || 'Terjadi kesalahan server.';
  if (/SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|JWT_SECRET|Environment|env/i.test(msg)) {
    return 'Layanan sedang disiapkan. Hubungi admin aplikasi.';
  }
  return msg;
}

function safeJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, value: {} };
  }
}

function getClientIp(headers) {
  const forwarded = String(headers['x-forwarded-for'] || '').split(',')[0].trim();
  return headers['x-nf-client-connection-ip'] || forwarded || headers['client-ip'] || null;
}

async function fallbackToLegacyGas(event, action) {
  const url = process.env.GAS_WEB_APP_URL;
  if (!url) {
    return json(501, {
      success: false,
      error: 'Aksi "' + action + '" belum tersedia di backend baru.'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.GAS_TIMEOUT_MS || 25000));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: event.body || '{}',
      redirect: 'follow',
      signal: controller.signal
    });

    const text = await response.text();
    return {
      statusCode: response.status,
      headers: responseHeaders({
        'content-type': response.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store'
      }),
      body: text
    };
  } finally {
    clearTimeout(timeout);
  }
}

function responseHeaders(extra = {}) {
  return Object.assign({}, CORS_HEADERS, extra);
}

function empty(statusCode) {
  return { statusCode, headers: responseHeaders({ 'cache-control': 'no-store' }), body: '' };
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: responseHeaders({ 'content-type': 'application/json', 'cache-control': 'no-store' }),
    body: JSON.stringify(data)
  };
}
