'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET wajib diatur minimal 32 karakter.');
  }
  return secret;
}

function signToken(user) {
  if (!user || !user.id) throw new Error('User tidak valid untuk pembuatan token.');

  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '12h',
      issuer: process.env.JWT_ISSUER || 'gesit-api',
      audience: process.env.JWT_AUDIENCE || 'gesit-pwa'
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: process.env.JWT_ISSUER || 'gesit-api',
    audience: process.env.JWT_AUDIENCE || 'gesit-pwa'
  });
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    nama: row.nama,
    email: row.email || '',
    role: row.role,
    department: row.department || '',
    jabatan: row.jabatan || '',
    no_hp: row.no_hp || '',
    force_password_change: Boolean(row.force_password_change)
  };
}

function requireRole(user, allowed) {
  if (!allowed || !allowed.length) return true;

  const role = user && user.role ? String(user.role) : '';
  if (!user || !allowed.includes(role)) {
    const err = new Error('Anda tidak memiliki akses untuk aksi ini.');
    err.statusCode = 403;
    throw err;
  }

  return true;
}

module.exports = { signToken, verifyToken, sha256, publicUser, requireRole };
