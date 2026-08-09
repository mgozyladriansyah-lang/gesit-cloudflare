'use strict';

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');

async function health() {
  const started = Date.now();
  const db = getSupabaseAdmin();

  const { error } = await db
    .from('app_users')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;

  return {
    success: true,
    status: 'ok',
    backend: 'supabase-postgres',
    latency_ms: Date.now() - started,
    time: new Date().toISOString()
  };
}

module.exports = { health };
