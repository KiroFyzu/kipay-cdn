require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  defaultQuotaBytes: Number(process.env.DEFAULT_QUOTA_BYTES || 2 * 1024 * 1024 * 1024),
  dbPath: path.resolve(__dirname, '../../', process.env.DB_PATH || './data.sqlite'),
  storageDir: path.resolve(__dirname, '../../', process.env.STORAGE_DIR || './storage'),
  trashRetentionDays: Number(process.env.TRASH_RETENTION_DAYS || 30),
};
