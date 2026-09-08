const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const config = require('../config');

const User = {
  create({ email, passwordHash, role = 'user' }) {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, role, storage_used_bytes, storage_quota_bytes)
       VALUES (?, ?, ?, ?, 0, ?)`
    ).run(id, email, passwordHash, role, config.defaultQuotaBytes);
    return User.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findAll() {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  },

  delete(id) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  setQuota(id, quotaBytes) {
    db.prepare('UPDATE users SET storage_quota_bytes = ? WHERE id = ?').run(quotaBytes, id);
    return User.findById(id);
  },

  setTotpSecret(id, secret) {
    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret, id);
  },

  enableTotp(id) {
    db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(id);
    return User.findById(id);
  },

  disableTotp(id) {
    db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(id);
  },

  setPasswordHash(id, passwordHash) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
  },

  setRole(id, role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    return User.findById(id);
  },

  incrementUsage(id, deltaBytes) {
    db.prepare(
      'UPDATE users SET storage_used_bytes = MAX(0, storage_used_bytes + ?) WHERE id = ?'
    ).run(deltaBytes, id);
  },

  toPublic(user) {
    if (!user) return null;
    const { password_hash, totp_secret, ...rest } = user;
    return rest;
  },
};

module.exports = User;
