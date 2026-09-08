const User = require('../models/User');

function hasRoomFor(user, sizeBytes) {
  return user.storage_used_bytes + sizeBytes <= user.storage_quota_bytes;
}

function applyDelta(userId, deltaBytes) {
  User.incrementUsage(userId, deltaBytes);
}

module.exports = { hasRoomFor, applyDelta };
