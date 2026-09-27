const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db');

const KEY_PREFIX = 'cdnk_';
const PREFIX_DISPLAY_LEN = 12;

function generateRawKey() {
  return KEY_PREFIX + crypto.randomBytes(32).toString('hex');
}

function hash(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

const ApiKey = {
  KEY_PREFIX,
  hash,

  create({ userId, name }) {
    const id = uuidv4();
    const rawKey = generateRawKey();
    const keyHash = hash(rawKey);
    const keyPrefix = rawKey.slice(0, PREFIX_DISPLAY_LEN);
    db.prepare(
      `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?, ?)`
    ).run(id, userId, name, keyHash, keyPrefix);
    return { ...ApiKey.findById(id), rawKey };
  },

  findById(id) {
    return db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id);
  },

  findByHash(keyHash) {
    return db.prepare('SELECT * FROM api_keys WHERE key_hash = ?').get(keyHash);
  },

  listByUser(userId) {
    return db
      .prepare(
        `SELECT id, name, key_prefix, last_used_at, created_at FROM api_keys
         WHERE user_id = ? ORDER BY created_at DESC`
      )
      .all(userId);
  },

  touchLastUsed(id) {
    db.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?").run(id);
  },

  deleteForUser(id, userId) {
    const result = db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(id, userId);
    return result.changes > 0;
  },

  toPublic(apiKey) {
    if (!apiKey) return null;
    const { key_hash, rawKey, ...rest } = apiKey;
    return rest;
  },
};

module.exports = ApiKey;
