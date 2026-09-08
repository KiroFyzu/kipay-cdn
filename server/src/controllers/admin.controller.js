const User = require('../models/User');
const FileModel = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const storageService = require('../services/storage.service');

function listUsers(req, res) {
  const users = User.findAll().map(User.toPublic);
  res.json({ users });
}

function setQuota(req, res) {
  const { quotaBytes } = req.body;
  if (!Number.isFinite(quotaBytes) || quotaBytes < 0) {
    return res.status(400).json({ error: 'quotaBytes must be a non-negative number' });
  }
  const user = User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  const updated = User.setQuota(user.id, quotaBytes);
  res.json({ user: User.toPublic(updated) });
}

function deleteUser(req, res) {
  const user = User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  const files = FileModel.listAll().filter((f) => f.user_id === user.id);
  files.forEach((f) => storageService.deletePhysicalFile(f.stored_path));
  User.delete(user.id); // cascades to folders/files via FK
  res.status(204).end();
}

function listAllFiles(req, res) {
  const files = FileModel.listAll();
  res.json({ files });
}

function stats(req, res) {
  const users = User.findAll();
  const files = FileModel.listAll();

  const totalUsers = users.length;
  const totalStorageUsed = users.reduce((sum, u) => sum + u.storage_used_bytes, 0);
  const totalStorageQuota = users.reduce((sum, u) => sum + u.storage_quota_bytes, 0);
  const totalFiles = files.length;

  const usersByUsage = users
    .map((u) => ({
      id: u.id,
      email: u.email,
      usedBytes: u.storage_used_bytes,
      quotaBytes: u.storage_quota_bytes,
    }))
    .sort((a, b) => b.usedBytes - a.usedBytes)
    .slice(0, 10);

  const filesByType = files.reduce((acc, f) => {
    const mime = f.mime_type || '';
    let category = 'other';
    if (mime.startsWith('image/')) category = 'image';
    else if (mime.startsWith('video/')) category = 'video';
    else if (
      mime === 'application/pdf' ||
      mime.startsWith('text/') ||
      mime.startsWith('application/vnd.') ||
      mime === 'application/msword'
    ) {
      category = 'document';
    }
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalUsers,
    totalStorageUsed,
    totalStorageQuota,
    totalFiles,
    usersByUsage,
    filesByType,
  });
}

function listActivity(req, res) {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const cursor = Number(req.query.cursor) || 0;
  const entries = ActivityLog.listAll({ limit, cursor });
  res.json({ entries });
}

module.exports = { listUsers, setQuota, deleteUser, listAllFiles, stats, listActivity };
