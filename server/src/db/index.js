const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const config = require('../config');

if (!fs.existsSync(config.storageDir)) {
  fs.mkdirSync(config.storageDir, { recursive: true });
}

const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  storage_used_bytes INTEGER NOT NULL DEFAULT 0,
  storage_quota_bytes INTEGER NOT NULL DEFAULT ${config.defaultQuotaBytes},
  totp_secret TEXT,
  totp_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  public_token TEXT UNIQUE,
  expires_at TEXT,
  is_starred INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  last_accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_name TEXT,
  meta TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
`);

// --- Migrations for databases created before these columns/tables existed ---
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
if (!userColumns.includes('totp_secret')) {
  db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT');
}
if (!userColumns.includes('totp_enabled')) {
  db.exec('ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0');
}

const fileColumns = db.prepare("PRAGMA table_info(files)").all().map((c) => c.name);
if (!fileColumns.includes('expires_at')) {
  db.exec('ALTER TABLE files ADD COLUMN expires_at TEXT');
}
if (!fileColumns.includes('is_starred')) {
  db.exec('ALTER TABLE files ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0');
}
if (!fileColumns.includes('deleted_at')) {
  db.exec('ALTER TABLE files ADD COLUMN deleted_at TEXT');
}
if (!fileColumns.includes('last_accessed_at')) {
  db.exec('ALTER TABLE files ADD COLUMN last_accessed_at TEXT');
  db.exec("UPDATE files SET last_accessed_at = created_at WHERE last_accessed_at IS NULL");
}

module.exports = db;
