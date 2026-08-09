'use strict';

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');

function cleanText(value, max = 255) {
  return String(value || '').trim().slice(0, max);
}

async function createNotification(data = {}, context = {}) {
  const title = cleanText(data.title || data.judul, 120);
  const body = cleanText(data.body || data.message || data.pesan, 1500);

  if (!title || !body) {
    return { success: false, error: 'Judul dan pesan notifikasi wajib diisi.' };
  }

  const db = getSupabaseAdmin();
  const payload = {
    user_id: cleanText(data.user_id, 80) || null,
    channel: cleanText(data.channel, 40) || 'app',
    title,
    body,
    data: data.data && typeof data.data === 'object' ? data.data : {},
    jenis: cleanText(data.jenis, 80) || null,
    penerima: cleanText(data.penerima || data.target_username, 180) || null,
    ref_modul: cleanText(data.ref_modul || data.module, 120) || null,
    ref_id: cleanText(data.ref_id, 120) || null,
    status: cleanText(data.status, 80) || 'created',
    error: cleanText(data.error, 500) || null,
    oleh: context.authUser && (context.authUser.username || context.authUser.sub) || cleanText(data.oleh, 120) || null
  };

  const { data: row, error } = await db
    .from('notifications')
    .insert(payload)
    .select('id,title,created_at')
    .single();

  if (error) throw error;
  return { success: true, data: row };
}

module.exports = { createNotification };
