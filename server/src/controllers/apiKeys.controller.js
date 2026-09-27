const ApiKey = require('../models/ApiKey');
const ActivityLog = require('../models/ActivityLog');

const MAX_KEYS_PER_USER = 20;

function list(req, res) {
  const keys = ApiKey.listByUser(req.user.id);
  res.json({ apiKeys: keys });
}

function create(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: 'name must be at most 100 characters' });
  }
  const existing = ApiKey.listByUser(req.user.id);
  if (existing.length >= MAX_KEYS_PER_USER) {
    return res.status(409).json({ error: `maximum of ${MAX_KEYS_PER_USER} API keys per account` });
  }

  const apiKey = ApiKey.create({ userId: req.user.id, name: name.trim() });
  ActivityLog.record({ userId: req.user.id, action: 'api_key_create', targetName: apiKey.name });

  // rawKey is only ever returned here - it cannot be retrieved again after this response.
  res.status(201).json({ apiKey: ApiKey.toPublic(apiKey), key: apiKey.rawKey });
}

function remove(req, res) {
  const existing = ApiKey.findById(req.params.id);
  const deleted = ApiKey.deleteForUser(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'API key not found' });
  }
  ActivityLog.record({ userId: req.user.id, action: 'api_key_revoke', targetName: existing?.name });
  res.status(204).send();
}

module.exports = { list, create, remove };
