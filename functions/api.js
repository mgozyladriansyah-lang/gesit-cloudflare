'use strict';

let modulesPromise = null;

function applyEnv(env) {
  globalThis.process = globalThis.process || { env: {} };
  globalThis.process.env = globalThis.process.env || {};
  Object.keys(env || {}).forEach(function (k) {
    if (env[k] !== undefined && env[k] !== null) globalThis.process.env[k] = String(env[k]);
  });
}

async function loadModules(env) {
  applyEnv(env);
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('../src/actions/index.js'),
      import('../src/lib/security.js'),
      import('../src/lib/supabaseAdmin.js')
    ]).then(function (mods) {
      var actions = mods[0].default || mods[0];
      var security = mods[1].default || mods[1];
      var supabaseAdmin = mods[2].default || mods[2];
      return {
        getHandler: actions.getHandler,
        verifyToken: security.verifyToken,
        sha256: security.sha256,
        publicUser: security.publicUser,
        getSupabaseAdmin: supabaseAdmin.getSupabaseAdmin
      };
    });
  }
  return modulesPromise;
}

function corsHeaders(env) {
  return {
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400'
  };
}

function responseHeaders(env, extra) {
  return Object.assign({}, corsHeaders(env), extra || {});
}

function json(env, status, data) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: responseHeaders(env, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    })
  });
}

function empty(env, status) {
  return new Response('', {
    status: status,
    headers: responseHeaders(env, { 'cache-control': 'no-store' })
  });
}

function safeErrorMessage(err) {
  var msg = (err && err.message) || 'Terjadi kesalahan server.';
  if (/SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|JWT_SECRET|Environment|env/i.test(msg)) {
    return 'Layanan sedang disiapkan. Hubungi admin aplikasi.';
  }
  return msg;
}

async function safeJson(request) {
  try {
    return { ok: true, value: await request.json() };
  } catch (e) {
    return { ok: false, value: {} };
  }
}

function hasSupabaseConfig(env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.JWT_SECRET);
}

function getClientIp(request) {
  var headers = request.headers;
  var forwarded = String(headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return headers.get('cf-connecting-ip') || forwarded || headers.get('client-ip') || null;
}

async function validateSession(token, mod) {
  if (!token) return { valid: false, error: 'Sesi tidak ditemukan.' };
  var decoded;
  try {
    decoded = mod.verifyToken(token);
  } catch (e) {
    return { valid: false, error: 'Sesi tidak valid.' };
  }
  var db = mod.getSupabaseAdmin();
  var sessionRes = await db
    .from('app_sessions')
    .select('id,user_id,expires_at,revoked_at')
    .eq('token_hash', mod.sha256(token))
    .maybeSingle();
  if (sessionRes.error) throw sessionRes.error;
  var session = sessionRes.data;
  var expired = session && new Date(session.expires_at).getTime() < Date.now();
  if (!session || session.revoked_at || expired || String(session.user_id) !== String(decoded.sub)) {
    return { valid: false, error: 'Sesi sudah berakhir.' };
  }
  var userRes = await db
    .from('app_users')
    .select('id,username,email,nama,role,department,jabatan,no_hp,status,force_password_change')
    .eq('id', decoded.sub)
    .maybeSingle();
  if (userRes.error) throw userRes.error;
  var user = userRes.data;
  if (!user || user.status !== 'active') return { valid: false, error: 'Akun tidak aktif.' };
  return {
    valid: true,
    authUser: {
      sub: user.id,
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      public: mod.publicUser(user)
    }
  };
}

async function fallbackToLegacyGas(env, request, action) {
  var url = env.GAS_WEB_APP_URL;
  if (!url) {
    return json(env, 501, { success: false, error: 'Aksi "' + action + '" belum tersedia di backend baru.' });
  }
  var bodyText = await request.clone().text();
  var timeoutMs = Number(env.GAS_TIMEOUT_MS || 25000);
  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    var response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: bodyText || '{}',
      redirect: 'follow',
      signal: controller.signal
    });
    var text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: responseHeaders(env, {
        'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      })
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function handleRequest(context) {
  var env = context.env || {};
  var request = context.request;
  applyEnv(env);

  if (request.method === 'OPTIONS') return empty(env, 204);
  if (request.method !== 'POST') return json(env, 405, { success: false, error: 'Method not allowed' });

  var parsed = await safeJson(request.clone());
  if (!parsed.ok) return json(env, 400, { success: false, error: 'Format JSON tidak valid.' });

  var body = parsed.value || {};
  var action = String(body.action || '').trim();
  var data = body.data && typeof body.data === 'object' ? body.data : {};
  var authHeader = String(request.headers.get('authorization') || '');
  var bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  var token = String(body.token || data.token || bearerToken || '').trim();
  data.__token = token;

  if (!action) return json(env, 400, { success: false, error: 'Action wajib diisi.' });

  var mod = await loadModules(env);
  var handler = mod.getHandler(action);
  if (!handler) return fallbackToLegacyGas(env, request, action);

  if (!hasSupabaseConfig(env)) {
    if (env.GAS_WEB_APP_URL) return fallbackToLegacyGas(env, request, action);
    if (action === 'health') {
      return json(env, 200, {
        success: false,
        status: 'setup_required',
        error: 'Backend baru belum dikonfigurasi. Atur SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan JWT_SECRET di Cloudflare.'
      });
    }
    return json(env, 503, { success: false, error: 'Layanan sedang disiapkan. Hubungi admin aplikasi.' });
  }

  var authUser = null;
  if (handler.auth) {
    var validation = await validateSession(token, mod);
    if (!validation.valid) {
      return json(env, 401, { success: false, sessionExpired: true, error: validation.error || 'Sesi tidak valid.' });
    }
    authUser = validation.authUser;
  }

  var runContext = {
    authUser: authUser,
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || null,
    headers: Object.fromEntries(request.headers.entries())
  };

  var result = await handler.run(data, runContext);
  return json(env, 200, result || { success: true });
}

export async function onRequest(context) {
  try {
    return await handleRequest(context);
  } catch (err) {
    console.error('[GESIT API Cloudflare]', err);
    return json(context.env || {}, err.statusCode || 500, { success: false, error: safeErrorMessage(err) });
  }
}
