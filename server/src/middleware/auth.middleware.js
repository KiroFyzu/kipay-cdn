const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');

// Accepts either a JWT (from /api/auth/login) or a long-lived API key
// (from /api/api-keys, prefixed "cdnk_") in the same Authorization header.
function resolveUserFromToken(token) {
  if (token.startsWith(ApiKey.KEY_PREFIX)) {
    const apiKey = ApiKey.findByHash(ApiKey.hash(token));
    if (!apiKey) return null;
    const user = User.findById(apiKey.user_id);
    if (!user) return null;
    ApiKey.touchLastUsed(apiKey.id);
    return user;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return User.findById(payload.sub) || null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const user = resolveUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// For <img>/<video>/<embed> tags that cannot set an Authorization header:
// accepts the JWT via ?token= query param as well as the header.
function requireAuthFlexible(req, res, next) {
  const header = req.headers.authorization || '';
  const token = (header.startsWith('Bearer ') ? header.slice(7) : null) || req.query.token || null;
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const user = resolveUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

module.exports = { requireAuth, requireAdmin, requireAuthFlexible };
