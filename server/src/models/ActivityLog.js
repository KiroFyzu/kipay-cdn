const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const ActivityLog = {
  record({ userId, action, targetName = null, meta = null }) {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO activity_log (id, user_id, action, target_name, meta) VALUES (?, ?, ?, ?, ?)`
    ).run(id, userId, action, targetName, meta ? JSON.stringify(meta) : null);
    return id;
  },

  listByUser(userId, { limit = 50, cursor = 0 } = {}) {
    return db
      .prepare(
        `SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`
      )
      .all(userId, limit, cursor);
  },

  listAll({ limit = 100, cursor = 0 } = {}) {
    return db
      .prepare(
        `SELECT activity_log.*, users.email AS user_email FROM activity_log
         LEFT JOIN users ON users.id = activity_log.user_id
         ORDER BY activity_log.created_at DESC, activity_log.rowid DESC LIMIT ? OFFSET ?`
      )
      .all(limit, cursor);
  },
};

module.exports = ActivityLog;
