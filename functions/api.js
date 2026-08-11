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
  // GESIT_TASK3D_FIX4_LEGACY_SESSION_SAFE
  // Guard paling awal untuk token legacy 64 hex.
  // Tujuan:
  // - checkSession token legacy valid boleh fallback ke GAS bila perlu.
  // - checkSession setelah logout tidak boleh 500, harus success=true valid=false.
  // - logout token legacy selalu aman walaupun fallback error.
  if (action === 'checkSession' || action === 'check_session' || action === 'logout') {
    var fix4Token = String(body.token || (body.data && body.data.token) || '').trim();
    var fix4LooksLikeJwt = fix4Token.split('.').length === 3;
    var fix4LooksLikeLegacyHex = /^[a-f0-9]{64}$/i.test(fix4Token);

    if (!fix4Token && (action === 'checkSession' || action === 'check_session')) {
      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: false,
        source: 'task3d-fix4-empty-token'
      });
    }

    if (fix4Token && (!fix4LooksLikeJwt || fix4LooksLikeLegacyHex)) {
      try {
        var fix4Mod = await loadModules(env);
        var fix4Db = fix4Mod.getSupabaseAdmin();
        var fix4Hash = fix4Mod.sha256(fix4Token);

        if (action === 'logout') {
          try {
            await fix4Db
              .from('app_sessions')
              .update({ revoked_at: new Date().toISOString() })
              .or('token_hash.eq.' + fix4Token + ',token_hash.eq.' + fix4Hash)
              .is('revoked_at', null);
          } catch (e) {}

          if (env.GAS_WEB_APP_URL) {
            try {
              await fallbackToLegacyGas(env, request, action);
            } catch (e) {}
          }

          return json(env, 200, {
            success: true,
            source: 'task3d-fix4-legacy-logout-safe'
          });
        }

        if (action === 'checkSession' || action === 'check_session') {
          var fix4SessionRes = await fix4Db
            .from('app_sessions')
            .select('id,user_id,expires_at,revoked_at')
            .or('token_hash.eq.' + fix4Token + ',token_hash.eq.' + fix4Hash)
            .limit(1);

          if (!fix4SessionRes.error && fix4SessionRes.data && fix4SessionRes.data.length) {
            var fix4Session = fix4SessionRes.data[0];
            var fix4Expired = fix4Session && new Date(fix4Session.expires_at).getTime() < Date.now();

            if (!fix4Session || fix4Session.revoked_at || fix4Expired) {
              return json(env, 200, {
                success: true,
                valid: false,
                sessionExpired: true,
                source: 'task3d-fix4-legacy-db-revoked-expired'
              });
            }

            var fix4UserRes = await fix4Db
              .from('app_users')
              .select('id,username,email,nama,role,department,jabatan,no_hp,status,force_password_change')
              .eq('id', fix4Session.user_id)
              .maybeSingle();

            if (!fix4UserRes.error && fix4UserRes.data && fix4UserRes.data.status === 'active') {
              var fix4User = fix4UserRes.data;

              return json(env, 200, {
                success: true,
                valid: true,
                sessionExpired: false,
                user: {
                  id: fix4User.id,
                  username: fix4User.username,
                  email: fix4User.email || '',
                  nama: fix4User.nama || '',
                  nama_lengkap: fix4User.nama || '',
                  role: fix4User.role,
                  department: fix4User.department || '',
                  jabatan: fix4User.jabatan || '',
                  no_hp: fix4User.no_hp || '',
                  status: fix4User.status,
                  force_password_change: Boolean(fix4User.force_password_change)
                },
                source: 'task3d-fix4-legacy-db-valid'
              });
            }

            return json(env, 200, {
              success: true,
              valid: false,
              sessionExpired: true,
              source: 'task3d-fix4-legacy-db-user-invalid'
            });
          }
        }
      } catch (e) {}

      if (action === 'checkSession' || action === 'check_session') {
        if (env.GAS_WEB_APP_URL) {
          try {
            var fix4GasResponse = await fallbackToLegacyGas(env, request, action);

            if (fix4GasResponse.status >= 400) {
              return json(env, 200, {
                success: true,
                valid: false,
                sessionExpired: true,
                source: 'task3d-fix4-gas-error-normalized'
              });
            }

            return fix4GasResponse;
          } catch (e) {
            return json(env, 200, {
              success: true,
              valid: false,
              sessionExpired: true,
              source: 'task3d-fix4-gas-catch-normalized'
            });
          }
        }

        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-fix4-legacy-no-gas-normalized'
        });
      }
    }
  }
  // GESIT_TASK3D_FIX3_HYBRID_CHECKSESSION
  // Transitional guard: login saat ini masih mengembalikan token legacy 64 hex.
  // Token legacy tidak boleh diverifikasi sebagai JWT. Delegasikan ke legacy GAS bila tersedia.
  // Token JWT tetap divalidasi oleh handler modern di bawahnya.
  if (action === 'checkSession' || action === 'check_session') {
    var hybridToken = String(body.token || (body.data && body.data.token) || '').trim();

    if (!hybridToken) {
      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: false,
        source: 'task3d-fix3-empty-token'
      });
    }

    var looksLikeJwt = hybridToken.split('.').length === 3;
    var looksLikeLegacyHex = /^[a-f0-9]{64}$/i.test(hybridToken);

    if (!looksLikeJwt || looksLikeLegacyHex) {
      if (env.GAS_WEB_APP_URL) {
        return fallbackToLegacyGas(env, request, action);
      }

      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: true,
        source: 'task3d-fix3-legacy-token-no-gas-fallback'
      });
    }
  }
  // GESIT_TASK3D_FIX2_CHECKSESSION_PRIORITY
  // Priority handler: token valid harus valid=true, token logout/revoked/expired harus valid=false tanpa 500.
  if (action === 'checkSession' || action === 'check_session') {
    var fix2Token = String(body.token || (body.data && body.data.token) || '').trim();

    if (!fix2Token) {
      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: false,
        source: 'task3d-fix2-empty-token'
      });
    }

    try {
      var fix2Mod = await loadModules(env);

      var fix2Decoded;
      try {
        fix2Decoded = fix2Mod.verifyToken(fix2Token);
      } catch (e) {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-fix2-invalid-token'
        });
      }

      var db = fix2Mod.getSupabaseAdmin();

      var fix2SessionRes = await db
        .from('app_sessions')
        .select('id,user_id,expires_at,revoked_at')
        .eq('token_hash', fix2Mod.sha256(fix2Token))
        .maybeSingle();

      if (fix2SessionRes.error) {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-fix2-session-query-error'
        });
      }

      var fix2Session = fix2SessionRes.data;
      var fix2Expired = fix2Session && new Date(fix2Session.expires_at).getTime() < Date.now();

      if (!fix2Session || fix2Session.revoked_at || fix2Expired || String(fix2Session.user_id) !== String(fix2Decoded.sub)) {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-fix2-revoked-expired-or-missing'
        });
      }

      var fix2UserRes = await db
        .from('app_users')
        .select('id,username,email,nama,role,department,jabatan,no_hp,status,force_password_change')
        .eq('id', fix2Decoded.sub)
        .maybeSingle();

      if (fix2UserRes.error || !fix2UserRes.data || fix2UserRes.data.status !== 'active') {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-fix2-user-invalid'
        });
      }

      var u = fix2UserRes.data;

      return json(env, 200, {
        success: true,
        valid: true,
        sessionExpired: false,
        user: {
          id: u.id,
          username: u.username,
          email: u.email || '',
          nama: u.nama || '',
          nama_lengkap: u.nama || '',
          role: u.role,
          department: u.department || '',
          jabatan: u.jabatan || '',
          no_hp: u.no_hp || '',
          status: u.status,
          force_password_change: Boolean(u.force_password_change)
        },
        source: 'task3d-fix2-valid'
      });
    } catch (e) {
      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: true,
        source: 'task3d-fix2-catch'
      });
    }
  }
  // GESIT_TASK3D_SAFE_CHECKSESSION
  // Handler ini memastikan checkSession tidak pernah 500 setelah logout/revoked/expired.
  // Output aman: success true, valid false untuk token kosong, token invalid, revoked, expired, atau query session bermasalah.
  if (action === 'checkSession' || action === 'check_session') {
    var safeToken = String(body.token || (body.data && body.data.token) || '').trim();
    if (!safeToken) {
      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: false,
        source: 'task3d-safe-checksession-empty-token'
      });
    }

    try {
      var safeMod = await loadModules(env);
      var decoded;
      try {
        decoded = safeMod.verifyToken(safeToken);
      } catch (e) {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-safe-checksession-invalid-token'
        });
      }

      var db = safeMod.getSupabaseAdmin();
      var sessionRes = await db
        .from('app_sessions')
        .select('id,user_id,expires_at,revoked_at')
        .eq('token_hash', safeMod.sha256(safeToken))
        .maybeSingle();

      if (sessionRes.error) {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-safe-checksession-session-query-error'
        });
      }

      var session = sessionRes.data;
      var expired = session && new Date(session.expires_at).getTime() < Date.now();
      if (!session || session.revoked_at || expired || String(session.user_id) !== String(decoded.sub)) {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-safe-checksession-revoked-or-expired'
        });
      }

      var userRes = await db
        .from('app_users')
        .select('id,username,email,nama,role,department,jabatan,no_hp,status,force_password_change')
        .eq('id', decoded.sub)
        .maybeSingle();

      if (userRes.error || !userRes.data || userRes.data.status !== 'active') {
        return json(env, 200, {
          success: true,
          valid: false,
          sessionExpired: true,
          source: 'task3d-safe-checksession-user-invalid'
        });
      }

      return json(env, 200, {
        success: true,
        valid: true,
        sessionExpired: false,
        user: safeMod.publicUser(userRes.data),
        source: 'task3d-safe-checksession-valid'
      });
    } catch (e) {
      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: true,
        source: 'task3d-safe-checksession-catch'
      });
    }
  }

  // GESIT_TASK2C_DIRECT_SESSION_COMPAT
  // Fallback aman untuk action dasar agar frontend tidak jatuh ke legacy/GAS.
  if (action === 'checkSession' || action === 'check_session') {
    var directToken = String(body.token || (body.data && body.data.token) || '').trim();
    if (!directToken) {
      return json(env, 200, {
        success: true,
        valid: false,
        sessionExpired: false,
        source: 'task2c-direct-session-empty-token'
      });
    }
  }

  if (action === 'login') {
    var directLoginData = body.data && typeof body.data === 'object' ? body.data : {};
    var directUsername = String(directLoginData.username || body.username || '').trim();
    var directPassword = String(directLoginData.password || body.password || '');
    if (!directUsername || !directPassword) {
      return json(env, 200, {
        success: false,
        error: 'Username dan password wajib diisi.',
        source: 'task2c-direct-login-empty'
      });
    }
  }

  // GESIT_TASK2B_DIRECT_HEALTH
  // Direct health endpoint agar /api tidak fallback ke backend lama/GAS.
  if (action === 'health') {
    return json(env, 200, {
      success: true,
      status: 'ok',
      backend: 'cloudflare-pages-functions',
      task: 'task2b-direct-health',
      time: new Date().toISOString()
    });
  }
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






