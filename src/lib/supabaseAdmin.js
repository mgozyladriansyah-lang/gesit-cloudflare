'use strict';

const { createClient } = require('@supabase/supabase-js');

let cached = null;
let cachedConfigKey = null;

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(name + ' wajib diatur.');
  }
  return String(value).trim();
}

function assertValidUrl(url) {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('invalid protocol');
  } catch (e) {
    throw new Error('SUPABASE_URL tidak valid.');
  }
}

function getSupabaseAdmin() {
  const url = requireEnv('SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  assertValidUrl(url);

  const configKey = url + ':' + key.slice(0, 8);
  if (cached && cachedConfigKey === configKey) return cached;

  cached = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-application-name': 'gesit-netlify-api'
      }
    }
  });
  cachedConfigKey = configKey;
  return cached;
}

module.exports = { getSupabaseAdmin };
