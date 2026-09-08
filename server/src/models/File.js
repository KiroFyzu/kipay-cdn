const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const SORTABLE_COLUMNS = {
  name: 'original_name',
  size: 'size_bytes',
  date: 'created_at',
};

const TYPE_MIME_PATTERNS = {
  image: ["mime_type LIKE 'image/%'"],
  video: ["mime_type LIKE 'video/%'"],
  document: [
    "mime_type LIKE 'application/pdf'",
    "mime_type LIKE 'text/%'",
    "mime_type LIKE 'application/msword'",
    "mime_type LIKE 'application/vnd.openxmlformats%'",
    "mime_type LIKE 'application/vnd.ms-excel'",
    "mime_type LIKE 'application/vnd.ms-powerpoint'",
  ],
};

const FileModel = {
  create({ userId, folderId = null, originalName, storedPath, sizeBytes, mimeType }) {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO files (id, user_id, folder_id, original_name, stored_path, size_bytes, mime_type, is_public, public_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)`
    ).run(id, userId, folderId, originalName, storedPath, sizeBytes, mimeType);
    return FileModel.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
  },

  findByPublicToken(token) {
    const file = db
      .prepare('SELECT * FROM files WHERE public_token = ? AND is_public = 1 AND deleted_at IS NULL')
      .get(token);
    if (!file) return null;
    if (file.expires_at && new Date(file.expires_at).getTime() <= Date.now()) {
      return null;
    }
    return file;
  },

  listByUser(userId, folderId = null, { search, type, sortBy, sortOrder } = {}) {
    const clauses = ['user_id = ?', 'deleted_at IS NULL'];
    const params = [userId];

    if (folderId) {
      clauses.push('folder_id = ?');
      params.push(folderId);
    } else {
      clauses.push('folder_id IS NULL');
    }

    if (search) {
      clauses.push('original_name LIKE ?');
      params.push(`%${search}%`);
    }

    if (type && TYPE_MIME_PATTERNS[type]) {
      clauses.push(`(${TYPE_MIME_PATTERNS[type].join(' OR ')})`);
    } else if (type === 'other') {
      const known = Object.values(TYPE_MIME_PATTERNS).flat();
      clauses.push(`NOT (${known.join(' OR ')})`);
    }

    const column = SORTABLE_COLUMNS[sortBy] || 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const sql = `SELECT * FROM files WHERE ${clauses.join(' AND ')} ORDER BY ${column} ${order}`;
    return db.prepare(sql).all(...params);
  },

  listPublicByUser(userId) {
    return db
      .prepare(
        'SELECT * FROM files WHERE user_id = ? AND is_public = 1 AND deleted_at IS NULL ORDER BY created_at DESC'
      )
      .all(userId);
  },

  listStarredByUser(userId) {
    return db
      .prepare(
        'SELECT * FROM files WHERE user_id = ? AND is_starred = 1 AND deleted_at IS NULL ORDER BY created_at DESC'
      )
      .all(userId);
  },

  listRecentByUser(userId, limit = 50) {
    return db
      .prepare(
        'SELECT * FROM files WHERE user_id = ? AND deleted_at IS NULL ORDER BY last_accessed_at DESC LIMIT ?'
      )
      .all(userId, limit);
  },

  listTrashByUser(userId) {
    return db
      .prepare(
        'SELECT * FROM files WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC'
      )
      .all(userId);
  },

  listExpiredTrash(cutoffIso) {
    return db.prepare('SELECT * FROM files WHERE deleted_at IS NOT NULL AND deleted_at <= ?').all(cutoffIso);
  },

  listAll() {
    return db
      .prepare(
        `SELECT files.*, users.email AS owner_email FROM files
         JOIN users ON users.id = files.user_id
         WHERE files.deleted_at IS NULL
         ORDER BY files.created_at DESC`
      )
      .all();
  },

  setVisibility(id, isPublic, token, expiresAt = null) {
    db.prepare('UPDATE files SET is_public = ?, public_token = ?, expires_at = ? WHERE id = ?').run(
      isPublic ? 1 : 0,
      isPublic ? token : null,
      isPublic ? expiresAt : null,
      id
    );
    return FileModel.findById(id);
  },

  setStarred(id, starred) {
    db.prepare('UPDATE files SET is_starred = ? WHERE id = ?').run(starred ? 1 : 0, id);
    return FileModel.findById(id);
  },

  touchAccessed(id) {
    db.prepare("UPDATE files SET last_accessed_at = datetime('now') WHERE id = ?").run(id);
  },

  softDelete(id) {
    db.prepare("UPDATE files SET deleted_at = datetime('now') WHERE id = ?").run(id);
    return FileModel.findById(id);
  },

  restore(id) {
    db.prepare('UPDATE files SET deleted_at = NULL WHERE id = ?').run(id);
    return FileModel.findById(id);
  },

  rename(id, name) {
    db.prepare('UPDATE files SET original_name = ? WHERE id = ?').run(name, id);
    return FileModel.findById(id);
  },

  moveToFolder(id, folderId) {
    db.prepare('UPDATE files SET folder_id = ? WHERE id = ?').run(folderId, id);
    return FileModel.findById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
  },

  newPublicToken() {
    return uuidv4();
  },
};

module.exports = FileModel;
