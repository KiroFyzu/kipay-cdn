const Folder = require('../models/Folder');
const FileModel = require('../models/File');

function create(req, res) {
  const { name, parentId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (parentId) {
    const parent = Folder.findById(parentId);
    if (!parent || parent.user_id !== req.user.id) {
      return res.status(404).json({ error: 'parent folder not found' });
    }
  }
  const folder = Folder.create({ userId: req.user.id, parentId: parentId || null, name });
  res.status(201).json({ folder });
}

function list(req, res) {
  const { parentId } = req.query;
  const folders = Folder.listByUser(req.user.id, parentId || null);
  res.json({ folders });
}

function rename(req, res) {
  const folder = Folder.findById(req.params.id);
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).json({ error: 'folder not found' });
  }
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const updated = Folder.rename(folder.id, name.trim());
  res.json({ folder: updated });
}

function remove(req, res) {
  const folder = Folder.findById(req.params.id);
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).json({ error: 'folder not found' });
  }
  Folder.delete(folder.id);
  res.status(204).end();
}

module.exports = { create, list, rename, remove };
