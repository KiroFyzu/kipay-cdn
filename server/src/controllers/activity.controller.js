const ActivityLog = require('../models/ActivityLog');

function listMine(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const cursor = Number(req.query.cursor) || 0;
  const entries = ActivityLog.listByUser(req.user.id, { limit, cursor });
  res.json({ entries });
}

module.exports = { listMine };
