const fs = require('fs');
const FileModel = require('../models/File');
const Folder = require('../models/Folder');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const quotaService = require('../services/quota.service');
const storageService = require('../services/storage.service');

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'file is required (field name: file)' });
  }

  const actualSize = req.file.size;

  // The header-based quota middleware only caught the declared Content-Length.
  // Now that the file is fully written, verify against its real size too.
  const freshUser = User.findById(req.user.id);
  if (!quotaService.hasRoomFor(freshUser, actualSize)) {
    storageService.deletePhysicalFile(req.file.path);
    return res.status(413).json({
      error: 'Storage quota exceeded',
      remainingBytes: Math.max(0, freshUser.storage_quota_bytes - freshUser.storage_used_bytes),
      quotaBytes: freshUser.storage_quota_bytes,
      usedBytes: freshUser.storage_used_bytes,
    });
  }

  const { folderId } = req.body;
  if (folderId) {
    const folder = Folder.findById(folderId);
    if (!folder || folder.user_id !== req.user.id) {
      storageService.deletePhysicalFile(req.file.path);
      return res.status(404).json({ error: 'folder not found' });
    }
  }

  const file = FileModel.create({
    userId: req.user.id,
    folderId: folderId || null,
    originalName: req.file.originalname,
    storedPath: req.file.path,
    sizeBytes: actualSize,
    mimeType: req.file.mimetype,
  });

  quotaService.applyDelta(req.user.id, actualSize);
  ActivityLog.record({ userId: req.user.id, action: 'upload', targetName: file.original_name });

  res.status(201).json({ file });
}

function list(req, res) {
  const { folderId, search, type, sortBy, sortOrder } = req.query;
  const files = FileModel.listByUser(req.user.id, folderId || null, {
    search,
    type,
    sortBy,
    sortOrder,
  });
  res.json({ files });
}

function listPublic(req, res) {
  const files = FileModel.listPublicByUser(req.user.id);
  res.json({ files });
}

function listStarred(req, res) {
  const files = FileModel.listStarredByUser(req.user.id);
  res.json({ files });
}

function listRecent(req, res) {
  const files = FileModel.listRecentByUser(req.user.id, 50);
  res.json({ files });
}

function listTrash(req, res) {
  const files = FileModel.listTrashByUser(req.user.id);
  res.json({ files });
}

function rename(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || (file.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'file not found' });
  }
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const previousName = file.original_name;
  const updated = FileModel.rename(file.id, name.trim());
  ActivityLog.record({
    userId: req.user.id,
    action: 'rename',
    targetName: updated.original_name,
    meta: { from: previousName },
  });
  res.json({ file: updated });
}

function setStarred(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || file.user_id !== req.user.id) {
    return res.status(404).json({ error: 'file not found' });
  }
  const { starred } = req.body;
  const updated = FileModel.setStarred(file.id, !!starred);
  res.json({ file: updated });
}

function content(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || (file.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'file not found' });
  }
  if (!fs.existsSync(file.stored_path)) {
    return res.status(404).json({ error: 'file missing from storage' });
  }
  FileModel.touchAccessed(file.id);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(file.original_name)}"`
  );
  fs.createReadStream(file.stored_path).pipe(res);
}

function getOne(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || (file.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'file not found' });
  }
  res.json({ file });
}

// Soft delete: moves the file to Trash. It still counts against quota until
// permanently deleted (either by the user or by the retention auto-purge).
function remove(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || (file.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'file not found' });
  }
  if (file.deleted_at) {
    return res.status(409).json({ error: 'file is already in trash' });
  }
  const updated = FileModel.softDelete(file.id);
  ActivityLog.record({ userId: file.user_id, action: 'trash', targetName: file.original_name });
  res.json({ file: updated });
}

function restore(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || (file.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'file not found' });
  }
  if (!file.deleted_at) {
    return res.status(409).json({ error: 'file is not in trash' });
  }
  const updated = FileModel.restore(file.id);
  ActivityLog.record({ userId: file.user_id, action: 'restore', targetName: file.original_name });
  res.json({ file: updated });
}

function permanentDelete(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || (file.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'file not found' });
  }
  storageService.deletePhysicalFile(file.stored_path);
  FileModel.delete(file.id);
  quotaService.applyDelta(file.user_id, -file.size_bytes);
  ActivityLog.record({ userId: file.user_id, action: 'delete_permanent', targetName: file.original_name });
  res.status(204).end();
}

function setVisibility(req, res) {
  const file = FileModel.findById(req.params.id);
  if (!file || file.user_id !== req.user.id) {
    return res.status(404).json({ error: 'file not found' });
  }
  const { isPublic, expiresAt } = req.body;
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return res.status(400).json({ error: 'expiresAt must be in the future' });
  }
  const token = isPublic ? file.public_token || FileModel.newPublicToken() : null;
  const updated = FileModel.setVisibility(file.id, !!isPublic, token, isPublic ? expiresAt || null : null);
  ActivityLog.record({
    userId: req.user.id,
    action: isPublic ? 'share_enable' : 'share_disable',
    targetName: file.original_name,
  });
  res.json({ file: updated });
}

function servePublic(req, res) {
  const file = FileModel.findByPublicToken(req.params.token);
  if (!file) {
    return res.status(404).json({ error: 'file not found' });
  }
  if (!fs.existsSync(file.stored_path)) {
    return res.status(404).json({ error: 'file missing from storage' });
  }
  FileModel.touchAccessed(file.id);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(file.original_name)}"`
  );
  fs.createReadStream(file.stored_path).pipe(res);
}

module.exports = {
  upload,
  list,
  listPublic,
  listStarred,
  listRecent,
  listTrash,
  rename,
  setStarred,
  content,
  getOne,
  remove,
  restore,
  permanentDelete,
  setVisibility,
  servePublic,
};
