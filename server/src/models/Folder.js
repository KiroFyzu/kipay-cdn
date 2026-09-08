const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const Folder = {
  create({ userId, parentId = null, name }) {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO folders (id, user_id, parent_id, name) VALUES (?, ?, ?, ?)`
    ).run(id, userId, parentId, name);
    return Folder.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
  },

  listByUser(userId, parentId = null) {
    if (parentId) {
      return db
        .prepare('SELECT * FROM folders WHERE user_id = ? AND parent_id = ? ORDER BY name')
        .all(userId, parentId);
    }
    return db
      .prepare('SELECT * FROM folders WHERE user_id = ? AND parent_id IS NULL ORDER BY name')
      .all(userId);
  },

  rename(id, name) {
    db.prepare('UPDATE folders SET name = ? WHERE id = ?').run(name, id);
    return Folder.findById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM folders WHERE id = ?').run(id);
  },
};

module.exports = Folder;
