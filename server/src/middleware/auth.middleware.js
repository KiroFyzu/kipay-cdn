const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
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
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, requireAdmin, requireAuthFlexible };
