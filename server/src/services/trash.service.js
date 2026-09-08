const config = require('../config');
const FileModel = require('../models/File');
const User = require('../models/User');
const storageService = require('./storage.service');

function purgeExpiredTrash() {
  const cutoff = new Date(Date.now() - config.trashRetentionDays * 24 * 60 * 60 * 1000).toISOString();
  const expired = FileModel.listExpiredTrash(cutoff);
  for (const file of expired) {
    storageService.deletePhysicalFile(file.stored_path);
    FileModel.delete(file.id);
    User.incrementUsage(file.user_id, -file.size_bytes);
  }
  return expired.length;
}

module.exports = { purgeExpiredTrash };
